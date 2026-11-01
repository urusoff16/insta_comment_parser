(function () {
  "use strict";

  var HASH_PREFIX = "#ig-comment-focus=";
  var STORAGE_KEY = "ig_comment_focus_target";
  var ATTEMPT_DELAY_MS = 750;
  var SEARCH_TIMEOUT_MS = 45000;
  var HIGHLIGHT_DURATION_MS = 8000;
  var clickedAt = new WeakMap();
  var attempts = 0;
  var searchDeadline = Date.now() + SEARCH_TIMEOUT_MS;
  var intervalId = null;
  var observer = null;

  function parseTarget() {
    var hash = window.location.hash || "";
    if (hash.indexOf(HASH_PREFIX) === 0) {
      var encodedTarget = hash.slice(HASH_PREFIX.length);
      var parts = encodedTarget.split(":").map(function (part) {
        try {
          return decodeURIComponent(part);
        } catch (error) {
          return part;
        }
      });

      if (parts[0]) {
        return {
          parentId: parts[0],
          targetId: parts[1] || parts[0],
          isReply: Boolean(parts[1]),
        };
      }
    }

    var replyMatch = window.location.pathname.match(/\/c\/([^/]+)\/r\/([^/]+)\/?/);
    if (replyMatch) {
      return {
        parentId: decodeURIComponent(replyMatch[1]),
        targetId: decodeURIComponent(replyMatch[2]),
        isReply: true,
      };
    }

    var commentMatch = window.location.pathname.match(/\/c\/([^/]+)\/?/);
    if (commentMatch) {
      var commentId = decodeURIComponent(commentMatch[1]);
      return { parentId: commentId, targetId: commentId, isReply: false };
    }

    return null;
  }

  var target = parseTarget();
  if (!target) return;

  function mergeStoredTarget(callback) {
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      if (callback) callback();
      return;
    }

    chrome.storage.local.get(STORAGE_KEY, function (result) {
      var stored = result && result[STORAGE_KEY];
      if (
        stored &&
        stored.targetId &&
        String(stored.targetId) === String(target.targetId) &&
        (!stored.expiresAt || stored.expiresAt > Date.now())
      ) {
        target.parentId = stored.parentId || target.parentId;
        target.isReply = Boolean(stored.isReply || target.isReply);
        target.userName = stored.userName || "";
        target.text = stored.text || "";
      }

      if (callback) callback();
    });
  }

  function getHref(anchor) {
    return (anchor && anchor.getAttribute("href")) || "";
  }

  function findAnchorBySegment(segment, id) {
    var expected = "/" + segment + "/" + encodeURIComponent(String(id)) + "/";
    var anchors = document.querySelectorAll('a[href*="/' + segment + '/"]');

    for (var i = 0; i < anchors.length; i++) {
      if (getHref(anchors[i]).indexOf(expected) !== -1) return anchors[i];
    }

    return null;
  }

  function findTargetAnchor() {
    if (target.isReply) {
      var replyAnchor = findAnchorBySegment("r", target.targetId);
      if (replyAnchor) return replyAnchor;
    }

    var commentAnchor = findAnchorBySegment("c", target.targetId);
    if (commentAnchor) return commentAnchor;

    var anchors = document.querySelectorAll("a[href]");
    var targetId = String(target.targetId);
    for (var i = 0; i < anchors.length; i++) {
      if (getHref(anchors[i]).indexOf(targetId) !== -1) return anchors[i];
    }

    return null;
  }

  function getControlText(control) {
    return (
      (control && control.getAttribute && control.getAttribute("aria-label")) ||
      (control && control.textContent) ||
      ""
    ).trim();
  }

  function isReplyExpansionControl(control) {
    var text = getControlText(control).toLowerCase();
    if (!text) return false;

    return (
      /(view|show|load).*(repl)/i.test(text) ||
      /(more).*(repl)/i.test(text) ||
      /(посмотреть|показать|раскрыть|загрузить|ещ[её]).*(ответ)/i.test(text) ||
      /(ver|mostrar|cargar).*(respuesta)/i.test(text) ||
      /(voir|afficher|charger).*(réponse|reponse)/i.test(text) ||
      /(anzeigen|mehr).*(antwort)/i.test(text) ||
      /(visualizar|mostrar|carregar).*(resposta)/i.test(text) ||
      /(visualizza|mostra|carica).*(rispost)/i.test(text) ||
      /(görüntüle|goster|yükle|daha).*(yanıt|yanit)/i.test(text)
    );
  }

  function clickReplyControl(parentAnchor) {
    var node = parentAnchor;
    var now = Date.now();

    for (var depth = 0; node && depth < 10; depth++, node = node.parentElement) {
      var controls = node.querySelectorAll
        ? node.querySelectorAll('button,[role="button"]')
        : [];
      for (var i = 0; i < controls.length; i++) {
        if (!isReplyExpansionControl(controls[i])) continue;

        var previousClick = clickedAt.get(controls[i]) || 0;
        if (now - previousClick < 1500) continue;

        clickedAt.set(controls[i], now);
        controls[i].click();
        return true;
      }
    }

    return false;
  }

  function clickVisibleReplyControls() {
    var candidates = document.querySelectorAll('button,[role="button"],span');
    var now = Date.now();
    var clickCount = 0;

    for (var i = 0; i < candidates.length && clickCount < 4; i++) {
      if (!isReplyExpansionControl(candidates[i])) continue;

      var control =
        (candidates[i].closest && candidates[i].closest('button,[role="button"]')) ||
        candidates[i];
      var previousClick = clickedAt.get(control) || 0;
      if (now - previousClick < 1500) continue;

      clickedAt.set(control, now);
      control.click();
      clickCount++;
    }

    return clickCount > 0;
  }

  function normalizeText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function findTargetByText() {
    var expectedText = normalizeText(target.text);
    if (!expectedText) return null;

    var candidates = document.querySelectorAll('span[dir="auto"],div[dir="auto"]');
    var expectedUser = normalizeText(target.userName);

    for (var i = 0; i < candidates.length; i++) {
      var candidateText = normalizeText(candidates[i].textContent);
      if (!candidateText) continue;
      if (
        candidateText !== expectedText &&
        candidateText.indexOf(expectedText) !== 0 &&
        expectedText.indexOf(candidateText) !== 0
      ) {
        continue;
      }

      if (expectedUser) {
        var container = findCommentContainer(candidates[i]);
        if (normalizeText(container.textContent).indexOf(expectedUser) === -1) continue;
      }

      return candidates[i];
    }

    return null;
  }

  function findCommentContainer(anchor) {
    var listItem = anchor.closest && anchor.closest("li");
    if (listItem) return listItem;

    var node = anchor.parentElement;
    var best = node || anchor;

    for (var depth = 0; node && depth < 8; depth++, node = node.parentElement) {
      var commentLinks = node.querySelectorAll
        ? node.querySelectorAll('a[href*="/c/"],a[href*="/r/"]')
        : [];
      if (commentLinks.length > 1) break;
      if ((node.textContent || "").trim()) best = node;
    }

    return best;
  }

  function focusComment(anchor) {
    var container = findCommentContainer(anchor);
    container.setAttribute("data-ig-comment-focus", "true");
    container.scrollIntoView({ behavior: "smooth", block: "center" });

    window.setTimeout(function () {
      container.removeAttribute("data-ig-comment-focus");
    }, HIGHLIGHT_DURATION_MS);
  }

  function stopSearching() {
    if (intervalId !== null) window.clearInterval(intervalId);
    if (observer) observer.disconnect();
  }

  function clearStoredTarget() {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(STORAGE_KEY);
    }
  }

  function tryFocus() {
    attempts++;

    var targetElement = findTargetAnchor() || findTargetByText();
    if (targetElement) {
      focusComment(targetElement);
      clearStoredTarget();
      stopSearching();
      return;
    }

    if (target.isReply) {
      var parentAnchor = findAnchorBySegment("c", target.parentId);
      if (parentAnchor) clickReplyControl(parentAnchor);
      clickVisibleReplyControls();
    }

    if (!target.text && attempts % 4 === 0) mergeStoredTarget();
    if (Date.now() >= searchDeadline) stopSearching();
  }

  var style = document.createElement("style");
  style.textContent =
    '[data-ig-comment-focus="true"]{' +
    "outline:3px solid #6366f1!important;" +
    "outline-offset:4px!important;" +
    "border-radius:8px!important;" +
    "background:rgba(99,102,241,.12)!important;" +
    "transition:background .2s ease,outline-color .2s ease!important" +
    "}";
  document.head.appendChild(style);

  function startSearching() {
    observer = new MutationObserver(tryFocus);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    intervalId = window.setInterval(tryFocus, ATTEMPT_DELAY_MS);
    tryFocus();
  }

  mergeStoredTarget(startSearching);
})();
