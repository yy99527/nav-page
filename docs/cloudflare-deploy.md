# ☁️ 无服务器部署教程（重点：Cloudflare）

本项目的最大特点：**无需任何服务器、无需构建**，整个站点就是一堆静态文件
（`index.html` / `style.css` / `main.js` / `config.js` / `links.json`），
可以免费托管在 Cloudflare、Vercel、Netlify、GitHub Pages 等平台上。

下面按“从最快到最专业”的顺序，重点讲解 **Cloudflare** 的几种部署方式。

---

## 目录

- [准备：先 Fork 本项目](#准备先-fork-本项目)
- [方式 A：一键部署（最快，适合零基础）](#方式-a一键部署最快适合零基础)
- [方式 B：Cloudflare Pages 连接 GitHub（最推荐）](#方式-bcloudflare-pages-连接-github最推荐)
- [方式 C：Wrangler CLI 本地部署（适合开发者）](#方式-cwrangler-cli-本地部署适合开发者)
- [方式 D：GitHub Actions 自动部署（每次推送自动发布）](#方式-dgithub-actions-自动部署每次推送自动发布)
- [绑定自定义域名](#绑定自定义域名)
- [可选：部署图标代理 Worker（国内加速）](#可选部署图标代理-worker国内加速)
- [常见问题 FAQ](#常见问题-faq)

---

## 准备：先 Fork 本项目

1. 打开本仓库页面，点击右上角 **Fork**。
2. Fork 完成后，你就拥有了自己的副本：`https://github.com/你的用户名/nav-page`。
3. 后续所有部署都基于**你的 Fork 仓库**进行（注意把教程里的 `你的用户名`
   替换成你自己的 GitHub 用户名）。

> 修改内容：改 `config.js`（站点名、搜索引擎、图标源等）和 `links.json`（网站数据）。
> 不想改代码的话，部署后再用可视化后台 `https://你的域名/admin.html` 在线编辑。

---

## 方式 A：一键部署（最快，适合零基础）

Cloudflare 官方提供了 **“Deploy with Workers”** 一键部署入口，点击后授权
Cloudflare 访问你的 GitHub 仓库，会自动把整个站点部署为一个
**Workers 静态站点**（免费额度内完全够用）。

### 步骤

1. **先 Fork 本仓库**（见上）。
2. 复制下面的链接，把 `你的用户名` 替换成你的 GitHub 用户名：

   ```text
   https://deploy.workers.cloudflare.com/?url=https://github.com/你的用户名/nav-page
   ```

3. 在浏览器打开这个链接，按页面提示：
   - 点击 **Authorize Workers**，授权 Cloudflare 访问 GitHub；
   - 选择要部署的仓库（你的 `nav-page`）；
   - 点击 **Deploy**，等待约 1 分钟。
4. 部署成功后，Cloudflare 会给你一个 `https://nav-page.你的子域.workers.dev`
   的地址，打开即可看到导航页。

> 也可以直接点下面的按钮（部署原仓库，体验效果）：
>
> [![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yy99527/nav-page)
>
> ⚠️ 这个按钮部署的是原仓库。**部署你自己的版本请把链接中的 `yy99527` 改成你的用户名**，
> 或先在部署页面里粘贴你的 Fork 仓库地址。

### 为什么一键部署就能跑？

仓库根目录已经为你准备好两个文件：

- `wrangler.jsonc`：Workers 部署配置，声明“把整个目录作为静态资源发布”；
- `worker.js`：极简入口，负责返回静态文件（并支持 `/admin` 这种无后缀地址）。

所以 Cloudflare 拿到仓库后不需要你做任何配置。

---

## 方式 B：Cloudflare Pages 连接 GitHub（最推荐）

这是最主流、最“正规”的 Pages 用法：**Cloudflare 直接连接你的 GitHub 仓库，
以后每次推送代码，Pages 自动重新部署。** 完全免费、无需服务器。

### 步骤

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)（没有账号就先注册，免费）。
2. 左侧菜单进入 **Workers & Pages**（或直接访问 `https://dash.cloudflare.com/pages`）。
3. 点击 **Create application（创建应用程序）→ Pages → Connect to Git（连接到 Git）**。
4. 首次使用会要求授权 GitHub：点击 **Authorize Cloudflare Pages**，
   选择你的 GitHub 账号，只授权 `nav-page` 这个仓库即可（推荐“Only select repositories”）。
5. 在仓库列表中选择 **你的用户名/nav-page**，点击 **Begin setup（开始设置）**。
6. 关键配置（照着填）：

   | 配置项 | 填写内容 |
   | --- | --- |
   | Project name | `nav-page`（可自定义） |
   | Production branch | `main` |
   | Framework preset | **None**（本项目无需框架） |
   | Build command | **留空**（本项目无需构建） |
   | Build output directory | `.`（仓库根目录，就一个点） |

7. 点击 **Save and Deploy（保存并部署）**。
8. 等待 1～2 分钟，部署完成后点击 **Visit site**，即可访问
   `https://你的项目名.pages.dev`。

以后你只要在 GitHub 上修改 `links.json`、`config.js` 并推送，Cloudflare 会自动更新站点。

### 小技巧：清理不需要发布的文件

Pages 会把仓库根目录都发布出去。它不会影响使用，但如果你想更干净，可以在
`config.js` 同级新增一个 `.pagesignore`（可选，不建也没关系）。

---

## 方式 C：Wrangler CLI 本地部署（适合开发者）

如果你习惯命令行，可以用 Cloudflare 官方 CLI `wrangler` 部署为 Workers 静态站点。

```bash
# 1. 安装 Node.js（18+）后，全局安装 wrangler
npm install -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 克隆你的仓库
git clone https://github.com/你的用户名/nav-page.git
cd nav-page

# 4. 部署（读取 wrangler.jsonc 配置）
wrangler deploy
```

部署成功后终端会输出 `https://nav-page.你的子域.workers.dev`。

---

## 方式 D：GitHub Actions 自动部署（每次推送自动发布）

仓库已经内置 `.github/workflows/cloudflare-pages.yml`，配置一次后，
**每次 push 到 `main` 都会自动发布到 Cloudflare Pages**，适合长期维护。

### 步骤

1. 在 Cloudflare 右上角 **My Profile → API Tokens → Create Token**，
   选择模板 **“Create Custom Token”**：
   - Permissions：`Account → Cloudflare Pages → Edit`（以及 `Account → Account Settings → Read`）；
   - 或直接给 `Cloudflare Pages — Edit` 权限。
2. 复制生成的 Token（只显示一次，请保存好）。
3. 在 Cloudflare 概览页右侧找到 **Account ID**，复制。
4. 打开你的 GitHub 仓库 **Settings → Secrets and variables → Actions → New repository secret**，添加两个：
   - `CLOUDFLARE_API_TOKEN` = 上一步的 Token；
   - `CLOUDFLARE_ACCOUNT_ID` = 你的 Account ID。
5. 进入仓库 **Actions** 页，选择左侧 **Deploy to Cloudflare Pages**，点击
   **Run workflow**，手动跑一次（以后 push 会自动跑）。
6. 完成后访问 `https://nav-page.pages.dev`（项目名如改过请相应调整）。

---

## 绑定自定义域名

以 Cloudflare Pages 为例：

1. 先把你的域名接入 Cloudflare（在 Cloudflare 添加站点、修改 DNS 服务器）。
2. 进入你的 Pages 项目 → **Custom domains → Set up a custom domain**。
3. 输入例如 `nav.example.com`，按提示完成（Cloudflare 通常会自动配置 DNS 记录）。
4. 等待证书签发，几分钟后即可用 `https://nav.example.com` 访问。

> 用 Workers 部署的话，同样在 Worker 的 **Settings → Domains & Routes** 添加自定义域名。

---

## 可选：部署图标代理 Worker（国内加速）

如果自动抓取的 favicon 在国内访问缓慢/失败，可以部署仓库里现成的代理：

1. 打开 `workers/icon-proxy.js`，复制全部代码。
2. Cloudflare → **Workers & Pages → Create → Create Worker**，粘贴代码，部署。
3. 给这个 Worker 绑定一个**国内可访问的自定义域名**（不要与导航页同域名），
   例如 `https://api.example.com`。
4. 打开导航页的 `config.js`，修改：

   ```js
   iconProxy: "https://api.example.com",   // 注意结尾不要带斜杠
   ```

原理：导航页把所有 favicon 请求改走 `你的代理域名/原图标地址`，由 Worker 中转，
绕开国内访问 Google / DuckDuckGo 图标服务不稳定的问题。

---

## 常见问题 FAQ

**Q1：部署成功但打开是空白/报错？**
多半是 `links.json` 被改坏了。请用 JSON 校验工具检查（例如 json.cn），确保最后一项后面没有多余逗号。

**Q2：改了 links.json 为什么没生效？**
- Cloudflare Pages 有几分钟缓存，可强制刷新（Ctrl+F5）；
- 如果使用 Service Worker 离线缓存，多刷新一次即可（本项目 SW 对数据文件是网络优先）。

**Q3：后台 admin.html 怎么用？**
访问 `https://你的域名/admin.html`，第一次输入 GitHub Token 和一个短密码。
后台直接读写你 Fork 仓库里的 `links.json`，点“保存到 GitHub”即可在线更新。

**Q4：免费额度够吗？**
Cloudflare Workers 免费版每天 10 万请求，Pages 无限静态请求，个人导航页完全够用。

**Q5：我 Fork 后一键部署按钮还能用吗？**
可以，但一定要把按钮链接里的仓库地址从 `yy99527/nav-page` 改成 `你的用户名/nav-page`。
