"use client"
import { use, useEffect, useState } from "react";
import { UserAuthComponent, UserAuthContext } from "@/components/context/user";
import { LiffContext } from "@/components/context/liff";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { useRouter } from "next/navigation";
import { Reservation } from "@/types/firestore/Reservation";

export default function Home() {
  const router = useRouter();
  const { decodeResult } = use(LiffContext);
  const { userInfo } = use(UserAuthContext);
  const [nextReservation, setNextReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userInfo?.uid) return;

    const fetchNextReservation = async () => {
      try {
        const response = await fetch(`/api/reservations?userId=${userInfo.uid}&status=confirmed`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.reservations.length > 0) {
            // 今日以降の予約のみフィルタリングして最も近いものを取得
            const today = new Date().toISOString().split('T')[0];
            const upcomingReservations = data.reservations.filter(
              (r: Reservation) => r.date >= today
            );
            if (upcomingReservations.length > 0) {
              setNextReservation(upcomingReservations[0]);
            }
          }
        }
      } catch (error) {
        console.error('予約の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNextReservation();
  }, [userInfo?.uid]);

  // 承認待ちユーザーの場合
  if (userInfo?.status === 'pending') {
    return (
      <UserAuthComponent>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto pt-8">
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold mb-4">承認待ちです</h2>
                  <p className="text-gray-600">
                    オーナーによる承認をお待ちください。
                    <br />
                    承認後、予約が可能になります。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </UserAuthComponent>
    );
  }

  // ブロックユーザーの場合
  if (userInfo?.status === 'blocked') {
    return (
      <UserAuthComponent>
        <div className="min-h-screen bg-gray-50 p-4">
          <div className="max-w-2xl mx-auto pt-8">
            <Card>
              <CardContent>
                <div className="text-center py-8">
                  <h2 className="text-2xl font-bold mb-4">アクセスが制限されています</h2>
                  <p className="text-gray-600">
                    このアカウントではご利用いただけません。
                  </p>
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
          {/* ヘッダー: ユーザー情報 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="flex items-center gap-4">
              {decodeResult?.picture && (
                <img
                  src={decodeResult.picture}
                  alt="プロフィール画像"
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold">ようこそ</h1>
                <p className="text-gray-600">{decodeResult?.name}さん</p>
              </div>
            </div>
          </div>

          {/* 店舗情報 */}
          <Card>
            <CardHeader title="完全予約制個室居酒屋" />
            <CardContent>
              <p className="text-gray-700 mb-4">
                1日1組限定の完全貸切スタイル。
                <br />
                プライベートな空間でごゆっくりお過ごしください。
              </p>
            </CardContent>
          </Card>

          {/* 次回予約情報 */}
          {loading ? (
            <div className="my-6 flex justify-center">
              <Loading size="md" text="予約情報を読み込み中..." />
            </div>
          ) : nextReservation ? (
            <Card>
              <CardHeader title="次回のご予約" />
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">予約日</span>
                    <span>{new Date(nextReservation.date).toLocaleDateString('ja-JP')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">人数</span>
                    <span>{nextReservation.numberOfGuests}名</span>
                  </div>
                  {nextReservation.notes && (
                    <div className="mt-2 pt-2 border-t">
                      <span className="font-semibold">備考</span>
                      <p className="text-gray-600 mt-1">{nextReservation.notes}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => router.push(`/reservations/${nextReservation.id}`)}
                  >
                    予約詳細を見る
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-gray-600 mb-4">予約がありません</p>
                  <Button
                    variant="primary"
                    onClick={() => router.push('/reservations/new')}
                  >
                    新規予約する
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* クイックアクション */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <Button
              variant="primary"
              fullWidth
              onClick={() => router.push('/reservations/new')}
            >
              新規予約
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => router.push('/reservations')}
            >
              予約一覧
            </Button>
          </div>

          {/* 友人招待ボタン */}
          <div className="mt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => router.push('/invite')}
            >
              友人を招待
            </Button>
          </div>

          {/* オーナー管理画面へのリンク */}
          {userInfo?.role === 'owner' && (
            <div className="mt-6">
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push('/admin')}
              >
                管理画面へ
              </Button>
            </div>
          )}
        </div>
      </div>
    </UserAuthComponent>
  );
}
