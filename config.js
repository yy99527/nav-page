/* =========================================================
 *  导航页全局配置
 *  ---------------------------------------------------------
 *  所有可自定义项都集中在这里，改完保存、刷新页面即可生效。
 *  本项目为纯静态站点，无需构建、无需服务器。
 * ========================================================= */
window.NAV_CONFIG = {
  // ---------- 站点信息 ----------
  title: "我的导航",
  subtitle: "轻量 · 无服务器 · 多端部署",
  favicon: "🧭", // 浏览器标签页图标（emoji 或图标路径）

  // ---------- 数据文件 ----------
  linksFile: "links.json",

  // ---------- 主题 ----------
  // 'auto' 跟随系统 | 'light' 浅色 | 'dark' 深色
  theme: "auto",

  // ---------- 网站图标 ----------
  // 自动抓取 favicon 的源：'google' | 'duckduckgo' | 'none'
  // google 国内访问可能较慢，duckduckgo 相对稳定；也可自行部署图标代理
  faviconProvider: "google",
  // 图标代理前缀（国内加速可选）。例如：https://api.example.com
  // 注意结尾不要带斜杠。留空表示不使用代理。
  iconProxy: "",

  // ---------- 背景 ----------
  // 'gradient' 使用内置动态渐变（无需联网，推荐）
  // 或填写一个能直接返回图片的 API 地址（每次刷新随机切换背景）
  background: "gradient",
  backgroundApi: "",

  // ---------- 内外网切换 ----------
  // 为带有 intranet 字段的卡片提供“外网/内网”一键切换（适合 NAS / 家庭服务器场景）
  enableIntranet: true,

  // ---------- 搜索引擎 ----------
  // 分类 tab + 每个分类下的搜索引擎，url 为搜索接口前缀
  searchCategories: [
    {
      id: "engine",
      label: "引擎",
      icon: "🔍",
      engines: [
        { name: "百度", icon: "🔵", url: "https://www.baidu.com/s?wd=", domain: "baidu.com" },
        { name: "Google", icon: "🌐", url: "https://www.google.com/search?q=", domain: "google.com" },
        { name: "Bing", icon: "🔷", url: "https://www.bing.com/search?q=", domain: "bing.com" },
        { name: "DuckDuckGo", icon: "🦆", url: "https://duckduckgo.com/?q=", domain: "duckduckgo.com" },
        { name: "搜狗", icon: "🐶", url: "https://www.sogou.com/web?query=", domain: "sogou.com" },
        { name: "360", icon: "🟢", url: "https://www.so.com/s?q=", domain: "so.com" },
        { name: "夸克", icon: "⚡", url: "https://www.quark.cn/s?q=", domain: "quark.cn" },
        { name: "Brave", icon: "🦁", url: "https://search.brave.com/search?q=", domain: "search.brave.com" }
      ]
    },
    {
      id: "dev",
      label: "开发",
      icon: "💻",
      engines: [
        { name: "GitHub", icon: "🐱", url: "https://github.com/search?q=", domain: "github.com" },
        { name: "Stack Overflow", icon: "🔶", url: "https://stackoverflow.com/search?q=", domain: "stackoverflow.com" },
        { name: "npm", icon: "📦", url: "https://www.npmjs.com/search?q=", domain: "npmjs.com" },
        { name: "MDN", icon: "📘", url: "https://developer.mozilla.org/search?q=", domain: "developer.mozilla.org" },
        { name: "CSDN", icon: "🟥", url: "https://so.csdn.net/so/search?q=", domain: "csdn.net" },
        { name: "掘金", icon: "🟦", url: "https://juejin.cn/search?query=", domain: "juejin.cn" }
      ]
    },
    {
      id: "video",
      label: "视频",
      icon: "🎬",
      engines: [
        { name: "哔哩哔哩", icon: "📺", url: "https://search.bilibili.com/all?keyword=", domain: "bilibili.com" },
        { name: "YouTube", icon: "🔴", url: "https://www.youtube.com/results?search_query=", domain: "youtube.com" },
        { name: "腾讯视频", icon: "🐧", url: "https://v.qq.com/x/search/?q=", domain: "v.qq.com" },
        { name: "爱奇艺", icon: "🟢", url: "https://so.iqiyi.com/so/q_", domain: "iqiyi.com" },
        { name: "优酷", icon: "🔵", url: "https://so.youku.com/search_video/q_", domain: "youku.com" }
      ]
    },
    {
      id: "music",
      label: "音乐",
      icon: "🎵",
      engines: [
        { name: "网易云音乐", icon: "🔴", url: "https://music.163.com/#/search/m/?s=", domain: "music.163.com" },
        { name: "QQ音乐", icon: "🟢", url: "https://y.qq.com/portal/search.html#page=1&searchid=1&remoteplace=txt.yqq.top&t=song&w=", domain: "y.qq.com" },
        { name: "酷狗", icon: "🔷", url: "https://www.kugou.com/yy/html/search.html#searchType=song&searchKeyWord=", domain: "kugou.com" }
      ]
    },
    {
      id: "life",
      label: "生活",
      icon: "🛒",
      engines: [
        { name: "淘宝", icon: "🟠", url: "https://s.taobao.com/search?q=", domain: "taobao.com" },
        { name: "京东", icon: "🔴", url: "https://search.jd.com/Search?keyword=", domain: "jd.com" },
        { name: "拼多多", icon: "🟣", url: "https://mobile.yangkeduo.com/search_result.html?search_key=", domain: "pinduoduo.com" },
        { name: "知乎", icon: "🔵", url: "https://www.zhihu.com/search?q=", domain: "zhihu.com" },
        { name: "微博", icon: "🌊", url: "https://s.weibo.com/weibo?q=", domain: "weibo.com" },
        { name: "豆瓣", icon: "🟢", url: "https://www.douban.com/search?q=", domain: "douban.com" },
        { name: "下厨房", icon: "🍳", url: "https://www.xiachufang.com/search/?keyword=", domain: "xiachufang.com" }
      ]
    }
  ]
};
