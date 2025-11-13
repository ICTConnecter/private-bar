import { Timestamp } from 'firebase/firestore';

/**
 * 通知タイプ
 */
export type NotificationType =
  | 'reservation_confirmed'
  | 'reservation_reminder'
  | 'reservation_cancelled'
  | 'reservation_updated'
  | 'invitation_approved';

/**
 * 通知情報
 */
export type Notification = {
  id: string;                     // ドキュメントID（自動生成）
  userId: string;                 // 通知先ユーザーのUID
  type: NotificationType;
  reservationId: string | null;   // 関連する予約ID
  message: string;                // 送信したメッセージ内容
  sentAt: Timestamp;              // 送信日時
  status: 'sent' | 'failed';      // 送信ステータス
}

/**
 * 通知作成時の入力データ
 */
export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  reservationId?: string | null;
  message: string;
}
