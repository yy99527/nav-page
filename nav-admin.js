/* =========================================================
 *  nav-admin.js
 *  共享的“无服务器后端”访问库：账号体系 + 导航数据 API。
 *  前端（index.html）和后台（admin.html）共用。
 *  当后端未配置（Cloudflare D1 未绑定）时，configured 为 false。
 * ========================================================= */
(function () {
  "use strict";

  var TOKEN_KEY = "nav_admin_token";
  var EXPIRES_KEY = "nav_admin_expires";

  function getToken() {
    var expires = Number(localStorage.getItem(EXPIRES_KEY) || 0);
    if (expires && expires < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(EXPIRES_KEY);
      return "";
    }
    return localStorage.getItem(TOKEN_KEY) || "";
  }
  function setToken(token, expiresAt) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(EXPIRES_KEY, String(expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000));
  }
  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
  }

  function api(path, options) {
    options = options || {};
    var headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    var token = getToken();
    if (token) headers.Authorization = "Bearer " + token;
    return fetch(path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var err = new Error(data && data.error ? data.error : "请求失败：" + res.status);
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  var statusPromise = null;
  function setupStatus(force) {
    if (force || !statusPromise) {
      statusPromise = fetch("/api/setup/status", { cache: "no-store" })
        .then(function (res) {
          if (!res.ok) return { configured: false, hasAdmin: false, dataExists: false };
          return res.json();
        })
        .catch(function () {
          return { configured: false, hasAdmin: false, dataExists: false };
        });
    }
    return statusPromise;
  }

  window.NavAdmin = {
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,
    setupStatus: setupStatus,

    register: function (username, password) {
      return api("/api/auth/register", { method: "POST", body: { username: username, password: password } }).then(function (res) {
        setToken(res.token, res.expiresAt);
        return res;
      });
    },
    login: function (username, password) {
      return api("/api/auth/login", { method: "POST", body: { username: username, password: password } }).then(function (res) {
        setToken(res.token, res.expiresAt);
        return res;
      });
    },
    logout: function () {
      return api("/api/auth/logout", { method: "POST" }).catch(function () {}).then(function () {
        clearToken();
        return { ok: true };
      });
    },
    me: function () {
      return api("/api/auth/me");
    },
    changePassword: function (oldPassword, newPassword) {
      return api("/api/auth/password", { method: "POST", body: { oldPassword: oldPassword, newPassword: newPassword } });
    },

    getData: function () {
      return api("/api/data");
    },
    putData: function (links) {
      return api("/api/data", { method: "PUT", body: { links: links } });
    },
  };
})();
