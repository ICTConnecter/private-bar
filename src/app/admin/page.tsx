"use client"
import { use, useEffect, useState } from "react";
import { UserAuthComponent, UserAuthContext } from "@/components/context/user";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { useRouter } from "next/navigation";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { userInfo } = use(UserAuthContext);

  const [stats, setStats] = useState({
    totalReservationsThisMonth: 0,
    pendingUsersCount: 0,
    upcomingReservations: [] as any[],
  });
  const [loading, setLoading] = useState(true);

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
    const fetchStats = async () => {
      try {
        // 今月の予約数を取得
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const [reservationsRes, usersRes] = await Promise.all([
          fetch('/api/admin/reservations'),
          fetch('/api/admin/users?status=pending'),
        ]);

        if (reservationsRes.ok) {
          const reservationsData = await reservationsRes.json();
          if (reservationsData.success) {
            // 今月の予約をフィルタリング
            const thisMonthReservations = reservationsData.reservations.filter(
              (r: any) => {
                const date = new Date(r.date);
                return date >= firstDayOfMonth && date <= lastDayOfMonth && r.status === 'confirmed';
              }
            );

            // 今日以降の予約を取得（最大5件）
            const todayStr = today.toISOString().split('T')[0];
            const upcoming = reservationsData.reservations
              .filter((r: any) => r.date >= todayStr && r.status === 'confirmed')
              .slice(0, 5);

            setStats(prev => ({
              ...prev,
              totalReservationsThisMonth: thisMonthReservations.length,
              upcomingReservations: upcoming,
            }));
          }
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.success) {
            setStats(prev => ({
              ...prev,
              pendingUsersCount: usersData.users.length,
            }));
          }
        }
      } catch (error) {
        console.error('統計情報の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <UserAuthComponent>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* ヘッダー */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">オーナー管理画面</h1>
            <p className="text-gray-600 mt-2">予約・ユーザー管理</p>
          </div>

          {loading ? (
            <Card>
              <CardContent>
                <div className="flex justify-center py-8">
                  <Loading size="md" text="データを読み込み中..." />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 統計情報カード */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600 mb-2">今月の予約件数</p>
                      <p className="text-4xl font-bold text-blue-600">
                        {stats.totalReservationsThisMonth}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">件</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600 mb-2">申請中のユーザー</p>
                      <p className="text-4xl font-bold text-orange-600">
                        {stats.pendingUsersCount}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">名</p>
                      {stats.pendingUsersCount > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => router.push('/admin/users')}
                        >
                          承認する
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* クイックアクション */}
              <Card>
                <CardHeader title="クイックアクション" />
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => router.push('/admin/slots')}
                    >
                      予約枠を設定
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => router.push('/admin/users')}
                    >
                      ユーザー管理
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => router.push('/admin/reservations')}
                    >
                      予約管理
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => router.push('/admin/invite')}
                    >
                      ユーザーを招待
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 直近の予約 */}
              <Card>
                <CardHeader title="直近の予約" />
                <CardContent>
                  {stats.upcomingReservations.length === 0 ? (
                    <p className="text-center text-gray-600 py-4">予約がありません</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.upcomingReservations.map((reservation: any) => (
                        <div
                          key={reservation.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/admin/reservations`)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {new Date(reservation.date).toLocaleDateString('ja-JP', {
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                              <p className="text-sm text-gray-600">
                                {reservation.userName} - {reservation.numberOfGuests}名
                              </p>
                            </div>
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              予約確定
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ユーザー画面へ戻る */}
              <div className="mt-6">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => router.push('/')}
                >
                  ユーザー画面に戻る
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </UserAuthComponent>
  );
}
