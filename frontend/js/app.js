// ================================================================
//  Логика приложения — Профориентационный тест Дубна
// ================================================================

// ================================================================
//  STATE
// ================================================================
var answers      = {};
var allQuestions = [];
var qIdx         = 0;
var activeQNum   = null;
var finalResults = null;
var started      = false;
var autoMode     = false;
var currentTheme = "dark";
var TOTAL_QUESTIONS = Array.isArray(BLOCKS)
  ? BLOCKS.reduce(function(total, block) {
      return total + block.groups.reduce(function(groupTotal, group) {
        return groupTotal + group.questions.length;
      }, 0);
    }, 0)
  : 76;

// Ссылка на Google Form
var FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScoMvmbt1_JjSMmGfDQYHrmS4D4iYRSfUioAN2R016FXb6_XA/viewform?usp=dialog";
var API_BASE_URL = window.TEST_API_BASE_URL || "http://localhost:8787";
var userProfile = { name: "", email: "", consent: false };
var emailDispatchState = "idle";

// ================================================================
//  Тема
// ================================================================
function updateThemeToggle() {
  var btn = document.getElementById("theme-toggle-btn");
  if (!btn) return;

  var isLight = currentTheme === "light";
  btn.textContent = isLight ? "☀️" : "🌙";
  btn.title = isLight ? "Светлая тема" : "Тёмная тема";
  btn.setAttribute(
    "aria-label",
    isLight
      ? "Сейчас светлая тема. Переключить на тёмную тему"
      : "Сейчас тёмная тема. Переключить на светлую тему"
  );
}

function applyTheme(theme) {
  currentTheme = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  document.documentElement.style.colorScheme = currentTheme;

  try {
    localStorage.setItem("dubna-theme", currentTheme);
  } catch (e) {}

  updateThemeToggle();
}

function toggleTheme() {
  applyTheme(currentTheme === "light" ? "dark" : "light");
}

