import { Timestamp } from 'firebase/firestore';

/**
 * ユーザー情報
 */
export type User = {
  uid: string;                    // LINEユーザーID（ドキュメントID）
  displayName: string;            // LINE表示名
  pictureUrl: string;             // LINEプロフィール画像URL
  role: 'owner' | 'user';         // ユーザーロール
  status: 'pending' | 'approved' | 'blocked';  // ユーザーステータス
  invitedBy: string | null;       // 招待者のUID（オーナー招待の場合null）
  invitedAt: any;                 // 招待日時（Timestamp or string）
  approvedAt: any;                // 承認日時（Timestamp or string or null）
  createdAt: any;                 // 作成日時（Timestamp or string）
  updatedAt: any;                 // 更新日時（Timestamp or string）
}

/**
 * ユーザー作成時の入力データ
 */
export type CreateUserInput = {
  uid: string;
  displayName: string;
  pictureUrl: string;
  role?: 'owner' | 'user';
  invitedBy?: string | null;
}

/**
 * ユーザー更新時の入力データ
 */
export type UpdateUserInput = {
  status?: 'pending' | 'approved' | 'blocked';
  displayName?: string;
  pictureUrl?: string;
}
