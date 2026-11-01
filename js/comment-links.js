(function () {
  "use strict";

  var CELL_SELECTOR = ".comment-table tbody td.col-text";

  function findOptionsVm() {
    var queue = [];
    var visited = new Set();
    var optionRoot = document.querySelector("#option-root");
    var appRoot = document.querySelector("#app");

    if (optionRoot && optionRoot.__vue__) queue.push(optionRoot.__vue__);
    if (appRoot && appRoot.__vue__) queue.push(appRoot.__vue__);

    while (queue.length > 0) {
      var vm = queue.shift();
      if (!vm || visited.has(vm)) continue;
      visited.add(vm);

      if (Array.isArray(vm.commentList) && typeof vm.postCode === "string") {
        return vm;
      }

      if (Array.isArray(vm.$children)) {
        queue.push.apply(queue, vm.$children);
      }
    }

    return null;
  }

  function buildCommentUrl(postCode, item) {
    if (!postCode) return "";

    var postUrl = "https://www.instagram.com/p/" + encodeURIComponent(postCode) + "/";
    if (!item || !item.commentId) return postUrl;

    var commentId = encodeURIComponent(String(item.commentId));
    if (item.commentType === "reply" && item.parentCommentId) {
      var parentId = encodeURIComponent(String(item.parentCommentId));
      return (
        postUrl +
        "c/" +
        parentId +
        "/r/" +
        commentId +
        "/#ig-comment-focus=" +
        parentId +
        ":" +
        commentId
      );
    }

    return postUrl + "c/" + commentId + "/#ig-comment-focus=" + commentId;
  }

  function getCommentForCell(cell) {
    var row = cell && cell.closest("tr");
    var body = row && row.parentElement;
    var vm = findOptionsVm();

    if (!row || !body || !vm) return null;

    var rowIndex = Array.prototype.indexOf.call(body.children, row);
    if (rowIndex < 0 || rowIndex >= vm.commentList.length) return null;

    return {
      item: vm.commentList[rowIndex],
      postCode: vm.postCode,
    };
  }

  function openComment(cell) {
    var context = getCommentForCell(cell);
    if (!context) return;

    var url = buildCommentUrl(context.postCode, context.item);
    if (!url) return;

    var item = context.item || {};
    var focusTarget = {
      postCode: context.postCode,
      parentId: item.parentCommentId || item.commentId || "",
      targetId: item.commentId || "",
      isReply: item.commentType === "reply",
      userName: item.userName || "",
      text: String(item.text || "").slice(0, 500),
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    try {
      chrome.storage.local.set({ ig_comment_focus_target: focusTarget });
    } catch (error) {
      // The permalink and hash remain sufficient for comments exposed by ID.
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  document.addEventListener("click", function (event) {
    var cell = event.target.closest && event.target.closest(CELL_SELECTOR);
    if (cell) openComment(cell);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;

    var cell = event.target.closest && event.target.closest(CELL_SELECTOR);
    if (!cell) return;

    event.preventDefault();
    openComment(cell);
  });

  function decorateCells() {
    var cells = document.querySelectorAll(CELL_SELECTOR);
    for (var i = 0; i < cells.length; i++) {
      cells[i].tabIndex = 0;
      cells[i].setAttribute("role", "link");
      cells[i].setAttribute("title", "Open this comment on Instagram");
    }
  }

  var style = document.createElement("style");
  style.textContent =
    CELL_SELECTOR +
    '[role="link"]{cursor:pointer;transition:color .15s ease,background-color .15s ease}' +
    CELL_SELECTOR +
    '[role="link"]:hover{color:#4f46e5;background:#f5f3ff;text-decoration:underline}' +
    CELL_SELECTOR +
    '[role="link"]:focus-visible{outline:2px solid #6366f1;outline-offset:-2px;background:#f5f3ff}';
  document.head.appendChild(style);

  var observer = new MutationObserver(decorateCells);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  decorateCells();
})();
