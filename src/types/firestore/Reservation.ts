import { Timestamp } from 'firebase/firestore';

/**
 * 予約情報（サーバーサイド用）
 */
export type ReservationDoc = {
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

/**
 * 予約情報（クライアントサイド用 - APIレスポンス）
 */
export type Reservation = {
  id: string;                     // ドキュメントID（自動生成）
  userId: string;                 // 予約者のUID
  userName: string;               // 予約者の表示名（キャッシュ）
  date: string;                   // 予約日（YYYY-MM-DD形式）
  numberOfGuests: number;         // 利用人数
  notes: string;                  // 備考
  status: 'confirmed' | 'cancelled';  // 予約ステータス
  createdAt: any;                 // 予約作成日時（Timestamp or string）
  updatedAt: any;                 // 更新日時（Timestamp or string）
  cancelledAt: any;               // キャンセル日時（Timestamp or string or null）
}

/**
 * 予約作成時の入力データ
 */
export type CreateReservationInput = {
  userId: string;
  userName: string;
  date: string;
  numberOfGuests: number;
  notes?: string;
}

/**
 * 予約更新時の入力データ
 */
export type UpdateReservationInput = {
  date?: string;
  numberOfGuests?: number;
  notes?: string;
}
