const { getTestData, getStudyLabels } = require("./data-service");

const RIASEC_LABELS = {
  R: "Реалистичный",
  I: "Исследовательский",
  A: "Артистический",
  S: "Социальный",
  E: "Предпринимательский",
  C: "Конвенциональный"
};

const KLIMOV_LABELS = {
  "ЧЧ": "Человек — Человек",
  "ЧП": "Человек — Природа",
  "ЧЗ": "Человек — Знаковые системы",
  "ЧТ": "Человек — Техника",
  "ЧХ": "Человек — Художественный образ"
};

function getSortedPairs(obj) {
  return Object.keys(obj || {})
    .map((key) => ({ key, value: Number(obj[key] || 0) }))
    .sort((a, b) => b.value - a.value);
}

function joinHuman(items) {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} и ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} и ${items[items.length - 1]}`;
}

function buildDirectionPracticalSummary(details) {
  const parts = [];

  if (details.exams) parts.push(`ЕГЭ: ${details.exams}.`);
  if (details.score_budget || details.score_budget === 0) parts.push(`Проходной балл: ${details.score_budget}.`);
  if (details.budget_places || details.budget_places === 0) {
    parts.push(details.budget_places > 0 ? `Бюджетных мест: ${details.budget_places}.` : "Бюджетных мест сейчас нет.");
  }

  return parts.join(" ");
}

function buildInsightCards(scored) {
  const studyLabels = getStudyLabels();
  const topRiasec = getSortedPairs(scored.riasec)
    .slice(0, 2)
    .map((item) => `${RIASEC_LABELS[item.key]} — ${item.value}%`);
  const topKlimov = getSortedPairs(scored.klimov)[0];
  const topStudy = getSortedPairs(scored.study)
    .slice(0, 2)
    .map((item) => `${studyLabels[item.key] || item.key} — ${item.value}%`);

  return [
    {
      title: "Ведущие личностные типы",
      text: joinHuman(topRiasec)
    },
    {
      title: "Предпочтительный предмет труда",
      text: topKlimov ? `${KLIMOV_LABELS[topKlimov.key]} — ${topKlimov.value}%` : "н/д"
    },
    {
      title: "Наиболее выраженные учебные интересы",
      text: joinHuman(topStudy)
    }
  ];
}

function buildProfileRows(data, labels, accentClass) {
  return Object.keys(data || {})
    .map((key) => {
      const label = labels[key] || key;
      const value = Number(data[key] || 0);

      return `
        <div class="bar-row">
          <span class="bar-label">${label}${RIASEC_LABELS[key] ? ` (${key})` : ""}</span>
          <div class="bar-track"><div class="bar-fill ${accentClass || ""}" style="width:${value}%"></div></div>
          <span class="bar-val">${value}%</span>
        </div>
      `;
    })
    .join("");
}

function buildPdfHtml({ user, scored }) {
  const { PROGRAM_DETAILS } = getTestData();
  const generatedAt = new Date().toLocaleDateString("ru-RU");
  const username = user && user.name ? user.name : "Абитуриент";
  const leader = scored.ranked[0];
  const leaderDetails = leader ? PROGRAM_DETAILS[leader.name] || {} : {};
  const topRows = (scored.top3 || [])
    .map((item, index) => {
      const details = PROGRAM_DETAILS[item.name] || {};
      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${item.name}</strong>
            <div class="muted">${details.code || "Код не указан"}</div>
          </td>
          <td><strong>${item.total}%</strong></td>
        </tr>
      `;
    })
    .join("");

  const fullRows = (scored.ranked || [])
    .map((item, index) => {
      const details = PROGRAM_DETAILS[item.name] || {};
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${details.code || "-"}</td>
          <td>${item.name}</td>
          <td>${details.exams || "-"}</td>
          <td>${details.score_budget || details.score_budget === 0 ? details.score_budget : "н/д"}</td>
          <td><strong>${item.total}%</strong></td>
        </tr>
      `;
    })
    .join("");

  const insightCards = buildInsightCards(scored)
    .map(
      (item) => `
        <div class="card">
          <div class="card-title">${item.title}</div>
          <div>${item.text}</div>
        </div>
      `
    )
    .join("");

  return `<!DOCTYPE html>
  <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Профориентационный отчёт</title>
      <style>
        @page { margin: 16mm; }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: "Segoe UI", Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #172033;
          background: #f3f7fd;
        }
        .page {
          background: linear-gradient(180deg, #f8fbff 0%, #ffffff 38%, #fbfcff 100%);
          border: 1px solid #d8e3f2;
          border-radius: 28px;
          padding: 26px 24px;
        }
        .eyebrow {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 999px;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 8.6pt;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .08em;
        }
        h1 { margin: 12px 0 6px; font-size: 24pt; line-height: 1.15; }
        h2 { margin: 0 0 12px; font-size: 13pt; }
        .meta { color: #64748b; margin-bottom: 18px; }
        .hero, .section {
          border: 1px solid #dbe3ef;
          border-radius: 22px;
          background: rgba(255,255,255,.94);
          padding: 18px;
          margin-top: 16px;
        }
        .hero {
          background: linear-gradient(135deg, #eff6ff 0%, #ffffff 60%, #f5f3ff 100%);
        }
        .hero-title {
          font-size: 18pt;
          font-weight: 800;
          margin: 8px 0;
        }
        .metric-row, .card-grid {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .metric, .card {
          flex: 1 1 180px;
          min-width: 180px;
          padding: 12px 14px;
          border-radius: 16px;
          border: 1px solid #dbe3ef;
          background: #ffffff;
        }
        .metric span, .card-title {
          display: block;
          color: #64748b;
          font-size: 8.5pt;
          text-transform: uppercase;
          letter-spacing: .06em;
          margin-bottom: 4px;
          font-weight: 800;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 9pt;
          background: #fff;
        }
        th, td {
          border: 1px solid #dbe3ef;
          padding: 8px 9px;
          vertical-align: top;
        }
        th {
          background: #eff6ff;
          text-align: left;
        }
        .muted { color: #64748b; font-size: 8.5pt; margin-top: 3px; }
        .bar-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        .bar-label {
          width: 220px;
          flex-shrink: 0;
          font-size: 9pt;
        }
        .bar-track {
          flex: 1;
          height: 10px;
          border-radius: 999px;
          background: #e5edf7;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #2563eb, #60a5fa);
          border-radius: 999px;
        }
        .bar-fill.secondary {
          background: linear-gradient(90deg, #7c3aed, #a78bfa);
        }
        .bar-val {
          width: 42px;
          text-align: right;
          font-weight: 700;
          color: #1d4ed8;
          font-size: 9pt;
        }
        .summary {
          color: #334155;
          margin-top: 8px;
        }
        .footer {
          margin-top: 18px;
          padding-top: 10px;
          border-top: 1px solid #dbe3ef;
          font-size: 8.5pt;
          color: #64748b;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="eyebrow">Итоговый аналитический отчёт</div>
        <h1>Профориентационный тест</h1>
        <div class="meta">Государственный университет «Дубна» | Дата формирования: ${generatedAt}</div>

        <div class="hero">
          <div class="card-title">Персональная рекомендация</div>
          <div class="hero-title">${leader ? leader.name : "Рекомендация не сформирована"}</div>
          <div>Пользователь: <strong>${username}</strong></div>
          <div class="summary">${leader ? buildDirectionPracticalSummary(leaderDetails) : "Недостаточно данных для построения отчёта."}</div>
          ${
            leader
              ? `<div class="metric-row" style="margin-top:14px;">
                  <div class="metric"><span>Совпадение</span><strong>${leader.total}%</strong></div>
                  <div class="metric"><span>RIASEC</span><strong>${leader.mR}%</strong></div>
                  <div class="metric"><span>Климов</span><strong>${leader.mK}%</strong></div>
                  <div class="metric"><span>Учебные склонности</span><strong>${leader.mS}%</strong></div>
                </div>`
              : ""
          }
        </div>

        <div class="section">
          <h2>Ключевые выводы</h2>
          <div class="card-grid">${insightCards}</div>
        </div>

        <div class="section">
          <h2>Топ-3 рекомендованных направления</h2>
          <table>
            <thead>
              <tr><th>#</th><th>Направление</th><th>Итого</th></tr>
            </thead>
            <tbody>${topRows}</tbody>
          </table>
        </div>

        <div class="section">
          <h2>Профиль по методике RIASEC</h2>
          ${buildProfileRows(scored.riasec, RIASEC_LABELS)}
        </div>

        <div class="section">
          <h2>Профиль по методике Климова</h2>
          ${buildProfileRows(scored.klimov, KLIMOV_LABELS, "secondary")}
        </div>

        <div class="section">
          <h2>Полный рейтинг направлений</h2>
          <table>
            <thead>
              <tr><th>#</th><th>Код</th><th>Направление</th><th>ЕГЭ</th><th>Балл</th><th>Итого</th></tr>
            </thead>
            <tbody>${fullRows}</tbody>
          </table>
        </div>

        <div class="footer">
          Результаты имеют рекомендательный характер и используются как инструмент первичной профориентации.
        </div>
      </div>
    </body>
  </html>`;
}

module.exports = {
  buildPdfHtml,
  RIASEC_LABELS,
  KLIMOV_LABELS
};
