"use client"
import { use, useEffect, useState } from "react";
import { UserAuthComponent, UserAuthContext } from "@/components/context/user";
import { LiffContext } from "@/components/context/liff";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface Slot {
  id: string;
  date: string;
  available: boolean;
  reservedBy: string | null;
}

export default function AdminSlotsPage() {
  const router = useRouter();
  const { idToken } = use(LiffContext);
  const { userInfo } = use(UserAuthContext);
  const { showToast } = useToast();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
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
    fetchSlots();
  }, [currentMonth]);

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const response = await fetch(
        `/api/admin/slots?startDate=${startDate}&endDate=${endDate}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSlots(data.slots || []);
        }
      }
    } catch (error) {
      console.error('予約枠の取得に失敗しました:', error);
      showToast('予約枠の取得に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDates([]);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDates([]);
  };

  const handleDateClick = (dateStr: string, isReserved: boolean) => {
    if (isReserved) return; // 予約済みの日は選択不可

    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  const handleSetAvailable = async (available: boolean) => {
    if (selectedDates.length === 0) {
      showToast('日付を選択してください', 'error');
      return;
    }

    if (!idToken) {
      showToast('認証情報が取得できませんでした', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/slots', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer:${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dates: selectedDates,
          available,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast(
          `${selectedDates.length}日を${available ? '予約可能' : '予約不可'}に設定しました`,
          'success'
        );
        setSelectedDates([]);
        fetchSlots();
      } else {
        showToast(data.error || '予約枠の設定に失敗しました', 'error');
      }
    } catch (error) {
      console.error('予約枠の設定に失敗しました:', error);
      showToast('予約枠の設定に失敗しました', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getSlotStatus = (dateStr: string) => {
    const slot = slots.find(s => s.date === dateStr);
    if (!slot) return { label: '未設定', color: 'bg-gray-100 text-gray-600', isReserved: false };
    if (slot.reservedBy) return { label: '予約済み', color: 'bg-blue-600 text-white', isReserved: true };
    if (slot.available) return { label: '予約可能', color: 'bg-green-100 text-green-800', isReserved: false };
    return { label: '予約不可', color: 'bg-red-100 text-red-800', isReserved: false };
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];
    const totalCells = Math.ceil((daysInMonth + startDayOfWeek) / 7) * 7;

    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < totalCells; i++) {
      const day = i - startDayOfWeek + 1;

      if (day < 1 || day > daysInMonth) {
        days.push(<div key={i} className="h-24 border border-gray-200 bg-gray-50" />);
      } else {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const status = getSlotStatus(dateStr);
        const isSelected = selectedDates.includes(dateStr);
        const isPast = dateStr < today;

        days.push(
          <button
            key={i}
            onClick={() => !isPast && handleDateClick(dateStr, status.isReserved)}
            disabled={isPast || submitting}
            className={`h-24 border border-gray-200 p-2 transition-all ${
              isPast
                ? 'bg-gray-50 cursor-not-allowed'
                : status.isReserved
                ? 'cursor-not-allowed'
                : 'hover:shadow-md cursor-pointer'
            } ${isSelected ? 'ring-2 ring-blue-600' : ''}`}
          >
            <div className="flex flex-col h-full">
              <span className="text-sm font-semibold text-left">{day}</span>
              <div className="flex-1 flex items-center justify-center">
                <span className={`text-xs px-2 py-1 rounded ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </button>
        );
      }
    }

    return days;
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <UserAuthComponent>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/admin')}>
              ＜ 管理画面
            </Button>
          </div>

          <Card>
            <CardHeader title="予約枠設定" />
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loading size="md" text="予約枠を読み込み中..." />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 月選択 */}
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                      ＜ 前月
                    </Button>
                    <h3 className="text-xl font-bold">
                      {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
                    </h3>
                    <Button variant="outline" size="sm" onClick={handleNextMonth}>
                      次月 ＞
                    </Button>
                  </div>

                  {/* カレンダー */}
                  <div>
                    {/* 曜日ヘッダー */}
                    <div className="grid grid-cols-7 mb-2">
                      {weekDays.map((day, index) => (
                        <div
                          key={index}
                          className={`text-center text-sm font-semibold py-2 ${
                            index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* カレンダーグリッド */}
                    <div className="grid grid-cols-7 gap-1">
                      {renderCalendar()}
                    </div>
                  </div>

                  {/* 選択した日付の表示 */}
                  {selectedDates.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2">
                        {selectedDates.length}日選択中
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSetAvailable(true)}
                          loading={submitting}
                          disabled={submitting}
                        >
                          予約可能にする
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleSetAvailable(false)}
                          loading={submitting}
                          disabled={submitting}
                        >
                          予約不可にする
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDates([])}
                          disabled={submitting}
                        >
                          選択解除
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 凡例 */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">凡例</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-200"></div>
                        <span>未設定</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-100 border border-green-200"></div>
                        <span>予約可能</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-100 border border-red-200"></div>
                        <span>予約不可</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-600"></div>
                        <span>予約済み</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </UserAuthComponent>
  );
}
