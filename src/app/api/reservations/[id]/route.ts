import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/utils/firebase/admin';
import { decodeIdToken } from '@/utils/line/decodeIdToken';
import { isOwner, isDateAvailable, isPastDate } from '@/utils/firebase/helpers';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/reservations/[id]
 * 予約詳細取得
 */
export async function GET(
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

    const { id } = await params;
    const db = getAdminDb();
    const reservationDoc = await db.collection('reservations').doc(id).get();

    if (!reservationDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }

    const reservation = reservationDoc.data();

    // 自分の予約またはオーナーのみアクセス可能
    const isOwnerUser = await isOwner(userId);
    if (reservation?.userId !== userId && !isOwnerUser) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reservation: {
          id: reservationDoc.id,
          ...reservation,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get reservation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reservations/[id]
 * 予約更新
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

    const { id } = await params;
    const db = getAdminDb();
    const reservationDoc = await db.collection('reservations').doc(id).get();

    if (!reservationDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }

    const reservation = reservationDoc.data();

    // 自分の予約のみ更新可能
    if (reservation?.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // キャンセル済みの予約は更新不可
    if (reservation?.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cannot update cancelled reservation' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { date, numberOfGuests, notes } = body;

    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    // 日付を変更する場合
    if (date && date !== reservation?.date) {
      // 過去日チェック
      if (isPastDate(date)) {
        return NextResponse.json(
          { success: false, error: 'Cannot update to past date' },
          { status: 400 }
        );
      }

      // 新しい日付が予約可能かチェック
      if (!(await isDateAvailable(date))) {
        return NextResponse.json(
          { success: false, error: 'Selected date is not available' },
          { status: 400 }
        );
      }

      // 古い予約枠を解放
      const oldSlotsSnapshot = await db.collection('reservationSlots')
        .where('date', '==', reservation?.date)
        .limit(1)
        .get();

      if (!oldSlotsSnapshot.empty) {
        await oldSlotsSnapshot.docs[0].ref.update({
          reservedBy: null,
          updatedAt: Timestamp.now(),
        });
      }

      // 新しい予約枠を予約済みに
      const newSlotsSnapshot = await db.collection('reservationSlots')
        .where('date', '==', date)
        .limit(1)
        .get();

      if (!newSlotsSnapshot.empty) {
        await newSlotsSnapshot.docs[0].ref.update({
          reservedBy: userId,
          updatedAt: Timestamp.now(),
        });
      }

      updateData.date = date;
    }

    if (numberOfGuests !== undefined) {
      if (numberOfGuests < 1) {
        return NextResponse.json(
          { success: false, error: 'Number of guests must be at least 1' },
          { status: 400 }
        );
      }
      updateData.numberOfGuests = numberOfGuests;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    await reservationDoc.ref.update(updateData);

    const updatedDoc = await reservationDoc.ref.get();

    return NextResponse.json(
      {
        success: true,
        reservation: {
          id: updatedDoc.id,
          ...updatedDoc.data(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update reservation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reservations/[id]
 * 予約キャンセル
 */
export async function DELETE(
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

    const { id } = await params;
    const db = getAdminDb();
    const reservationDoc = await db.collection('reservations').doc(id).get();

    if (!reservationDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Reservation not found' },
        { status: 404 }
      );
    }

    const reservation = reservationDoc.data();

    // 自分の予約またはオーナーのみキャンセル可能
    const isOwnerUser = await isOwner(userId);
    if (reservation?.userId !== userId && !isOwnerUser) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // 既にキャンセル済み
    if (reservation?.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Reservation is already cancelled' },
        { status: 400 }
      );
    }

    const now = Timestamp.now();

    // 予約をキャンセル状態に更新
    await reservationDoc.ref.update({
      status: 'cancelled',
      cancelledAt: now,
      updatedAt: now,
    });

    // 予約枠を解放
    const slotsSnapshot = await db.collection('reservationSlots')
      .where('date', '==', reservation?.date)
      .limit(1)
      .get();

    if (!slotsSnapshot.empty) {
      await slotsSnapshot.docs[0].ref.update({
        reservedBy: null,
        updatedAt: now,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Reservation cancelled successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cancel reservation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
