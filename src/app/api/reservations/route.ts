import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/utils/firebase/admin';
import { decodeIdToken } from '@/utils/line/decodeIdToken';
import { getUserByUid, isApprovedUser, isDateAvailable, isPastDate } from '@/utils/firebase/helpers';
import { Reservation } from '@/types/firestore/Reservation';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/reservations
 * ユーザーの予約一覧取得
 */
export async function GET(req: NextRequest) {
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

    // パラメータ取得
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as 'confirmed' | 'cancelled' | null;

    const db = getAdminDb();
    let query = db.collection('reservations')
      .where('userId', '==', userId)
      .orderBy('date', 'desc');

    if (status && (status === 'confirmed' || status === 'cancelled')) {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.get();
    const reservations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, reservations }, { status: 200 });
  } catch (error) {
    console.error('Get reservations error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reservations
 * 新規予約作成
 */
export async function POST(req: NextRequest) {
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

    // ユーザーが承認済みかチェック
    if (!(await isApprovedUser(userId))) {
      return NextResponse.json(
        { success: false, error: 'User is not approved' },
        { status: 403 }
      );
    }

    // リクエストボディ取得
    const body = await req.json();
    const { date, numberOfGuests, notes } = body;

    // バリデーション
    if (!date || !numberOfGuests) {
      return NextResponse.json(
        { success: false, error: 'Date and numberOfGuests are required' },
        { status: 400 }
      );
    }

    if (numberOfGuests < 1) {
      return NextResponse.json(
        { success: false, error: 'Number of guests must be at least 1' },
        { status: 400 }
      );
    }

    // 過去日チェック
    if (isPastDate(date)) {
      return NextResponse.json(
        { success: false, error: 'Cannot reserve past dates' },
        { status: 400 }
      );
    }

    // 日付が予約可能かチェック
    if (!(await isDateAvailable(date))) {
      return NextResponse.json(
        { success: false, error: 'Selected date is not available' },
        { status: 400 }
      );
    }

    const user = await getUserByUid(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const db = getAdminDb();
    const now = Timestamp.now();

    // 予約を作成
    const reservationData: Omit<Reservation, 'id'> = {
      userId,
      userName: user.displayName,
      date,
      numberOfGuests,
      notes: notes || '',
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
      cancelledAt: null,
    };

    const docRef = await db.collection('reservations').add(reservationData);

    // 予約枠を更新（reservedByを設定）
    const slotsSnapshot = await db.collection('reservationSlots')
      .where('date', '==', date)
      .limit(1)
      .get();

    if (!slotsSnapshot.empty) {
      await slotsSnapshot.docs[0].ref.update({
        reservedBy: userId,
        updatedAt: now,
      });
    }

    const reservation = {
      id: docRef.id,
      ...reservationData,
    };

    return NextResponse.json({ success: true, reservation }, { status: 200 });
  } catch (error) {
    console.error('Create reservation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
