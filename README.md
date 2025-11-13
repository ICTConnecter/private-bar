# 完全予約制個室居酒屋 予約サイト 仕様書

## 📋 プロジェクト概要

完全予約制の個室居酒屋向けLINE予約システム。招待制により限定的なユーザーのみが予約可能で、1日1組限定の完全貸切スタイルを実現します。

### 技術スタック

- **フロントエンド**: Next.js (App Router)
- **プラットフォーム**: LINE Front-end Framework (LIFF)
- **認証**: LINE Login
- **データベース**: Cloud Firestore
- **ホスティング**: Firebase Hosting
- **通知**: LINE Messaging API

---

## 🎯 主要機能

### オーナー機能
- 予約枠の設定・管理（日単位）
- ユーザーの招待・承認
- ユーザーのブロック
- 予約一覧の確認・管理

### ユーザー機能
- 予約の作成（日付・人数指定）
- 予約の変更・キャンセル
- 自分の予約一覧確認
- 友人の招待リクエスト

### 通知機能（LINE）
- 予約完了通知
- 予約リマインダー（予約日前日）
- 招待承認通知
- 予約変更・キャンセル通知

---

## 👥 ユーザーロール

| ロール | 説明 | 権限 |
|--------|------|------|
| **オーナー** | 店舗管理者（単一） | 全ての管理機能にアクセス可能 |
| **一般ユーザー** | 招待されたユーザー | 予約・閲覧機能のみ |
| **ブロックユーザー** | アクセス禁止 | サイトへのアクセス不可 |
| **申請中ユーザー** | 招待待ち | 閲覧のみ（予約不可） |

---

## 🏗️ システムアーキテクチャ

```
┌─────────────┐
│ LINE App    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  LIFF Application   │
│  (Next.js)          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Firebase Hosting   │
└──────┬──────────────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────┐   ┌──────────────┐
│Firestore │   │LINE Messaging│
│          │   │API (通知)    │
└──────────┘   └──────────────┘
```

---

## 📱 画面構成

### 1. ユーザー画面

#### 1-1. ホーム画面 (`/`)
- **表示内容**:
  - 店舗情報（店名、説明、画像）
  - 次回予約情報（ある場合）
  - クイックアクション（新規予約、予約一覧）
- **権限**: 承認済みユーザーのみ
- **未承認ユーザー**: 申請中メッセージ表示

#### 1-2. 予約作成画面 (`/reservations/new`)
- **入力項目**:
  - 予約日（カレンダー選択）
  - 利用人数（数値入力）
  - 備考（テキストエリア、任意）
- **表示内容**:
  - 予約可能日のみ選択可能
  - 予約済みの日はグレーアウト
- **バリデーション**:
  - 過去日選択不可
  - 既に予約済みの日は選択不可
  - 人数は1名以上
- **権限**: 承認済みユーザーのみ

#### 1-3. 予約一覧画面 (`/reservations`)
- **表示内容**:
  - 自分の予約一覧（予約日順）
  - 各予約の詳細（日付、人数、ステータス）
  - 各予約へのアクション（詳細、変更、キャンセル）
- **ステータス表示**:
  - `予約確定`
  - `キャンセル済み`
- **権限**: 承認済みユーザーのみ

#### 1-4. 予約詳細・編集画面 (`/reservations/[id]`)
- **表示内容**:
  - 予約詳細情報
  - 予約日、人数、備考
  - 予約日時
- **アクション**:
  - 編集ボタン → 予約変更画面へ
  - キャンセルボタン → 確認ダイアログ表示
- **権限**: 予約者本人のみ

#### 1-5. 予約編集画面 (`/reservations/[id]/edit`)
- **入力項目**: 予約作成と同様
- **制限**: 予約日の前日まで変更可能
- **権限**: 予約者本人のみ

#### 1-6. 友人招待画面 (`/invite`)
- **機能**:
  - 招待用URLの生成・共有
  - またはLINE友達に直接招待送信
- **説明**:
  - 招待した友人はオーナー承認が必要
  - 承認後に予約可能になる旨を表示
