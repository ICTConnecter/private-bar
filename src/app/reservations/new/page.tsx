"use client"
import { use, useEffect, useState } from "react";
import { UserAuthComponent, UserAuthContext } from "@/components/context/user";
import { LiffContext } from "@/components/context/liff";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { Calendar } from "@/components/ui/Calendar";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function NewReservationPage() {
  const router = useRouter();
  const { idToken } = use(LiffContext);
  const { userInfo } = use(UserAuthContext);
  const { showToast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [numberOfGuests, setNumberOfGuests] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [disabledDates, setDisabledDates] = useState<string[]>([]);

  // 今日の日付を YYYY-MM-DD 形式で取得
  const today = new Date().toISOString().split('T')[0];

  // 予約不可日を取得
  useEffect(() => {
    const fetchUnavailableDates = async () => {
      try {
        // 3ヶ月先までの予約枠を取得
        const startDate = today;
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);
        const endDateStr = endDate.toISOString().split('T')[0];

        const response = await fetch(
          `/api/admin/slots?startDate=${startDate}&endDate=${endDateStr}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.slots) {
            // available=false または reservedBy が存在する日付を無効化
            const unavailable = data.slots
              .filter((slot: any) => !slot.available || slot.reservedBy)
              .map((slot: any) => slot.date);
            setDisabledDates(unavailable);
          }
        }
      } catch (error) {
        console.error('予約枠の取得に失敗しました:', error);
        showToast('予約枠の取得に失敗しました', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUnavailableDates();
  }, [today, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate) {
      showToast('予約日を選択してください', 'error');
      return;
    }

    if (numberOfGuests < 1) {
      showToast('人数は1名以上を入力してください', 'error');
      return;
    }

    if (!idToken || !userInfo) {
      showToast('認証情報が取得できませんでした', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer:${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userInfo.uid,
          date: selectedDate,
          numberOfGuests,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('予約が完了しました！', 'success');
        router.push('/reservations');
      } else {
        showToast(data.error || '予約の作成に失敗しました', 'error');
      }
    } catch (error) {
      console.error('予約の作成に失敗しました:', error);
      showToast('予約の作成に失敗しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 承認済みユーザーでない場合はリダイレクト
  if (userInfo?.status !== 'approved') {
    return (
      <UserAuthComponent>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto pt-8">
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold mb-4">予約できません</h2>
                  <p className="text-gray-600 mb-4">
                    予約機能はオーナーの承認後にご利用いただけます。
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
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              ＜ 戻る
            </Button>
          </div>

          <Card>
            <CardHeader title="新規予約" />
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loading size="md" text="予約枠を読み込み中..." />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* カレンダー */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      予約日 <span className="text-red-600">*</span>
                    </label>
                    <Calendar
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      disabledDates={disabledDates}
                      minDate={today}
                    />
                    {selectedDate && (
                      <p className="mt-2 text-sm text-gray-600">
                        選択日: {new Date(selectedDate).toLocaleDateString('ja-JP')}
                      </p>
                    )}
                  </div>

                  {/* 人数入力 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      人数 <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={numberOfGuests}
                      onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* 備考入力 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      備考（任意）
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="アレルギーや特別なご要望などがあればご記入ください"
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* 送信ボタン */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={submitting}
                      disabled={!selectedDate || submitting}
                    >
                      予約する
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </UserAuthComponent>
  );
}
