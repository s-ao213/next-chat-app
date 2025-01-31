// src/app/chat/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../_components/ui/Button";
import Header from "../../_components/Header";
import { supabase } from "@/lib/supabaseClient";

export default function NewChatRoom() {
  const [name, setName] = useState("");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("認証が必要です");
      }

      let iconUrl = null;
      if (iconFile) {
        const fileExt = iconFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("room-icons")
          .upload(fileName, iconFile);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("room-icons")
          .getPublicUrl(fileName);
        iconUrl = data.publicUrl;
      }

      // チャットルーム作成
      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .insert([
          {
            name,
            icon_url: iconUrl,
          },
        ])
        .select()
        .single();

      if (roomError) throw roomError;

      // メンバー追加（created_atを除去、joined_atは自動設定される）
      const { error: memberError } = await supabase
        .from("chat_room_members")
        .insert({
          room_id: room.id,
          user_id: user.id,
        });

      if (memberError) {
        console.error("Member Error:", memberError);
        // ルームを削除
        await supabase.from("chat_rooms").delete().eq("id", room.id);
        throw memberError;
      }

      if (room.invite_code) {
        await navigator.clipboard.writeText(
          `${window.location.origin}/chat/join/${room.invite_code}`
        );
      }

      router.push("/chat");
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "作成中..." : "作成する"}
          </Button>
        </form>
      </div>
    </div>
  );
}
