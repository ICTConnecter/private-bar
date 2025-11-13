"use client"
import { use, useEffect, useState } from "react";
import { UserAuthComponent, UserAuthContext } from "@/components/context/user";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { useRouter } from "next/navigation";
import { Reservation } from "@/types/firestore/Reservation";

export default function ReservationsPage() {
  const router = useRouter();
  const { userInfo } = use(UserAuthContext);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    if (!userInfo?.uid) return;

    const fetchReservations = async () => {
      try {
        const statusParam = filter === 'all' ? '' : `&status=${filter}`;
        const response = await fetch(
          `/api/reservations?userId=${userInfo.uid}${statusParam}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setReservations(data.reservations);
          }
        }
      } catch (error) {
        console.error('予約の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [userInfo?.uid, filter]);

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
        <div className="max-w-2xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-4 flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => router.push('/')}>
              ＜ ホーム
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/reservations/new')}
            >
              新規予約
            </Button>
          </div>

          <Card>
            <CardHeader title="予約一覧" />
            <CardContent>
              {/* フィルター */}
              <div className="mb-4 flex gap-2">
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

              {/* 予約リスト */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loading size="md" text="予約を読み込み中..." />
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">予約がありません</p>
                  <Button
                    variant="primary"
                    onClick={() => router.push('/reservations/new')}
                  >
                    新規予約する
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/reservations/${reservation.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg">
                            {new Date(reservation.date).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {reservation.numberOfGuests}名
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
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {reservation.notes}
                        </p>
                      )}

                      <div className="mt-3 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/reservations/${reservation.id}`);
                          }}
                        >
                          詳細を見る
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </UserAuthComponent>
  );
}
