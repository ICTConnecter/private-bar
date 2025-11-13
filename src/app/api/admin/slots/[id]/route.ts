import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/utils/firebase/admin';
import { decodeIdToken } from '@/utils/line/decodeIdToken';
import { isOwner } from '@/utils/firebase/helpers';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * PUT /api/admin/slots/[id]
 * 予約枠更新（オーナー専用）
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    const accessToken = authHeader?.split(':')[1];

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }

    const decodedToken = await decodeIdToken(accessToken);
    const userId = decodedToken.sub;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // オーナー権限チェック
    if (!(await isOwner(userId))) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Owner only.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const db = getAdminDb();
    const slotDoc = await db.collection('reservationSlots').doc(id).get();

    if (!slotDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Slot not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { available } = body;

    if (typeof available !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Available must be a boolean' },
        { status: 400 }
      );
    }

    const slotData = slotDoc.data();

    // 予約済みの場合は無効化できない
    if (slotData?.reservedBy && !available) {
      return NextResponse.json(
        { success: false, error: 'Cannot disable a slot that is already reserved' },
        { status: 400 }
      );
    }

    await slotDoc.ref.update({
      available,
      updatedAt: Timestamp.now(),
    });

    const updatedDoc = await slotDoc.ref.get();

    return NextResponse.json(
      {
        success: true,
        slot: {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update slot error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
