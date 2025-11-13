"use client"
import { use, useEffect, useState } from "react";
import { UserAuthComponent, UserAuthContext } from "@/components/context/user";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { useRouter } from "next/navigation";
import { Reservation } from "@/types/firestore/Reservation";

export default function AdminReservationsPage() {
  const router = useRouter();
  const { userInfo } = use(UserAuthContext);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
    fetchReservations();
  }, [filter, sortOrder]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/reservations');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          let filtered = data.reservations;

          // フィルター適用
          if (filter !== 'all') {
            filtered = filtered.filter((r: Reservation) => r.status === filter);
          }

          // ソート適用
          filtered.sort((a: Reservation, b: Reservation) => {
            if (sortOrder === 'asc') {
              return a.date.localeCompare(b.date);
            } else {
              return b.date.localeCompare(a.date);
            }
          });

          setReservations(filtered);
        }
      }
    } catch (error) {
      console.error('予約の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '予約確定';
      case 'cancelled':
        return 'キャンセル済み';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
            <CardHeader title="予約管理" />
            <CardContent>
              {/* フィルターとソート */}
              <div className="mb-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter === 'all' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    すべて
                  </Button>
                  <Button
                    variant={filter === 'confirmed' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('confirmed')}
                  >
                    予約確定
                  </Button>
                  <Button
                    variant={filter === 'cancelled' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('cancelled')}
                  >
                    キャンセル済み
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">並び順:</span>
                  <Button
                    variant={sortOrder === 'asc' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSortOrder('asc')}
                  >
                    日付昇順
                  </Button>
                  <Button
                    variant={sortOrder === 'desc' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSortOrder('desc')}
                  >
                    日付降順
                  </Button>
                </div>
              </div>

              {/* 予約リスト */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loading size="md" text="予約を読み込み中..." />
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">予約がありません</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">
                            {new Date(reservation.date).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {reservation.userName} - {reservation.numberOfGuests}名
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            reservation.status
                          )}`}
                        >
                          {getStatusLabel(reservation.status)}
                        </span>
                      </div>

                      {reservation.notes && (
                        <div className="mb-3 p-3 bg-gray-50 rounded">
                          <p className="text-xs font-semibold text-gray-700 mb-1">備考</p>
                          <p className="text-sm text-gray-900">{reservation.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                        <span>
                          予約作成: {new Date(reservation.createdAt?.seconds ? reservation.createdAt.seconds * 1000 : reservation.createdAt).toLocaleDateString('ja-JP')}
                        </span>
                        {reservation.cancelledAt && (
                          <span>
                            キャンセル日: {new Date(reservation.cancelledAt?.seconds ? reservation.cancelledAt.seconds * 1000 : reservation.cancelledAt).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 統計情報 */}
              {!loading && reservations.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    表示中の予約: <span className="font-bold">{reservations.length}</span> 件
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </UserAuthComponent>
  );
}
