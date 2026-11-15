# X（Twitter）シャドウバン診断風 UI & Discord Webhook通知サイト

X（Twitter）のシャドウバンチェックサイト（[hisubway.online/shadowban](https://hisubway.online/shadowban/)）のUIを忠実に再現したWebサイトです。

入力されたXのアカウントIDをDiscordの指定チャンネルにWebhookで通知し、画面上にはダミーの診断結果（※ご指定により Search Suggestion Ban と Search Ban は BAN 表示）を表示します。

---

## 🌟 主な機能

1. **元サイトそっくりのUIデザイン**
   - Material Design（BeerCSS）を採用した美しいUI
   - ID入力に応じて見出しの `@username` がリアルタイムに更新
   - CHECKボタンを押すと、ローディングスピナーが回り本物そっくりに診断演出
2. **ダミー診断結果の表示**
   - 🔴 **Search Suggestion Ban**: **BAN**（赤色・エラーアイコン）
   - 🔴 **Search Ban**: **BAN**（赤色・エラーアイコン）
   - 🟢 **Ghost Ban**: **正常（No Ghost Ban）**（緑色・チェックアイコン）
   - 🟢 **Reply Deboosting**: **正常（No Reply Deboosting）**（緑色・チェックアイコン）
   - 各アコーディオンをクリックすると、BANの詳細な日本語解説が開閉
   - 「結果をツイートする」ボタンも連動
3. **Discord Webhook連携**
   - 入力されたID、アクセス時刻、ダミー結果をリッチな埋め込み（Embed）でDiscordチャンネルに自動送信
4. **2つの実行モード**
   - **簡単モード**: `index.html` をダブルクリックしてブラウザで開くだけ（サーバー不要）
   - **サーバーモード**: Node.js標準機能で動作する軽量サーバー（Webhook URLを隠蔽して安全に公開可能）

---

## 🚀 使い方

### 方法1: ブラウザで直接開く（一番簡単・おすすめ）

1. フォルダ内の `index.html` をダブルクリック（またはブラウザにドラッグ＆ドロップ）します。
2. 画面右上の **「⚙️ Discord設定」** ボタンを押します。
3. 発行した **Discord Webhook URL** を貼り付けて「保存する」をクリックします。
4. 入力欄にXのID（例: `elonmusk`）を入力し、**CHECK** ボタンを押すとDiscordに通知が届き、画面に診断結果が表示されます！

---

### 方法2: Node.jsサーバーで動かす（安全・Web公開向け）

外部パッケージのインストール不要！Node.jsが入っていればすぐに起動できます。

1. ターミナルでこのディレクトリに移動します：
   ```bash
   cd /Users/yuura/.gemini/antigravity/scratch/x-shadowban-ui
   ```

2. `.env` ファイルを作成し、Discord Webhook URLを設定します：
   ```bash
   cp .env.example .env
   # .env を開いて DISCORD_WEBHOOK_URL にご自身のWebhook URLを入力
   ```

3. サーバーを起動します：
   ```bash
   npm start
   # または node server.js
   ```

4. ブラウザで `http://localhost:3000` にアクセスします。

---

## 📌 Discord Webhook URLの取得手順（初心者向けガイド）

1. **Discord** を開き、通知を受け取りたいサーバーのチャンネル一覧を表示します。
2. 通知を送りたいチャンネルの横にある **歯車アイコン（チャンネルの編集）** をクリックします。
3. 左メニューの **「連携」** を選択し、**「ウェブフック」** をクリックします。
4. **「新しいウェブフック」** ボタンを押します。
5. 名前（例: `シャドウバン通知ボット`）を付け、**「ウェブフックURLをコピー」** をクリックします。
6. コピーしたURLを、本サイトの画面右上「⚙️ Discord設定」または `.env` に貼り付ければ準備完了です！

---

## ⚙️ ダミー結果のカスタマイズ（設定変更）

`config.js` を開くと、診断結果の表示内容を簡単に変更できます：

```javascript
DUMMY_RESULTS: {
  suggestionBan: false, // true = 正常(緑), false = BAN(赤)
  searchBan: false,     // true = 正常(緑), false = BAN(赤)
  ghostBan: true,       // true = 正常(緑), false = BAN(赤)
  replyDeboosting: true // true = 正常(緑), false = BAN(赤)
}
```

---

## 📁 ファイル構成

```text
x-shadowban-ui/
├── index.html       # メイン画面（UIマークアップ）
├── style.css        # スタイルシート（配色、フォント、アニメーション）
├── app.js           # アプリロジック（入力連動、演出、Discord送信処理）
├── config.js        # 設定ファイル（Webhook URL初期値、ダミー診断結果定義）
├── server.js        # 軽量Node.jsサーバー（標準ライブラリのみ・npm不要）
├── package.json     # プロジェクト設定
├── .env.example     # 環境変数サンプル
└── README.md        # 本説明書
```
