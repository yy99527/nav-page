/* =========================================================
 *  Cloudflare Worker 入口
 *  ---------------------------------------------------------
 *  1. 把整个仓库作为静态站点托管（配合 wrangler.jsonc 的 assets）
 *  2. 提供可选的无服务器后端 API（需要绑定 D1，见 docs）：
 *     - 账号体系：首次注册即管理员、登录、退出、改密
 *     - 导航数据：读取 / 保存 links 数据
 *
 *  若未绑定 D1（env.DB 不存在），静态站点照常工作，
 *  /api/setup/status 会返回 configured: false，前端自动回退到
 *  纯静态模式（admin.html 使用 GitHub Token 编辑方式）。
 * ========================================================= */

const enc = new TextEncoder();

function toHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}
function randomHex(bytes) {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}
async function sha256Hex(str) {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(str))));
}
async function pbkdf2Hex(password, saltHex) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(saltHex), iterations: 210000, hash: "SHA-256" },
    key,
    256
  );
  return toHex(new Uint8Array(bits));
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Cache-Control": "no-store",
    },
  });

async function readJson(request) {
  try {
    return await request.json();
  } catch (e) {
    return null;
  }
}

async function ensureSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS nav_data (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

async function createSession(db, userId) {
  const raw = randomHex(32);
  const hash = await sha256Hex(raw);
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 天
  await db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").bind(hash, userId, expiresAt).run();
  return { token: raw, expiresAt };
}

async function getAuthUser(db, request) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const hash = await sha256Hex(token);
  const session = await db.prepare("SELECT user_id, expires_at FROM sessions WHERE token_hash = ?").bind(hash).first();
  if (!session) return null;
  if (session.expires_at < Date.now()) {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hash).run();
    return null;
  }
  return (await db.prepare("SELECT id, username FROM users WHERE id = ?").bind(session.user_id).first()) || null;
}

