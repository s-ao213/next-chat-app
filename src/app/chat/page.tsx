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
import {
  PlusCircle,
  Trash2,
  Edit,
  Link,
  UserPlus,
  X,
  Loader2,
} from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export default function ChatRoomList() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [newName, setNewName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const router = useRouter();
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  useEffect(() => {
    // 初回読み込み
    const loadInitialData = async () => {
      await loadRooms();
    };
    loadInitialData();

    // 3秒ごとに自動更新
    const intervalId = setInterval(() => {
      loadRooms();
    }, 3000); // 3000ミリ秒 = 3秒

    // クリーンアップ関数（コンポーネントがアンマウントされたときに実行）
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleRoomClick = (roomId: string) => {
    setLoadingRoomId(roomId);
    router.push(`/chat/${roomId}`);
  };

  const handleJoinRoom = async () => {
    if (!inviteCode.trim()) return;

    // URLから招待コードを抽出するロジック
    let code = inviteCode.trim();

    // URLの場合は最後のセグメントを取得
    if (code.includes("/")) {
      code = code.split("/").filter(Boolean).pop() || "";
    }

    // クエリパラメータを含む場合は除去
    code = code.split("?")[0];

    if (!code) {
      alert("有効な招待コードを入力してください");
      return;
    }

    console.log("Joining room with code:", code); // デバッグ用
    router.push(`/chat/join/${code}`);
    setInviteCode(""); // 入力をクリア
  };

  const handleLeaveRoom = (roomId: string) => {
    setRoomToDelete(roomId);
  };

  // loadRooms関数
  const loadRooms = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error("User error:", userError);
        return;
      }

      // ユーザーが参加しているルームを取得
      const { data: memberData, error: memberError } = await supabase
        .from("chat_room_members")
        .select("room_id")
        .eq("user_id", user.id);

      if (memberError) {
        console.error("Member error:", memberError);
        return;
      }

      // ルームIDの配列を作成
      const roomIds = memberData.map((member) => member.room_id);

      if (roomIds.length === 0) {
        setRooms([]);
        return;
      }

      // ルーム情報を取得
      const { data: roomData, error: roomError } = await supabase
        .from("chat_rooms")
        .select("*")
        .in("id", roomIds)
        .order("created_at", { ascending: false });

      if (roomError) {
        console.error("Room error:", roomError);
        return;
      }
      setRooms(roomData || []);
    } catch (error) {
      console.error("Error in loadRooms:", error);
    }
  };
  const confirmLeaveRoom = async () => {
    if (!roomToDelete) return;

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

      // まず、そのルームのメンバー数を確認
      const { count: memberCount, error: memberCountError } = await supabase
        .from("chat_room_members")
        .select("*", { count: "exact" })
        .eq("room_id", roomToDelete);

      if (memberCountError) {
        console.error("Member count error:", memberCountError);
        return;
      }

      // メンバーを削除
      const { error: deleteError } = await supabase
        .from("chat_room_members")
        .delete()
        .match({
          room_id: roomToDelete,
          user_id: user.id,
        });

      if (deleteError) {
        console.error("Delete error:", deleteError);
        return;
      }

      // もし最後のメンバーであれば、関連するメッセージと部屋を削除
      if (memberCount === 1) {
        // メッセージを削除
        await supabase.from("messages").delete().eq("room_id", roomToDelete);

        // チャットルームを削除
        await supabase.from("chat_rooms").delete().eq("id", roomToDelete);
      }

      // ルーム一覧を再読み込み
      await loadRooms();

      // ダイアログを閉じる
      setRoomToDelete(null);
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
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="mr-2 h-4 w-4" />
                  チャットに参加
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>チャットルームに参加</DialogTitle>
                  <DialogDescription>
                    招待リンクまたは招待コードを入力してください
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="招待コードを入力"
                    className="border p-2 rounded w-full text-black dark:text-white dark:bg-gray-800 bg-white"
                  />
                  <Button
                    onClick={handleJoinRoom}
                    className="w-full"
                    disabled={!inviteCode.trim()}
                  >
                    参加する
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={() => router.push("/chat/new")}>
              <PlusCircle className="mr-2" />
              新規作成
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
            >
              <div
                className="flex items-center space-x-4 cursor-pointer"
                onClick={() => handleRoomClick(room.id)}
              >
                {room.icon_url && (
                  <img
                    src={room.icon_url}
                    alt=""
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{room.name}</span>
                  {loadingRoomId === room.id && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                  )}
                </div>
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
                    <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                      <X className="h-4 w-4" />
                      <span className="sr-only">閉じる</span>
                    </DialogPrimitive.Close>
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
                        className="border p-2 rounded w-full bg-white text-black dark:bg-gray-800 dark:text-white"
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
                  onClick={() => handleLeaveRoom(room.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Dialog
                  open={roomToDelete !== null}
                  onOpenChange={() => setRoomToDelete(null)}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>トークルームから退出</DialogTitle>
                      <DialogDescription>
                        本当にこのトークルームから退出しますか？
                        退出すると、このルームのすべてのメッセージも削除されます。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setRoomToDelete(null)}
                      >
                        キャンセル
                      </Button>
                      <Button variant="destructive" onClick={confirmLeaveRoom}>
                        退出する
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
