const nodemailer = require("nodemailer");
const config = require("../config");

function hasSmtpConfig() {
  return Boolean(config.smtp.host && config.smtp.user && config.smtp.pass);
}

function createTransport() {
  if (!hasSmtpConfig()) return null;

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    dnsTimeout: 7000,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });
}

async function sendEmail({ to, subject, html, text, attachments }) {
  const transport = createTransport();

  if (!transport) {
    return {
      delivered: false,
      mode: "dry-run",
      to,
      subject
    };
  }

  const info = await transport.sendMail({
    from: config.smtp.from,
    to: config.smtp.debugRecipient || to,
    subject,
    html,
    text,
    attachments: Array.isArray(attachments) ? attachments : undefined
  });

  return {
    delivered: true,
    mode: config.smtp.debugRecipient ? "debug-recipient" : "smtp",
    messageId: info.messageId,
    accepted: info.accepted || []
  };
}

module.exports = { sendEmail, hasSmtpConfig };
