import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/utils/firebase/admin';
import { decodeIdToken } from '@/utils/line/decodeIdToken';
import { isOwner, isApprovedUser, generateInvitationCode } from '@/utils/firebase/helpers';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/invitations
 * 招待コード生成
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

    // オーナーまたは承認済みユーザーのみ招待可能
    const userIsOwner = await isOwner(userId);
    const userIsApproved = await isApprovedUser(userId);

    if (!userIsOwner && !userIsApproved) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only approved users can create invitations.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { expiresAt } = body;

    const db = getAdminDb();

    // ユニークな招待コードを生成
    let code = generateInvitationCode();
    let isUnique = false;

    // コードの重複チェック
    while (!isUnique) {
      const existingInvitation = await db.collection('invitations')
        .where('code', '==', code)
        .limit(1)
        .get();

      if (existingInvitation.empty) {
        isUnique = true;
      } else {
        code = generateInvitationCode();
      }
    }

    const invitationData: any = {
      code,
      createdBy: userId,
      usedBy: null,
      usedAt: null,
      expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null,
      createdAt: Timestamp.now(),
    };

    const docRef = await db.collection('invitations').add(invitationData);

    // 招待用URLを生成
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-app-url.com';
    const invitationUrl = `${baseUrl}/register?code=${code}`;

    return NextResponse.json(
      {
        success: true,
        invitation: {
          id: docRef.id,
          code,
          url: invitationUrl,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
