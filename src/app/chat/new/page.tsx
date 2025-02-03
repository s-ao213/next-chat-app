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
    let createdRoomId: string | null = null;

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
        try {
          if (iconFile.size > 5 * 1024 * 1024) {
            alert("画像ファイルは5MB以下にしてください");
            return;
          }

          const fileExt = iconFile.name.split(".").pop()?.toLowerCase();
          if (!["jpg", "jpeg", "png", "gif"].includes(fileExt || "")) {
            alert("JPG、PNG、GIF形式の画像のみアップロード可能です");
            return;
          }

          const fileName = `${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from("room-icons")
            .upload(fileName, iconFile, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from("room-icons")
            .getPublicUrl(fileName);

          iconUrl = urlData.publicUrl;
        } catch (error) {
          console.error("Icon upload error:", error);
          // アイコンのアップロードに失敗しても続行
          console.log("Continuing without icon...");
        }
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

      if (roomData) {
        createdRoomId = roomData.id;

        // 4. メンバーとして自分を追加
        const { error: memberError } = await supabase
          .from("chat_room_members")
          .insert([
            {
              room_id: roomData.id,
              user_id: user.id,
            },
          ]);

        if (memberError) throw memberError;

        // 5. クリップボードへのコピーを試みる（失敗しても続行）
        if (roomData.invite_code) {
          try {
            const inviteLink = `${window.location.origin}/chat/join/${roomData.invite_code}`;
            await navigator.clipboard.writeText(inviteLink);
            console.log("Invite link copied successfully");
          } catch (clipboardError) {
            console.error("Clipboard error:", clipboardError);
            // クリップボードエラーは無視
          }
        }

        // 6. 成功メッセージを表示して画面遷移
        alert("トークルームを作成しました");

        // 少し待ってから画面遷移
        setTimeout(() => {
          router.push("/chat");
        }, 500);
      }
    } catch (error) {
      console.error("Error in room creation:", error);

      if (createdRoomId) {
        // ルームは作成されているが何らかのエラーが発生した場合
        alert(
          "トークルームは作成されましたが、一部の処理に失敗しました。チャット一覧に戻ります。"
        );
        setTimeout(() => {
          router.push("/chat");
        }, 500);
      } else {
        alert("エラーが発生しました。もう一度お試しください。");
      }
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
              maxLength={50}
              className="w-full p-2 border rounded"
              placeholder="ルーム名を入力（50文字以内）"
            />
          </div>

          <div>
            <label className="block mb-2">アイコン画像（任意）</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.size > 5 * 1024 * 1024) {
                  alert("画像ファイルは5MB以下にしてください");
                  e.target.value = "";
                  return;
                }
                setIconFile(file || null);
              }}
              className="w-full"
            />
            <p className="text-sm text-gray-500 mt-1">
              5MB以下のJPG、PNG、GIF形式の画像を使用してください
            </p>
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
