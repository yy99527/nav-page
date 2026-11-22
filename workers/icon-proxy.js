/* =========================================================
 *  可选：图标代理 Worker（国内加速 favicon）
 *  ---------------------------------------------------------
 *  部署方式：把本文件内容粘贴到 Cloudflare → Workers & Pages →
 *  创建 Worker 中；或复制为一个新 Worker 项目单独部署。
 *  然后绑定一个国内可访问的自定义域名（不要与导航页同域名）。
 *
 *  用法：在导航页 config.js 中设置
 *    iconProxy: "https://你的代理域名"
 *  注意结尾不要带斜杠。
 * ========================================================= */
export default {
  async fetch(request) {
    const url = new URL(request.url);
    let target = url.pathname.replace(/^\/+/, "");
    if (!target) return new Response("图标代理运行中 ✅");

    if (!/^https?:\/\//.test(target)) target = "https://" + target;
    target += url.search;

    try {
      const headers = new Headers(request.headers);
      headers.set("User-Agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

      const upstream = await fetch(target, { method: request.method, headers, redirect: "follow" });
      const modified = new Headers(upstream.headers);
      modified.set("Access-Control-Allow-Origin", "*");
      modified.set("Cache-Control", "public, max-age=86400");
      return new Response(upstream.body, { status: upstream.status, headers: modified });
    } catch (e) {
      return new Response("代理请求失败: " + e.message, { status: 500 });
    }
  },
};
