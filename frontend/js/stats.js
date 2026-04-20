(function () {
  var STORAGE_KEY = "stats-admin-key";

  function byId(id) {
    return document.getElementById(id);
  }

  var state = {
    apiBase: window.TEST_API_BASE_URL || "http://localhost:8787",
    apiKey: sessionStorage.getItem(STORAGE_KEY) || "",
    period: localStorage.getItem("stats-period") || "30"
  };

  function formatDate(value) {
    if (!value) return "—";
    var d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString("ru-RU");
  }

  function setStatus(text, isError) {
    var node = byId("status-line");
    if (!node) return;
    node.textContent = text;
    node.style.color = isError ? "#fca5a5" : "#94a9d1";
  }

  function setAccessStatus(text, isError) {
    var node = byId("access-status");
    if (!node) return;
    node.textContent = text;
    node.style.color = isError ? "#fca5a5" : "#94a9d1";
  }

  function percent(delivered, total) {
    if (!total) return "0%";
    return (Math.round((delivered / total) * 1000) / 10).toFixed(1) + "%";
  }

  function buildHeaders() {
    var headers = {};
    if (state.apiKey) headers["X-API-Key"] = state.apiKey;
    return headers;
  }

  function buildSummaryUrl(period) {
    var base = state.apiBase.replace(/\/$/, "");
    if (period === "all") return base + "/api/v1/stats/summary";
    return base + "/api/v1/stats/summary?days=" + encodeURIComponent(period);
  }

  function buildEventsUrl(period) {
    var base = state.apiBase.replace(/\/$/, "");
    if (period === "all") return base + "/api/v1/stats/events?limit=100";
    return base + "/api/v1/stats/events?limit=100&days=" + encodeURIComponent(period);
  }

  function setHealthValue(id, text, tone) {
    var node = byId(id);
    if (!node) return;
    node.textContent = text;
    node.className = tone ? "health-value " + tone : "health-value";
  }

  function renderBars(containerId, rows, labelKey, valueKey) {
    var host = byId(containerId);
    host.innerHTML = "";

    if (!rows || !rows.length) {
      host.innerHTML = '<p class="status">Пока нет данных за выбранный период.</p>';
      return;
    }

    var max = rows.reduce(function (acc, item) {
      return Math.max(acc, Number(item[valueKey] || 0));
    }, 0);

    rows.forEach(function (item) {
      var value = Number(item[valueKey] || 0);
      var width = max > 0 ? Math.max(3, Math.round((value / max) * 100)) : 0;

      var wrap = document.createElement("div");
      wrap.className = "bar-row";
      wrap.innerHTML =
        '<div class="bar-meta"><span>' + item[labelKey] + '</span><strong>' + value + '</strong></div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + width + '%"></div></div>';
      host.appendChild(wrap);
    });
  }

  function renderEvents(items) {
    var body = byId("events-body");
    body.innerHTML = "";

    if (!items || !items.length) {
      body.innerHTML = '<tr><td colspan="5" class="muted-cell">Нет данных за выбранный период.</td></tr>';
      return;
    }

    items.forEach(function (row) {
      var tr = document.createElement("tr");
      var top3 = (row.top3 || [])
        .map(function (x) {
          var val = Number(x.total || 0);
          return x.name + " (" + (Math.round(val * 10) / 10).toFixed(1) + "%)";
        })
        .join("<br>");

      var delivered = row.email && row.email.delivered;
      var mode = row.email && row.email.mode ? row.email.mode : "unknown";
      var mailPill = delivered
        ? '<span class="pill ok">OK</span>'
        : '<span class="pill bad">Ошибка</span>';

      tr.innerHTML =
        "<td>" + formatDate(row.at) + "</td>" +
        "<td>" + (row.topDirection || "—") + "</td>" +
        "<td>" + (top3 || "—") + "</td>" +
        "<td>" + (row.riasecTop && row.riasecTop.key ? row.riasecTop.key + " (" + row.riasecTop.value + "%)" : "—") + "</td>" +
        "<td>" + mailPill + "<br><small>" + mode + "</small></td>";
      body.appendChild(tr);
    });
  }

  function showDashboard() {
    byId("access-shell").classList.add("is-hidden");
    byId("dashboard").classList.remove("is-hidden");
    setHealthValue("health-access", state.apiKey ? "Ключ задан" : "Локальный доступ", "ok");
  }

  function showAccessScreen(message) {
    byId("dashboard").classList.add("is-hidden");
    byId("access-shell").classList.remove("is-hidden");
    byId("admin-key").value = "";
    setAccessStatus(message || "Ожидание доступа", !!message);
    setHealthValue("health-access", "Закрыт", "warn");
  }

  async function loadHealth() {
    try {
      var response = await fetch(state.apiBase.replace(/\/$/, "") + "/api/health");
      var data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error((data && data.error) || "health_failed");
      }

      setHealthValue("health-api", "Доступен", "ok");
      setHealthValue("health-smtp", data.smtpConfigured ? "Настроен" : "Dry-run", data.smtpConfigured ? "ok" : "warn");
      return data;
    } catch (error) {
      setHealthValue("health-api", "Недоступен", "bad");
      setHealthValue("health-smtp", "Неизвестно", "warn");
      throw error;
    }
  }

  async function loadSummary() {
    var period = byId("period").value;
    localStorage.setItem("stats-period", period);
    setHealthValue("health-period", period === "all" ? "Все время" : period + " дн.", "neutral");
    setStatus("Загружаю статистику...", false);

    try {
      await loadHealth();

      var response = await fetch(buildSummaryUrl(period), { headers: buildHeaders() });
      var data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error((data && data.error) || "request_failed");
      }

      var s = data.summary || {};
      byId("metric-total").textContent = String(s.totalSubmissions || 0);
      byId("metric-unique").textContent = String(s.uniqueUsers || 0);

      var delivered = s.emailDelivery ? Number(s.emailDelivery.delivered || 0) : 0;
      var failed = s.emailDelivery ? Number(s.emailDelivery.failed || 0) : 0;
      byId("metric-delivery").textContent = percent(delivered, delivered + failed);
      byId("metric-last").textContent = formatDate(s.lastSubmissionAt);

      renderBars("top-directions", s.topDirections || [], "name", "count");
      renderBars("top-riasec", s.topRiasec || [], "key", "count");

      var eventsResp = await fetch(buildEventsUrl(period), { headers: buildHeaders() });
      var eventsData = await eventsResp.json();
      if (!eventsResp.ok || !eventsData.ok) {
        throw new Error((eventsData && eventsData.error) || "events_request_failed");
      }
      renderEvents((eventsData.events && eventsData.events.items) || []);

      var rangeLabel = "все время";
      if (s.range && s.range.days) rangeLabel = "последние " + s.range.days + " дн.";
      setStatus("Данные обновлены: " + new Date().toLocaleTimeString("ru-RU") + " • период: " + rangeLabel, false);
    } catch (error) {
      if (error && error.message === "invalid_api_key") {
        sessionStorage.removeItem(STORAGE_KEY);
        state.apiKey = "";
        showAccessScreen("Неверный admin key");
        return;
      }

      setStatus("Ошибка загрузки: " + error.message, true);
    }
  }

  function handleAccess() {
    state.apiKey = byId("admin-key").value.trim();
    sessionStorage.setItem(STORAGE_KEY, state.apiKey);
    showDashboard();
    loadSummary();
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY);
    state.apiKey = "";
    showAccessScreen("Доступ закрыт");
  }

  function init() {
    byId("period").value = state.period;
    byId("refresh-btn").addEventListener("click", loadSummary);
    byId("period").addEventListener("change", loadSummary);
    byId("access-btn").addEventListener("click", handleAccess);
    byId("logout-btn").addEventListener("click", handleLogout);
    byId("admin-key").addEventListener("keydown", function (event) {
      if (event.key === "Enter") handleAccess();
    });

    if (sessionStorage.getItem(STORAGE_KEY) !== null) {
      showDashboard();
      loadSummary();
    } else {
      showAccessScreen();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
