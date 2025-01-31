// src/app/chat/join/[inviteCode]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/Button";
import Header from "@/app/_components/Header";
import { supabase } from "@/lib/supabaseClient";
interface PageProps {
  params: {
    inviteCode: string;
  };
}

export default function JoinRoom() {
  // useParamsから直接inviteCodeを取得する代わりに
  const params = useParams();
  const inviteCode = params?.inviteCode as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);

  useEffect(() => {
    if (inviteCode) {
      checkAndJoinRoom();
    }
  }, [inviteCode]);

  const checkAndJoinRoom = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // ユーザー認証の確認
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setError("サインインが必要です");
        return;
      }

      console.log("Checking invite code:", inviteCode); // デバッグ用

      // ルームの存在確認
      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .select("id, name")
        .eq("invite_code", inviteCode)
        .single();

      if (roomError) {
        console.error("Room error:", roomError); // デバッグ用
        setError("無効な招待コードです");
        return;
      }

      if (!room) {
        setError("無効な招待コードです");
        return;
      }

      console.log("Found room:", room); // デバッグ用
      setRoomName(room.name);

      // すでにメンバーかどうかを確認
      const { data: existingMember, error: memberCheckError } = await supabase
        .from("chat_room_members")
        .select("*")
        .eq("room_id", room.id)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        router.push(`/chat/${room.id}`);
        return;
      }

      // メンバーとして追加
      const { error: joinError } = await supabase
        .from("chat_room_members")
        .insert([
          {
            room_id: room.id,
            user_id: user.id,
          },
        ]);

      if (joinError) throw joinError;

      // 参加成功後、ルームページへリダイレクト
      router.push(`/chat/${room.id}`);
    } catch (error) {
      console.error("Error joining room:", error);
      setError("エラーが発生しました。もう一度お試しください。");
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
