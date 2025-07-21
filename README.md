# Discourse Forum Dashboard

Discourseフォーラムの統計・ユーザー・アクティビティを可視化するダッシュボードです。

## 必要条件

- Node.js 18以上
- DiscourseフォーラムのAPIが利用可能

## セットアップ手順

1. このリポジトリをダウンロードまたはクローン
2. `config/config.json` の `"forum.baseUrl"` を自分のDiscourseフォーラムURLに変更
3. ターミナルで以下を実行

   ```
   npm install
   npm start
   ```

4. ブラウザで `http://localhost:3000` を開く

## データについて

- `data/` フォルダ内の `*.json` は初期化済み（空配列や空オブジェクト）
- 履歴やユーザー情報は自動で収集されます

## 注意

- このダッシュボードはDiscourse専用です。他のフォーラムには対応していません。
- APIエンドポイントや認証が必要な場合は `config/config.json` を調整してください。

## ライセンス

MIT