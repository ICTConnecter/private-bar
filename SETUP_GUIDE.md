# 🚀 セットアップガイド

完全予約制個室居酒屋 予約サイトのセットアップ手順

---

## 📋 前提条件

以下のアカウント・ツールが必要です：

- ✅ Node.js (v18以上)
- ✅ npm または yarn
- ✅ Firebaseアカウント
- ✅ LINE Developersアカウント
- ✅ Git

---

## 🔧 1. プロジェクトのクローン

```bash
git clone <repository-url>
cd private-bar
npm install
```

---

## 🔥 2. Firebaseプロジェクトの設定

### 2.1 Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `private-bar-reservation`）
4. Google Analyticsは任意で設定
5. プロジェクトを作成

### 2.2 Firestoreデータベースの作成

1. Firebase Consoleのサイドメニューから「Firestore Database」を選択
2. 「データベースの作成」をクリック
3. 本番環境モードで開始（後でセキュリティルールを設定）
4. ロケーションを選択（例: `asia-northeast1`）

### 2.3 Firebase Admin認証情報の取得

1. Firebase Consoleで「プロジェクトの設定」（歯車アイコン）をクリック
2. 「サービスアカウント」タブを選択
3. 「新しい秘密鍵の生成」をクリック
4. JSONファイルがダウンロードされます
5. JSONファイルを開き、以下の値をメモ：
   - `client_email`
   - `private_key`

### 2.4 Firebase Web設定の取得

1. Firebase Consoleで「プロジェクトの設定」→「全般」タブ
2. 「アプリを追加」→「ウェブ」を選択
3. アプリのニックネームを入力（例: `private-bar-web`）
4. 「Firebase Hostingを設定」のチェックは**外す**（Vercelを使用するため）
5. 表示される設定情報をメモ：
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

---

## 📱 3. LINE Developersの設定

### 3.1 LINE Developersチャネルの作成

1. [LINE Developers Console](https://developers.line.biz/console/)にアクセス
2. 新規プロバイダーを作成（既存のものを使用してもOK）
3. 「Messaging APIチャネル」を作成
   - チャネル名: `完全予約制個室居酒屋`
   - チャネル説明: 適当に入力
   - 大業種・小業種: 飲食に関するものを選択

### 3.2 Messaging API設定

1. 作成したチャネルの「Messaging API設定」タブを開く
2. **チャネルアクセストークン**を発行
   - 「チャネルアクセストークン（長期）」の「発行」ボタンをクリック
   - 表示されたトークンをコピーして保存
3. **Webhook設定**
   - Webhookの利用: オフ（後で設定）
4. **応答メッセージ**
   - 応答メッセージ: オフ
   - Webhook: オン

### 3.3 チャネルシークレットの取得

1. 「チャネル基本設定」タブを開く
2. 「チャネルシークレット」をコピーして保存

### 3.4 LIFFアプリの作成

1. 「LIFF」タブを開く
2. 「追加」ボタンをクリック
3. LIFF設定：
   - **LIFFアプリ名**: `予約サイト`
   - **サイズ**: Full
   - **エンドポイントURL**: 一旦 `https://example.com` と入力（後で変更）
   - **Scope**: `profile`, `openid` を選択
   - **ボットリンク機能**: On（推奨）
4. 「作成」をクリック
5. 表示される **LIFF ID** をコピーして保存

---

## ⚙️ 4. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成：

```bash
# LIFF設定
NEXT_PUBLIC_LIFF_ID=your-liff-id-here

# Firebase クライアント設定
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK（サーバーサイド）
FIREBASE_ADMIN_CLIENT_EMAIL=your-client-email@your-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
LINE_CHANNEL_SECRET=your-channel-secret

# オーナーのLINE UID（初回ログイン後に設定）
OWNER_LINE_UID=
```

### 環境変数の値を設定

上記の手順で取得した値を各項目に入力してください。

**注意**: `FIREBASE_ADMIN_PRIVATE_KEY` は改行を `\n` に置き換えて1行にしてください。

---

## 🗄️ 5. Firestoreの設定

### 5.1 Firestoreインデックスの作成

プロジェクトルートに `firestore.indexes.json` を作成：

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "invitedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reservationSlots",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "available", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "reservations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reservations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reservations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "date", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### 5.2 Firestore Security Rulesの設定

プロジェクトルートに `firestore.rules` を作成：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ユーザー情報の取得用ヘルパー
    function getUserData(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data;
    }

    function isOwner() {
      return request.auth != null && getUserData(request.auth.uid).role == 'owner';
    }

    function isApprovedUser() {
      return request.auth != null &&
             getUserData(request.auth.uid).status == 'approved';
    }

    function isOwnerOrSelf(uid) {
      return request.auth != null &&
             (isOwner() || request.auth.uid == uid);
    }

    // users コレクション
    match /users/{uid} {
      // 自分の情報は読み取り可能、オーナーは全て読み取り可能
      allow read: if isOwnerOrSelf(uid);

      // 新規登録は認証済みユーザーのみ
      allow create: if request.auth != null && request.auth.uid == uid;

      // 更新はオーナーのみ（ステータス変更など）
      allow update: if isOwner();

      // 削除は禁止
      allow delete: if false;
    }

    // reservationSlots コレクション
    match /reservationSlots/{slotId} {
      // 承認済みユーザーは読み取り可能
      allow read: if isApprovedUser() || isOwner();

      // 作成・更新・削除はオーナーのみ
      allow create, update, delete: if isOwner();
    }

    // reservations コレクション
    match /reservations/{reservationId} {
      // 自分の予約は読み取り可能、オーナーは全て読み取り可能
      allow read: if isOwner() ||
                     (isApprovedUser() && resource.data.userId == request.auth.uid);

      // 作成は承認済みユーザーのみ
      allow create: if isApprovedUser() &&
                       request.resource.data.userId == request.auth.uid;

      // 更新は予約者本人のみ
      allow update: if isApprovedUser() &&
                       resource.data.userId == request.auth.uid;

      // 削除はオーナーのみ（緊急時）
      allow delete: if isOwner();
    }

    // invitations コレクション
    match /invitations/{invitationId} {
      // 全員読み取り可能（招待コード検証のため）
      allow read: if true;

      // 作成はオーナーまたは承認済みユーザー
      allow create: if isOwner() || isApprovedUser();

      // 更新・削除はオーナーのみ
      allow update, delete: if isOwner();
    }

    // notifications コレクション
    match /notifications/{notificationId} {
      // 自分宛の通知は読み取り可能
      allow read: if request.auth != null &&
                     resource.data.userId == request.auth.uid;

      // 作成・更新・削除はサーバー側のみ（APIから実行）
      allow create, update, delete: if false;
    }
  }
}
```

### 5.3 Firebase CLIのインストールとデプロイ

```bash
# Firebase CLIをグローバルインストール
npm install -g firebase-tools

