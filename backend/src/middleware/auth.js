const config = require("../config");

function requireApiKey(req, res, next) {
  if (!config.apiKeys.length) {
    return next();
  }

  const incoming = req.get("x-api-key");
  if (!incoming || !config.apiKeys.includes(incoming)) {
    return res.status(401).json({ ok: false, error: "invalid_api_key" });
  }

  return next();
}

module.exports = { requireApiKey };
