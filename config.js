// ==========================================
// 設定ファイル (config.js)
// ==========================================

const CONFIG = {
  // DiscordのWebhook URL（ここに自分のDiscord Webhook URLを入力してください）
  // 画面右上の「⚙️ Webhook設定」からもブラウザ上で保存・変更可能です。
  DISCORD_WEBHOOK_URL: "",

  // ダミー診断結果の設定
  // true: BANされていない（正常・緑色 No ...）
  // false: BANされている（制限中・赤色 ...）
  DUMMY_RESULTS: {
    suggestionBan: false, // Search Suggestion Ban: BAN（赤色）
    searchBan: false,     // Search Ban: BAN（赤色）
    ghostBan: true,       // Ghost Ban: 正常（緑色）
    replyDeboosting: true // Reply Deboosting: 正常（緑色）
  },

  // 診断演出の待機時間（ミリ秒）: 1500ms = 1.5秒
  LOADING_DELAY_MS: 1500
};

// グローバルに公開
window.CONFIG = CONFIG;
