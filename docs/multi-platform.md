# 🌍 多端部署指南

本项目是**纯静态站点**：没有构建步骤、没有后端依赖，因此理论上可以部署到任何能托管
静态文件的地方。下面是除 Cloudflare 之外的其他常见平台。

> Cloudflare 部署请看 [docs/cloudflare-deploy.md](./cloudflare-deploy.md)（重点教程）。

---

## 目录

- [Vercel（一键部署）](#vercel一键部署)
- [Netlify（一键部署）](#netlify一键部署)
- [GitHub Pages](#github-pages)
- [Docker / NAS / 任意服务器](#docker--nas--任意服务器)
- [本地直接使用](#本地直接使用)
- [Nginx / Caddy 等传统 Web 服务器](#nginx--caddy-等传统-web-服务器)

---

## Vercel（一键部署）

Vercel 支持直接从 GitHub 克隆并部署。

1. 先 **Fork** 本仓库。
2. 把下面链接中的 `yy99527` 换成你的用户名后打开：

   ```text
   https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2F你的用户名%2Fnav-page
   ```

   或点击按钮（部署原仓库）：

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyy99527%2Fnav-page)

3. 按提示授权 GitHub，Framework Preset 选择 **Other**，Build Command 留空，
   Output Directory 留空（或填 `.`），点击 Deploy。
4. 完成后获得 `https://xxx.vercel.app` 地址。

> 仓库根目录的 `vercel.json` 已配置好 `cleanUrls`（访问 `/admin` 等价于 `/admin.html`）。

---

## Netlify（一键部署）

1. 先 **Fork** 本仓库。
2. 打开：

   ```text
   https://app.netlify.com/start/deploy?repository=https://github.com/你的用户名/nav-page
   ```

   或点击按钮：

   [![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yy99527/nav-page)

3. 授权 GitHub → 选择仓库 → Build command 留空、Publish directory 填 `.` → Deploy。
4. 完成后获得 `https://xxx.netlify.app` 地址。

> 仓库根目录的 `netlify.toml` 已配置 publish 目录为 `.`。

---

## GitHub Pages

### 方式一：Actions 自动部署（推荐）

1. Fork 后进入你的仓库 **Settings → Pages**。
2. **Source** 选择 **GitHub Actions**。
3. 进入 **Actions** 页，运行一次 **Deploy to GitHub Pages** 工作流。
4. 完成后 Pages 页面会显示网址：`https://你的用户名.github.io/nav-page/`。

> 之后每次 push 到 `main` 都会自动更新。`.github/workflows/github-pages.yml`
> 已经帮你排除了 `.git`、`.github`、`docs` 等不需要发布的文件。

### 方式二：经典分支部署

1. Settings → Pages → Source 选择 `Deploy from a branch`。
2. 分支选 `main`，目录选 `/ (root)`，保存。
3. 访问 `https://你的用户名.github.io/nav-page/`。

> 经典方式会发布整个仓库根目录（不影响使用）。

---

## Docker / NAS / 任意服务器

如果你有 NAS（如群晖、威联通、fnOS）或一台服务器，也可以用 Docker 跑：

```bash
git clone https://github.com/你的用户名/nav-page.git
cd nav-page
docker compose up -d
```

然后访问 `http://你的设备IP:8080`。

自定义端口：编辑 `docker-compose.yml`，把 `8080:80` 改成 `9000:80` 之类。

---

## 本地直接使用

因为是完全静态的，直接双击 `index.html` 也能在浏览器打开使用。
需要说明：

- 通过 `file://` 打开时，`links.json` 的 `fetch` 可能被浏览器拦截（CORS 限制）。
  建议用任意静态服务器预览：

  ```bash
  # Python
  python3 -m http.server 8080

  # Node
  npx serve .
  ```

- 也可以通过浏览器扩展或“新标签页”插件加载本地文件。

---

## Nginx / Caddy 等传统 Web 服务器

把整个目录放到网站根目录即可。

Nginx 示例：

```nginx
server {
    listen 80;
    server_name nav.example.com;
    root /var/www/nav-page;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ =404;
    }
}
```

Caddy 示例（一行）：

```caddyfile
nav.example.com {
    root * /var/www/nav-page
    file_server
}
```

---

## 小结

| 平台 | 是否免费 | 是否无服务器 | 一键部署 | 自动更新 |
| --- | --- | --- | --- | --- |
| Cloudflare Pages | ✅ | ✅ | ✅（Workers 按钮） | ✅（连接 Git / Actions） |
| Cloudflare Workers | ✅ | ✅ | ✅ | ❌（需手动重新部署） |
| Vercel | ✅ | ✅ | ✅ | ✅ |
| Netlify | ✅ | ✅ | ✅ | ✅ |
| GitHub Pages | ✅ | ✅ | ❌（点一次工作流） | ✅（Actions） |
| Docker / NAS | 自有设备 | ❌ | ❌ | 手动 pull |
