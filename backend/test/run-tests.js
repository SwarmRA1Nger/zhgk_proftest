const assert = require("node:assert/strict");
const http = require("node:http");

const { scoreByAnswers } = require("../src/services/scoring-service");
const { sendEmail } = require("../src/services/email-service");
const { createApp } = require("../src/server");
const { getAllQuestionIds } = require("../src/services/data-service");

function buildAnswers(value) {
  return getAllQuestionIds().reduce((acc, questionId) => {
    acc[questionId] = value;
    return acc;
  }, {});
}

function makeRequest(server, path, payload) {
  const port = server.address().port;
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function run(name, fn) {
  try {
    await fn();
    console.log("PASS", name);
  } catch (error) {
    console.error("FAIL", name);
    console.error(error);
    process.exitCode = 1;
  }
}

async function main() {
  await run("scoreByAnswers returns ranked results for complete answers", () => {
    const scored = scoreByAnswers(buildAnswers(3));

    assert.equal(Object.keys(scored.riasec).length, 6);
    assert.equal(Object.keys(scored.klimov).length, 5);
    assert.ok(scored.ranked.length >= 3);
    assert.deepEqual(scored.top3, scored.ranked.slice(0, 3));
  });

  await run("scoreByAnswers normalizes minimum answers to zero", () => {
    const scored = scoreByAnswers(buildAnswers(1));
    const values = Object.values(scored.riasec)
      .concat(Object.values(scored.klimov))
      .concat(Object.values(scored.study));

    values.forEach((value) => {
      assert.equal(value, 0);
    });
  });

  await run("sendEmail falls back to dry-run mode without SMTP", async () => {
    const result = await sendEmail({
      to: "student@example.com",
      subject: "Test subject",
      html: "<p>Test</p>",
      text: "Test"
    });

    assert.equal(result.delivered, false);
    assert.equal(result.mode, "dry-run");
  });

  await run("calculate endpoint returns scored result for complete answers", async () => {
    const app = createApp();
    const server = app.listen(0);

    try {
      const response = await makeRequest(server, "/api/v1/test/calculate", {
        answers: buildAnswers(4)
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.ok, true);
      assert.ok(Array.isArray(response.body.result.ranked));
      assert.equal(response.body.result.top3.length, 3);
    } finally {
      server.close();
    }
  });

  await run("calculate endpoint rejects incomplete answers", async () => {
    const app = createApp();
    const server = app.listen(0);

    try {
      const response = await makeRequest(server, "/api/v1/test/calculate", {
        answers: { 1: 5 }
      });

      assert.equal(response.statusCode, 400);
      assert.equal(response.body.ok, false);
      assert.equal(response.body.error, "answers_incomplete");
    } finally {
      server.close();
    }
  });

  if (process.exitCode) {
    process.exit(process.exitCode);
  }
}

main().catch((error) => {
  console.error("FAIL", "test runner crashed");
  console.error(error);
  process.exit(1);
});
