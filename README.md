# 🧭 nav-page · 无需服务器的个人导航页

一个**轻量、美观、数据驱动**的个人导航页模板。纯静态实现：**没有构建步骤、没有后端、
没有数据库**，改两个文件就能上线，可免费部署到 Cloudflare / Vercel / Netlify / GitHub Pages，
也可以 Docker 跑在 NAS 上。

> 本项目参考了 [Simple-Nav-Page](https://github.com/xmynscnq/Simple-Nav-Page) 与
> [go-nav](https://github.com/dengxiwang/go-nav) 的优点，并针对**无服务器部署**做了重点优化。

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yy99527/nav-page)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyy99527%2Fnav-page)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yy99527/nav-page)

> ⚠️ 上面的按钮部署的是原仓库。**部署你自己的版本请先 Fork**，然后把链接里的
> `yy99527` 换成你的 GitHub 用户名（详见 [Cloudflare 教程](#-重点cloudflare-无服务器部署教程)）。

在线演示：<https://yy99527.github.io/nav-page/>

---

## ✨ 功能特点

- 🚀 **无需服务器**：纯静态文件，Cloudflare Pages / Workers、Vercel、Netlify、GitHub Pages 全部免费托管
- ⚡ **Cloudflare 一键部署**：Fork 后点一下按钮、授权 Cloudflare 即可安装
- 🧩 **数据驱动**：网站内容全部在 `links.json`，站点设置在 `config.js`，改完即生效
- 🔍 **多引擎搜索**：内置引擎 / 开发 / 视频 / 音乐 / 生活等分类，可自由增删
- 📌 **站内即时检索**：输入关键词实时过滤，**支持拼音与首字母**（如输入 `bili` 定位 B 站）
- 🖼️ **自动网站图标**：自动抓取 favicon，支持自定义图标与国内代理
- 🌗 **深色 / 浅色 / 跟随系统** 三态主题，自动记忆
- 🗂️ **两种布局**：分类瀑布流 / 单页标签，随时切换
- 📐 **卡片密度切换**：宽松 / 紧凑
- 🏠 **内外网一键切换**：适合 NAS / 家庭服务器（外网域名 + 内网地址）
- 📱 **响应式**：手机 / 平板 / 桌面自适应，可安装到主屏（PWA）
- 🔐 **账号体系（可选）**：配合 Cloudflare D1，首次注册即管理员，后续编辑需登录
- 💻 **可视化后台**：`admin.html` 注册/登录后可增删改站点，数据存云端
- ✏️ **前台管理**：登录后可在导航页首页直接就地编辑（增删改站点/分类）
- 🌄 **内置渐变背景**：零外部请求；也可配置随机图片 API

---

## 📁 项目结构

```
nav-page/
├── index.html            # 页面结构
├── style.css             # 全部样式
├── main.js               # 核心逻辑（渲染、搜索、主题、布局）
├── config.js             # ⭐ 站点全局配置（标题、引擎、图标源、背景…）
├── links.json            # ⭐ 网站数据（分类与站点）
├── admin.html            # 可视化后台（账号登录 / 注册，读写云端数据）
├── nav-admin.js          # 共享的无服务器后端 API 库（账号 + 数据）
├── manifest.webmanifest  # PWA 清单
├── sw.js                 # 离线缓存（数据文件始终网络优先）
├── pinyin-pro.min.js     # 拼音搜索库（本地化，无 CDN 依赖）
├── worker.js             # Cloudflare Workers 静态站点入口
├── wrangler.jsonc        # Cloudflare Workers 部署配置（一键部署用）
├── workers/icon-proxy.js # 可选：favicon 国内加速代理
├── vercel.json           # Vercel 配置
├── netlify.toml          # Netlify 配置
├── Dockerfile            # Docker 部署
├── docker-compose.yml
└── .github/workflows/    # GitHub Pages / Cloudflare Pages 自动部署
```

---

## 🚀 快速开始

### 1. Fork 本仓库

点击右上角 **Fork**，得到 `https://github.com/你的用户名/nav-page`。

### 2. 修改站点信息

编辑 `config.js`：

```js
window.NAV_CONFIG = {
  title: "我的导航",        // 改成你的名字
  subtitle: "轻量 · 无服务器 · 多端部署",
  favicon: "🧭",
  theme: "auto",           // auto | light | dark
  faviconProvider: "google", // google | duckduckgo | none
  iconProxy: "",           // 国内加速代理，如 https://api.example.com
  background: "gradient",  // gradient 或图片 API 地址
  searchCategories: [ ... ] // 搜索引擎分类，可自由增删
};
```

### 3. 修改网站数据

编辑 `links.json`，每一项字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `section` | ✅ | 分类名称 |
| `icon` | 可选 | 分类图标（emoji，如 💻） |
| `title` | ✅ | 站点名称 |
| `url` | ✅ | 外网地址 |
| `desc` | 可选 | 卡片下方简介 |
| `keywords` | 可选 | 搜索关键词（空格分隔） |
| `icon` | 可选 | 自定义图标路径 / URL，留空自动抓取 |
| `intranet` | 可选 | 内网地址（开启内外网切换后生效） |

示例：

```json
[
  {
    "section": "常用",
    "icon": "⭐",
    "items": [
      {
        "title": "哔哩哔哩",
        "url": "https://www.bilibili.com/",
        "desc": "视频、动漫、弹幕",
        "keywords": "b站 bilibili 视频"
      }
    ]
  }
]
```

### 4. 部署

**重点推荐 Cloudflare（无服务器、免费、一键部署）**，完整教程见：

👉 **[docs/cloudflare-deploy.md](docs/cloudflare-deploy.md)**（含一键按钮、Pages 连接 Git、CLI、Actions 四种方式）

其他平台（Vercel / Netlify / GitHub Pages / Docker / NAS / Nginx）见：

👉 **[docs/multi-platform.md](docs/multi-platform.md)**

---

## ☁️ 重点：Cloudflare 无服务器部署教程

### 最快方式：Fork 后一键授权安装

1. **Fork** 本仓库。
2. 打开下面链接（把 `你的用户名` 换成你的 GitHub 用户名）：

   ```text
   https://deploy.workers.cloudflare.com/?url=https://github.com/你的用户名/nav-page
   ```

3. 点击 **Authorize Workers** 授权 Cloudflare 访问你的仓库，等待自动部署完成，
   即可获得 `https://nav-page.xxx.workers.dev` 地址。

### 最推荐：Cloudflare Pages 连接 GitHub（自动更新）

1. 进入 [Cloudflare 控制台](https://dash.cloudflare.com/) → **Workers & Pages** → **Create → Pages → Connect to Git**。
2. 授权并选择你的 `nav-page` 仓库。
3. 构建配置：**Build command 留空，Output directory 填 `.`**，Framework preset 选 **None**。
4. 保存部署，获得 `https://nav-page.pages.dev`，以后每次 push 自动更新。

> 更多细节（自定义域名、CLI、GitHub Actions 自动部署、图标代理、FAQ）请阅读
> **[docs/cloudflare-deploy.md](docs/cloudflare-deploy.md)**。

---

## 💻 可视化后台与账号体系（可选）

后台地址：`https://你的域名/admin.html`

- **无服务器后端模式（推荐，需 Cloudflare D1）**：第一次打开后台会引导**注册管理员账号**，
  之后修改和编辑导航页都需要登录；登录后可在后台增删分类和站点，数据保存在云端。
- **纯静态回退模式**：未绑定 D1 时（如 GitHub Pages / Vercel / Netlify），后台自动回退为
  **GitHub Token 编辑模式**——输入 Fine-grained Token（仅给本仓库 `Contents` 读写权限），
  直接写回仓库里的 `links.json`。
- **前台管理**：在无服务器后端模式下，导航页首页右下角登录后点击“✏️ 编辑”，
  即可在首页就地增删改站点和分类。

> 启用账号体系的完整步骤见 **[docs/cloudflare-deploy.md](docs/cloudflare-deploy.md#-启用账号系统注册管理员--登录编辑)**。

---

## 🖥️ 本地预览

```bash
# 任选其一
python3 -m http.server 8080
# 或
npx serve .
```

然后访问 `http://localhost:8080`。

---

## 📄 开源协议

[MIT License](LICENSE) © 2026 yy99527

## 🙏 致谢

- [Simple-Nav-Page](https://github.com/xmynscnq/Simple-Nav-Page)：无服务器导航页思路、后台与 Worker 图标代理
- [go-nav](https://github.com/dengxiwang/go-nav)：JSON 配置驱动、后台管理思路
- [pinyin-pro](https://github.com/zh-lx/pinyin-pro)：拼音搜索
