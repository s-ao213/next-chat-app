// src/app/chat/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../_components/ui/Button";
import Header from "../_components/Header";
import { supabase } from "@/lib/supabaseClient";
import type { ChatRoom } from "../_types/chat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../_components/ui/Dialog";
import { PlusCircle, Trash2, Edit, Link } from "lucide-react";

export default function ChatRoomList() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [newName, setNewName] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadRooms();
  }, []);

  // loadRooms関数を修正
  const loadRooms = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("chat_rooms")
        .select(
          `
        *,
        chat_room_members!inner(user_id)
      `
        )
        .eq("chat_room_members.user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading rooms:", error);
        return;
      }

      setRooms(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const leaveRoom = async (roomId: string) => {
    try {
      // 現在のユーザーを取得
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        console.error("User not found");
        return;
      }

      // メンバーを削除
      const { error: deleteError } = await supabase
        .from("chat_room_members")
        .delete()
        .match({
          room_id: roomId,
          user_id: user.id,
        });

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return;
      }

      // ルーム一覧を再読み込み
      await loadRooms();
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  const updateRoomName = async (roomId: string, newName: string) => {
    const { error } = await supabase
      .from("chat_rooms")
      .update({ name: newName })
      .eq("id", roomId);
    if (error) console.error(error);
    else {
      loadRooms();
      setSelectedRoom(null);
    }
  };

  const copyInviteLink = async (inviteCode: string) => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/chat/join/${inviteCode}`
    );
    alert("招待リンクをコピーしました");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">トークルーム一覧</h1>
          <Button onClick={() => router.push("/chat/new")}>
            <PlusCircle className="mr-2" />
            新規作成
          </Button>
        </div>

        <div className="space-y-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
            >
              <div
                className="flex items-center space-x-4"
                onClick={() => router.push(`/chat/${room.id}`)}
              >
                {room.icon_url && (
                  <img
                    src={room.icon_url}
                    alt=""
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <span className="font-medium">{room.name}</span>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyInviteLink(room.invite_code)}
                >
                  <Link className="h-4 w-4" />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedRoom(room);
                        setNewName(room.name);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>ルーム名を変更</DialogTitle>
                      <DialogDescription>
                        新しいルーム名を入力してください
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="border p-2 rounded w-full"
                      />
                      <Button
                        onClick={() =>
                          selectedRoom &&
                          updateRoomName(selectedRoom.id, newName)
                        }
                        className="w-full"
                      >
                        変更する
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => leaveRoom(room.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
