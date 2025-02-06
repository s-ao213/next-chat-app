// src/app/chat/join/[inviteCode]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/Button";
import Header from "@/app/_components/Header";
import { supabase } from "@/lib/supabaseClient";

export default function JoinRoom({
  params,
}: {
  params: { inviteCode: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        // セッションがない場合は現在のURLをエンコードしてリダイレクト先として保存
        const returnUrl = encodeURIComponent(window.location.pathname);
        router.push(`/login?returnUrl=${returnUrl}`);
        return;
      }

      // 認証済みの場合はルーム参加処理を実行
      if (params.inviteCode) {
        checkAndJoinRoom();
      }
    };

    checkAuth();
  }, [params.inviteCode]);

  const checkAndJoinRoom = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. ユーザー確認
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        setError("サインインが必要です");
        return;
      }

      // 2. ユーザーの現在のグループ数を確認
      const { count: groupCount, error: countError } = await supabase
        .from("chat_room_members")
        .select("*", { count: "exact" })
        .eq("user_id", user.id);

      if (countError) {
        setError("エラーが発生しました");
        return;
      }

      // 3. グループ数が5以上の場合は参加を制限
      if (groupCount && groupCount >= 5) {
        setError(
          "参加できるグループは5つまでです。他のグループから退会してから再度お試しください。"
        );
        // 3秒後にチャット一覧ページに戻る
        setTimeout(() => {
          router.push("/chat");
        }, 3000);
        return;
      }

      // 4. ルーム確認
      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .select("id, name")
        .eq("invite_code", params.inviteCode)
        .single();

      if (roomError || !room) {
        setError("無効な招待コードです");
        return;
      }

      setRoomName(room.name);

      // 5. メンバーシップ確認
      const { data: existingMember } = await supabase
        .from("chat_room_members")
        .select()
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        router.push(`/chat/${room.id}`);
        return;
      }

      // 6. メンバー追加
      const { error: joinError } = await supabase
        .from("chat_room_members")
        .insert([
          {
            room_id: room.id,
            user_id: user.id,
          },
        ]);

      if (joinError) throw joinError;

      router.push(`/chat/${room.id}`);
    } catch (error) {
      console.error("Error:", error);
      setError("エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <h1 className="text-2xl font-bold mb-6 text-center">
            チャットルームに参加
          </h1>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="mb-4">ルームに参加しています...</div>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="text-red-500 text-center">{error}</div>
              <Button onClick={() => router.push("/chat")} className="w-full">
                ルーム一覧に戻る
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mb-4">「{roomName}」に参加しています...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
