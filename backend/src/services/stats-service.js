const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.resolve(__dirname, "../../data");
const STATS_FILE = path.resolve(DATA_DIR, "stats.ndjson");

function getTopKey(obj) {
  const pairs = Object.keys(obj || {}).map((key) => ({ key, value: Number(obj[key] || 0) }));
  pairs.sort((a, b) => b.value - a.value);
  return pairs[0] || { key: null, value: 0 };
}

function compactTop(scored) {
  return (scored.top3 || []).map((x) => ({ name: x.name, total: x.total }));
}

async function appendStatRecord({ user, scored, emailMode, emailDelivered }) {
  const topRiasec = getTopKey(scored.riasec);
  const topKlimov = getTopKey(scored.klimov);
  const topStudy = getTopKey(scored.study);
  const normalizedUser = {
    name: String(user && user.name ? user.name : "").trim(),
    email: String(user && user.email ? user.email : "").trim().toLowerCase()
  };

  const row = {
    at: new Date().toISOString(),
    user: normalizedUser,
    topDirection: scored.top3[0] ? scored.top3[0].name : null,
    top3: compactTop(scored),
    profileTop: {
      riasec: topRiasec,
      klimov: topKlimov,
      study: topStudy
    },
    email: {
      delivered: Boolean(emailDelivered),
      mode: emailMode || "unknown"
    }
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.appendFile(STATS_FILE, `${JSON.stringify(row)}\n`, "utf8");
}

async function readAllRows() {
  try {
    const text = await fs.readFile(STATS_FILE, "utf8");
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (_) {
          return null;
        }
      })
      .filter(Boolean);
  } catch (error) {
    if (error && error.code === "ENOENT") return [];
    throw error;
  }
}

function parseDateSafe(value) {
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function filterByRange(rows, options) {
  const opts = options || {};
  let from = null;
  let to = null;

  if (opts.days && Number(opts.days) > 0) {
    to = new Date();
    from = new Date(to.getTime() - Number(opts.days) * 24 * 60 * 60 * 1000);
  }

  if (opts.from) {
    const parsedFrom = parseDateSafe(opts.from);
    if (parsedFrom) from = parsedFrom;
  }

  if (opts.to) {
    const parsedTo = parseDateSafe(opts.to);
    if (parsedTo) to = parsedTo;
  }

  if (!from && !to) {
    return {
      rows,
      range: { from: null, to: null, days: null }
    };
  }

  const filtered = rows.filter((row) => {
    const at = parseDateSafe(row.at);
    if (!at) return false;
    if (from && at < from) return false;
    if (to && at > to) return false;
    return true;
  });

  return {
    rows: filtered,
    range: {
      from: from ? from.toISOString() : null,
      to: to ? to.toISOString() : null,
      days: opts.days ? Number(opts.days) : null
    }
  };
}

async function getStatsSummary(options) {
  const allRows = await readAllRows();
  const { rows, range } = filterByRange(allRows, options);
  const uniqueUsers = new Set();
  const directionCounts = {};
  const riasecCounts = {};
  const delivery = { delivered: 0, failed: 0 };

  let lastSubmissionAt = null;

  rows.forEach((row) => {
    const userEmail = row.user && row.user.email ? String(row.user.email).trim().toLowerCase() : "";
    if (userEmail) uniqueUsers.add(userEmail);
    else if (row.emailHash) uniqueUsers.add(row.emailHash);

    if (row.topDirection) {
      directionCounts[row.topDirection] = (directionCounts[row.topDirection] || 0) + 1;
    }
    if (row.profileTop && row.profileTop.riasec && row.profileTop.riasec.key) {
      const key = row.profileTop.riasec.key;
      riasecCounts[key] = (riasecCounts[key] || 0) + 1;
    }
    if (row.email && row.email.delivered) delivery.delivered += 1;
    else delivery.failed += 1;

    if (!lastSubmissionAt || (row.at && row.at > lastSubmissionAt)) {
      lastSubmissionAt = row.at;
    }
  });

  const topDirections = Object.keys(directionCounts)
    .map((name) => ({ name, count: directionCounts[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topRiasec = Object.keys(riasecCounts)
    .map((key) => ({ key, count: riasecCounts[key] }))
    .sort((a, b) => b.count - a.count);

  return {
    range,
    totalSubmissions: rows.length,
    uniqueUsers: uniqueUsers.size,
    emailDelivery: delivery,
    topDirections,
    topRiasec,
    lastSubmissionAt
  };
}

async function getStatsEvents(options) {
  const allRows = await readAllRows();
  const opts = options || {};
  const limit = Math.max(1, Math.min(500, Number(opts.limit || 100)));
  const { rows, range } = filterByRange(allRows, opts);

  const normalized = rows
    .slice()
    .sort((a, b) => String(b.at || "").localeCompare(String(a.at || "")))
    .slice(0, limit)
    .map((row, index) => ({
      id: index + 1,
      at: row.at || null,
      user: row.user || { name: "", email: "" },
      topDirection: row.topDirection || null,
      top3: Array.isArray(row.top3) ? row.top3 : [],
      riasecTop: row.profileTop && row.profileTop.riasec ? row.profileTop.riasec : { key: null, value: 0 },
      email: row.email || { delivered: false, mode: "unknown" }
    }));

  return {
    range,
    total: rows.length,
    returned: normalized.length,
    items: normalized
  };
}

module.exports = {
  appendStatRecord,
  getStatsSummary,
  getStatsEvents
};
