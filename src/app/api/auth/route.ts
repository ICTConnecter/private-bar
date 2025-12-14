import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/utils/firebase/admin';
import { decodeIdToken } from '@/utils/line/decodeIdToken';
import { User } from '@/types/firestore/User';
import { GetResType } from './types';

/**
 * GET /api/auth
 * 認証済みユーザーの情報を取得
 */
export async function GET(req: NextRequest) {
  try {
    // Authorization headerからtokenを取得
    const authHeader = req.headers.get('Authorization');
    const accessToken = authHeader?.split(':')[1];

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Tokenが設定されていません。' },
        { status: 400 }
      );
    }

    // Tokenのdecode
    const decodedToken = await decodeIdToken(accessToken);

    if (!decodedToken.sub) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Firestoreからユーザー情報を取得
    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decodedToken.sub).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: '登録情報が見当たりませんでした。' },
        { status: 404 }
      );
    }

    const userData = userDoc.data() as User;

    // ブロックされているユーザーの場合
    if (userData.status === 'blocked') {
      return NextResponse.json(
        { success: false, error: 'アクセスが許可されていません。' },
        { status: 403 }
      );
    }

    // レスポンス用データの作成（lineIdを除外）
    const response: GetResType = {
      uid: userDoc.id,
      displayName: userData.displayName,
      pictureUrl: userData.pictureUrl,
      role: userData.role,
      status: userData.status,
      invitedBy: userData.invitedBy,
      invitedAt: userData.invitedAt,
      approvedAt: userData.approvedAt,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
