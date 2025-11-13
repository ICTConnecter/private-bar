"use client"
import { use, useEffect, useState } from "react";
import { UserAuthComponent, UserAuthContext } from "@/components/context/user";
import { LiffContext } from "@/components/context/liff";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { User } from "@/types/firestore/User";

export default function AdminUsersPage() {
  const router = useRouter();
  const { idToken } = use(LiffContext);
  const { userInfo } = use(UserAuthContext);
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'approved' | 'blocked'>('pending');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'block' | 'unblock'>('approve');
  const [submitting, setSubmitting] = useState(false);

  // オーナー権限チェック
  if (userInfo?.role !== 'owner') {
    return (
      <UserAuthComponent>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto pt-8">
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold mb-4">アクセス権限がありません</h2>
                  <p className="text-gray-600 mb-4">
                    この画面はオーナーのみアクセスできます。
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

  useEffect(() => {
    fetchUsers();
  }, [tab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?status=${tab}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUsers(data.users);
        }
      }
    } catch (error) {
      console.error('ユーザーの取得に失敗しました:', error);
      showToast('ユーザーの取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async () => {
    if (!selectedUser || !idToken) return;

    setSubmitting(true);

    try {
      const newStatus = actionType === 'approve' ? 'approved' : 'blocked';

      const response = await fetch(`/api/admin/users/${selectedUser.uid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer:${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const actionLabel =
          actionType === 'approve'
            ? '承認しました'
            : actionType === 'block'
            ? 'ブロックしました'
            : 'ブロックを解除しました';

        showToast(actionLabel, 'success');
        setActionModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showToast(data.error || '操作に失敗しました', 'error');
      }
    } catch (error) {
      console.error('操作に失敗しました:', error);
      showToast('操作に失敗しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openActionModal = (user: User, action: 'approve' | 'block' | 'unblock') => {
    setSelectedUser(user);
    setActionType(action);
    setActionModalOpen(true);
  };

  const getActionModalContent = () => {
    if (!selectedUser) return { title: '', message: '', buttonText: '', buttonVariant: 'primary' as const };

    switch (actionType) {
      case 'approve':
        return {
          title: 'ユーザーを承認しますか?',
          message: `${selectedUser.displayName}さんを承認します。承認後、このユーザーは予約が可能になります。`,
          buttonText: '承認する',
          buttonVariant: 'primary' as const,
        };
      case 'block':
        return {
          title: 'ユーザーをブロックしますか?',
          message: `${selectedUser.displayName}さんをブロックします。このユーザーはサイトにアクセスできなくなります。`,
          buttonText: 'ブロックする',
          buttonVariant: 'danger' as const,
        };
      case 'unblock':
        return {
          title: 'ブロックを解除しますか?',
          message: `${selectedUser.displayName}さんのブロックを解除して承認します。`,
          buttonText: 'ブロックを解除',
          buttonVariant: 'primary' as const,
        };
    }
  };

  const modalContent = getActionModalContent();

  return (
    <UserAuthComponent>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin')}>
              ＜ 管理画面
            </Button>
          </div>

          <Card>
            <CardHeader title="ユーザー管理" />
            <CardContent>
              {/* タブ */}
              <div className="mb-4 flex gap-2 border-b">
                <button
                  className={`px-4 py-2 font-semibold transition-colors ${
                    tab === 'pending'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setTab('pending')}
                >
                  申請中
                </button>
                <button
                  className={`px-4 py-2 font-semibold transition-colors ${
                    tab === 'approved'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setTab('approved')}
                >
                  承認済み
                </button>
                <button
                  className={`px-4 py-2 font-semibold transition-colors ${
                    tab === 'blocked'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setTab('blocked')}
                >
                  ブロック済み
                </button>
              </div>

              {/* ユーザーリスト */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loading size="md" text="ユーザーを読み込み中..." />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">ユーザーがいません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.uid}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {user.pictureUrl && (
                            <img
                              src={user.pictureUrl}
                              alt={user.displayName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {user.displayName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              招待日: {new Date(user.invitedAt?.seconds ? user.invitedAt.seconds * 1000 : user.invitedAt).toLocaleDateString('ja-JP')}
                            </p>
                            {user.invitedBy && (
                              <p className="text-xs text-gray-500">
                                招待者: {user.invitedBy}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* アクションボタン */}
                        <div className="flex gap-2">
                          {tab === 'pending' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => openActionModal(user, 'approve')}
                              >
                                承認
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => openActionModal(user, 'block')}
                              >
                                却下
                              </Button>
                            </>
                          )}
                          {tab === 'approved' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => openActionModal(user, 'block')}
                            >
                              ブロック
                            </Button>
                          )}
                          {tab === 'blocked' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openActionModal(user, 'unblock')}
                            >
                              解除
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* アクション確認モーダル */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={modalContent.title}
      >
        <p className="text-gray-600 mb-4">{modalContent.message}</p>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setActionModalOpen(false)}
            disabled={submitting}
          >
            キャンセル
          </Button>
          <Button
            variant={modalContent.buttonVariant}
            onClick={handleUserAction}
            loading={submitting}
            disabled={submitting}
          >
            {modalContent.buttonText}
          </Button>
        </ModalFooter>
      </Modal>
    </UserAuthComponent>
  );
}