# Firebaseにログイン
firebase login

# Firebaseプロジェクトの初期化
firebase init

# 選択項目:
# - Firestore: Rules and indexes
# ※ Hostingは選択しない（Vercelを使用）
#
# 既存のFirebaseプロジェクトを選択
# firestore.rules, firestore.indexes.jsonを既存のものを使用

# インデックスとセキュリティルールをデプロイ
firebase deploy --only firestore
```

---

## 👤 6. オーナーアカウントの設定

### 6.1 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開く

### 6.2 LINE UIDの取得

1. LINE DevelopersコンソールでLIFFアプリの設定を開く
2. エンドポイントURLを `http://localhost:3000` に変更（開発用）
3. LINEアプリでLIFFアプリを開く
   - LINE Developers ConsoleのLIFFタブから「QRコードを表示」
   - スマートフォンのLINEアプリでQRコードを読み取る
4. 初回ログイン時、コンソールまたはFirestoreで自分のLINE UIDを確認
5. `.env.local` の `OWNER_LINE_UID` にそのUIDを設定

```bash
OWNER_LINE_UID=U1234567890abcdef1234567890abcdef
```

### 6.3 サーバーの再起動

```bash
# Ctrl+C で開発サーバーを停止
npm run dev
```

再度ログインすると、オーナー権限が付与されます。

---

## 🏗️ 7. 本番環境へのデプロイ（Vercel）

### 7.1 Vercel CLIでデプロイ

```bash
# Vercel CLIをグローバルインストール（任意）
npm install -g vercel

# Vercelにログイン
vercel login

# デプロイ
vercel
```

### 7.2 Vercel Dashboard からデプロイ（推奨）

