const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

module.exports = {
  port: Number(process.env.PORT || 8787),
  nodeEnv: process.env.NODE_ENV || "development",
  allowedOrigins: parseCsv(process.env.ALLOWED_ORIGINS),
  apiKeys: parseCsv(process.env.API_KEYS),
  smtpDnsServers: parseCsv(process.env.SMTP_DNS_SERVERS),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Dubna Test <no-reply@example.com>",
    debugRecipient: process.env.DEBUG_EMAIL_RECIPIENT || ""
  }
};
