import { Timestamp } from 'firebase/firestore';

/**
 * 予約可能日
 */
export type ReservationSlot = {
  id: string;                     // ドキュメントID（自動生成）
  date: string;                   // 予約日（YYYY-MM-DD形式）
  available: boolean;             // 予約可能かどうか
  reservedBy: string | null;      // 予約者のUID（予約済みの場合）
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * 予約枠作成時の入力データ
 */
export type CreateReservationSlotInput = {
  date: string;
  available: boolean;
}

/**
 * 予約枠更新時の入力データ
 */
export type UpdateReservationSlotInput = {
  available?: boolean;
  reservedBy?: string | null;
}
