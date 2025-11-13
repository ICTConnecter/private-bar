import { NotificationType } from '@/types/firestore/Notification';

/**
 * LINE通知メッセージを生成
 */
export function generateNotificationMessage(
  type: NotificationType,
  data?: {
    date?: string;
    numberOfGuests?: number;
    notes?: string;
  }
): string {
  switch (type) {
    case 'reservation_confirmed':
      return `【予約完了】
ご予約ありがとうございます！

予約日: ${data?.date ? formatDate(data.date) : ''}
人数: ${data?.numberOfGuests}名
${data?.notes ? `備考: ${data.notes}` : ''}

変更・キャンセルはマイページから行えます。`;

    case 'reservation_reminder':
      return `【予約リマインダー】
明日のご予約です！

予約日: ${data?.date ? formatDate(data.date) : ''}
人数: ${data?.numberOfGuests}名

お待ちしております。`;

    case 'reservation_cancelled':
      return `【予約キャンセル完了】
予約をキャンセルしました。

キャンセル日: ${data?.date ? formatDate(data.date) : ''}

またのご利用をお待ちしております。`;

    case 'reservation_updated':
      return `【予約変更完了】
予約内容を変更しました。

新しい予約日: ${data?.date ? formatDate(data.date) : ''}
人数: ${data?.numberOfGuests}名`;

    case 'invitation_approved':
      return `【承認完了】
ご利用が承認されました！

これから予約が可能になります。
マイページからご予約ください。`;

    default:
      return 'お知らせがあります。';
  }
}

/**
 * 日付フォーマット（YYYY-MM-DD → YYYY年MM月DD日）
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}

/**
 * LINE Messaging APIを使用してプッシュ通知を送信
 */
export async function sendLineNotification(
  userId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelAccessToken) {
      console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
      return { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN is not configured' };
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('LINE API error:', errorData);
      return { success: false, error: errorData.message || 'Failed to send notification' };
    }

    return { success: true };
  } catch (error) {
    console.error('Send LINE notification error:', error);
    return { success: false, error: 'Internal error' };
  }
}
