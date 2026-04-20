const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright-core");

function firstExisting(paths) {
  for (const p of paths) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
}

function resolveBrowserExecutable() {
  if (process.env.BROWSER_EXECUTABLE_PATH && fs.existsSync(process.env.BROWSER_EXECUTABLE_PATH)) {
    return process.env.BROWSER_EXECUTABLE_PATH;
  }

  const localAppData = process.env.LOCALAPPDATA || "";
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";

  return firstExisting([
    path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
    path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe")
  ]);
}

async function renderPdfFromHtml(html) {
  if (!html || typeof html !== "string") {
    throw new Error("pdf_html_missing");
  }

  const executablePath = resolveBrowserExecutable();
  if (!executablePath) {
    throw new Error("browser_not_found");
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-gpu"]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    return await page.pdf({
      printBackground: true,
      preferCSSPageSize: true
    });
  } finally {
    await browser.close();
  }
}

module.exports = { renderPdfFromHtml };