1. [Vercel](https://vercel.com/) にログイン
2. 「New Project」をクリック
3. GitHubリポジトリをインポート
4. 「Deploy」をクリック

### 7.3 環境変数の設定

Vercel Dashboard で環境変数を設定:

1. プロジェクトを選択
2. 「Settings」→「Environment Variables」
3. 以下の環境変数を追加:

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_LIFF_ID` | LIFF ID |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Firebase Admin Client Email |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Firebase Admin Private Key |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Channel Access Token |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret |
| `OWNER_LINE_UID` | オーナーのLINE UID |

**注意**: `FIREBASE_ADMIN_PRIVATE_KEY` は改行を含むため、Vercelでは自動的に処理されます。

### 7.4 LIFFエンドポイントURLの更新

1. デプロイ完了後に表示されるVercel URLをコピー
   - 例: `https://your-project.vercel.app`
2. LINE Developers ConsoleでLIFFアプリの設定を開く
3. エンドポイントURLを本番URLに変更
4. 保存

### 7.5 カスタムドメインの設定（任意）

1. Vercel Dashboard → プロジェクト → 「Settings」→「Domains」
2. カスタムドメインを追加
3. DNSレコードを設定
4. LINE DevelopersでLIFFエンドポイントURLをカスタムドメインに更新

---

## ✅ 8. 動作確認

### 8.1 基本機能のテスト

- [ ] LINEログインができる
- [ ] オーナーとしてログインできる
- [ ] 管理画面にアクセスできる
- [ ] 予約枠を設定できる
- [ ] 招待URLを生成できる
- [ ] 招待URLから新規ユーザーを登録できる
- [ ] 新規ユーザーを承認できる
- [ ] 承認されたユーザーが予約できる
- [ ] 予約の変更・キャンセルができる

### 8.2 LINE通知のテスト

1. 予約作成時に通知が届くか確認
2. 予約変更時に通知が届くか確認
3. 予約キャンセル時に通知が届くか確認
4. ユーザー承認時に通知が届くか確認

---

## 🔧 9. トラブルシューティング

### Firebase Admin認証エラー

```
Error: Firebase Admin credentials are not set
```

**解決方法**:
- `.env.local` ファイルが正しい場所にあるか確認
- `FIREBASE_ADMIN_CLIENT_EMAIL` と `FIREBASE_ADMIN_PRIVATE_KEY` が正しく設定されているか確認
- `FIREBASE_ADMIN_PRIVATE_KEY` の改行が `\n` になっているか確認
- サーバーを再起動

### LINE通知が送信されない

**原因**: チャネルアクセストークンが無効または未設定

**解決方法**:
1. LINE Developers Consoleで正しいトークンを取得
2. `.env.local` の `LINE_CHANNEL_ACCESS_TOKEN` を更新
3. サーバーを再起動

### Firestoreの権限エラー

```
Missing or insufficient permissions
```

**解決方法**:
```bash
firebase deploy --only firestore:rules
```

### LIFFアプリが開けない

**原因**: エンドポイントURLが正しくない

**解決方法**:
1. LINE Developers ConsoleでLIFFアプリの設定を確認
2. エンドポイントURLが正しいか確認（http vs https、末尾のスラッシュなど）
3. 開発環境では `http://localhost:3000`、本番では `https://your-domain.com`

### 予約が作成できない

**原因**: 予約枠が設定されていない

**解決方法**:
1. オーナーでログイン
2. 管理画面 → 予約枠設定
3. カレンダーで予約可能日を設定

---

## 📚 10. 次のステップ

### 10.1 Cloud Functionsで自動リマインダー

予約日前日に自動でLINE通知を送信する機能を実装する場合：

1. Cloud Functionsをセットアップ
2. Cloud Schedulerで毎日20時に実行
3. 翌日の予約を取得してLINE通知

参考: [Firebase Cloud Functions](https://firebase.google.com/docs/functions)

### 10.2 カスタマイズ

- デザインのカスタマイズ（色、フォント）
- 店舗情報の変更
- 通知メッセージのカスタマイズ
- 予約可能日の自動設定ルール

### 10.3 監視とメンテナンス

- Firebase Consoleでエラーログを確認
- Firestoreの使用量を監視
- LINE Messaging APIの使用量を確認

---

## 🆘 サポート

問題が発生した場合：

1. [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) を確認
2. [README.md](./README.md) の仕様を確認
3. Firebaseコンソールのログを確認
4. ブラウザのコンソールでエラーを確認

---

**最終更新日**: 2025-12-14

セットアップが完了したら、まず開発環境で動作確認を行ってから本番環境にデプロイしてください。