- **権限**: 承認済みユーザーのみ

---

### 2. オーナー管理画面

#### 2-1. オーナーダッシュボード (`/admin`)
- **表示内容**:
  - 今月の予約件数
  - 申請中のユーザー数（バッジ表示）
  - クイックアクション（予約枠設定、ユーザー管理）
  - 直近の予約一覧
- **権限**: オーナーのみ

#### 2-2. 予約枠設定画面 (`/admin/slots`)
- **表示内容**:
  - カレンダービュー（月表示）
  - 各日の予約状況（空き/予約済み）
- **機能**:
  - 予約可能日の一括設定（範囲選択）
  - 予約不可日の設定（定休日など）
  - 個別日の予約可否切り替え
- **権限**: オーナーのみ

#### 2-3. 予約管理画面 (`/admin/reservations`)
- **表示内容**:
  - 全予約一覧（日付順）
  - フィルター（期間、ステータス）
  - 各予約の詳細情報（ユーザー名、人数、日付、備考）
- **アクション**:
  - 予約詳細確認
  - 予約キャンセル（緊急時）
- **権限**: オーナーのみ

#### 2-4. ユーザー管理画面 (`/admin/users`)
- **タブ構成**:
  - **承認済みユーザー**: 現在アクティブなユーザー一覧
  - **申請中**: 招待承認待ちユーザー一覧（要アクション）
  - **ブロック済み**: ブロックしたユーザー一覧
- **各ユーザー情報**:
  - LINE表示名
  - 招待日時
  - 予約回数
- **アクション**:
  - 承認（申請中 → 承認済み）
  - 却下/ブロック（申請中 → ブロック済み）
  - ブロック（承認済み → ブロック済み）
  - ブロック解除（ブロック済み → 承認済み）
- **権限**: オーナーのみ

#### 2-5. ユーザー招待画面 (`/admin/invite`)
- **機能**:
  - 招待用URLの生成
  - 招待コードの発行（オプション）
- **表示内容**:
  - 生成した招待URLのリスト
  - 各URLの使用状況
- **権限**: オーナーのみ

---

## 🗄️ データベース設計（Firestore）

### Collections

#### `users`
ユーザー情報を管理

