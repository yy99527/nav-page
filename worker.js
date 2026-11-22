/* =========================================================
 *  Cloudflare Worker 入口
 *  作用：把整个仓库作为静态站点托管在 Cloudflare Workers 上，
 *  配合 wrangler.jsonc 的 assets 配置即可一键部署、无需服务器。
 *  同时支持把 /admin 自动映射到 /admin.html 这类“无后缀访问”。
 * ========================================================= */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 无文件后缀的路径（如 /admin）尝试补全 .html，实现干净 URL
    if (url.pathname !== "/" && !/\.[a-zA-Z0-9]+$/.test(url.pathname)) {
      const candidate = new URL(url.pathname + ".html", url);
      const res = await env.ASSETS.fetch(new Request(candidate, request));
      if (res.status !== 404) return res;
    }

    return env.ASSETS.fetch(request);
  },
};
