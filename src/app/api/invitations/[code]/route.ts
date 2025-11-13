import { NextResponse, NextRequest } from 'next/server';
import { getAdminDb } from '@/utils/firebase/admin';

/**
 * GET /api/invitations/[code]
 * 招待コード検証
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const db = getAdminDb();
    const invitationSnapshot = await db.collection('invitations')
      .where('code', '==', code)
      .limit(1)
      .get();

    if (invitationSnapshot.empty) {
      return NextResponse.json(
        {
          success: true,
          valid: false,
          message: '無効な招待コードです。',
        },
        { status: 200 }
      );
    }

    const invitation = invitationSnapshot.docs[0].data();

    // 既に使用済み
    if (invitation.usedBy) {
      return NextResponse.json(
        {
          success: true,
          valid: false,
          message: 'この招待コードは既に使用されています。',
        },
        { status: 200 }
      );
    }

    // 有効期限チェック
    if (invitation.expiresAt && invitation.expiresAt.toDate() < new Date()) {
      return NextResponse.json(
        {
          success: true,
          valid: false,
          message: '招待コードの有効期限が切れています。',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        valid: true,
        invitation: {
          id: invitationSnapshot.docs[0].id,
          code: invitation.code,
          createdBy: invitation.createdBy,
          expiresAt: invitation.expiresAt?.toDate().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Validate invitation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
