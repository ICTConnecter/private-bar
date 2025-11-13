import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/utils/firebase/admin';
import { decodeIdToken } from '@/utils/line/decodeIdToken';
import { isOwner } from '@/utils/firebase/helpers';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * GET /api/admin/slots
 * 予約枠一覧取得（オーナー専用）
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

    // オーナー権限チェック
    if (!(await isOwner(userId))) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Owner only.' },
        { status: 403 }
      );
    }

    // クエリパラメータ取得
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const db = getAdminDb();
    let query = db.collection('reservationSlots').orderBy('date', 'asc');

    if (startDate) {
      query = query.where('date', '>=', startDate) as any;
    }
    if (endDate) {
      query = query.where('date', '<=', endDate) as any;
    }

    const snapshot = await query.get();
    const slots = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, slots }, { status: 200 });
  } catch (error) {
    console.error('Get slots error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/slots
 * 予約枠一括作成（オーナー専用）
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

    // オーナー権限チェック
    if (!(await isOwner(userId))) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Owner only.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { dates, available } = body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dates array is required' },
        { status: 400 }
      );
    }

    if (typeof available !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Available must be a boolean' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const now = Timestamp.now();
    let createdCount = 0;

    // バッチ処理で複数の日付を追加
    const batch = db.batch();

    for (const date of dates) {
      // 既存のスロットをチェック
      const existingSlots = await db.collection('reservationSlots')
        .where('date', '==', date)
        .limit(1)
        .get();

      if (existingSlots.empty) {
        // 存在しない場合のみ追加
        const newSlotRef = db.collection('reservationSlots').doc();
        batch.set(newSlotRef, {
          date,
          available,
          reservedBy: null,
          createdAt: now,
          updatedAt: now,
        });
        createdCount++;
      } else {
        // 既存のスロットを更新
        batch.update(existingSlots.docs[0].ref, {
          available,
          updatedAt: now,
        });
      }
    }

    await batch.commit();

    return NextResponse.json(
      {
        success: true,
        createdCount,
        message: `${createdCount} slots created/updated`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Create slots error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
