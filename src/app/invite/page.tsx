"use client"
import { use, useState } from "react";
import { UserAuthComponent, UserAuthContext } from "@/components/context/user";
import { LiffContext } from "@/components/context/liff";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function InvitePage() {
  const router = useRouter();
  const { idToken } = use(LiffContext);
  const { userInfo } = use(UserAuthContext);
  const { showToast } = useToast();

  const [invitationUrl, setInvitationUrl] = useState<string>("");
  const [invitationCode, setInvitationCode] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  const handleGenerateInvitation = async () => {
    if (!idToken || !userInfo) {
      showToast('認証情報が取得できませんでした', 'error');
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer:${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          createdBy: userInfo.uid,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setInvitationCode(data.invitation.code);
        setInvitationUrl(data.invitation.url);
        showToast('招待URLを生成しました', 'success');
      } else {
        showToast(data.error || '招待URLの生成に失敗しました', 'error');
      }
    } catch (error) {
      console.error('招待URLの生成に失敗しました:', error);
      showToast('招待URLの生成に失敗しました', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!invitationUrl) return;

    try {
      await navigator.clipboard.writeText(invitationUrl);
      showToast('URLをコピーしました', 'success');
    } catch (error) {
      console.error('コピーに失敗しました:', error);
      showToast('コピーに失敗しました', 'error');
    }
  };

  const handleCopyCode = async () => {
    if (!invitationCode) return;

    try {
      await navigator.clipboard.writeText(invitationCode);
      showToast('招待コードをコピーしました', 'success');
    } catch (error) {
      console.error('コピーに失敗しました:', error);
      showToast('コピーに失敗しました', 'error');
    }
  };

  const handleShareLine = () => {
    if (!invitationUrl) return;

    const message = encodeURIComponent(
      `完全予約制個室居酒屋への招待です！\n\nこちらのURLから登録してください：\n${invitationUrl}`
    );

    // LINE共有URL
    const shareUrl = `https://line.me/R/msg/text/?${message}`;
    window.open(shareUrl, '_blank');
  };

  // 承認済みユーザーでない場合はアクセス拒否
  if (userInfo?.status !== 'approved') {
    return (
      <UserAuthComponent>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto pt-8">
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold mb-4">招待できません</h2>
                  <p className="text-gray-600 mb-4">
                    招待機能はオーナーの承認後にご利用いただけます。
                  </p>
                  <Button onClick={() => router.push('/')}>
                    ホームに戻る
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </UserAuthComponent>
    );
  }

  return (
    <UserAuthComponent>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
              ＜ ホーム
            </Button>
          </div>

          <Card>
            <CardHeader title="友人を招待" />
            <CardContent>
              <div className="space-y-6">
                {/* 説明 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">招待について</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 招待した友人はオーナーの承認が必要です</li>
                    <li>• 承認後に予約が可能になります</li>
                    <li>• 招待URLは何度でも生成できます</li>
                  </ul>
                </div>

                {/* 招待URL生成 */}
                <div>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleGenerateInvitation}
                    loading={generating}
                    disabled={generating}
                  >
                    招待URLを生成
                  </Button>
                </div>

                {/* 生成された招待情報 */}
                {invitationCode && invitationUrl && (
                  <div className="space-y-4 animate-fade-in">
                    {/* 招待コード */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        招待コード
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={invitationCode}
                          readOnly
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono"
                        />
                        <Button variant="outline" onClick={handleCopyCode}>
                          コピー
                        </Button>
                      </div>
                    </div>

                    {/* 招待URL */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        招待URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={invitationUrl}
                          readOnly
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm truncate"
                        />
                        <Button variant="outline" onClick={handleCopyUrl}>
                          コピー
                        </Button>
                      </div>
                    </div>

                    {/* LINE共有ボタン */}
                    <div>
                      <Button
                        variant="secondary"
                        fullWidth
                        onClick={handleShareLine}
                      >
                        LINEで共有
                      </Button>
                    </div>
                  </div>
                )}

                {/* 注意事項 */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">注意事項</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 招待URLは第三者と共有しないでください</li>
                    <li>• 招待した方が不適切な利用をした場合、責任を問われる可能性があります</li>
                    <li>• オーナーの判断により、招待された方の承認が却下される場合があります</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserAuthComponent>
  );
}
