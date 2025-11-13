import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/utils/firebase/admin';
import { sendLineNotification, generateNotificationMessage } from '@/utils/line/sendNotification';
import { NotificationType } from '@/types/firestore/Notification';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/notifications/send
 * LINE通知送信（内部使用）
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, type, reservationId, customMessage, reservationData } = body;

    if (!userId || !type) {
      return NextResponse.json(
        { success: false, error: 'userId and type are required' },
        { status: 400 }
      );
    }

    // メッセージ生成
    const message = customMessage || generateNotificationMessage(type as NotificationType, reservationData);

    // LINE通知送信
    const sendResult = await sendLineNotification(userId, message);

    const db = getAdminDb();
    const now = Timestamp.now();

    // 通知履歴を保存
    const notificationData = {
      userId,
      type,
      reservationId: reservationId || null,
      message,
      sentAt: now,
      status: sendResult.success ? 'sent' : 'failed',
    };

    const docRef = await db.collection('notifications').add(notificationData);

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: sendResult.error,
          notificationId: docRef.id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        notificationId: docRef.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
