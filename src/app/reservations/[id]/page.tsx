"use client"
import { use, useEffect, useState } from "react";
import { UserAuthComponent, UserAuthContext } from "@/components/context/user";
import { LiffContext } from "@/components/context/liff";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Calendar } from "@/components/ui/Calendar";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Reservation } from "@/types/firestore/Reservation";

export default function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { idToken } = use(LiffContext);
  const { userInfo } = use(UserAuthContext);
  const { showToast } = useToast();

  const { id } = use(params);

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 編集用の状態
  const [editedDate, setEditedDate] = useState<string>("");
  const [editedNumberOfGuests, setEditedNumberOfGuests] = useState<number>(1);
  const [editedNotes, setEditedNotes] = useState<string>("");
  const [disabledDates, setDisabledDates] = useState<string[]>([]);

  const today = new Date().toISOString().split('T')[0];

  // 予約詳細を取得
  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const response = await fetch(`/api/reservations/${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setReservation(data.reservation);
            setEditedDate(data.reservation.date);
            setEditedNumberOfGuests(data.reservation.numberOfGuests);
            setEditedNotes(data.reservation.notes || "");
          } else {
            showToast('予約が見つかりませんでした', 'error');
            router.push('/reservations');
          }
        }
      } catch (error) {
        console.error('予約の取得に失敗しました:', error);
        showToast('予約の取得に失敗しました', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [id, router, showToast]);

  // 編集モードの時に予約不可日を取得
  useEffect(() => {
    if (!isEditing) return;

    const fetchUnavailableDates = async () => {
      try {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);
        const endDateStr = endDate.toISOString().split('T')[0];

        const response = await fetch(
          `/api/admin/slots?startDate=${today}&endDate=${endDateStr}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.slots) {
            // 現在の予約日以外で、available=false または reservedBy が存在する日付を無効化
            const unavailable = data.slots
              .filter(
                (slot: any) =>
                  slot.date !== reservation?.date &&
                  (!slot.available || slot.reservedBy)
              )
              .map((slot: any) => slot.date);
            setDisabledDates(unavailable);
          }
        }
      } catch (error) {
        console.error('予約枠の取得に失敗しました:', error);
      }
    };

    fetchUnavailableDates();
  }, [isEditing, reservation?.date, today]);

  // 予約更新
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editedDate) {
      showToast('予約日を選択してください', 'error');
      return;
    }

    if (editedNumberOfGuests < 1) {
      showToast('人数は1名以上を入力してください', 'error');
      return;
    }

    if (!idToken) {
      showToast('認証情報が取得できませんでした', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer:${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: editedDate,
          numberOfGuests: editedNumberOfGuests,
          notes: editedNotes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('予約を更新しました', 'success');
        setReservation(data.reservation);
        setIsEditing(false);
      } else {
        showToast(data.error || '予約の更新に失敗しました', 'error');
      }
    } catch (error) {
      console.error('予約の更新に失敗しました:', error);
      showToast('予約の更新に失敗しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 予約キャンセル
  const handleCancel = async () => {
    if (!idToken) {
      showToast('認証情報が取得できませんでした', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer:${idToken}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('予約をキャンセルしました', 'success');
        router.push('/reservations');
      } else {
        showToast(data.error || '予約のキャンセルに失敗しました', 'error');
      }
    } catch (error) {
      console.error('予約のキャンセルに失敗しました:', error);
      showToast('予約のキャンセルに失敗しました', 'error');
    } finally {
      setSubmitting(false);
      setIsCancelModalOpen(false);
    }
  };

  // 自分の予約でない場合はアクセス拒否
  if (!loading && reservation && reservation.userId !== userInfo?.uid) {
    return (
      <UserAuthComponent>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto pt-8">
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold mb-4">アクセス権限がありません</h2>
                  <p className="text-gray-600 mb-4">
                    この予約にはアクセスできません。
                  </p>
                  <Button onClick={() => router.push('/reservations')}>
                    予約一覧に戻る
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
            <Button variant="outline" size="sm" onClick={() => router.push('/reservations')}>
              ＜ 予約一覧
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent>
                <div className="flex justify-center py-8">
                  <Loading size="md" text="予約を読み込み中..." />
                </div>
              </CardContent>
            </Card>
          ) : !reservation ? (
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">予約が見つかりませんでした</p>
                  <Button onClick={() => router.push('/reservations')}>
                    予約一覧に戻る
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader
                  title={isEditing ? '予約編集' : '予約詳細'}
                  subtitle={
                    reservation.status === 'cancelled' ? 'キャンセル済み' : undefined
                  }
                />
                <CardContent>
                  {isEditing ? (
                    <form onSubmit={handleUpdate} className="space-y-6">
                      {/* 日付編集 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          予約日 <span className="text-red-600">*</span>
                        </label>
                        <Calendar
                          selectedDate={editedDate}
                          onDateSelect={setEditedDate}
                          disabledDates={disabledDates}
                          minDate={today}
                        />
                      </div>

                      {/* 人数編集 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          人数 <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={editedNumberOfGuests}
                          onChange={(e) => setEditedNumberOfGuests(parseInt(e.target.value) || 1)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      {/* 備考編集 */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          備考（任意）
                        </label>
                        <textarea
                          value={editedNotes}
                          onChange={(e) => setEditedNotes(e.target.value)}
                          placeholder="アレルギーや特別なご要望などがあればご記入ください"
                          rows={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                      </div>

                      {/* ボタン */}
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          fullWidth
                          onClick={() => {
                            setIsEditing(false);
                            setEditedDate(reservation.date);
                            setEditedNumberOfGuests(reservation.numberOfGuests);
                            setEditedNotes(reservation.notes || "");
                          }}
                          disabled={submitting}
                        >
                          キャンセル
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          fullWidth
                          loading={submitting}
                          disabled={submitting}
                        >
                          保存
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      {/* 予約情報表示 */}
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                          <span className="font-semibold text-gray-700">予約日</span>
                          <span className="text-gray-900">
                            {new Date(reservation.date).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex justify-between py-2 border-b">
                          <span className="font-semibold text-gray-700">人数</span>
                          <span className="text-gray-900">{reservation.numberOfGuests}名</span>
                        </div>

                        <div className="flex justify-between py-2 border-b">
                          <span className="font-semibold text-gray-700">ステータス</span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              reservation.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {reservation.status === 'confirmed' ? '予約確定' : 'キャンセル済み'}
                          </span>
                        </div>

                        {reservation.notes && (
                          <div className="py-2">
                            <span className="font-semibold text-gray-700 block mb-2">備考</span>
                            <p className="text-gray-900 whitespace-pre-wrap">{reservation.notes}</p>
                          </div>
                        )}

                        <div className="flex justify-between py-2 border-t text-sm text-gray-500">
                          <span>予約作成日時</span>
                          <span>
                            {new Date(reservation.createdAt).toLocaleString('ja-JP')}
                          </span>
                        </div>
                      </div>

                      {/* アクションボタン */}
                      {reservation.status === 'confirmed' && (
                        <div className="pt-4 space-y-3">
                          <Button
                            variant="primary"
                            fullWidth
                            onClick={() => setIsEditing(true)}
                          >
                            編集
                          </Button>
                          <Button
                            variant="danger"
                            fullWidth
                            onClick={() => setIsCancelModalOpen(true)}
                          >
                            キャンセル
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* キャンセル確認モーダル */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="予約をキャンセルしますか？"
      >
        <p className="text-gray-600 mb-4">
          この操作は取り消せません。本当にキャンセルしますか?
        </p>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setIsCancelModalOpen(false)}
            disabled={submitting}
          >
            戻る
          </Button>
          <Button
            variant="danger"
            onClick={handleCancel}
            loading={submitting}
            disabled={submitting}
          >
            キャンセルする
          </Button>
        </ModalFooter>
      </Modal>
    </UserAuthComponent>
  );
}
