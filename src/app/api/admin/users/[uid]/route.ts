import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/utils/firebase/admin';
import { decodeIdToken } from '@/utils/line/decodeIdToken';
import { isOwner } from '@/utils/firebase/helpers';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * PUT /api/admin/users/[uid]
 * ユーザーステータス更新（オーナー専用）
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
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

    const { uid } = await params;
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // オーナーのステータスは変更できない
    if (userData?.role === 'owner') {
      return NextResponse.json(
        { success: false, error: 'Cannot change owner status' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !['approved', 'blocked'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be "approved" or "blocked"' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    // approvedに変更する場合は承認日時を記録
    if (status === 'approved' && userData?.status !== 'approved') {
      updateData.approvedAt = Timestamp.now();
    }

    await userDoc.ref.update(updateData);

    const updatedDoc = await userDoc.ref.get();

    return NextResponse.json(
      {
        success: true,
        user: {
          uid: updatedDoc.id,
          ...updatedDoc.data(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update user status error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
