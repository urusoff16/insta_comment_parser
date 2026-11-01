(function () {
  "use strict";

  var uiLanguage = "en";
  try {
    uiLanguage =
      (chrome.i18n && chrome.i18n.getUILanguage && chrome.i18n.getUILanguage()) ||
      navigator.language ||
      "en";
  } catch (error) {
    uiLanguage = navigator.language || "en";
  }

  var isRussian = /^ru(?:-|$)/i.test(uiLanguage);
  document.documentElement.lang = isRussian ? "ru" : "en";
  if (isRussian) document.title = "Экспорт комментариев Instagram";

  var originalFetch = window.fetch && window.fetch.bind(window);
  if (originalFetch) {
    window.fetch = function (resource, options) {
      var url = typeof resource === "string" ? resource : resource && resource.url;
      if (/^https:\/\/(?:dev)?igcomment\.igscraper\.io\/extension\//i.test(url || "")) {
        return Promise.reject(new Error("Subscription services are disabled in local Pro mode"));
      }
      return originalFetch(resource, options);
    };
  }

  var style = document.createElement("style");
  style.textContent =
    ".header-actions,.btn-pro,.limit-banner,.pro-banner,.list-limit-bar," +
    ".app-footer,.contact-info,a[href^=\"mailto:\"]{" +
    "display:none!important}" +
    ".modal-overlay{display:none!important}";
  document.head.appendChild(style);

  var translations = {
    "IG Comment Exporter": "Экспорт комментариев Instagram",
    "Export Instagram comments to CSV / Excel": "Экспорт комментариев Instagram в CSV / Excel",
    "Export Instagram comments to Excel/CSV for free.": "Экспортируйте комментарии Instagram в Excel или CSV.",
    "Export Instagram Data": "Экспортировать данные Instagram",
    "Export Settings": "Настройки экспорта",
    "Configure the Instagram post and fetch options below.": "Укажите публикацию Instagram и параметры сбора.",
    "Instagram Post URL": "Ссылка на публикацию Instagram",
    "Paste any Instagram post, Reel, or IGTV URL to start exporting comments.": "Вставьте ссылку на публикацию, Reel или IGTV, чтобы начать сбор комментариев.",
    "Note: Instagram API may limit exports. Progress auto-saves every 10 pages and on browser close - you can resume anytime.": "Примечание: Instagram может ограничивать выдачу данных. Прогресс сохраняется каждые 10 страниц и при закрытии браузера — сбор можно продолжить позже.",
    "Request Delay": "Задержка запросов",
    "A longer delay reduces risk to your Instagram account. We recommend ≥ 5s.": "Большая задержка снижает риск ограничений аккаунта Instagram. Рекомендуется не менее 5 секунд.",
    "High Risk For Your Account": "Высокий риск для аккаунта",
    "Start parsing": "Начать сбор",
    "Resume parsing": "Продолжить сбор",
    "Pause parsing": "Приостановить",
    "Stop": "Остановить",
    "Stop & Reset": "Остановить и сбросить",
    "Clear progress": "Очистить прогресс",
    "Progress": "Прогресс",
    "Status": "Статус",
    "Stopped": "Остановлено",
    "Paused": "Приостановлено",
    "In progress": "Выполняется",
    "Finished": "Завершено",
    "Error": "Ошибка",
    "Total comments": "Всего комментариев",
    "Found comments": "Собрано комментариев",
    "No data yet": "Данных пока нет",
    "Auto-saving every 10 pages": "Автосохранение каждые 10 страниц",
    "Safe": "Безопасно",
    "Export Data": "Экспорт данных",
    "Save to CSV": "Сохранить в CSV",
    "Save to Excel": "Сохранить в Excel",
    "Save CSV": "Сохранить CSV",
    "Save Excel": "Сохранить Excel",
    "Comments": "Комментарии",
    "NO.": "№",
    "Avatar": "Аватар",
    "Username": "Пользователь",
    "Comment": "Комментарий",
    "Date": "Дата",
    "Instagram API Limitation": "Ограничение Instagram API",
    "Instagram data delay": "Задержка данных Instagram",
    "Exporting": "Сбор:",
    "comments, please wait a moment...": "комментариев, подождите...",
    "No comments to export": "Нет комментариев для экспорта",
    "No saved progress found": "Сохранённый прогресс не найден",
    "Stopped and reset. All progress cleared.": "Сбор остановлен, весь прогресс очищен.",
    "Could not extract post code from URL. Please check the URL.": "Не удалось определить код публикации. Проверьте ссылку.",
    "Instagram post url can't be empty": "Ссылка на публикацию Instagram не может быть пустой",
    "This is not IG Post URL": "Это не ссылка на публикацию Instagram",
    "404 Instagram post url not found": "Публикация Instagram не найдена",
    "Please wait a few minutes before you try again": "Подождите несколько минут перед повторной попыткой",
    "Instagram Web Server Error": "Ошибка сервера Instagram",
    "Fetch Error": "Ошибка загрузки",
    "Network Timeout": "Превышено время ожидания сети",
    "Export limit reached": "Достигнут предел экспорта",
    "Open this comment on Instagram": "Открыть комментарий в Instagram",
    "Step 1: Please log in to your Instagram account by visiting:": "Шаг 1. Войдите в свой аккаунт Instagram:",
    "Step 2: To export comments, please input the Instagram post url. For example: \"https://www.instagram.com/p/CDrcwykscvS\" or \"https://www.instagram.com/reels/DUomONwANAz/\" can be available.": "Шаг 2. Вставьте ссылку на публикацию Instagram, например: \"https://www.instagram.com/p/CDrcwykscvS\" или \"https://www.instagram.com/reels/DUomONwANAz/\".",
    "Step 3: Then click \"Start Parsing\" to begin collecting comments. Once you have gathered enough comments, export the list to a CSV or Excel file.": "Шаг 3. Нажмите «Начать сбор». После загрузки комментариев сохраните список в CSV или Excel.",
    "Export in progress. Your progress will be saved. Are you sure you want to leave?": "Идёт сбор комментариев. Прогресс будет сохранён. Вы уверены, что хотите выйти?",
    "Another great dm tool for you:": "Ещё один полезный инструмент:",
    "WhatsApp Sender": "Рассылка WhatsApp"
  };

  var dynamicTranslations = [
    [/^Cooldown (\d+)s$/, "Ожидание $1 с"],
    [/^([\d.,]+)s · Safe$/, "$1 с · Безопасно"],
    [/^([\d.,]+)s · High Risk$/, "$1 с · Высокий риск"],
    [/^⚠\s*High Risk For Your Account$/, "⚠ Высокий риск для аккаунта"],
    [/^Cooling down \((\d+)s\), will resume shortly\.\.\.$/, "Ожидание ($1 с), сбор скоро продолжится..."],
    [/^Progress saved: (\d+) comments from previous session\. Click Resume to continue\.$/, "Сохранён прогресс: $1 комментариев. Нажмите «Продолжить сбор»."],
    [/^Found saved progress: (\d+) comments from previous session$/, "Найден сохранённый прогресс: $1 комментариев"],
    [/^Paused at (\d+) comments\. You can resume anytime\.$/, "Сбор приостановлен на $1 комментариях. Его можно продолжить позже."],
    [/^Resuming from (\d+) comments\.\.\.$/, "Продолжаем с $1 комментариев..."],
    [/^Download (\d+) comments$/, "Скачать $1 комментариев"],
    [/^(\d+) comments ready$/, "Готово комментариев: $1"],
    [/^(\d+) comments collected(?: \((\d+) total shown\))?$/, "Собрано комментариев: $1"],
    [/^Exporting (\d+) \/ (.+) comments, please wait a moment\.\.\.$/, "Собрано $1 из $2 комментариев, подождите..."],
    [/^Note: Instagram API may not allow fetching all (\d+) comments$/, "Instagram API может не выдать все $1 комментариев"],
    [/^Export completed! (\d+) comments collected\.$/, "Экспорт завершён! Собрано комментариев: $1."],
    [/^Export completed: (\d+) comments collected \((\d+)% of (\d+) total\)\. Instagram API has limits on fetching all comments\. Missing (\d+) comments due to Instagram's restrictions\.$/, "Экспорт завершён: собрано $1 комментариев из $3 ($2%). Instagram не предоставил ещё $4."],
    [/^Only (\d+)% of comments \((\d+)\/(\d+)\) could be fetched due to Instagram's API restrictions\. This is a platform limitation, not a tool issue\.$/, "Instagram предоставил только $2 из $3 комментариев ($1%). Это ограничение платформы."],
    [/^Instagram data may be delayed\. Please use the actual collected count \((\d+)\) as the final result\.$/, "Данные Instagram могут поступать с задержкой. Итоговый результат — фактически собранные комментарии ($1)."],
    [/^Instagram reports (\d+) comments, but only (\d+) are currently available through its API\. All available comments have been collected\.$/, "Instagram сообщает о $1 комментариях, но через API сейчас доступны только $2. Все доступные комментарии собраны."]
  ];

  function translateValue(value) {
    if (!isRussian || !value) return value;
    var normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized) return value;

    var translated = translations[normalized];
    if (!translated) {
      for (var i = 0; i < dynamicTranslations.length; i++) {
        if (dynamicTranslations[i][0].test(normalized)) {
          translated = normalized.replace(dynamicTranslations[i][0], dynamicTranslations[i][1]);
          break;
        }
      }
    }

    if (!translated || translated === normalized) return value;
    var leading = value.match(/^\s*/)[0];
    var trailing = value.match(/\s*$/)[0];
    return leading + translated + trailing;
  }

  function translateElement(element) {
    if (!isRussian || !element || element.nodeType !== Node.ELEMENT_NODE) return;
    ["placeholder", "title", "aria-label"].forEach(function (attribute) {
      if (!element.hasAttribute(attribute)) return;
      var current = element.getAttribute(attribute);
      var translated = translateValue(current);
      if (translated !== current) element.setAttribute(attribute, translated);
    });
  }

  function translateTree(root) {
    if (!isRussian || !root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      var translatedText = translateValue(root.nodeValue);
      if (translatedText !== root.nodeValue) root.nodeValue = translatedText;
      return;
    }

    translateElement(root);
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) {
        var translated = translateValue(node.nodeValue);
        if (translated !== node.nodeValue) node.nodeValue = translated;
      } else {
        translateElement(node);
      }
    }
  }

  function findOptionsVm() {
    var queue = [];
    var visited = new Set();
    var roots = [document.querySelector("#option-root"), document.querySelector("#app")];
    roots.forEach(function (root) {
      if (root && root.__vue__) queue.push(root.__vue__);
    });

    while (queue.length) {
      var vm = queue.shift();
      if (!vm || visited.has(vm)) continue;
      visited.add(vm);
      if (Array.isArray(vm.commentList) && typeof vm.fetchLead === "function") return vm;
      if (Array.isArray(vm.$children)) queue.push.apply(queue, vm.$children);
    }
    return null;
  }

  function delay(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  function enhanceCommentCollection(vm) {
    if (!vm || vm.__commentCollectionEnhanced) return;

    if (
      typeof vm.fetchV1CommentReplies === "function" &&
      typeof vm.fetchInstagramV1 === "function" &&
      typeof vm.formatV1CommentNode === "function"
    ) {
      vm.fetchV1CommentReplies = async function (mediaId, parentComment) {
        var parentCommentId = parentComment && (parentComment.pk || parentComment.id)
          ? String(parentComment.pk || parentComment.id)
          : "";
        if (!parentCommentId) return [];

        var parentUser = parentComment.user || parentComment.owner || {};
        var parentUserName = parentUser.username || "";
        var minId = "";
        var replies = [];
        var seenReplyIds = new Set();

        for (var page = 0; page < 50; page++) {
          var params = new URLSearchParams();
          if (minId) params.set("min_id", minId);
          var query = params.toString();
          var result = await this.fetchInstagramV1(
            "media/" + mediaId + "/comments/" + parentCommentId +
            "/inline_child_comments/" + (query ? "?" + query : "")
          );
          var data = result && result.data ? result.data : {};
          var childComments = data.child_comments || [];

          for (var childIndex = 0; childIndex < childComments.length; childIndex++) {
            var formatted = this.formatV1CommentNode(childComments[childIndex], {
              commentType: "reply",
              parentCommentId: parentCommentId,
              parentUserName: parentUserName,
            });
            if (formatted.commentId && seenReplyIds.has(formatted.commentId)) continue;
            replies.push(formatted);
            if (formatted.commentId) seenReplyIds.add(formatted.commentId);
          }

          var nextCursor = data.next_min_child_cursor || "";
          if (!data.has_more_head_child_comments || !nextCursor || nextCursor === minId) break;
          minId = nextCursor;
          await delay(200);
        }

        return replies;
      };
    }

    if (
      typeof vm.fetchV1Comments === "function" &&
      typeof vm.fetchInstagramV1 === "function" &&
      typeof vm.flattenV1Comment === "function"
    ) {
      vm.fetchV1Comments = async function (mediaId, targetCount) {
        var rows = [];
        var maxId = "";
        var minId = "";
        var seenIds = new Set();
        var previewComments = this.mediaPreviewComments || [];

        async function appendComment(component, comment) {
          var flattened = await component.flattenV1Comment(comment, mediaId);
          for (var rowIndex = 0; rowIndex < flattened.length; rowIndex++) {
            var commentId = flattened[rowIndex].commentId;
            if (commentId && seenIds.has(commentId)) continue;
            rows.push(flattened[rowIndex]);
            if (commentId) seenIds.add(commentId);
          }
        }

        for (var previewIndex = 0; previewIndex < previewComments.length; previewIndex++) {
          await appendComment(this, previewComments[previewIndex]);
        }

        for (var page = 0; page < 50; page++) {
          var params = new URLSearchParams({
            can_support_threading: "true",
            permalink_enabled: "false",
          });
          if (maxId) params.set("max_id", maxId);
          else if (minId) params.set("min_id", minId);

          var result = await this.fetchInstagramV1(
            "media/" + mediaId + "/comments/?" + params.toString()
          );
          var data = result && result.data ? result.data : {};
          var comments = (data.preview_comments || []).concat(data.comments || []);
          var previousSize = rows.length;

          for (var commentIndex = 0; commentIndex < comments.length; commentIndex++) {
            await appendComment(this, comments[commentIndex]);
          }

          if (targetCount && rows.length >= targetCount) break;

          var nextMaxId = data.next_max_id || data.max_id || "";
          var nextMinId = data.next_min_id || data.min_id || "";
          if (data.has_more_comments && nextMaxId && nextMaxId !== maxId) {
            maxId = nextMaxId;
            minId = "";
          } else if (data.has_more_headload_comments && nextMinId && nextMinId !== minId) {
            maxId = "";
            minId = nextMinId;
          } else {
            break;
          }

          if (rows.length === previousSize && page >= 2) break;
          await delay(250);
        }

        return rows;
      };
    }

    if (typeof vm.markFetchFinished === "function") {
      var originalMarkFetchFinished = vm.markFetchFinished.bind(vm);
      vm.markFetchFinished = async function () {
        var reportedTotal = Number(this.totalComments) || 0;
        await originalMarkFetchFinished();

        var collectedTotal = Math.max(
          Number(this.foundComments) || 0,
          Array.isArray(this.commentList) ? this.commentList.length : 0
        );
        if (reportedTotal > collectedTotal && collectedTotal > 0) {
          this.reportedTotalComments = reportedTotal;
          this.totalComments = collectedTotal;
          this.availabilityNotice =
            "Instagram reports " + reportedTotal +
            " comments, but only " + collectedTotal +
            " are currently available through its API. All available comments have been collected.";
        }
      };
    }

    vm.__commentCollectionEnhanced = true;
  }

  function enableLocalProMode() {
    var vm = findOptionsVm();
    if (!vm) return false;
    enhanceCommentCollection(vm);
    if (vm.__localProEnabled) return true;

    try {
      Object.defineProperty(vm, "isLoggedIn", {
        configurable: true,
        get: function () { return true; }
      });
      Object.defineProperty(vm, "isProUser", {
        configurable: true,
        get: function () { return true; }
      });
      vm.showAccountDialog = false;
      vm.showPricingDialog = false;
      vm.__localProEnabled = true;
      vm.$forceUpdate();
    } catch (error) {
      console.warn("Failed to enable local Pro mode:", error);
    }
    return true;
  }

  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "attributes") {
        translateElement(mutation.target);
        return;
      }
      if (mutation.type === "characterData") {
        translateTree(mutation.target);
        return;
      }
      for (var i = 0; i < mutation.addedNodes.length; i++) {
        translateTree(mutation.addedNodes[i]);
      }
    });
    enableLocalProMode();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["placeholder", "title", "aria-label"]
  });

  translateTree(document.documentElement);
  window.setTimeout(enableLocalProMode, 0);
  window.setTimeout(enableLocalProMode, 250);
})();
