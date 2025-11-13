import { Timestamp } from 'firebase/firestore';

/**
 * 招待情報
 */
export type Invitation = {
  id: string;                     // ドキュメントID（自動生成）
  code: string;                   // 招待コード（ユニーク）
  createdBy: string;              // 作成者のUID
  usedBy: string | null;          // 使用したユーザーのUID
  usedAt: Timestamp | null;       // 使用日時
  expiresAt: Timestamp | null;    // 有効期限（nullの場合無期限）
  createdAt: Timestamp;
}

/**
 * 招待作成時の入力データ
 */
export type CreateInvitationInput = {
  createdBy: string;
  expiresAt?: Date | null;
}
