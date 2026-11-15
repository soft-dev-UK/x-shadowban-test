// Vercel Serverless Function: /api/check
export default async function handler(req, res) {
  // CORSヘッダー
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { username, dummyResults } = req.body || {};
  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  console.log(`[API /api/check] 診断リクエスト受信: @${username}`);

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl) {
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

    try {
      const discordRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!discordRes.ok) {
        console.error("Discord送信失敗:", discordRes.status, discordRes.statusText);
      } else {
        console.log("Discord送信成功");
      }
    } catch (err) {
      console.error("Discord送信エラー:", err);
    }
  } else {
    console.log("DISCORD_WEBHOOK_URL 環境変数が未設定です。");
  }

  return res.status(200).json({ success: true, username });
}
