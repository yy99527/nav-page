# 🧭 nav-page · Serverless Personal Navigation Page

A lightweight, beautiful, data-driven personal start page. Pure static files —
**no build step, no backend, no database**. Edit two files and deploy for free on
Cloudflare / Vercel / Netlify / GitHub Pages, or run it in Docker on your NAS.

Inspired by [Simple-Nav-Page](https://github.com/xmynscnq/Simple-Nav-Page) and
[go-nav](https://github.com/dengxiwang/go-nav), optimized for **serverless deployment**.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yy99527/nav-page)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyy99527%2Fnav-page)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/yy99527/nav-page)

> ⚠️ The buttons deploy the original repo. **To deploy your own copy, fork first** and
> replace `yy99527` with your GitHub username (see the Cloudflare guide below).

Live demo: <https://yy99527.github.io/nav-page/>

---

## ✨ Features

- 🚀 **No server required** — static files only; free on Cloudflare / Vercel / Netlify / GitHub Pages
- ⚡ **One-click Cloudflare deploy** — fork, click, authorize Cloudflare, done
- 🧩 **Data-driven** — sites in `links.json`, settings in `config.js`
- 🔍 **Multi-engine search** — grouped engines (web / dev / video / music / shopping)
- 📌 **Instant filtering** — match title, description, **pinyin and initials** (e.g. `bili` → Bilibili)
- 🖼️ **Auto favicons** — Google / DuckDuckGo providers, custom icons, optional proxy
- 🌗 **Light / dark / system** theme with persistence
- 🗂️ **Two layouts** — waterfall sections or single-category tabs
- 📐 **Card density toggle** — comfortable / compact
- 🏠 **Internet / intranet toggle** — great for NAS & home servers
- 📱 **Responsive + PWA** — installable on mobile home screen
- 🔐 **Optional account system** — register once as admin (Cloudflare D1), login required to edit
- 💻 **Visual admin panel** — register/login and edit sites; data stored in the cloud
- ✏️ **Front-end management** — after login, edit sites in place right on the home page
- 🌄 **Built-in gradient background** — zero external requests; image API optional

---

## 🚀 Quick Start

1. **Fork** this repo.
2. Edit `config.js` (site title, search engines, favicon provider, background, …).
3. Edit `links.json` (categories and sites).
4. Deploy — Cloudflare is recommended:

   ```text
   https://deploy.workers.cloudflare.com/?url=https://github.com/YOUR_USERNAME/nav-page
   ```

   Or use Cloudflare Pages: dashboard → **Workers & Pages → Create → Pages →
   Connect to Git** → pick your repo → **Build command: empty, Output directory: `.`**.

Full deployment guides:

- **[Cloudflare (serverless, detailed)](docs/cloudflare-deploy.md)**
- **[Other platforms](docs/multi-platform.md)** — Vercel / Netlify / GitHub Pages / Docker / Nginx

---

## 📁 Data Format

`links.json`:

```json
[
  {
    "section": "Favorites",
    "items": [
      {
        "title": "GitHub",
        "url": "https://github.com/",
        "desc": "Code hosting",
        "keywords": "git open source",
        "icon": "",
        "intranet": ""
      }
    ]
  }
]
```

| Field | Required | Description |
| --- | --- | --- |
| `section` | ✅ | Category name |
| `title` | ✅ | Site name |
| `url` | ✅ | Site URL |
| `desc` | optional | Short description |
| `keywords` | optional | Search keywords |
| `icon` | optional | Custom icon URL/path |
| `intranet` | optional | Intranet URL (for the intranet toggle) |

---

## 🔐 Admin & Accounts (optional)

Open `https://your-domain/admin.html`:

- **Serverless backend mode (Cloudflare D1)**: register once as the admin account,
  then login is required to edit. After login, you can also click “✏️ Edit” on the
  home page to manage sites in place. See
  [docs/cloudflare-deploy.md](docs/cloudflare-deploy.md).
- **Static fallback mode**: without D1 (GitHub Pages / Vercel / Netlify), the admin
  panel falls back to GitHub Token editing and writes `links.json` back to your repo.

---

## 🖥️ Local Preview

```bash
python3 -m http.server 8080
# or
npx serve .
```

Open `http://localhost:8080`.

---

## 📄 License

[MIT License](LICENSE) © 2026 yy99527

## 🙏 Credits

- [Simple-Nav-Page](https://github.com/xmynscnq/Simple-Nav-Page)
- [go-nav](https://github.com/dengxiwang/go-nav)
- [pinyin-pro](https://github.com/zh-lx/pinyin-pro)