```typescript
{
  uid: string;                    // LINEユーザーID（ドキュメントID）
  displayName: string;            // LINE表示名
  pictureUrl: string;             // LINEプロフィール画像URL
  role: 'owner' | 'user';         // ユーザーロール
  status: 'pending' | 'approved' | 'blocked';  // ユーザーステータス
  invitedBy: string | null;       // 招待者のUID（オーナー招待の場合null）
  invitedAt: Timestamp;           // 招待日時
  approvedAt: Timestamp | null;   // 承認日時
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**インデックス**:
- `status` (ASC), `invitedAt` (DESC)
- `role` (ASC)

---

#### `reservationSlots`
予約可能日を管理

```typescript
{
  id: string;                     // ドキュメントID（自動生成）
  date: string;                   // 予約日（YYYY-MM-DD形式）
  available: boolean;             // 予約可能かどうか
  reservedBy: string | null;      // 予約者のUID（予約済みの場合）
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**インデックス**:
- `date` (ASC), `available` (ASC)

---

#### `reservations`
予約情報を管理

```typescript
{
  id: string;                     // ドキュメントID（自動生成）
  userId: string;                 // 予約者のUID
  userName: string;               // 予約者の表示名（キャッシュ）
  date: string;                   // 予約日（YYYY-MM-DD形式）
  numberOfGuests: number;         // 利用人数
  notes: string;                  // 備考
  status: 'confirmed' | 'cancelled';  // 予約ステータス
  createdAt: Timestamp;           // 予約作成日時
  updatedAt: Timestamp;           // 更新日時
  cancelledAt: Timestamp | null;  // キャンセル日時
}
```

**インデックス**:
- `userId` (ASC), `date` (DESC)
- `date` (ASC), `status` (ASC)
- `status` (ASC), `date` (DESC)

---

#### `invitations`
招待リンク・履歴を管理

```typescript
{
  id: string;                     // ドキュメントID（自動生成）
  code: string;                   // 招待コード（ユニーク）
  createdBy: string;              // 作成者のUID
  usedBy: string | null;          // 使用したユーザーのUID
  usedAt: Timestamp | null;       // 使用日時
  expiresAt: Timestamp | null;    // 有効期限（nullの場合無期限）
  createdAt: Timestamp;
}
```

**インデックス**:
- `code` (ASC)
- `createdBy` (ASC), `createdAt` (DESC)

---

#### `notifications`
送信した通知履歴を管理

```typescript
{
  id: string;                     // ドキュメントID（自動生成）
  userId: string;                 // 通知先ユーザーのUID
  type: 'reservation_confirmed' | 'reservation_reminder' |
        'reservation_cancelled' | 'invitation_approved';
  reservationId: string | null;   // 関連する予約ID
  message: string;                // 送信したメッセージ内容
  sentAt: Timestamp;              // 送信日時
  status: 'sent' | 'failed';      // 送信ステータス
}
```

**インデックス**:
- `userId` (ASC), `sentAt` (DESC)
- `reservationId` (ASC)

---

## 🔌 API設計

### Next.js App Router API Routes

#### 認証・ユーザー管理

##### `POST /api/auth/login`
LIFF認証後のユーザー情報登録・ログイン

**Request Body**:
```typescript
{
  accessToken: string;  // LIFFアクセストークン
}
```

**Response**:
```typescript
{
  success: boolean;
  user: {
    uid: string;
    displayName: string;
    pictureUrl: string;
    role: 'owner' | 'user';
    status: 'pending' | 'approved' | 'blocked';
  }
}
```

---

##### `POST /api/auth/register`
招待コードを使用したユーザー登録

**Request Body**:
```typescript
{
  accessToken: string;  // LIFFアクセストークン
  invitationCode?: string;  // 招待コード（任意）
}
```

**Response**:
```typescript
{
  success: boolean;
  user: User;
  message: string;  // "承認待ちです" など
}
```

---

#### 予約管理

##### `GET /api/reservations`
ユーザーの予約一覧取得

**Query Parameters**:
```typescript
{
  userId: string;
  status?: 'confirmed' | 'cancelled' | 'all';
}
```

**Response**:
```typescript
{
  success: boolean;
  reservations: Reservation[];
}
```

---

##### `GET /api/reservations/[id]`
予約詳細取得

**Response**:
```typescript
{
  success: boolean;
  reservation: Reservation;
}
```

---

##### `POST /api/reservations`
新規予約作成

**Request Body**:
```typescript
{
  userId: string;
  date: string;          // YYYY-MM-DD
  numberOfGuests: number;
  notes?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  reservation: Reservation;
}
```

**エラーケース**:
- 選択日が既に予約済み
- 過去日の選択
- ユーザーが未承認

---

##### `PUT /api/reservations/[id]`
予約更新

**Request Body**:
```typescript
{
  date?: string;
  numberOfGuests?: number;
  notes?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  reservation: Reservation;
}
```

---

##### `DELETE /api/reservations/[id]`
予約キャンセル

**Response**:
```typescript
{
  success: boolean;
  message: string;
}
```

---

#### 予約枠管理（オーナー専用）

##### `GET /api/admin/slots`
予約枠一覧取得

**Query Parameters**:
```typescript
{
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}
```

**Response**:
```typescript
{
  success: boolean;
  slots: ReservationSlot[];
}
```

---

##### `POST /api/admin/slots`
予約枠一括作成

**Request Body**:
```typescript
{
  dates: string[];     // ["2025-11-10", "2025-11-11", ...]
  available: boolean;
}
```

**Response**:
```typescript
{
  success: boolean;
  createdCount: number;
}
```

---

##### `PUT /api/admin/slots/[id]`
予約枠更新

**Request Body**:
```typescript
{
  available: boolean;
}
```

**Response**:
```typescript
{
  success: boolean;
  slot: ReservationSlot;
}
```

---

#### ユーザー管理（オーナー専用）

##### `GET /api/admin/users`
ユーザー一覧取得

**Query Parameters**:
```typescript
{
  status?: 'pending' | 'approved' | 'blocked' | 'all';
}
```

**Response**:
```typescript
{
  success: boolean;
  users: User[];
}
```

---

##### `PUT /api/admin/users/[uid]`
ユーザーステータス更新

**Request Body**:
```typescript
{
  status: 'approved' | 'blocked';
}
```

**Response**:
```typescript
{
  success: boolean;
  user: User;
}
```

---

#### 招待管理

##### `POST /api/invitations`
招待コード生成

**Request Body**:
```typescript
{
  createdBy: string;
  expiresAt?: string;  // ISO 8601形式（任意）
}
```

**Response**:
```typescript
{
  success: boolean;
  invitation: {
    code: string;
    url: string;  // 招待用フルURL
  }
}
```

---

##### `GET /api/invitations/[code]`
招待コード検証

**Response**:
```typescript
{
  success: boolean;
  valid: boolean;
  invitation?: Invitation;
}
```

---

#### 通知

##### `POST /api/notifications/send`
LINE通知送信（内部使用）

**Request Body**:
```typescript
{
  userId: string;
  type: 'reservation_confirmed' | 'reservation_reminder' |
        'reservation_cancelled' | 'invitation_approved';
  reservationId?: string;
  customMessage?: string;
}
```

**Response**:
```typescript
{
  success: boolean;
  notificationId: string;
}
```

---

## 🔔 LINE通知設計

### 通知タイミングと内容

#### 1. 予約完了通知
**トリガー**: 予約作成時
**送信先**: 予約者
**内容**:
```
【予約完了】
ご予約ありがとうございます！

予約日: 2025年11月15日
人数: 4名
備考: {備考内容}

変更・キャンセルはマイページから行えます。
```

---

#### 2. 予約リマインダー
**トリガー**: 予約日の前日 20:00（Cloud Functions/Cloud Scheduler使用）
**送信先**: 予約者
**内容**:
```
【予約リマインダー】
明日のご予約です！

予約日: 2025年11月15日
人数: 4名

お待ちしております。
```

---

#### 3. 予約変更通知
**トリガー**: 予約更新時
**送信先**: 予約者
**内容**:
```
【予約変更完了】
予約内容を変更しました。

新しい予約日: 2025年11月20日
人数: 5名
```

---

#### 4. 予約キャンセル通知
**トリガー**: 予約キャンセル時
**送信先**: 予約者
**内容**:
```
【予約キャンセル完了】
予約をキャンセルしました。

キャンセル日: 2025年11月15日

またのご利用をお待ちしております。
```

---

#### 5. 招待承認通知
**トリガー**: オーナーがユーザーを承認時
**送信先**: 承認されたユーザー
**内容**:
```
【承認完了】
ご利用が承認されました！

これから予約が可能になります。
マイページからご予約ください。
```

---

## 🔐 セキュリティとアクセス制御

### Firebase Security Rules (Firestore)

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

---

## 🎨 UI/UX設計指針

### デザイン原則
1. **シンプル＆クリーン**: 高級感のあるミニマルデザイン
2. **モバイルファースト**: LINEアプリ内で快適に操作可能
3. **直感的な操作**: タップ数を最小限に
4. **適切なフィードバック**: ローディング、成功/エラー表示

### カラースキーム（案）
```css
--primary: #1DB954;      /* アクセントカラー */
--secondary: #2C2C2C;    /* ダークグレー */
--background: #FFFFFF;   /* ホワイト */
--text-primary: #1A1A1A; /* ダークテキスト */
--text-secondary: #6B6B6B; /* グレーテキスト */
--error: #E63946;        /* エラーレッド */
--success: #06D6A0;      /* 成功グリーン */
```

### コンポーネント設計
- **ボタン**: Primary / Secondary / Outline / Danger
- **カード**: 予約カード、ユーザーカード
- **カレンダー**: 日付選択用（予約済み日はグレーアウト）
- **モーダル**: 確認ダイアログ、詳細表示
- **トースト通知**: 成功/エラーメッセージ表示

---

## 🚀 デプロイ手順

### 1. 環境変数設定

`.env.local` ファイルを作成:
```env
# LIFF
NEXT_PUBLIC_LIFF_ID=your-liff-id

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin (サーバーサイド)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=your-client-email
FIREBASE_ADMIN_PRIVATE_KEY=your-private-key

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
LINE_CHANNEL_SECRET=your-channel-secret

# オーナーLINE UID（初期設定）
OWNER_LINE_UID=your-owner-line-uid
```

---

### 2. Firebase初期設定

```bash
# Firebase CLIインストール
npm install -g firebase-tools

# Firebaseログイン
firebase login

# Firebaseプロジェクト初期化
firebase init

# 選択項目:
# - Firestore
# - Hosting
# - Functions（Cloud Functionsを使う場合）
```

---

### 3. Firestoreインデックス作成

`firestore.indexes.json`:
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
    }
  ]
}
```

インデックスをデプロイ:
```bash
firebase deploy --only firestore:indexes
```

---

### 4. Next.jsビルド＆デプロイ

```bash
# 依存関係インストール
npm install

