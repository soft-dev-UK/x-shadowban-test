// ==========================================
// 軽量Node.jsサーバー (server.js)
// 外部npmパッケージ不要！Node.js標準機能だけで動作します
// ==========================================

const http = require("http");
const fs = require("fs");
const path = require("path");

// .env ファイルが存在すれば手動でパースして環境変数に読み込む
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        process.env[key] = val;
      }
    }
  });
}

const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (req, res) => {
  // CORSヘッダー
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // APIエンドポイント: POST /api/check
  if (req.url === "/api/check" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const data = JSON.parse(body || "{}");
        const { username, dummyResults } = data;

        if (!username) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "username is required" }));
          return;
        }

        console.log(`[CHECK] 診断リクエスト受信: @${username}`);

        // Discord Webhook送信
        if (DISCORD_WEBHOOK_URL) {
          const payload = {
            username: "Shadowban Checker",
            avatar_url: "https://abs.twimg.com/favicons/twitter.3.ico",
            embeds: [
              {
                title: "🔍 シャドウバン診断リクエストを受信しました",
                description: `ユーザー **[@${username}](https://x.com/${username})** の診断が実行されました。`,
                color: 0xED4245,
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
                      dummyResults?.suggestionBan ? "🟢 **Search Suggestion Ban**: 正常" : "🔴 **Search Suggestion Ban**: BAN",
                      dummyResults?.searchBan ? "🟢 **Search Ban**: 正常" : "🔴 **Search Ban**: BAN",
                      dummyResults?.ghostBan ? "🟢 **Ghost Ban**: 正常" : "🔴 **Ghost Ban**: BAN",
                      dummyResults?.replyDeboosting ? "🟢 **Reply Deboosting**: 正常" : "🔴 **Reply Deboosting**: BAN"
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

          const webhookRes = await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!webhookRes.ok) {
            console.error(`[ERROR] Discord送信失敗: ${webhookRes.status} ${webhookRes.statusText}`);
          } else {
            console.log(`[SUCCESS] Discord Webhookへ送信完了: @${username}`);
          }
        } else {
          console.log("[INFO] サーバー側のDISCORD_WEBHOOK_URLが未設定です（.env または環境変数を設定してください）");
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, username }));
      } catch (err) {
        console.error("[ERROR]", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal Server Error" }));
      }
    });
    return;
  }

  // 静的ファイル配信
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/") reqPath = "/index.html";

  const filePath = path.join(__dirname, reqPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 Not Found");
      } else {
        res.writeHead(500);
        res.end("Server Error: " + err.code);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`📁 静的ファイルディレクトリ: ${__dirname}`);
  if (DISCORD_WEBHOOK_URL) {
    console.log(`🔔 Discord Webhook: 設定済み`);
  } else {
    console.log(`⚠️  Discord Webhook: 未設定 (.env または画面右上の設定から指定可能)`);
  }
  console.log(`===============================================`);
});
