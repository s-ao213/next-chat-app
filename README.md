# 💬 RealChat

RealChatは、リアルタイムコミュニケーションを実現するモダンなチャットアプリケーションです。Supabaseを活用した認証システムと、直感的なユーザーインターフェースを提供します。

公開URL：https://next-chat-app-rouge.vercel.app

## 🌟 開発の背景

ビジネスやプライベートでのコミュニケーションツールとして、以下の課題を解決することを目指しました。

- セキュリティを確保しながら、簡単にグループチャットを作成したい
- シンプルで使いやすいUIでありながら、最低限の機能は備えていてほしい
- リアルタイムな更新で、スムーズなコミュニケーションを実現したい

## 🔥 特徴と機能

### 1. 📱 シンプルで直感的なUI

![PCのチャット画面](/public/img/chat-PC.png)
![スマホのチャット画面](/public/img/chat-mobile.png>)

- モダンなデザインとレスポンシブ対応
- メッセージの送信状態をリアルタイムで表示
- チャットルームのメンバーを確認できる
- チャットルームごとにメッセージ数の制限(30メッセージを超えると自動的にデータベースから削除される)

### 2. 🔐 認証・招待システム

- Supabaseによる安全な認証基盤
- 招待リンクによる簡単なルーム参加
- ユーザーごとの参加ルーム数制限（最大5ルーム）

### 3. 🚀 リアルタイム機能

- メッセージのリアルタイム配信

### 4. 👥 グループ管理機能

![PCのホーム画面](/public/img/home-pc.png)
![新規作成](/public/img/new-chatroom.png)

- チャットルームの作成・編集・削除
- メンバー管理（招待・退出）
- ルームアイコンのカスタマイズ
- メッセージの暗号化保存

## 🛠️ 使用技術

### フロントエンド

- ⚛️ Next.js 15
- 📘 TypeScript
- 🎨 Tailwind CSS
- 🎯 Shadcn/ui
- 📝 React Hook Form
- 🔄 Supabase Realtime

### バックエンド

- 🔥 Supabase
  - 🔑 Authentication
  - 🗄️ PostgreSQL
  - 📦 Storage
  - 🔄 Realtime Subscriptions

### インフラ・開発環境

- ☁️ Vercel (ホスティング)
- 🔧 Git/GitHub
- 💻 VSCode
- 🧹 ESLint/Prettier

### システム構成図

```mermaid
graph TB
    Client[クライアント] -->|Next.js| Frontend[フロントエンド]
    Frontend -->|Realtime| Supabase[Supabase]
    Frontend -->|REST API| Supabase
    Supabase -->|Auth| Auth[認証]
    Supabase -->|Data| DB[(PostgreSQL)]
    Supabase -->|Storage| Storage[ファイルストレージ]
```

## 👨‍💻 開発情報

- 👤 開発体制：個人開発
- ⏰ 開発期間：2024年12月〜2025年2月 (約150時間)

## 💡 工夫した点

### 1. パフォーマンス最適化

- メッセージのページング実装
- リアルタイム更新の効率化
- ログイン機能の実装

### 2. セキュリティ対策

- メッセージの暗号化保存
- ファイルアップロードの制限と検証
- 適切なアクセス制御

### 3. ユーザビリティ

- スクロール位置の保持
- トースト通知による分かりやすいフィードバック

## 🔜 今後の展望

### 機能拡張

- 📎 ファイル添付機能
- 📨 新着メッセージ確認
- 🔍 メッセージ検索機能
- 👥 グループ管理機能の拡充
- 🌐 多言語対応

### 改善計画

- パフォーマンスの更なる最適化
- モバイルアプリ版の開発
- E2Eテストの追加

## 📞 連絡先

作者に連絡する場合は以下までお願いします：

- 📧 Email: 19850409aoi@gmail.com
- 🌐 Portfolio: https://s-ao213.github.io/portfolio
- 💼 GitHub: https://github.com/s-ao213
