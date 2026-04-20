function pickTop(items, size) {
  return (items || []).slice(0, size || 3);
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return String(Math.round(value * 10) / 10);
}

function buildResultEmail({ user, scored, detailsByName }) {
  const top = pickTop(scored.ranked, 3);
  const username = user.name || "Абитуриент";
  const createdAt = new Date().toLocaleString("ru-RU");

  const rows = top
    .map((item, index) => {
      const info = detailsByName[item.name] || {};
      const exams = info.exams ? `<div style="font-size:13px;color:#5f6f86;margin-top:6px;">ЕГЭ: ${info.exams}</div>` : "";
      const link = info.url
        ? `<a href="${info.url}" style="color:#2563eb;text-decoration:none;">Открыть страницу направления</a>`
        : "";

      return `
        <tr>
          <td style="padding:10px;border:1px solid #dbe3ef;">${index + 1}</td>
          <td style="padding:10px;border:1px solid #dbe3ef;">
            <b>${item.name}</b>
            <div style="font-size:13px;color:#5f6f86;margin-top:4px;">
              Код: ${info.code || "н/д"} | Совпадение: ${formatPercent(item.total)}%
            </div>
            ${exams}
            ${link ? `<div style="margin-top:6px;">${link}</div>` : ""}
          </td>
          <td style="padding:10px;border:1px solid #dbe3ef;">${info.score_budget || info.score_budget === 0 ? info.score_budget : "н/д"}</td>
          <td style="padding:10px;border:1px solid #dbe3ef;">${info.budget_places || info.budget_places === 0 ? info.budget_places : "н/д"}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.55;color:#172033;max-width:760px">
      <h2 style="margin-bottom:8px;">Результат профориентационного теста</h2>
      <p>Здравствуйте, <b>${username}</b>!</p>
      <p>Спасибо за прохождение теста. Подробный отчёт приложен в PDF.</p>
      <p><b>Дата формирования:</b> ${createdAt}</p>

      <h3 style="margin:16px 0 8px;">Ваши топ-3 направления</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="padding:10px;border:1px solid #dbe3ef;background:#f5f8ff;">#</th>
            <th style="padding:10px;border:1px solid #dbe3ef;background:#f5f8ff;">Направление</th>
            <th style="padding:10px;border:1px solid #dbe3ef;background:#f5f8ff;">Проходной балл</th>
            <th style="padding:10px;border:1px solid #dbe3ef;background:#f5f8ff;">Бюджетные места</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <h3 style="margin:16px 0 8px;">Что делать дальше</h3>
      <ol style="margin-top:0;">
        <li>Сравните направления по предметам ЕГЭ и проходным баллам.</li>
        <li>Изучите программу каждого направления на сайте университета.</li>
        <li>Сохраните PDF и обсудите его с родителями или наставником.</li>
      </ol>

      <p style="font-size:13px;color:#5f6f86;">
        Результат носит рекомендательный характер и помогает сузить выбор образовательной траектории.
      </p>
    </div>
  `;

  const text = [
    "Результат профориентационного теста",
    `Пользователь: ${username}`,
    `Дата: ${createdAt}`,
    "",
    "Топ-3 направления:",
    ...top.map((item, index) => {
      const details = detailsByName[item.name] || {};
      return `${index + 1}. ${item.name} — ${formatPercent(item.total)}% (код: ${details.code || "н/д"})`;
    }),
    "",
    "Подробный PDF-отчёт приложен к письму."
  ].join("\n");

  return {
    subject: "Результаты профориентационного теста",
    html,
    text
  };
}

module.exports = { buildResultEmail, pickTop, formatPercent };