# ビルド
npm run build

# Firebase Hostingにデプロイ
firebase deploy --only hosting
```

---

### 5. LIFFアプリ設定

LINE Developers Consoleで:
1. LIFFアプリを作成
2. エンドポイントURLにFirebase HostingのURLを設定
3. スコープ設定: `profile`, `openid`
4. LIFF IDを `.env.local` に設定

---

## 📊 今後の拡張案

### フェーズ2（オプション機能）
- [ ] 複数店舗対応
- [ ] 時間帯別予約（1日複数組対応）
- [ ] レビュー・評価機能
- [ ] クーポン・ポイントシステム
- [ ] 予約履歴統計（オーナー向け）
- [ ] メニュー事前注文機能
- [ ] 多言語対応

### フェーズ3（高度な機能）
- [ ] LINE Payでの事前決済
- [ ] 自動リマインダー設定（カスタマイズ可能）
- [ ] AIによる予約傾向分析
- [ ] 顧客セグメント管理

---

## 📝 開発ロードマップ

### マイルストーン1: 基本機能実装（Week 1-2）
- [ ] Next.jsプロジェクトセットアップ
- [ ] Firebase設定
- [ ] LIFF認証実装
- [ ] ユーザー登録・ログイン機能
- [ ] 基本的なルーティング

### マイルストーン2: 予約機能実装（Week 3-4）
- [ ] 予約作成機能
- [ ] 予約一覧表示
- [ ] 予約変更・キャンセル機能
- [ ] カレンダーUIコンポーネント

### マイルストーン3: オーナー機能実装（Week 5-6）
- [ ] オーナーダッシュボード
- [ ] 予約枠設定機能
- [ ] ユーザー管理機能
- [ ] 招待機能

### マイルストーン4: 通知機能実装（Week 7）
- [ ] LINE Messaging API統合
- [ ] 予約完了通知
- [ ] リマインダー機能（Cloud Scheduler設定）

### マイルストーン5: テスト＆デプロイ（Week 8）
- [ ] 単体テスト作成
- [ ] E2Eテスト
- [ ] 本番環境デプロイ
- [ ] ドキュメント整備

---

## 🧪 テスト戦略

### 単体テスト
- API Routes（Jest）
- ユーティリティ関数
- カスタムフック

### 統合テスト
- Firestore操作
- LINE API連携

### E2Eテスト（Playwright）
- ユーザー予約フロー
- オーナー管理フロー
- 招待フロー

---

## 📚 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [LIFF Documentation](https://developers.line.biz/ja/docs/liff/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## 📞 サポート

質問や問題が発生した場合は、開発チームまでお問い合わせください。

---

**最終更新日**: 2025-11-09
**バージョン**: 1.0.0
