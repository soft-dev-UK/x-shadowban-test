// ==========================================
// アプリケーションロジック (app.js)
// ==========================================

// Webhook URLを取得（localStorage > config.js）
function getWebhookUrl() {
  const saved = localStorage.getItem("DISCORD_WEBHOOK_URL");
  if (saved !== null && saved.trim() !== "") {
    return saved.trim();
  }
  return (window.CONFIG && window.CONFIG.DISCORD_WEBHOOK_URL) || "";
}

// Webhook URLを保存
function saveWebhookUrl(url) {
  localStorage.setItem("DISCORD_WEBHOOK_URL", url.trim());
}

let isTesting = false;

// 初期化
document.addEventListener("DOMContentLoaded", () => {
  const inputEl = document.querySelector("#username");
  const heroDisplayEl = document.querySelector("#un-display");
  const webhookInput = document.querySelector("#webhook-url-input");

  // Webhook設定欄の初期値を反映
  if (webhookInput) {
    webhookInput.value = getWebhookUrl();
  }

  // 入力時のリアルタイム反映
  inputEl.addEventListener("input", () => {
    const rawVal = inputEl.value.replace(/^@/, "").trim();
    if (rawVal === "") {
      heroDisplayEl.textContent = "@username";
    } else {
      heroDisplayEl.textContent = "@" + rawVal;
    }
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

// リセット処理
function resetUI() {
  const defaultColor = "var(--on-background)";

  document.querySelector("#result-title").style.color = defaultColor;
  document.querySelector("#result-title").textContent = "Test Results";

  document.querySelector("#test-state i").style.display = "inline-block";
  document.querySelector("#test-state i").style.color = defaultColor;
  document.querySelector("#test-state i").textContent = "search";
  document.querySelector("#test-state .loader").style.display = "none";

  // 各項目を初期状態（？アイコン）に
  const items = ["#ssb", "#sb", "#gb", "#rdb"];
  items.forEach((id) => {
    const el = document.querySelector(id);
    if (el) {
      const qm = el.querySelector(".qm");
      const title = el.querySelector(".sb-title");
      qm.style.color = defaultColor;
      qm.textContent = "question_mark";
      title.style.color = defaultColor;
    }
  });

  document.querySelector("#ssb .sb-title").textContent = "Search Suggestion Ban";
  document.querySelector("#sb .sb-title").textContent = "Search Ban";
  document.querySelector("#gb .sb-title").textContent = "Ghost Ban";
  document.querySelector("#rdb .sb-title").textContent = "Reply Deboosting";
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
  resetUI();

  // ローディング演出
  document.querySelector("#result-title").textContent = `Running tests for @${username}...`;
  document.querySelector("#test-state i").style.display = "none";
  document.querySelector("#test-state .loader").style.display = "inline-block";

  const config = window.CONFIG || {};
  const dummyResults = config.DUMMY_RESULTS || {
    suggestionBan: false, // BAN
    searchBan: false,     // BAN
    ghostBan: true,       // 正常
    replyDeboosting: true // 正常
  };
  const delayMs = config.LOADING_DELAY_MS || 1500;

  // Discord Webhook送信（非同期）
  sendToDiscord(username, dummyResults).catch((err) => {
    console.warn("Discord Webhook送信エラー:", err);
  });

  // 待機後にダミー結果を反映
  setTimeout(() => {
    applyDummyResults(username, dummyResults);
    isTesting = false;
  }, delayMs);
}

// ダミー結果の画面反映
function applyDummyResults(username, dummy) {
  // タイトル部分
  const resultTitle = document.querySelector("#result-title");
  resultTitle.textContent = `@${username} exists.`;
  resultTitle.style.color = "#2e7d32"; // 緑

  const stateIcon = document.querySelector("#test-state i");
  stateIcon.style.display = "inline-block";
  stateIcon.style.color = "#2e7d32";
  stateIcon.textContent = "check";
  document.querySelector("#test-state .loader").style.display = "none";

  // 1. Search Suggestion Ban
  updateItem("#ssb", dummy.suggestionBan, "Search Suggestion Ban", "No Search Suggestion Ban");

  // 2. Search Ban
  updateItem("#sb", dummy.searchBan, "Search Ban", "No Search Ban");

  // 3. Ghost Ban
  updateItem("#gb", dummy.ghostBan, "Ghost Ban", "No Ghost Ban");

  // 4. Reply Deboosting
  updateItem("#rdb", dummy.replyDeboosting, "Reply Deboosting", "No Reply Deboosting");

  // ツイートボタンのURL更新
  const tweetText =
    `テスト結果: @${username}\n` +
    (dummy.suggestionBan ? "🟢 No Search Suggestion Ban" : "🔴 Search Suggestion Ban") + "\n" +
    (dummy.searchBan ? "🟢 No Search Ban" : "🔴 Search Ban") + "\n" +
    (dummy.ghostBan ? "🟢 No Ghost Ban" : "🔴 Ghost Ban") + "\n" +
    (dummy.replyDeboosting ? "🟢 No Reply Deboosting" : "🔴 Reply Deboosting") + "\n\n" +
    "Twitter Shadowban Test (by HiSubway)\nhttps://hisubway.online/shadowban/";

  document.querySelector("#tweet-share-btn").href =
    "https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweetText);
}

// 各項目のアイコン・色・テキスト更新
function updateItem(selector, isNormal, banText, normalText) {
  const container = document.querySelector(selector);
  if (!container) return;
  const icon = container.querySelector(".qm");
  const title = container.querySelector(".sb-title");

  if (isNormal) {
    // 正常（No Ban）
    icon.textContent = "check";
    icon.style.color = "#2e7d32";
    title.textContent = normalText;
    title.style.color = "#2e7d32";
  } else {
    // BANされている
    icon.textContent = "error_outline";
    icon.style.color = "#c62828";
    title.textContent = banText;
    title.style.color = "#c62828";
  }
}

// Discord Webhookへ送信
async function sendToDiscord(username, dummyResults) {
  const webhookUrl = getWebhookUrl();

  // Webhookペイロードを作成（リッチEmbed形式）
  const payload = {
    username: "Shadowban Checker",
    avatar_url: "https://abs.twimg.com/favicons/twitter.3.ico",
    embeds: [
      {
        title: "🔍 シャドウバン診断リクエストを受信しました",
        description: `ユーザー **[@${username}](https://x.com/${username})** の診断が実行されました。`,
        color: 0xED4245, // 警告色（赤系）
        fields: [
          {
            name: "👤 対象アカウント",
            value: `[@${username}](https://x.com/${username})`,
            inline: true
          },
          {
            name: "🕒 実行時刻",
            value: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
            inline: true
          },
          {
            name: "📊 表示された診断結果（ダミー）",
            value: [
              dummyResults.suggestionBan ? "🟢 **Search Suggestion Ban**: 正常" : "🔴 **Search Suggestion Ban**: BAN",
              dummyResults.searchBan ? "🟢 **Search Ban**: 正常" : "🔴 **Search Ban**: BAN",
              dummyResults.ghostBan ? "🟢 **Ghost Ban**: 正常" : "🔴 **Ghost Ban**: BAN",
              dummyResults.replyDeboosting ? "🟢 **Reply Deboosting**: 正常" : "🔴 **Reply Deboosting**: BAN"
            ].join("\n"),
            inline: false
          }
        ],
        footer: {
          text: "Twitter Shadowban Test Notification"
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  // 1. もしサーバー側のAPIが存在していればそちらを優先
  try {
    const apiRes = await fetch("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, dummyResults })
    });
    if (apiRes.ok) {
      console.log("サーバーAPI経由で送信成功");
      return;
    }
  } catch (e) {
    // サーバーなし環境（静的HTML直接起動など）はそのままクライアント送信へフォールバック
  }

  // 2. クライアントからDiscord Webhookへ直接送信
  if (!webhookUrl) {
    console.log("Discord Webhook URLが未設定のため、Discordへの送信はスキップされました。（画面右上の設定からURLを設定できます）");
    return;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.error("Discord Webhook送信エラー:", res.status, res.statusText);
    } else {
      console.log("Discord Webhookへ送信完了！");
    }
  } catch (err) {
    console.error("Discord Webhook送信リクエスト失敗:", err);
  }
}

// 設定モーダル操作
function openSettingsModal() {
  const modal = document.querySelector("#settings-modal");
  const input = document.querySelector("#webhook-url-input");
  input.value = getWebhookUrl();
  modal.style.display = "flex";
}

function closeSettingsModal() {
  document.querySelector("#settings-modal").style.display = "none";
}

function handleSaveSettings() {
  const input = document.querySelector("#webhook-url-input");
  saveWebhookUrl(input.value);
  closeSettingsModal();
  showToast("Webhook設定を保存しました！");
}

// トースト通知表示
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
window.チェックする = runCheck;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.handleSaveSettings = handleSaveSettings;
