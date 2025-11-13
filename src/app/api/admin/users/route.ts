import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/utils/firebase/admin';
import { decodeIdToken } from '@/utils/line/decodeIdToken';
import { isOwner } from '@/utils/firebase/helpers';

/**
 * GET /api/admin/users
 * ユーザー一覧取得（オーナー専用）
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
    const status = searchParams.get('status');

    const db = getAdminDb();
    let query = db.collection('users');

    if (status && status !== 'all') {
      query = query.where('status', '==', status) as any;
    }

    const snapshot = await query.orderBy('invitedAt', 'desc').get();
    const users = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, users }, { status: 200 });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
