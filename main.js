/* =========================================================
 *  导航页主逻辑（纯原生 JS，无依赖，无构建）
 * ========================================================= */
(function () {
  "use strict";

  var CFG = window.NAV_CONFIG || {};
  var LINKS_FILE = CFG.linksFile || "links.json";
  var DEFAULT_ICON =
    "data:image/svg+xml;base64," +
    btoa(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>'
    );

  /* ---------- 状态 ---------- */
  var linksData = [];
  var isIntranet = localStorage.getItem("netMode") === "intranet";
  var layout = localStorage.getItem("layout") || "waterfall"; // waterfall | tabs
  var density = localStorage.getItem("density") || "comfortable"; // comfortable | compact
  var themeOverride = localStorage.getItem("theme") || CFG.theme || "auto"; // auto | light | dark
  var currentCategoryId = null;
  var currentEngine = null;
  var enginePanelOpen = false;
  var currentCategoryIndex = 0;
  var preSearchIndex = 0;
  var searchStateSaved = false;

  /* ---------- 小工具 ---------- */
  function $(id) { return document.getElementById(id); }
  function getDomain(url) {
    try { return new URL(url, location.href).host; } catch (e) { return null; }
  }
  function withProxy(originUrl) {
    if (!CFG.iconProxy) return originUrl;
    return CFG.iconProxy + "/" + originUrl.replace(/^https?:\/\//, "");
  }
  function buildFaviconUrl(domain) {
    if (!domain) return DEFAULT_ICON;
    if (CFG.faviconProvider === "google") {
      return withProxy("https://www.google.com/s2/favicons?sz=64&domain=" + domain);
    }
    if (CFG.faviconProvider === "duckduckgo") {
      return withProxy("https://icons.duckduckgo.com/ip3/" + domain + ".ico");
    }
    return DEFAULT_ICON;
  }
  function faviconForUrl(url) { return buildFaviconUrl(getDomain(url)); }

  function safePinyin(text) {
    if (!text) return "";
    var lib = window.pinyinPro;
    if (!lib) return text;
    try {
      var fn = typeof lib === "function" ? lib : (lib.pinyin || lib.default || lib);
      if (typeof fn === "function") {
        return fn(text, { toneType: "none" }).replace(/\s+/g, "").toLowerCase();
      }
    } catch (e) {
      /* 忽略拼音错误，搜索降级为原文匹配 */
    }
    return text.toLowerCase();
  }
  function safePinyinFirst(text) {
    if (!text) return "";
    var lib = window.pinyinPro;
    if (!lib) return text;
    try {
      var fn = typeof lib === "function" ? lib : (lib.pinyin || lib.default || lib);
      if (typeof fn === "function") {
        return fn(text, { pattern: "first", toneType: "none" }).replace(/\s+/g, "").toLowerCase();
      }
    } catch (e) { /* ignore */ }
    return text.toLowerCase();
  }

  /* ---------- 主题 ---------- */
  function systemPrefersDark() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function applyTheme() {
    var dark = themeOverride === "dark" || (themeOverride === "auto" && systemPrefersDark());
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    var btn = $("themeToggleBtn");
    if (btn) {
      btn.textContent = themeOverride === "auto" ? "🖥️" : (dark ? "🌙" : "☀️");
      btn.title = themeOverride === "auto" ? "主题：跟随系统" : (dark ? "主题：深色" : "主题：浅色");
    }
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? "#0b1020" : "#eef2ff";
  }
  function cycleTheme() {
    themeOverride = themeOverride === "auto" ? "light" : (themeOverride === "light" ? "dark" : "auto");
    localStorage.setItem("theme", themeOverride);
    applyTheme();
  }

  /* ---------- 背景 ---------- */
  function applyBackground() {
    var layer = $("bgLayer");
    if (!layer) return;
    if (CFG.background === "gradient" || !CFG.backgroundApi) {
      layer.classList.add("gradient");
      layer.style.backgroundImage = "";
    } else {
      layer.classList.remove("gradient");
      layer.style.backgroundImage = 'url("' + CFG.backgroundApi + '")';
    }
  }

  /* ---------- 头部 ---------- */
  function applyHeader() {
    if (CFG.title) {
      document.title = CFG.title;
      var t = $("pageTitle");
      if (t) t.textContent = (CFG.favicon ? CFG.favicon + " " : "") + CFG.title;
    }
    if (CFG.subtitle && $("pageSubtitle")) $("pageSubtitle").textContent = CFG.subtitle;
  }

  /* ---------- 搜索：分类与引擎 ---------- */
  function getCategories() { return CFG.searchCategories || []; }

  function renderSearchTabs() {
    var tabsEl = $("searchTabs");
    if (!tabsEl) return;
    tabsEl.innerHTML = "";
    getCategories().forEach(function (cat) {
      var btn = document.createElement("button");
      btn.className = "search-tab" + (cat.id === currentCategoryId ? " active" : "");
      btn.type = "button";
      btn.innerHTML = '<span class="tab-icon">' + (cat.icon || "🔍") + '</span><span class="tab-label">' + cat.label + "</span>";
      btn.addEventListener("click", function () {
        selectCategory(cat.id);
        if (enginePanelOpen) renderEnginePanel();
      });
      tabsEl.appendChild(btn);
    });
  }

  function updateSearchBoxEngine() {
    var icon = $("searchEngineIcon");
    var nameEl = $("engineName");
    if (!currentEngine) return;
    if (icon) {
      icon.src = faviconForUrl("https://" + currentEngine.domain);
      icon.onerror = function () { this.src = DEFAULT_ICON; this.onerror = null; };
    }
    if (nameEl) nameEl.textContent = currentEngine.name;
  }

  function selectCategory(catId) {
    var cat = getCategories().find(function (c) { return c.id === catId; });
    if (!cat) return;
    currentCategoryId = catId;
    currentEngine = cat.engines[0];
    localStorage.setItem("engineCategory", catId);
    renderSearchTabs();
    updateSearchBoxEngine();
  }

  function selectEngine(engine) {
    currentEngine = engine;
    if (currentCategoryId) localStorage.setItem("engineName", engine.name);
    updateSearchBoxEngine();
    renderEnginePanel();
    $("searchInput").focus();
  }

  function renderEnginePanel() {
    var panel = $("enginePanel");
    if (!panel) return;
    panel.innerHTML = "";
    var cat = getCategories().find(function (c) { return c.id === currentCategoryId; });
    if (!cat) return;
    cat.engines.forEach(function (engine) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "engine-btn" + (engine === currentEngine ? " active" : "");
      var img = document.createElement("img");
      img.src = faviconForUrl("https://" + engine.domain);
      img.alt = engine.name;
      img.onerror = function () { this.src = DEFAULT_ICON; this.onerror = null; };
      var label = document.createElement("span");
      label.textContent = engine.name;
      btn.appendChild(img);
      btn.appendChild(label);
      btn.addEventListener("click", function () { selectEngine(engine); });
      panel.appendChild(btn);
    });
  }

  function openEnginePanel() {
    enginePanelOpen = true;
    renderEnginePanel();
    var panel = $("enginePanel");
    if (panel) panel.hidden = false;
    var arrow = $("engineArrow");
    if (arrow) arrow.style.transform = "rotate(180deg)";
  }
  function closeEnginePanel() {
    enginePanelOpen = false;
    var panel = $("enginePanel");
    if (panel) panel.hidden = true;
    var arrow = $("engineArrow");
    if (arrow) arrow.style.transform = "";
  }
  function toggleEnginePanel() {
    if (enginePanelOpen) closeEnginePanel(); else openEnginePanel();
  }

  function doSearch() {
    var kw = $("searchInput").value.trim();
    if (kw && currentEngine) {
      window.open(currentEngine.url + encodeURIComponent(kw), "_blank");
    }
  }
  function clearSearch() {
    $("searchInput").value = "";
    $("clearBtn").hidden = true;
    $("searchInput").focus();
    filterLinks();
  }

  /* ---------- 卡片渲染 ---------- */
  function cardUrl(item) {
    return isIntranet && item.intranet ? item.intranet : item.url;
  }

  function buildCard(item) {
    var a = document.createElement("a");
    a.href = cardUrl(item);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.className = "card";

    var rawTitle = (item.title || "").replace(/\s+/g, "");
    a.dataset.title = (item.title || "").toLowerCase();
    a.dataset.desc = ((item.desc || "") + " " + (item.keywords || item["data-desc"] || "")).toLowerCase();
    a.dataset.pinyin = safePinyin(rawTitle);
    a.dataset.py = safePinyinFirst(rawTitle);
    if (item.intranet) {
      a.dataset.url = item.url;
      a.dataset.intranet = item.intranet;
    }

    var img = document.createElement("img");
    img.className = "favicon";
    img.loading = "lazy";
    img.alt = "";
    if (item.icon) {
      img.src = item.icon;
      img.onerror = function () {
        if (!this.dataset.fallbackTried) {
          this.dataset.fallbackTried = "1";
          this.src = faviconForUrl(item.url);
        } else {
          this.src = DEFAULT_ICON;
          this.onerror = null;
        }
      };
    } else {
      img.src = faviconForUrl(item.url);
      img.onerror = function () {
        var domain = getDomain(item.url);
        if (domain && !this.dataset.fallbackTried) {
          this.dataset.fallbackTried = "1";
          this.src = "https://" + domain + "/favicon.ico";
        } else {
          this.src = DEFAULT_ICON;
          this.onerror = null;
        }
      };
    }

    var top = document.createElement("div");
    top.className = "card-top";
    var titleEl = document.createElement("span");
    titleEl.className = "title";
    titleEl.textContent = item.title || "";
    top.appendChild(img);
    top.appendChild(titleEl);

    var desc = document.createElement("div");
    desc.className = "desc";
    desc.textContent = item.desc || "";

    var popup = document.createElement("div");
    popup.className = "info-popup";
    popup.textContent = getDomain(cardUrl(item)) || cardUrl(item);

    a.appendChild(top);
    a.appendChild(desc);
    a.appendChild(popup);
    return a;
  }

  function renderCards(sections) {
    var main = $("main-content");
    main.innerHTML = "";
    sections.forEach(function (section, index) {
      var sec = document.createElement("div");
      sec.className = "section";
      sec.dataset.index = index;

      var h2 = document.createElement("h2");
      h2.className = "section-title";
      h2.textContent = section.section;
      sec.appendChild(h2);

      var grid = document.createElement("div");
      grid.className = "link-container";
      (section.items || []).forEach(function (item) {
        grid.appendChild(buildCard(item));
      });
      sec.appendChild(grid);
      main.appendChild(sec);
    });
  }

  function renderCategoryTabsRow() {
    var row = $("categoryTabsRow");
    if (!row) return;
    row.innerHTML = "";
    linksData.forEach(function (section, index) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "category-tab-item" + (index === currentCategoryIndex ? " active" : "");
      btn.textContent = section.section;
      btn.addEventListener("click", function () {
        currentCategoryIndex = index;
        syncActiveTab();
        applyCategoryFilter();
      });
      row.appendChild(btn);
    });
  }

  function syncActiveTab() {
    var row = $("categoryTabsRow");
    if (!row) return;
    var tabs = row.querySelectorAll(".category-tab-item");
    tabs.forEach(function (tab, index) {
      tab.classList.toggle("active", index === currentCategoryIndex);
    });
  }

  function applyCategoryFilter() {
    var sections = document.querySelectorAll(".section");
    sections.forEach(function (sec, index) {
      if (layout === "tabs") {
        sec.classList.toggle("cat-hidden", index !== currentCategoryIndex);
      } else {
        sec.classList.remove("cat-hidden");
      }
    });
  }

  function applyLayout() {
    var row = $("categoryTabsRow");
    var btn = $("layoutToggleBtn");
    if (row) row.hidden = layout !== "tabs";
    if (btn) {
      btn.textContent = layout === "tabs" ? "🗂️" : "📑";
      btn.title = layout === "tabs" ? "当前：单页标签（点击切换为瀑布流）" : "当前：分类瀑布流（点击切换为单页标签）";
    }
    if (layout === "tabs") renderCategoryTabsRow();
    applyCategoryFilter();
  }

  function cycleLayout() {
    layout = layout === "waterfall" ? "tabs" : "waterfall";
    localStorage.setItem("layout", layout);
    applyLayout();
    if (layout === "tabs") {
      // 保证当前分类仍在可视范围
      requestAnimationFrame(function () {
        var active = $("categoryTabsRow") && $("categoryTabsRow").querySelector(".category-tab-item.active");
        if (active) active.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" });
      });
    }
  }

  function applyDensity() {
    document.body.classList.toggle("density-compact", density === "compact");
    var btn = $("densityToggleBtn");
    if (btn) btn.title = density === "compact" ? "卡片密度：紧凑（点击切换为宽松）" : "卡片密度：宽松（点击切换为紧凑）";
  }
  function cycleDensity() {
    density = density === "comfortable" ? "compact" : "comfortable";
    localStorage.setItem("density", density);
    applyDensity();
  }

  /* ---------- 站内筛选 ---------- */
  function filterLinks() {
    var input = $("searchInput");
    $("clearBtn").hidden = !input.value.length;
    var query = input.value.toLowerCase().trim();

    var visibleCount = 0;
    document.querySelectorAll(".card").forEach(function (card) {
      if (!query) {
        card.classList.remove("hidden");
        visibleCount++;
      } else {
        var match =
          card.dataset.title.indexOf(query) !== -1 ||
          card.dataset.desc.indexOf(query) !== -1 ||
          card.dataset.pinyin.indexOf(query) !== -1 ||
          card.dataset.py.indexOf(query) !== -1;
        card.classList.toggle("hidden", !match);
        if (match) visibleCount++;
      }
    });

    document.querySelectorAll(".section").forEach(function (section) {
      var visible = section.querySelectorAll(".card:not(.hidden)").length;
      section.classList.toggle("section-hidden", visible === 0);
    });

    // 单页标签模式：搜索时临时展示所有分类并隐藏无结果标签
    if (layout === "tabs") {
      var row = $("categoryTabsRow");
      var tabs = row ? row.querySelectorAll(".category-tab-item") : [];
      if (query) {
        if (!searchStateSaved) {
          preSearchIndex = currentCategoryIndex;
          searchStateSaved = true;
        }
        document.querySelectorAll(".section").forEach(function (sec) { sec.classList.remove("cat-hidden"); });
        var firstMatch = -1;
        tabs.forEach(function (tab, index) {
          var sec = document.querySelectorAll(".section")[index];
          if (!sec) { tab.style.display = "none"; return; }
          var hasMatch = sec.querySelectorAll(".card:not(.hidden)").length > 0;
          tab.style.display = hasMatch ? "" : "none";
          if (hasMatch && firstMatch === -1) firstMatch = index;
        });
        if (row) row.hidden = false;
        if (firstMatch !== -1) {
          currentCategoryIndex = firstMatch;
          syncActiveTab();
        }
      } else {
        if (searchStateSaved) {
          currentCategoryIndex = preSearchIndex;
          searchStateSaved = false;
          tabs.forEach(function (tab) { tab.style.display = ""; });
          syncActiveTab();
          applyCategoryFilter();
        }
      }
    }

    // 无结果提示
    var noResult = $("noResult");
    if (!query) {
      if (noResult) noResult.remove();
    } else if (visibleCount === 0) {
      if (!noResult) {
        noResult = document.createElement("div");
        noResult.id = "noResult";
        noResult.className = "no-result";
        noResult.textContent = "没有找到相关网站，试试其他关键词或按 Enter 直接搜索网页";
        $("main-content").appendChild(noResult);
      }
    } else if (noResult) {
      noResult.remove();
    }
  }

  /* ---------- 内外网切换 ---------- */
  function updateNetToggleBtn() {
    var btn = $("netToggleBtn");
    if (!btn) return;
    var hasIntranet = linksData.some(function (s) {
      return (s.items || []).some(function (i) { return i.intranet; });
    });
    btn.hidden = !(CFG.enableIntranet && hasIntranet);
    btn.textContent = isIntranet ? "🏠 内网" : "🌐 外网";
    btn.classList.toggle("active", isIntranet);
  }
  function toggleNetMode() {
    isIntranet = !isIntranet;
    localStorage.setItem("netMode", isIntranet ? "intranet" : "internet");
    updateNetToggleBtn();
    document.querySelectorAll(".card[data-url][data-intranet]").forEach(function (a) {
      var url = isIntranet ? a.dataset.intranet : a.dataset.url;
      a.href = url;
      var popup = a.querySelector(".info-popup");
      if (popup) popup.textContent = getDomain(url) || url;
    });
  }

  /* ---------- 回到顶部 ---------- */
  function initBackTop() {
    var btn = $("backTopBtn");
    window.addEventListener("scroll", function () {
      if (btn) btn.hidden = window.scrollY <= 300;
    }, { passive: true });
    if (btn) btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    $("themeToggleBtn").addEventListener("click", cycleTheme);
    $("layoutToggleBtn").addEventListener("click", cycleLayout);
    $("densityToggleBtn").addEventListener("click", cycleDensity);
    $("engineTrigger").addEventListener("click", toggleEnginePanel);
    $("searchSubmitBtn").addEventListener("click", doSearch);
    $("clearBtn").addEventListener("click", clearSearch);
    $("netToggleBtn").addEventListener("click", toggleNetMode);

    var input = $("searchInput");
    input.addEventListener("input", filterLinks);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        doSearch();
      } else if (e.key === "Escape") {
        if (enginePanelOpen) { closeEnginePanel(); }
        else if (input.value) { clearSearch(); }
        else { input.blur(); }
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
      }
    });

    document.addEventListener("click", function (e) {
      if (enginePanelOpen && !e.target.closest(".search-wrapper")) closeEnginePanel();
    });

    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
        if (themeOverride === "auto") applyTheme();
      });
    }
  }

  /* ---------- 恢复持久化状态 ---------- */
  function restoreEngine() {
    var cats = getCategories();
    if (!cats.length) return;
    var savedCat = localStorage.getItem("engineCategory");
    var cat = cats.find(function (c) { return c.id === savedCat; }) || cats[0];
    currentCategoryId = cat.id;
    currentEngine = cat.engines[0];
    var savedEngine = localStorage.getItem("engineName");
    if (savedEngine) {
      var found = cat.engines.find(function (en) { return en.name === savedEngine; });
      if (found) currentEngine = found;
    }
  }

  /* ---------- Service Worker（可选 PWA 离线缓存） ---------- */
  function initServiceWorker() {
    if ("serviceWorker" in navigator && location.protocol === "https:") {
      navigator.serviceWorker.register("sw.js").catch(function () {
        /* 注册失败不影响使用 */
      });
    }
  }

  /* ---------- 启动 ---------- */
  function init() {
    applyTheme();
    applyBackground();
    applyHeader();
    restoreEngine();
    renderSearchTabs();
    updateSearchBoxEngine();
    bindEvents();
    applyDensity();
    initBackTop();
    initServiceWorker();

    fetch(LINKS_FILE + "?t=" + Date.now())
      .then(function (res) {
        if (!res.ok) throw new Error("加载 " + LINKS_FILE + " 失败：" + res.status);
        return res.json();
      })
      .then(function (data) {
        linksData = data || [];
        renderCards(linksData);
        applyLayout();
        updateNetToggleBtn();
        filterLinks();
      })
      .catch(function (err) {
        var main = $("main-content");
        if (main) {
          main.innerHTML =
            '<div class="no-result">⚠️ ' + (err && err.message ? err.message : "数据加载失败") +
            '。请检查 ' + LINKS_FILE + ' 是否存在且格式正确。</div>';
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
