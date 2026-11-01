const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(
  path.join(__dirname, "..", "js", "localization.js"),
  "utf8"
);

function createHarness(language) {
  let observerCallback;
  let injectedStyle = "";
  const scheduled = [];
  const nativeFetchCalls = [];

  const optionsVm = {
    commentList: [],
    fetchLead() {},
    totalComments: 113,
    foundComments: 104,
    fetchV1CommentReplies() {},
    async fetchInstagramV1() {
      return {
        data: {
          child_comments: [{ pk: "reply-1", text: "Ответ", user: { username: "user" } }],
          has_more_head_child_comments: false,
        },
      };
    },
    formatV1CommentNode(comment, meta) {
      return {
        commentId: String(comment.pk),
        text: comment.text,
        commentType: meta.commentType,
        parentCommentId: meta.parentCommentId,
      };
    },
    async markFetchFinished() {
      this.originalFinishCalled = true;
    },
    $children: [],
    showAccountDialog: true,
    showPricingDialog: true,
    $forceUpdate() {
      this.forceUpdated = true;
    },
  };
  const appRoot = { __vue__: optionsVm };

  const documentElement = {
    nodeType: 1,
    lang: "",
    childNodes: [],
    hasAttribute() { return false; },
  };
  const document = {
    title: "Options",
    documentElement,
    head: {
      appendChild(node) {
        injectedStyle += node.textContent || "";
      },
    },
    createElement() {
      return { textContent: "" };
    },
    createTreeWalker() {
      return { nextNode() { return null; } };
    },
    querySelector(selector) {
      return selector === "#app" ? appRoot : null;
    },
  };

  class TestMutationObserver {
    constructor(callback) {
      observerCallback = callback;
    }
    observe() {}
  }

  const context = {
    chrome: { i18n: { getUILanguage: () => language } },
    navigator: { language },
    document,
    Node: { ELEMENT_NODE: 1, TEXT_NODE: 3 },
    NodeFilter: { SHOW_TEXT: 4, SHOW_ELEMENT: 1 },
    MutationObserver: TestMutationObserver,
    Set,
    URLSearchParams,
    Promise,
    Error,
    console,
    window: {
      fetch(resource, options) {
        nativeFetchCalls.push([resource, options]);
        return Promise.resolve({ ok: true });
      },
      setTimeout(callback) {
        scheduled.push(callback);
      },
    },
  };

  vm.runInNewContext(script, context, { filename: "localization.js" });
  scheduled.forEach((callback) => callback());

  return {
    context,
    document,
    optionsVm,
    observerCallback,
    injectedStyle,
    nativeFetchCalls,
  };
}

async function run() {
  const ru = createHarness("ru-RU");
  assert.equal(ru.document.documentElement.lang, "ru");
  assert.equal(ru.document.title, "Экспорт комментариев Instagram");
  assert.equal(ru.optionsVm.isLoggedIn, true);
  assert.equal(ru.optionsVm.isProUser, true);
  assert.equal(ru.optionsVm.showAccountDialog, false);
  assert.equal(ru.optionsVm.showPricingDialog, false);
  assert.equal(ru.optionsVm.forceUpdated, true);
  assert.match(ru.injectedStyle, /\.limit-banner/);
  assert.match(ru.injectedStyle, /\.modal-overlay/);
  assert.match(ru.injectedStyle, /\.app-footer/);
  assert.match(ru.injectedStyle, /\.contact-info/);

  const textNode = { nodeType: 3, nodeValue: " Start parsing " };
  ru.observerCallback([{ type: "childList", addedNodes: [textNode] }]);
  assert.equal(textNode.nodeValue, " Начать сбор ");

  const rerenderedText = { nodeType: 3, nodeValue: "104 comments ready" };
  ru.observerCallback([{ type: "characterData", target: rerenderedText }]);
  assert.equal(rerenderedText.nodeValue, "Готово комментариев: 104");

  const safeDelayText = { nodeType: 3, nodeValue: "5s · Safe" };
  ru.observerCallback([{ type: "characterData", target: safeDelayText }]);
  assert.equal(safeDelayText.nodeValue, "5 с · Безопасно");

  const riskText = { nodeType: 3, nodeValue: "⚠ High Risk For Your Account" };
  ru.observerCallback([{ type: "characterData", target: riskText }]);
  assert.equal(riskText.nodeValue, "⚠ Высокий риск для аккаунта");

  const screenshotPhrases = [
    ["Exporting 90 / 113 comments, please wait a moment...", "Собрано 90 из 113 комментариев, подождите..."],
    ["Exporting", "Сбор:"],
    ["comments, please wait a moment...", "комментариев, подождите..."],
    ["Download 90 comments", "Скачать 90 комментариев"],
    ["104 comments ready", "Готово комментариев: 104"],
  ];
  for (const [english, russian] of screenshotPhrases) {
    const phraseNode = { nodeType: 3, nodeValue: english };
    ru.observerCallback([{ type: "characterData", target: phraseNode }]);
    assert.equal(phraseNode.nodeValue, russian);
  }

  const titleElement = {
    nodeType: 1,
    attributes: { title: "Open this comment on Instagram" },
    hasAttribute(name) { return Object.hasOwn(this.attributes, name); },
    getAttribute(name) { return this.attributes[name]; },
    setAttribute(name, value) { this.attributes[name] = value; },
  };
  ru.observerCallback([{ type: "attributes", target: titleElement, addedNodes: [] }]);
  assert.equal(titleElement.attributes.title, "Открыть комментарий в Instagram");

  await assert.rejects(
    ru.context.window.fetch("https://igcomment.igscraper.io/extension/user/info"),
    /Subscription services are disabled/
  );
  await ru.context.window.fetch("https://www.instagram.com/");
  assert.equal(ru.nativeFetchCalls.length, 1);

  const replies = await ru.optionsVm.fetchV1CommentReplies("media-1", {
    pk: "parent-1",
    user: { username: "parent" },
  });
  assert.equal(replies.length, 1);
  assert.equal(replies[0].commentId, "reply-1");
  assert.equal(replies[0].parentCommentId, "parent-1");

  await ru.optionsVm.markFetchFinished();
  assert.equal(ru.optionsVm.originalFinishCalled, true);
  assert.equal(ru.optionsVm.reportedTotalComments, 113);
  assert.equal(ru.optionsVm.totalComments, 104);
  assert.match(ru.optionsVm.availabilityNotice, /Instagram reports 113 comments/);

  const en = createHarness("en-US");
  assert.equal(en.document.documentElement.lang, "en");
  assert.equal(en.document.title, "Options");
  const englishText = { nodeType: 3, nodeValue: "Start parsing" };
  en.observerCallback([{ type: "childList", addedNodes: [englishText] }]);
  assert.equal(englishText.nodeValue, "Start parsing");

  console.log("Localization and local Pro mode checks passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
