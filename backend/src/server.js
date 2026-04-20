const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const dns = require("node:dns");

const config = require("./config");
const { requireApiKey } = require("./middleware/auth");
const { notFound, errorHandler } = require("./middleware/error-handler");
const { scoreByAnswers } = require("./services/scoring-service");
const { getAllQuestionIds } = require("./services/data-service");
const { buildResultEmail } = require("./services/template-service");
const { buildPdfHtml } = require("./services/report-template-service");
const { sendEmail, hasSmtpConfig } = require("./services/email-service");
const { renderPdfFromHtml } = require("./services/html-pdf-service");
const { appendStatRecord, getStatsSummary, getStatsEvents } = require("./services/stats-service");

const QUESTION_IDS = getAllQuestionIds();
const QUESTION_ID_SET = new Set(QUESTION_IDS);

if (config.smtpDnsServers.length) {
  dns.setServers(config.smtpDnsServers);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function validateUser(user) {
  if (!user || typeof user !== "object") return "missing_user";
  const name = String(user.name || "").trim();
  const email = String(user.email || "").trim();
  if (name.length < 2) return "invalid_name";
  if (!validateEmail(email)) return "invalid_email";
  if (!user.consent) return "consent_required";
  return null;
}

function normalizeAnswers(answers) {
  if (!answers || typeof answers !== "object" || !Object.keys(answers).length) {
    return { error: "answers_required" };
  }

  const normalized = {};

  for (const [rawKey, rawValue] of Object.entries(answers)) {
    const questionId = Number(rawKey);
    const value = Number(rawValue);

    if (!Number.isInteger(questionId) || !QUESTION_ID_SET.has(questionId)) {
      return { error: "unknown_question" };
    }

    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return { error: "invalid_answer_value" };
    }

    normalized[questionId] = value;
  }

  if (Object.keys(normalized).length !== QUESTION_IDS.length) {
    return { error: "answers_incomplete" };
  }

  return { answers: normalized };
}

function mapMailError(err) {
  const code = String(err && err.code ? err.code : "").toUpperCase();
  if (code === "EAUTH") return "smtp_auth_failed";
  if (code === "ETIMEDOUT" || code === "ESOCKET") return "smtp_timeout";
  if (code === "ECONNECTION" || code === "ECONNREFUSED") return "smtp_connection_failed";
  return "smtp_send_failed";
}

async function buildPdfAttachment(user, scored) {
  const pdfHtml = buildPdfHtml({ user, scored });
  const pdfBuffer = await renderPdfFromHtml(pdfHtml);

  return {
    filename: "career-test-report.pdf",
    content: pdfBuffer,
    contentType: "application/pdf"
  };
}

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (!config.allowedOrigins.length || config.allowedOrigins.includes(origin)) {
          return cb(null, true);
        }
        return cb(new Error("Not allowed by CORS"));
      }
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("dev"));

  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.get("/api/health", (req, res) => {
    res.json({
      ok: true,
      service: "dubna-test-backend",
      smtpConfigured: hasSmtpConfig(),
      now: new Date().toISOString()
    });
  });

  app.post("/api/v1/test/calculate", requireApiKey, (req, res) => {
    const validated = normalizeAnswers(req.body && req.body.answers);
    if (validated.error) {
      return res.status(400).json({ ok: false, error: validated.error });
    }

    const scored = scoreByAnswers(validated.answers);
    return res.json({
      ok: true,
      result: {
        riasec: scored.riasec,
        klimov: scored.klimov,
        study: scored.study,
        ranked: scored.ranked,
        top3: scored.top3
      }
    });
  });

  app.get("/api/v1/stats/summary", requireApiKey, async (req, res, next) => {
    try {
      const summary = await getStatsSummary({
        days: req.query && req.query.days,
        from: req.query && req.query.from,
        to: req.query && req.query.to
      });
      return res.json({ ok: true, summary });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/api/v1/stats/events", requireApiKey, async (req, res, next) => {
    try {
      const events = await getStatsEvents({
        days: req.query && req.query.days,
        from: req.query && req.query.from,
        to: req.query && req.query.to,
        limit: req.query && req.query.limit
      });
      return res.json({ ok: true, events });
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/v1/results/pdf", async (req, res, next) => {
    try {
      const userError = validateUser(req.body && req.body.user);
      if (userError) {
        return res.status(400).json({ ok: false, error: userError });
      }

      const validated = normalizeAnswers(req.body && req.body.answers);
      if (validated.error) {
        return res.status(400).json({ ok: false, error: validated.error });
      }

      const scored = scoreByAnswers(validated.answers);
      const attachment = await buildPdfAttachment(req.body.user, scored);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="career-test-report.pdf"');
      return res.send(attachment.content);
    } catch (err) {
      return next(err);
    }
  });

  app.post("/api/v1/results/email", async (req, res, next) => {
    try {
      const userError = validateUser(req.body && req.body.user);
      if (userError) {
        return res.status(400).json({ ok: false, error: userError });
      }

      const validated = normalizeAnswers(req.body && req.body.answers);
      if (validated.error) {
        return res.status(400).json({ ok: false, error: validated.error });
      }

      const scored = scoreByAnswers(validated.answers);
      const letter = buildResultEmail({
        user: req.body.user,
        scored,
        detailsByName: scored.detailsByName || {}
      });

      let attachments = [];
      try {
        attachments = [await buildPdfAttachment(req.body.user, scored)];
      } catch (pdfError) {
        console.error("PDF generation error:", pdfError && pdfError.message ? pdfError.message : pdfError);
      }

      let mail = null;
      try {
        mail = await sendEmail({
          to: req.body.user.email,
          subject: letter.subject,
          html: letter.html,
          text: letter.text,
          attachments
        });
      } catch (mailError) {
        const code = mapMailError(mailError);
        console.error("SMTP error:", code, mailError && mailError.message ? mailError.message : mailError);

        try {
          await appendStatRecord({
            user: req.body.user,
            scored,
            emailMode: "smtp-error",
            emailDelivered: false
          });
        } catch (_) {}

        return res.status(502).json({
          ok: false,
          error: code,
          message: "Не удалось отправить письмо через SMTP"
        });
      }

      try {
        await appendStatRecord({
          user: req.body.user,
          scored,
          emailMode: mail.mode,
          emailDelivered: mail.delivered
        });
      } catch (statsError) {
        console.error("Failed to write stats:", statsError);
      }

      return res.json({
        ok: true,
        sent: mail.delivered,
        mode: mail.mode,
        top3: scored.top3
      });
    } catch (err) {
      return next(err);
    }
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

function startServer() {
  const app = createApp();
  return app.listen(config.port, () => {
    console.log(`API started on http://localhost:${config.port}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  createApp,
  startServer,
  normalizeAnswers,
  validateUser
};