function initTheme() {
  var savedTheme = "dark";

  try {
    savedTheme = localStorage.getItem("dubna-theme") || "dark";
  } catch (e) {}

  applyTheme(savedTheme);
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function readLeadFromForm() {
  var nameEl = document.getElementById("lead-name");
  var emailEl = document.getElementById("lead-email");
  var consentEl = document.getElementById("lead-consent");

  return {
    name: nameEl ? String(nameEl.value || "").trim() : userProfile.name,
    email: emailEl ? String(emailEl.value || "").trim() : userProfile.email,
    consent: consentEl ? !!consentEl.checked : userProfile.consent
  };
}

function persistLeadProfile(profile) {
  userProfile = {
    name: profile.name,
    email: profile.email,
    consent: profile.consent
  };
}

function ensureLeadProfile() {
  var profile = readLeadFromForm();
  if (!profile.name || profile.name.length < 2) {
    setStatus("Введите имя (минимум 2 символа)");
    return false;
  }
  if (!validateEmail(profile.email)) {
    setStatus("Введите корректный email");
    return false;
  }
  if (!profile.consent) {
    setStatus("Нужно согласие на обработку данных");
    return false;
  }
  persistLeadProfile(profile);
  return true;
}

function buildResultPayload() {
  if (!Object.keys(answers).length) return null;

  return {
    user: {
      name: userProfile.name,
      email: userProfile.email,
      consent: userProfile.consent
    },
    answers: answers,
    meta: {
      source: "web-test",
      createdAt: new Date().toISOString(),
      version: "v1"
    }
  };
}

async function postJson(url, payload) {
  var response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  var data = {};
  try {
    data = await response.json();
  } catch (_) {}

  return {
    response: response,
    data: data
  };
}

async function calculateResults() {
  var payload = { answers: answers };
  if (!Object.keys(answers).length) return { ok: false, error: "answers_required" };

  try {
    var result = await postJson(API_BASE_URL + "/api/v1/test/calculate", payload);

    if (!result.response.ok || !result.data.ok) {
      return {
        ok: false,
        error: (result.data && result.data.error) || ("http-" + result.response.status)
      };
    }

    return {
      ok: true,
      result: result.data.result
    };
  } catch (error) {
    return { ok: false, error: error && error.message ? error.message : "network" };
  }
}

async function sendResultsToEmail() {
  var payload = buildResultPayload();
  if (!payload) return { ok: false, error: "missing-results" };

  try {
    var result = await postJson(API_BASE_URL + "/api/v1/results/email", payload);

    if (!result.response.ok || !result.data.ok) {
      return {
        ok: false,
        error: (result.data && result.data.error) || ("http-" + result.response.status)
      };
    }

    return {
      ok: true,
      sent: !!(result.data && result.data.sent),
      mode: (result.data && result.data.mode) || "unknown",
      data: result.data
    };
  } catch (error) {
    return { ok: false, error: error && error.message ? error.message : "network" };
  }
}

async function downloadPDF() {
  var payload = buildResultPayload();
  if (!payload) return;

  try {
    setStatus("Готовлю PDF-отчёт...");

    var response = await fetch(API_BASE_URL + "/api/v1/results/pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      var errorData = {};
      try {
        errorData = await response.json();
      } catch (_) {}

      throw new Error((errorData && errorData.error) || ("http-" + response.status));
    }

    var blob = await response.blob();
    var url = window.URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "career-test-report.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setStatus("PDF-отчёт готов");
  } catch (error) {
    var reason = error && error.message ? error.message : "pdf_error";
    showToast('Не удалось сформировать PDF (<b>' + escapeHtml(reason) + '</b>).', "warn", 5200);
    setStatus("Не удалось сформировать PDF");
  }
}

function handleStartClick() {
  if (!ensureLeadProfile()) return;
  startTest();
}

// ================================================================
//  Сбор плоского списка вопросов
// ================================================================
function buildQuestions() {
  allQuestions = [];
  BLOCKS.forEach(function(block) {
    block.groups.forEach(function(group, gi) {
      group.questions.forEach(function(q, qi) {
        allQuestions.push({
          qnum:           q[0],
          text:           q[1],
          blockId:        block.id,
          blockLabel:     block.label,
          blockNum:       block.num,
          blockIntro:     block.intro,
          groupKey:       group.key,
          groupName:      group.name,
          isFirstInBlock: gi === 0 && qi === 0
        });
      });
    });
  });
}

// ================================================================
//  Подсчёт результатов
// ================================================================
// ================================================================
//  Подписи и helper-функции
// ================================================================
var RIASEC_LABELS = {
  R: "Реалистичный",
  I: "Исследовательский",
  A: "Артистический",
  S: "Социальный",
  E: "Предпринимательский",
  C: "Конвенциональный"
};

var KLIMOV_LABELS = {
  "ЧЧ": "Человек — Человек",
  "ЧП": "Человек — Природа",
  "ЧЗ": "Человек — Знаковые системы",
  "ЧТ": "Человек — Техника",
  "ЧХ": "Человек — Художественный образ"
};

function getStudyLabels() {
  var map = {};
  BLOCKS.forEach(function(block) {
    if (block.id !== "study") return;
    block.groups.forEach(function(group) {
      map[group.key] = group.name;
    });
  });
  return map;
}

function getSortedPairs(obj) {
  return Object.keys(obj)
    .map(function(key) {
      return { key: key, value: obj[key] || 0 };
    })
    .sort(function(a, b) { return b.value - a.value; });
}

function getTopPair(obj) {
  return getSortedPairs(obj)[0] || { key: "", value: 0 };
}

function getTopPairs(obj, count) {
  return getSortedPairs(obj).slice(0, count || 3);
}

function joinHuman(items) {
  if (!items || !items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return items[0] + " и " + items[1];
  return items.slice(0, -1).join(", ") + " и " + items[items.length - 1];
}

function buildDirectionPracticalSummary(details) {
  if (!details) details = {};

  var parts = [];

  if (details.exams) {
    parts.push("ЕГЭ: " + details.exams + ".");
  }

  if (details.score_budget && details.score_budget !== "н/д") {
    parts.push("Проходной балл: " + details.score_budget + ".");
  }

  if (details.budget_places || details.budget_places === 0) {
    parts.push(
      details.budget_places > 0
        ? "Бюджетных мест: " + details.budget_places + "."
        : "Бюджетных мест сейчас нет."
    );
  }

  if (!parts.length && details.code) {
    parts.push("Код направления: " + details.code + ".");
  }

  return parts.join(" ");
}

function buildResultInsights(riasec, klimov, study) {
  var studyLabels = getStudyLabels();
  var topRiasec = getTopPairs(riasec, 2).map(function(item) {
    return RIASEC_LABELS[item.key] + " — " + item.value + "%";
  });
  var topKlimov = getTopPair(klimov);
  var topStudy = getTopPairs(study, 2).map(function(item) {
    return (studyLabels[item.key] || item.key) + " — " + item.value + "%";
  });

  return [
    {
      title: "Ведущие личностные типы",
      text: joinHuman(topRiasec)
    },
    {
      title: "Предпочтительный предмет труда",
      text: KLIMOV_LABELS[topKlimov.key] + " — " + topKlimov.value + "%"
    },
    {
      title: "Наиболее выраженные учебные интересы",
      text: joinHuman(topStudy)
    }
  ];
}

function buildDirectionTableRows(ranked) {
  return ranked.map(function(d, i) {
    var details = PROGRAM_DETAILS[d.name] || {};
    var codeStr = details.code || "-";
    var examStr = details.exams || "-";
    var scoreStr = details.score_budget || "-";
    var nameLink = details.url
      ? '<a href="' + details.url + '" target="_blank" rel="noopener noreferrer">' + d.name + '</a>'
      : d.name;

    return "<tr>"
      + "<td>" + (i + 1) + "</td>"
      + "<td>" + codeStr + "</td>"
      + "<td>" + nameLink + "</td>"
      + "<td class=\"muted-cell\">" + examStr + "</td>"
      + "<td>" + scoreStr + "</td>"
      + "<td><b>" + d.total + "</b></td>"
      + "<td class=\"bar-wrap\"><div class=\"bar-bg\"><div class=\"bar-fg\" style=\"width:" + d.total + "%\"></div></div></td>"
      + "</tr>";
  }).join("");
}

function buildProfileRows(data, labels) {
  return Object.keys(data).map(function(key) {
    var value = data[key];
    return '<div class="profile-row">'
      + '<div class="profile-label">' + labels[key] + (RIASEC_LABELS[key] ? ' (' + key + ')' : '') + '</div>'
      + '<div class="profile-bar-bg"><div class="profile-bar-fg" style="width:' + value + '%"></div></div>'
      + '<div class="profile-pct">' + value + '%</div>'
      + '</div>';
  }).join("");
}

function buildCollapsibleSection(title, content, extraClass) {
  return '<details class="results-details compact-details' + (extraClass ? ' ' + extraClass : '') + '">'
    + '<summary>' + title + '</summary>'
    + '<div class="details-body">' + content + '</div>'
    + '</details>';
}

function buildTopCards(ranked, riasec, klimov, study) {
  return ranked.slice(0, 3).map(function(d, i) {
    var details = PROGRAM_DETAILS[d.name] || {};
    var summary = buildDirectionPracticalSummary(details);
    var scoreBudget = details.score_budget || details.score_budget === 0 ? details.score_budget : 'н/д';
    var budgetPlaces = details.budget_places || details.budget_places === 0 ? details.budget_places : 'н/д';
    var nameLink = details.url
      ? '<a class="recommend-name-link" href="' + details.url + '" target="_blank" rel="noopener noreferrer">' + d.name + '</a>'
      : d.name;

    return '<div class="recommend-card">'
      + '<div class="recommend-card-top">'
      + '<div class="recommend-rank">' + (i + 1) + '</div>'
      + '<div>'
      + '<div class="recommend-name">' + nameLink + '</div>'
      + '<div class="recommend-meta">Совпадение ' + d.total + '% &nbsp;•&nbsp; Код ' + (details.code || '—') + '</div>'
      + '</div>'
      + '</div>'
      + '<div class="recommend-summary">' + summary + '</div>'
      + '<div class="recommend-stats">'
      + '<div class="recommend-stat"><span>Проходной балл</span><b>' + scoreBudget + '</b></div>'
      + '<div class="recommend-stat"><span>Бюджетных мест</span><b>' + budgetPlaces + '</b></div>'
      + '</div>'
      + '</div>';
  }).join("");
}

function buildInsightCards(insights) {
  return insights.map(function(item) {
    return '<div class="insight-card">'
      + '<div class="insight-title">' + item.title + '</div>'
      + '<div class="insight-text">' + item.text + '</div>'
      + '</div>';
  }).join("");
}

function buildNextSteps() {
  return '<div class="next-steps">'
    + '<div class="next-steps-grid">'
    + '<div class="next-step-item"><b>1.</b> Сравните топ-3 направления и подумайте, где вам ближе формат учёбы и будущая работа.</div>'
    + '<div class="next-step-item"><b>2.</b> Изучите описание образовательных программ, список предметов и проходные баллы.</div>'
    + '<div class="next-step-item"><b>3.</b> Сохраните PDF-отчёт и используйте его как основу для разговора с родителями, педагогом или на дне открытых дверей.</div>'
    + '</div>'
    + '</div>';
}

function buildResultsHTML(riasec, klimov, study, ranked) {
  var leader = ranked[0];
  var details = PROGRAM_DETAILS[leader.name] || {};
  var rBars = buildProfileRows(riasec, RIASEC_LABELS);
  var kBars = buildProfileRows(klimov, KLIMOV_LABELS);
  var hexSvg = buildHex(riasec, RIASEC_LABELS);
  var topCards = buildTopCards(ranked, riasec, klimov, study);
  var tableRows = buildDirectionTableRows(ranked);
  var nextSteps = buildNextSteps();
  var leaderTitle = details.url
    ? '<a class="results-title-link" href="' + details.url + '" target="_blank" rel="noopener noreferrer">' + leader.name + '</a>'
    : leader.name;
  var budgetPlaces = details.budget_places || details.budget_places === 0 ? details.budget_places : 'н/д';
  var scoreBudget = details.score_budget || details.score_budget === 0 ? details.score_budget : 'н/д';
  var topThreeSection = '<div class="section-title">Топ-3 рекомендованных направления</div>'
    + '<div class="recommend-grid">' + topCards + '</div>';
  var fullRatingSection = '<table class="dir-table">'
    + '<thead><tr><th>#</th><th>Код</th><th>Направление</th><th>ЕГЭ</th><th>Балл</th><th>Итого</th><th></th></tr></thead>'
    + '<tbody>' + tableRows + '</tbody>'
    + '</table>';
  var riasecChartSection = '<div class="analytics-panel"><div class="section-title">Профиль RIASEC</div><div class="hex-container">' + hexSvg + '</div></div>';
  var riasecProfileSection = '<div class="profile-section">' + rBars + '</div>';
  var actionButtonsSection = '<div class="action-btns">'
    + '<button class="pdf-btn" onclick="downloadPDF()">Скачать PDF-отчёт</button>'
    + '<button class="restart-btn" onclick="restartTest()">Пройти заново</button>'
    + '</div>';

  return '<div class="results-block">'
    + '<div class="result-hero desktop-only">'
    + '<div class="result-badge">Тест завершён</div>'
    + '<div class="results-title">Рекомендуемое направление: ' + leaderTitle + '</div>'
    + '<div class="result-hero-text">'
    + 'Лучшее совпадение составило <b>' + leader.total + '%</b>. '
    + (details.code ? 'Код направления: <b>' + details.code + '</b>. ' : '')
    + 'Результат носит рекомендательный характер и помогает сузить выбор на основе ваших интересов и склонностей.'
    + '</div>'
    + '<div class="hero-metrics">'
    + '<div class="hero-metric"><span>Код направления</span><b>' + (details.code || 'н/д') + '</b></div>'
    + '<div class="hero-metric"><span>Бюджетные места</span><b>' + budgetPlaces + '</b></div>'
    + '<div class="hero-metric"><span>Проходной балл</span><b>' + scoreBudget + '</b></div>'
    + '</div>'
    + (details.exams ? '<div class="result-hero-text hero-exams">Предметы ЕГЭ: <b>' + details.exams + '</b></div>' : '')
    + '</div>'
    + '<div class="mobile-only">' + topThreeSection + '</div>'
    + '<div class="desktop-only">' + topThreeSection + '</div>'
    + buildCollapsibleSection('Что можно сделать дальше?', nextSteps)
    + riasecChartSection
    + buildCollapsibleSection('Профиль по методике RIASEC', riasecProfileSection, 'profile-collapsible')
    + buildCollapsibleSection('Профиль по методике Климова', '<div class="profile-section">' + kBars + '</div>', 'profile-collapsible')
    + buildCollapsibleSection('Полный рейтинг всех направлений', fullRatingSection)
    + actionButtonsSection
    + '</div>';
}

function buildFeedbackHTML() {
  return '<div class="feedback-block">'
    + '<div class="feedback-title">Пожалуйста, оставьте обратную связь</div>'
    + '<div class="feedback-text">Ваш отзыв поможет улучшить тест, сделать рекомендации точнее и показать результаты апробации комиссии.</div>'
    + '<a class="feedback-btn" href="' + FEEDBACK_FORM_URL + '" target="_blank" rel="noopener noreferrer">Открыть форму обратной связи</a>'
    + '</div>';
}

// ================================================================
//  DOM helper-функции
// ================================================================
function scrollBottom() {
  var a = document.getElementById("chat-area");
  if (!a) return;

  if (window.innerWidth <= 768) {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  } else {
    a.scrollTop = a.scrollHeight;
  }
}

function addMsg(who, html, scrollMode) {
  var inner = document.getElementById("chat-inner");
  var wrap  = document.createElement("div");
  var isResultsMessage = /results-block/.test(html);
  var bubbleClass = /results-block|welcome-card|feedback-block/.test(html) ? ' wide-bubble' : '';
  wrap.className = "msg " + who;
  wrap.innerHTML = '<div class="msg-avatar">' + (who === "bot" ? "AI" : "Вы") + '</div>'
                 + '<div class="msg-bubble' + bubbleClass + '">' + html + '</div>';
  inner.appendChild(wrap);

  if (scrollMode === "top" || isResultsMessage) {
    setTimeout(function() {
      var offset = 120;
      if (window.innerWidth <= 768) {
        var top = window.pageYOffset + wrap.getBoundingClientRect().top - offset;
        window.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
      } else {
        var area = document.getElementById("chat-area");
        if (area) {
          var areaRect = area.getBoundingClientRect();
          var targetTop = area.scrollTop + (wrap.getBoundingClientRect().top - areaRect.top) - offset;
          area.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
        }
      }
    }, 40);
    return;
  }

  if (scrollMode === "none") {
    return;
  }

  scrollBottom();
}

function showTyping(scrollMode) {
  var inner = document.getElementById("chat-inner");
  var d = document.createElement("div");
  d.className = "msg bot";
  d.id = "typing";
  d.innerHTML = '<div class="msg-avatar">AI</div>'
              + '<div class="typing"><span></span><span></span><span></span></div>';
  inner.appendChild(d);

  if (scrollMode === "none") {
    return;
  }

  scrollBottom();
}

function hideTyping() {
  var t = document.getElementById("typing");
  if (t) t.remove();
}

function botSay(html, ms, scrollMode) {
  ms = ms || 500;
  return new Promise(function(res) {
    showTyping(scrollMode);
    setTimeout(function() {
      hideTyping();
      addMsg("bot", html, scrollMode);
      res();
    }, ms);
  });
}

function wait(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function setStatus(text) {
  document.getElementById("input-status").textContent = text;
}

function ensureToastRoot() {
  var root = document.getElementById("toast-root");
  if (root) return root;

  root = document.createElement("div");
  root.id = "toast-root";
  root.className = "toast-root";
  document.body.appendChild(root);
  return root;
}

function showToast(message, tone, timeoutMs) {
  var root = ensureToastRoot();
  var toast = document.createElement("div");
  toast.className = "toast " + (tone || "info");
  toast.innerHTML = '<div class="toast-body">' + message + '</div>';
  root.appendChild(toast);

  setTimeout(function() {
    toast.classList.add("show");
  }, 10);

  var ttl = typeof timeoutMs === "number" ? timeoutMs : 4200;
  setTimeout(function() {
    toast.classList.remove("show");
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 220);
  }, ttl);
}

function showConfirmBtn(label) {
  var b = document.getElementById("confirm-btn");
  b.textContent = label || "Далее";
  b.style.display = "block";
  b.disabled = false;
}

function hideConfirmBtn() {
  document.getElementById("confirm-btn").style.display = "none";
}

function updateHdrQ() {
  var count = Object.keys(answers).length;
  var pct = Math.round((count / TOTAL_QUESTIONS) * 100);
  var qNode = document.getElementById("hdr-q");
  var pctNode = document.getElementById("hdr-pct");
  var fillNode = document.getElementById("hdr-progress-fill");

  if (qNode) qNode.textContent = count;
  if (pctNode) pctNode.textContent = pct + "%";
  if (fillNode) fillNode.style.width = pct + "%";
}

function clearConfetti() {
  var layer = document.getElementById("confetti-layer");
  if (layer) layer.innerHTML = "";
}

function launchConfetti() {
  var layer = document.getElementById("confetti-layer");
  if (!layer) return;

  clearConfetti();

  var colors = ["#60a5fa", "#a78bfa", "#f59e0b", "#34d399", "#f472b6", "#f97316"];
  var shapes = ["square", "circle", "triangle"];
  var total = 40;

  for (var i = 0; i < total; i++) {
    var piece = document.createElement("span");
    var side = i < total / 2 ? "left" : "right";
    var delay = Math.random() * 240;
    var duration = 2600 + Math.random() * 1200;
    var size = 8 + Math.round(Math.random() * 8);
    var top = 10 + Math.random() * 45;
    var drift = 40 + Math.random() * 60;
    var rotate = (Math.random() * 720 - 360).toFixed(0) + "deg";
    var color = colors[Math.floor(Math.random() * colors.length)];
    var shape = shapes[Math.floor(Math.random() * shapes.length)];

    piece.className = "confetti-piece side-" + side + " shape-" + shape;
    piece.style.width = size + "px";
    piece.style.height = size + "px";
    piece.style.background = color;
    piece.style.color = color;
    piece.style.top = top + "vh";
    piece.style.animationDelay = delay + "ms";
    piece.style.animationDuration = duration + "ms";
    piece.style.setProperty("--drift", drift + "vw");
    piece.style.setProperty("--rotate-end", rotate);
    layer.appendChild(piece);
  }

  setTimeout(clearConfetti, 4200);
}

// ================================================================
//  АВТОЗАПОЛНЕНИЕ ТЕСТА
// ================================================================
async function autoCompleteTest() {
  if (!ensureLeadProfile()) return;
  if (autoMode) return;
  autoMode = true;

  var autoBtn = document.getElementById("auto-btn");
  if (autoBtn) {
    autoBtn.disabled = true;
    autoBtn.style.opacity = "0.6";
  }

  if (!allQuestions.length) buildQuestions();

  allQuestions.forEach(function(q) {
    if (!answers[q.qnum]) {
      answers[q.qnum] = Math.floor(Math.random() * 5) + 1;
    }
  });

  qIdx = allQuestions.length;
  updateHdrQ();
  await showResults();

  autoMode = false;
  if (autoBtn) autoBtn.style.display = "none";
}

// ================================================================
//  FLOW
// ================================================================
async function startTest() {
  if (started) return;
  if (!ensureLeadProfile()) return;
  started = true;
  buildQuestions();
  qIdx = 0;
  hideConfirmBtn();
  setStatus("Тест идёт...");

  await botSay(
    '<div class="intro-message">'
    + '<div class="intro-title">Добро пожаловать!</div>'
    + '<div class="intro-text">Тест поможет подобрать наиболее подходящие направления обучения в Университете «Дубна» на основе ваших интересов, склонностей и предпочитаемого формата деятельности.</div>'
    + '<div class="intro-chip-row">'
    + '<span class="info-chip">76 вопросов</span>'
    + '<span class="info-chip">≈ 5–7 минут</span>'
    + '<span class="info-chip">3 методики</span>'
    + '</div>'
    + '<div class="intro-note">Отвечайте честно. Результат носит рекомендательный характер и помогает сузить круг подходящих направлений.</div>'
    + '</div>',
    700
  );

  await wait(280);
  await nextQuestion();
}

async function nextQuestion() {
  if (qIdx >= allQuestions.length) {
    await showResults();
    return;
  }

  var q = allQuestions[qIdx];

  if (q.isFirstInBlock) {
    await botSay(
      '<div class="block-intro">'
      + '<div class="block-badge">Блок ' + q.blockNum + ' из 3</div>'
      + '<div class="block-title">' + q.blockLabel + '</div>'
      + '<div class="block-text">' + q.blockIntro + '</div>'
      + '</div>',
      380
    );
    await wait(180);
  }

  activeQNum = q.qnum;
  var saved = answers[q.qnum] || null;
  var btns = "";

  for (var v = 1; v <= 5; v++) {
    btns += '<button class="scale-btn' + (saved === v ? ' selected' : '') + '" onclick="selectAnswer(this,' + v + ')">' + v + '</button>';
  }

  await botSay(
    '<div class="question-meta">'
    + q.blockLabel + ' — ' + q.groupName + ' &nbsp;|&nbsp; Вопрос ' + q.qnum + ' из ' + TOTAL_QUESTIONS
    + '</div>'
    + '<div class="question-text">' + q.text + '</div>'
    + '<div class="scale-row">' + btns + '</div>'
    + '<div class="scale-labels"><span>не согласен</span><span>согласен</span></div>',
    300
  );

  setStatus('Выберите ответ от 1 до 5');
  if (saved) showConfirmBtn('Далее');
  else hideConfirmBtn();
}

function selectAnswer(btn, val) {
  var row = btn.parentElement;
  if (row) {
    row.querySelectorAll('.scale-btn.selected').forEach(function(b) {
      b.classList.remove('selected');
    });
  }

  btn.classList.add('selected');
  answers[activeQNum] = val;
  updateHdrQ();
  setStatus('Ответ: ' + val + ' — нажмите «Далее»');
  showConfirmBtn('Далее');
}

async function onConfirm() {
  if (!answers[activeQNum]) {
    setStatus('Сначала выберите ответ (1–5)');
    return;
  }

  var rows = document.querySelectorAll('.scale-row');
  if (rows.length) {
    var row = rows[rows.length - 1];
    row.querySelectorAll('.scale-btn').forEach(function(btn) {
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
    });
  }

  addMsg('user', '' + answers[activeQNum]);
  hideConfirmBtn();
  qIdx++;
  await wait(140);
  await nextQuestion();
}

// ================================================================
//  RESULTS
// ================================================================
async function showResults() {
  setStatus('Тест завершён');
  hideConfirmBtn();

  var autoBtn = document.getElementById('auto-btn');
  if (autoBtn) autoBtn.style.display = 'none';

  await botSay('Все вопросы пройдены. Анализирую профиль и формирую персональные рекомендации...', 650);
  await wait(500);

  var calculated = await calculateResults();
  if (!calculated.ok || !calculated.result) {
    var calcReason = calculated && calculated.error ? escapeHtml(calculated.error) : "calculate_failed";
    setStatus("Не удалось рассчитать результат");
    showToast('Не удалось рассчитать результат (<b>' + calcReason + '</b>). Проверьте backend API.', "warn", 6200);
    return;
  }

  finalResults = {
    riasec: calculated.result.riasec || {},
    klimov: calculated.result.klimov || {},
    study: calculated.result.study || {},
    ranked: Array.isArray(calculated.result.ranked) ? calculated.result.ranked : []
  };
  var riasec = finalResults.riasec;
  var klimov = finalResults.klimov;
  var study = finalResults.study;
  var ranked = finalResults.ranked;

  await botSay(buildResultsHTML(riasec, klimov, study, ranked), 700, 'top');
  launchConfetti();
  await wait(250);

  if (emailDispatchState !== "sending") {
    emailDispatchState = "sending";
    setStatus("Отправляю результат на email...");
    var emailResult = await sendResultsToEmail();
    emailDispatchState = emailResult.ok && emailResult.sent ? "sent" : "failed";

    if (emailResult.ok && emailResult.sent) {
      showToast('Результат отправлен на <b>' + escapeHtml(userProfile.email) + '</b>.', "success", 4600);
      setStatus("Результат отправлен на email");
    } else if (emailResult.ok) {
      var mode = emailResult && emailResult.mode ? escapeHtml(emailResult.mode) : "unknown";
      showToast('Письмо не отправлено (<b>' + mode + '</b>). Вы можете скачать PDF-отчёт ниже.', "warn", 6200);
      setStatus("Письмо не отправлено");
    } else {
      var reason = emailResult && emailResult.error ? escapeHtml(emailResult.error) : "unknown";
      showToast('Не удалось отправить письмо (<b>' + reason + '</b>). Вы можете скачать PDF-отчёт ниже.', "warn", 6200);
      setStatus("Не удалось отправить письмо");
    }
  }

  await botSay(buildFeedbackHTML(), 350, 'none');
}

// ================================================================
//  SVG-гексагон
// ================================================================
function buildHex(riasec, RL) {
  var keys = ["R", "I", "A", "S", "E", "C"];
  var cx = 155, cy = 155, R = 110;
  var ang = function(i) { return Math.PI / 180 * (i * 60 - 90); };
  var pt = function(r, a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };

  var grid = "";
  [0.25, 0.5, 0.75, 1].forEach(function(p) {
    var pts = keys.map(function(_, i) { return pt(R * p, ang(i)).join(","); }).join(" ");
    grid += '<polygon points="' + pts + '" fill="none" stroke="#2e3248" stroke-width="1"/>';
  });

  var spokes = keys.map(function(_, i) {
    var p = pt(R, ang(i));
    return '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="#2e3248" stroke-width="1"/>';
  }).join("");

  var dpts = keys.map(function(k, i) {
    var v = (riasec[k] || 0) / 100;
    return pt(R * v, ang(i));
  });
  var poly = dpts.map(function(p) { return p.join(","); }).join(" ");

  var lbls = keys.map(function(k, i) {
    var lp = pt(R + 24, ang(i));
    return '<text x="' + lp[0] + '" y="' + lp[1] + '" text-anchor="middle" dominant-baseline="middle" font-size="13" font-weight="700" fill="#7b82a0" font-family="Segoe UI,sans-serif">' + k + '</text>'
         + '<text x="' + lp[0] + '" y="' + (lp[1] + 15) + '" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#4a5070" font-family="Segoe UI,sans-serif">' + (riasec[k] || 0).toFixed(0) + '%</text>';
  }).join("");

  return '<svg width="310" height="310" viewBox="0 0 310 310" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;">'
       + grid + spokes
       + '<polygon points="' + poly + '" fill="rgba(79,142,247,0.18)" stroke="#4f8ef7" stroke-width="2" stroke-linejoin="round"/>'
       + dpts.map(function(p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#4f8ef7"/>'; }).join("")
       + lbls + '</svg>';
}

// ================================================================
//  RESTART
// ================================================================
function restartTest() {
  answers = {};
  allQuestions = [];
  qIdx = 0;
  activeQNum = null;
  finalResults = null;
  started = false;
  autoMode = false;
  emailDispatchState = "idle";

  document.getElementById('chat-inner').innerHTML = '';
  hideConfirmBtn();
  setStatus('Нажмите «Начать тест»');
  updateHdrQ();
  clearConfetti();

  var autoBtn = document.getElementById('auto-btn');
  if (autoBtn) autoBtn.style.display = 'none';

  initStart();
}

// ================================================================
//  INIT
// ================================================================
function initStart() {
  var inner = document.getElementById('chat-inner');
  var d = document.createElement('div');
  d.className = 'msg bot';
  d.innerHTML = '<div class="msg-avatar">AI</div>'
              + '<div class="msg-bubble wide-bubble">'
              + '<div class="welcome-card">'
              + '<div class="welcome-badge">Профориентационный помощник</div>'
              + '<div class="welcome-title">Готовы определить подходящее направление обучения?</div>'
              + '<div class="welcome-text">Тест анализирует ваши интересы, склонности и учебные предпочтения, после чего формирует персональные рекомендации.</div>'
              + '<div class="welcome-chip-row">'
              + '<span class="info-chip">76 вопросов</span>'
              + '<span class="info-chip">3 диагностических блока</span>'
              + '<span class="info-chip">Результат за 5-7 минут</span>'
              + '</div>'
              + '<div class="welcome-list">'
              + '<div class="welcome-list-item">• получите топ-3 рекомендованных направления</div>'
              + '<div class="welcome-list-item">• сможете скачать красивый PDF-отчёт</div>'
              + '</div>'
              + '<div class="welcome-note">Важно: перед стартом оставьте имя и email, чтобы автоматически получить результат на почту.</div>'
              + '<div class="lead-form">'
              + '<label class="lead-label" for="lead-name">Имя</label>'
              + '<input class="lead-input" id="lead-name" type="text" autocomplete="name" placeholder="Введите имя" value="' + escapeHtml(userProfile.name) + '">'
              + '<label class="lead-label" for="lead-email">Email</label>'
              + '<input class="lead-input" id="lead-email" type="email" autocomplete="email" placeholder="name@domain.ru" value="' + escapeHtml(userProfile.email) + '">'
              + '<label class="lead-check">'
              + '<input id="lead-consent" type="checkbox" ' + (userProfile.consent ? 'checked' : '') + '>'
              + '<span>Согласен(а) на обработку персональных данных для отправки результата теста.</span>'
              + '</label>'
              + '</div>'
              + '<div class="action-btns" style="margin-top:12px;">'
              + '<button class="pdf-btn" onclick="handleStartClick()">Начать тест</button>'
              + '</div>'
              + '</div>'
              + '</div>';
  inner.appendChild(d);
}

document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  updateHdrQ();
  initStart();
});
