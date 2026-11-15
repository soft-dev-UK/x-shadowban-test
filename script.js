// ==========================================
// アプリケーションロジック (script.js)
// ==========================================

const DUMMY_RESULTS = {
  suggestionBan: false, // Search Suggestion Ban: BAN（赤色）
  searchBan: false,     // Search Ban: BAN（赤色）
  ghostBan: true,       // Ghost Ban: 正常（緑色）
  replyDeboosting: true // Reply Deboosting: 正常（緑色）
};

const LOADING_DELAY_MS = 1500;
let isTesting = false;

document.addEventListener("DOMContentLoaded", () => {
  const inputEl = document.querySelector("#username");
  const heroDisplayEl = document.querySelector("#un-display");

  // 入力時のリアルタイム反映
  inputEl.addEventListener("input", () => {
    const rawVal = inputEl.value.replace(/^@/, "").trim();
    heroDisplayEl.textContent = rawVal === "" ? "@username" : "@" + rawVal;
  });

  // Enterキーでチェック発火
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      inputEl.blur();
      runCheck();
    }
  });

  // URLクエリパラメータに ?username= があれば自動実行
  const params = new URLSearchParams(window.location.search);
  const userParam = params.get("username");
  if (userParam) {
    inputEl.value = userParam.replace(/^@/, "").trim();
    heroDisplayEl.textContent = "@" + inputEl.value;
    runCheck();
  }
});

// UIリセット
function resetUI(username) {
  document.querySelector("#summary-alert").style.display = "none";
  document.querySelector("#tweet-btn-container").style.display = "none";

  const stateIcon = document.querySelector("#state-icon");
  const stateLoader = document.querySelector("#state-loader");
  const resultTitle = document.querySelector("#result-title");

  stateIcon.style.display = "none";
  stateLoader.style.display = "inline-block";
  resultTitle.textContent = `Running tests for @${username}...`;
  resultTitle.style.color = "#0a59f7";

  // 各項目を診断中状態に
  const items = ["#ssb", "#sb", "#gb", "#rdb"];
  items.forEach((id) => {
    const el = document.querySelector(id);
    if (el) {
      const details = el.querySelector("details");
      if (details) details.removeAttribute("open");
      const icon = el.querySelector(".status-icon");
      const badge = el.querySelector(".item-badge");
      if (icon) {
        icon.textContent = "hourglass_top";
        icon.style.color = "#757575";
      }
      if (badge) {
        badge.className = "item-badge badge-pending";
        badge.textContent = "診断中...";
      }
    }
  });
}

// チェック実行
async function runCheck() {
  if (isTesting) return;

  const inputEl = document.querySelector("#username");
  const username = inputEl.value.replace(/^@/, "").trim();

  if (!username) {
    showToast("X（Twitter）のIDを入力してください");
    inputEl.focus();
    return;
  }

  isTesting = true;
  resetUI(username);

  // サーバーAPI (/api/check) 経由でDiscordへ通知（非同期）
  fetch("/api/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, dummyResults: DUMMY_RESULTS })
  }).catch((err) => {
    console.warn("通知エラー:", err);
  });

  // 待機後にダミー結果を確実に画面反映
  setTimeout(() => {
    applyDummyResults(username, DUMMY_RESULTS);
    isTesting = false;
  }, LOADING_DELAY_MS);
}

// 結果の画面反映
function applyDummyResults(username, dummy) {
  // 1. ローダーを消して完了アイコンを表示
  const stateIcon = document.querySelector("#state-icon");
  const stateLoader = document.querySelector("#state-loader");
  const resultTitle = document.querySelector("#result-title");

  stateLoader.style.display = "none";
  stateIcon.style.display = "inline-block";
  stateIcon.textContent = "check_circle";
  stateIcon.style.color = "#2e7d32";

  resultTitle.textContent = `@${username} exists.`;
  resultTitle.style.color = "#2e7d32";

  // 2. 総合サマリーアラートを表示
  const summaryAlert = document.querySelector("#summary-alert");
  summaryAlert.style.display = "flex";

  // 3. 各項目の反映
  // Search Suggestion Ban: BAN (赤)
  renderResultItem("#ssb", dummy.suggestionBan, "Search Suggestion Ban", "No Search Suggestion Ban");

  // Search Ban: BAN (赤)
  renderResultItem("#sb", dummy.searchBan, "Search Ban", "No Search Ban");

  // Ghost Ban: 正常 (緑)
  renderResultItem("#gb", dummy.ghostBan, "Ghost Ban", "No Ghost Ban");

  // Reply Deboosting: 正常 (緑)
  renderResultItem("#rdb", dummy.replyDeboosting, "Reply Deboosting", "No Reply Deboosting");

  // 4. ツイートボタンを表示
  const tweetContainer = document.querySelector("#tweet-btn-container");
  const tweetBtn = document.querySelector("#tweet-share-btn");
  tweetContainer.style.display = "flex";

  const tweetText =
    `Twitterアカウント @${username} のシャドウバン診断結果:\n` +
    `🔴 Search Suggestion Ban: BAN\n` +
    `🔴 Search Ban: BAN\n` +
    `🟢 Ghost Ban: 正常\n` +
    `🟢 Reply Deboosting: 正常\n\n` +
    `#シャドウバン #Twitter\n` +
    window.location.origin;

  tweetBtn.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweetText);

  // 結果エリアへスクロール
  document.querySelector("#summary-alert").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// 各行の描画
function renderResultItem(selector, isNormal, banTitle, normalTitle) {
  const container = document.querySelector(selector);
  if (!container) return;

  const icon = container.querySelector(".status-icon");
  const title = container.querySelector(".item-title");
  const badge = container.querySelector(".item-badge");
  const details = container.querySelector("details");
  const expBox = container.querySelector(".explanation-box");

  if (isNormal) {
    // 正常
    icon.textContent = "check_circle";
    icon.style.color = "#2e7d32";
    title.textContent = normalTitle;
    title.style.color = "#2e7d32";
    badge.className = "item-badge badge-ok";
    badge.textContent = "正常（制限なし）";
    if (details) details.removeAttribute("open");
    if (expBox) expBox.className = "explanation-box";
  } else {
    // BANされている
    icon.textContent = "cancel";
    icon.style.color = "#d32f2f";
    title.textContent = banTitle;
    title.style.color = "#d32f2f";
    badge.className = "item-badge badge-banned";
    badge.textContent = "BANされています";
    if (details) details.setAttribute("open", "true"); // BAN項目は自動で解説を開く
    if (expBox) expBox.className = "explanation-box banned-border";
  }
}

// トースト通知
function showToast(text) {
  const toast = document.createElement("div");
  toast.className = "toast-msg";
  toast.textContent = text;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// グローバル公開
window.runCheck = runCheck;
