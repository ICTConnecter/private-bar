"use client";

import { use, useState } from "react";
import { LiffContext } from "@/components/context/liff";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function RegisterRequestPage() {
  const { idToken, decodeResult } = use(LiffContext);
  const { showToast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitRequest = async () => {
    if (!idToken) {
      showToast("認証情報が取得できませんでした", "error");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          Authorization: `Bearer:${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        showToast("入会リクエストを送信しました", "success");
      } else {
        if (data.error === "User already exists") {
          showToast("既に登録済みです。承認をお待ちください。", "info");
          setSubmitted(true);
        } else {
          showToast(data.error || "リクエストの送信に失敗しました", "error");
        }
      }
    } catch (error) {
      console.error("リクエスト送信エラー:", error);
      showToast("リクエストの送信に失敗しました", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // LIFF未初期化の場合
  if (!decodeResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // リクエスト送信完了後
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card>
            <CardHeader title="リクエスト送信完了" />
            <CardContent>
              <div className="text-center py-6">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    入会リクエストを受け付けました
                  </h2>
                  <p className="text-gray-600">
                    オーナーによる承認をお待ちください。
                    <br />
                    承認されると、このアプリをご利用いただけます。
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <p className="text-sm text-blue-800">
                    承認には数日かかる場合があります。
                    <br />
                    承認後、再度このアプリを開いてください。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <Card>
          <CardHeader title="完全予約制個室居酒屋" />
          <CardContent>
            <div className="space-y-6">
              {/* ユーザー情報 */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                {decodeResult.picture && (
                  <img
                    src={decodeResult.picture}
                    alt="プロフィール画像"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {decodeResult.name}
                  </p>
                  <p className="text-sm text-gray-500">LINEアカウント</p>
                </div>
              </div>

              {/* 説明 */}
              <div className="space-y-4">
                <p className="text-gray-700">
                  当店は完全会員制となっております。
                  <br />
                  ご利用には入会申請が必要です。
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 mb-2">
                    入会について
                  </h3>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>・入会にはオーナーの承認が必要です</li>
                    <li>・承認後、予約が可能になります</li>
                    <li>・招待コードをお持ちの方は招待者へお問い合わせください</li>
                  </ul>
                </div>
              </div>

              {/* 入会リクエストボタン */}
              <Button
                variant="primary"
                fullWidth
                onClick={handleSubmitRequest}
                loading={submitting}
                disabled={submitting}
              >
                入会をリクエスト
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
