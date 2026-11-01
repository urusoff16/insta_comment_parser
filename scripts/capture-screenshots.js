"use strict";

// Optional documentation tool: requires Playwright and its Chromium browser.
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "docs", "screenshots");
const origin = "https://extension-preview.test";

async function capture(browser, language) {
  const context = await browser.newContext({
    locale: language === "ru" ? "ru-RU" : "en-US",
    viewport: { width: 1280, height: 960 },
    deviceScaleFactor: 1,
  });
  try {
    await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      const filename = path.resolve(root, "." + decodeURIComponent(url.pathname));
      if (!filename.startsWith(root + path.sep)) return route.abort();
      try {
        const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".ico": "image/x-icon", ".woff": "font/woff", ".ttf": "font/ttf" };
        await route.fulfill({ body: await fs.readFile(filename), contentType: types[path.extname(filename)] || "application/octet-stream" });
      } catch {
        await route.fulfill({ status: 404, body: "Not found" });
      }
    });
    await context.addInitScript(({ language, origin }) => {
      const ru = language === "ru";
      const comments = [
        { id: "demo-user-1", commentId: "demo-comment-1", userName: "demo_alex", text: ru ? "Отличный пример! Спасибо за полезную публикацию." : "Great example! Thanks for the helpful post.", date: "2026/11/01 10:15:00", commentType: "comment" },
        { id: "demo-user-2", commentId: "demo-comment-2", userName: "demo_lina", text: ru ? "Сохранила, чтобы вернуться к этому позже." : "Saved this to come back to it later.", date: "2026/11/01 10:20:00", commentType: "comment" },
        { id: "demo-user-3", commentId: "demo-comment-3", userName: "demo_sam", text: ru ? "Согласен, очень удобно!" : "Agreed, very convenient!", date: "2026/11/01 10:22:00", commentType: "reply", parentCommentId: "demo-comment-1", parentUserName: "demo_alex" },
      ].map((row) => ({ ...row, profileUrl: "#", avatarUrl: "" }));
      const storage = {
        lead_list: comments,
        fetch_progress: { postUrl: "https://www.instagram.com/p/DEMO/", postCode: "DEMO", foundComments: 3, totalComments: 3, hasNextPage: false, fetchPageNum: 1, intervalSec: 5 },
      };
      function complete(value, callback) {
        if (callback) callback(value);
        return Promise.resolve(value);
      }
      Object.defineProperty(window, "chrome", { configurable: true, value: {
        i18n: { getUILanguage: () => ru ? "ru-RU" : "en-US" },
        runtime: {
          id: "documentation-preview",
          getURL: (asset) => origin + "/" + asset,
          getManifest: () => ({ version: "1.3.13" }),
          sendMessage: (message, callback) => complete({}, callback),
          openOptionsPage: () => Promise.resolve(),
          onMessage: { addListener() {}, removeListener() {} },
        },
        storage: { local: {
          get(keys, callback) {
            const result = {};
            for (const key of (typeof keys === "string" ? [keys] : keys || Object.keys(storage))) {
              if (Object.hasOwn(storage, key)) result[key] = storage[key];
            }
            return complete(result, callback);
          },
          set(values, callback) { Object.assign(storage, values); return complete(undefined, callback); },
          remove(keys, callback) { for (const key of [].concat(keys)) delete storage[key]; return complete(undefined, callback); },
        } },
      } });
    }, { language, origin });

    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(origin + "/options.html");
    await page.locator(".comment-table tbody tr").nth(2).waitFor();
    await page.evaluate(() => {
      const vm = document.querySelector("#option-root").__vue__;
      vm.runningStat = vm.RUN_STAT_FINISHED;
      vm.hasSavedProgress = false;
    });
    await page.locator(".el-message").waitFor({ state: "hidden", timeout: 10000 });
    await page.getByRole("button", { name: language === "ru" ? "Начать сбор" : "Start parsing", exact: true }).waitFor();
    assert.equal(await page.locator("html").getAttribute("lang"), language);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(output, "options-" + language + ".png"), fullPage: true });

    await page.goto(origin + "/popup.html");
    await page.getByRole("button", { name: language === "ru" ? "Экспортировать данные Instagram" : "Export Instagram Data", exact: true }).waitFor();
    await page.locator("#popup-root").screenshot({ path: path.join(output, "popup-" + language + ".png") });
    assert.deepEqual(errors, []);
    console.log("Captured options and popup in " + language);
  } finally {
    await context.close();
  }
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const language of ["en", "ru"]) await capture(browser, language);
  } finally {
    await browser.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
