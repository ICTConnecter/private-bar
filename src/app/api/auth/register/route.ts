import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/utils/firebase/admin';
import { decodeIdToken } from '@/utils/line/decodeIdToken';
import { User } from '@/types/firestore/User';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/auth/register
 * 招待コードを使用したユーザー登録
 */
export async function POST(req: NextRequest) {
  try {
    // Authorization headerからtokenを取得
    const authHeader = req.headers.get('Authorization');
    const accessToken = authHeader?.split(':')[1];

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Authorization header is required' },
        { status: 401 }
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

    // リクエストボディから招待コードを取得
    const body = await req.json();
    const invitationCode = body.invitationCode;

    const db = getAdminDb();

    // 既に登録済みかチェック
    const existingUser = await db.collection('users').doc(decodedToken.sub).get();
    if (existingUser.exists) {
      return NextResponse.json(
        { success: false, error: 'User already exists' },
        { status: 400 }
      );
    }

    let invitedBy: string | null = null;
    const ownerUid = process.env.OWNER_LINE_UID;

    // 招待コードが提供された場合、検証
    if (invitationCode) {
      const invitationSnapshot = await db.collection('invitations')
        .where('code', '==', invitationCode)
        .limit(1)
        .get();

      if (invitationSnapshot.empty) {
        return NextResponse.json(
          { success: false, error: '無効な招待コードです。' },
          { status: 400 }
        );
      }

      const invitation = invitationSnapshot.docs[0].data();

      // 既に使用済みの招待コード
      if (invitation.usedBy) {
        return NextResponse.json(
          { success: false, error: 'この招待コードは既に使用されています。' },
          { status: 400 }
        );
      }

      // 有効期限チェック
      if (invitation.expiresAt && invitation.expiresAt.toDate() < new Date()) {
        return NextResponse.json(
          { success: false, error: '招待コードの有効期限が切れています。' },
          { status: 400 }
        );
      }

      invitedBy = invitation.createdBy;

      // 招待コードを使用済みに更新
      await invitationSnapshot.docs[0].ref.update({
        usedBy: decodedToken.sub,
        usedAt: Timestamp.now(),
      });
    }

    // ユーザー情報を作成
    const now = Timestamp.now();
    const isOwner = decodedToken.sub === ownerUid;

    const newUser: Omit<User, 'uid'> = {
      displayName: decodedToken.name || 'Unknown',
      pictureUrl: decodedToken.picture || '',
      role: isOwner ? 'owner' : 'user',
      status: isOwner ? 'approved' : 'pending',
      invitedBy,
      invitedAt: now,
      approvedAt: isOwner ? now : null,
      createdAt: now,
      updatedAt: now,
    };

    // Firestoreに保存
    await db.collection('users').doc(decodedToken.sub).set(newUser);

    const message = isOwner
      ? 'オーナーとして登録されました。'
      : invitationCode
      ? '登録が完了しました。承認をお待ちください。'
      : '登録が完了しました。承認をお待ちください。';

    return NextResponse.json(
      {
        success: true,
        user: {
          uid: decodedToken.sub,
          ...newUser,
        },
        message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