/* ---------- API 路由 ---------- */
async function handleApi(pathname, request, env) {
  const db = env.DB;
  const path = pathname.replace(/^\/api/, "") || "/";

  if (request.method === "OPTIONS") return json({ ok: true });

  // 状态查询：无需登录
  if (path === "/setup/status" && request.method === "GET") {
    if (!db) return json({ configured: false, hasAdmin: false, dataExists: false });
    try {
      await ensureSchema(db);
      const admin = await db.prepare("SELECT id FROM users LIMIT 1").first();
      const data = await db.prepare("SELECT key FROM nav_data WHERE key = 'links'").first();
      return json({ configured: true, hasAdmin: !!admin, dataExists: !!data });
    } catch (e) {
      return json({ error: "数据库异常：" + e.message }, 500);
    }
  }

  if (!db) {
    return json({ error: "未配置 D1 数据库。请按 docs/cloudflare-deploy.md 中的账号系统教程绑定 D1 后重试。" }, 503);
  }
  await ensureSchema(db);

  // 注册：仅当还没有管理员时允许（首次注册即管理员）
  if (path === "/auth/register" && request.method === "POST") {
    const body = await readJson(request);
    if (!body || !body.username || !body.password) return json({ error: "用户名和密码不能为空" }, 400);
    const username = String(body.username).trim().slice(0, 32);
    const password = String(body.password);
    if (username.length < 2) return json({ error: "用户名至少 2 个字符" }, 400);
    if (password.length < 6) return json({ error: "密码至少 6 位" }, 400);

    const admin = await db.prepare("SELECT id FROM users LIMIT 1").first();
    if (admin) return json({ error: "管理员账号已存在，请直接登录" }, 409);

    const salt = randomHex(16);
    const hash = await pbkdf2Hex(password, salt);
    try {
      const result = await db
        .prepare("INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)")
        .bind(username, hash, salt, new Date().toISOString())
        .run();
      const session = await createSession(db, result.meta.last_row_id);
      return json({ ok: true, token: session.token, expiresAt: session.expiresAt, user: { username } });
    } catch (e) {
      if (String(e && e.message).includes("UNIQUE")) return json({ error: "该用户名已被使用" }, 409);
      throw e;
    }
  }

  // 登录
  if (path === "/auth/login" && request.method === "POST") {
    const body = await readJson(request);
    if (!body || !body.username || !body.password) return json({ error: "用户名和密码不能为空" }, 400);
    const username = String(body.username).trim();
    const user = await db.prepare("SELECT id, username, password_hash, salt FROM users WHERE username = ?").bind(username).first();
    if (!user) return json({ error: "用户名或密码错误" }, 401);
    const hash = await pbkdf2Hex(String(body.password), user.salt);
    if (hash !== user.password_hash) return json({ error: "用户名或密码错误" }, 401);
    const session = await createSession(db, user.id);
    return json({ ok: true, token: session.token, expiresAt: session.expiresAt, user: { username: user.username } });
  }

  // 退出
  if (path === "/auth/logout" && request.method === "POST") {
    const auth = request.headers.get("Authorization") || "";
    if (auth.startsWith("Bearer ")) {
      const hash = await sha256Hex(auth.slice(7).trim());
      await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(hash).run();
    }
    return json({ ok: true });
  }

  // 当前用户
  if (path === "/auth/me" && request.method === "GET") {
    const user = await getAuthUser(db, request);
    if (!user) return json({ error: "未登录或登录已过期" }, 401);
    return json({ user: { username: user.username } });
  }

  // 修改密码
  if (path === "/auth/password" && request.method === "POST") {
    const user = await getAuthUser(db, request);
    if (!user) return json({ error: "未登录或登录已过期" }, 401);
    const body = await readJson(request);
    if (!body || !body.oldPassword || !body.newPassword) return json({ error: "参数不完整" }, 400);
    const row = await db.prepare("SELECT password_hash, salt FROM users WHERE id = ?").bind(user.id).first();
    const oldHash = await pbkdf2Hex(String(body.oldPassword), row.salt);
    if (oldHash !== row.password_hash) return json({ error: "原密码错误" }, 401);
    if (String(body.newPassword).length < 6) return json({ error: "新密码至少 6 位" }, 400);
    const salt = randomHex(16);
    const hash = await pbkdf2Hex(String(body.newPassword), salt);
    await db.prepare("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?").bind(hash, salt, user.id).run();
    return json({ ok: true });
  }

  // 读取导航数据（公开）
  if (path === "/data" && request.method === "GET") {
    const row = await db.prepare("SELECT value FROM nav_data WHERE key = 'links'").first();
    if (!row) return json({ error: "暂无数据" }, 404);
    try {
      return json({ links: JSON.parse(row.value) });
    } catch (e) {
      return json({ error: "数据解析失败" }, 500);
    }
  }

  // 保存导航数据（需登录）
  if (path === "/data" && request.method === "PUT") {
    const user = await getAuthUser(db, request);
    if (!user) return json({ error: "未登录或登录已过期" }, 401);
    const body = await readJson(request);
    if (!body || !Array.isArray(body.links)) return json({ error: "数据格式错误：需要 { links: [...] }" }, 400);
    const value = JSON.stringify(body.links, null, 2);
    await db
      .prepare(
        "INSERT INTO nav_data (key, value, updated_at) VALUES ('links', ?, ?) " +
          "ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
      )
      .bind(value, new Date().toISOString())
      .run();
    return json({ ok: true, updatedAt: new Date().toISOString() });
  }

  return json({ error: "接口不存在：" + path }, 404);
}

/* ---------- 主入口 ---------- */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleApi(url.pathname, request, env);
      } catch (e) {
        return json({ error: "服务异常：" + (e && e.message ? e.message : e) }, 500);
      }
    }

    // 静态站点：无文件后缀的路径（如 /admin）尝试补全 .html
    if (url.pathname !== "/" && !/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
      const candidate = new URL(url.pathname + ".html", url);
      const res = await env.ASSETS.fetch(new Request(candidate, request));
      if (res.status !== 404) return res;
    }

    return env.ASSETS.fetch(request);
  },
};
