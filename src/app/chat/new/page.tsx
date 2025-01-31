// src/app/chat/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/Button";
import Header from "@/app/_components/Header";
import { supabase } from "@/lib/supabaseClient";

export default function NewChatRoom() {
  const [name, setName] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    try {
      // 1. ユーザー確認
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("ログインが必要です");
        return;
      }

      // 2. アイコンのアップロード（もしあれば）
      let iconUrl = null;
      if (iconFile) {
        const fileExt = iconFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("room-icons")
          .upload(fileName, iconFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("room-icons")
          .getPublicUrl(fileName);

        iconUrl = urlData.publicUrl;
      }

      // 3. ルーム作成
      const { data: roomData, error: roomError } = await supabase
        .from("chat_rooms")
        .insert([
          {
            name: name.trim(),
            icon_url: iconUrl,
          },
        ])
        .select()
        .single();

      if (roomError) throw roomError;

      // 4. メンバーとして自分を追加
      if (roomData) {
        const { error: memberError } = await supabase
          .from("chat_room_members")
          .insert([
            {
              room_id: roomData.id,
              user_id: user.id,
            },
          ]);

        if (memberError) throw memberError;

        // 5. 招待リンクをコピー
        if (roomData.invite_code) {
          await navigator.clipboard.writeText(
            `${window.location.origin}/chat/join/${roomData.invite_code}`
          );
          alert("招待リンクがコピーされました");
        }

        // 6. チャットルーム一覧に戻る
        router.push("/chat");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">新規トークルーム作成</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">ルーム名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
          </div>

          <div>
            <label className="block mb-2">アイコン画像（任意）</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setIconFile(e.target.files?.[0] || null)}
              className="w-full"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full"
          >
            {loading ? "作成中..." : "作成する"}
          </Button>
        </form>
      </div>
    </div>
  );
}
