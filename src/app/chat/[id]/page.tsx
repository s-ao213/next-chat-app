"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "../../_components/ui/Button";
import Header from "../../_components/Header";
import { supabase } from "@/lib/supabaseClient";
import type { Message, ChatRoom, ChatRoomMember } from "../../_types/chat";
import { Send, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../../_components/ui/Dialog";

export default function ChatRoom() {
  const { id } = useParams();
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [members, setMembers] = useState<ChatRoomMember[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 初期データの読み込み
    const initialize = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
      await Promise.all([loadRoom(), loadMembers(), loadMessages()]);
    };

    initialize();

    // 3秒ごとの自動更新
    const autoRefreshInterval = setInterval(() => {
      loadMessages();
      loadMembers();
    }, 500);

    // リアルタイムサブスクリプション
    const channel = supabase
      .channel(`room-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${id}`,
        },
        async (payload) => {
          const { data: newMessage, error } = await supabase
            .from("messages")
            .select(
              `
              *,
              users!user_id (
                id,
                name,
                avatar_url
              )
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (!error && newMessage) {
            setMessages((prev) => [
              ...prev,
              {
                ...newMessage,
                user: newMessage.users,
              },
            ]);
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        }
      )
      .subscribe();

    // クリーンアップ
    return () => {
      clearInterval(autoRefreshInterval);
      channel.unsubscribe();
    };
  }, [id]);

  const loadRoom = async () => {
    const { data, error } = await supabase
      .from("chat_rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (error) console.error("Error loading room:", error);
    else setRoom(data);
  };

  const loadMembers = async () => {
    const { data, error } = await supabase
      .from("chat_room_members")
      .select(
        `
        *,
        users!user_id (
          id,
          name,
          avatar_url
        )
      `
      )
      .eq("room_id", id);

    if (error) {
      console.error("Error loading members:", error);
      return;
    }

    setMembers(
      data?.map((member) => ({
        ...member,
        user: member.users,
      })) || []
    );
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
        *,
        users!user_id (
          id,
          name,
          avatar_url
        )
      `
      )
      .eq("room_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    const newMessages =
      data?.map((message) => ({
        ...message,
        user: message.users,
      })) || [];

    // メッセージが変更されている場合のみ更新
    if (JSON.stringify(messages) !== JSON.stringify(newMessages)) {
      setMessages(newMessages);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      const { error } = await supabase.from("messages").insert([
        {
          room_id: id,
          user_id: currentUser,
          content: newMessage.trim(),
        },
      ]);

      if (error) throw error;
      setNewMessage("");

      // 送信後に最新メッセージを読み込み
      await loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white p-4 rounded-t-lg shadow flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {room?.icon_url && (
              <img
                src={room.icon_url}
                alt=""
                className="w-10 h-10 rounded-full"
              />
            )}
            <h1 className="text-xl font-bold">{room?.name}</h1>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Users className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>メンバー一覧</DialogTitle>
                <DialogDescription>
                  このチャットルームに参加しているメンバーです
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center space-x-3"
                  >
                    {member.user.avatar_url && (
                      <img
                        src={member.user.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span>{member.user.name}</span>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white h-[60vh] overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = message.user_id === currentUser;
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} items-end space-x-2`}
                  >
                    {!isCurrentUser && message.user.avatar_url && (
                      <img
                        src={message.user.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div
                      className={`max-w-xs space-y-1 ${isCurrentUser ? "mr-2" : "ml-2"}`}
                    >
                      {!isCurrentUser && (
                        <div className="text-sm text-gray-600">
                          {message.user.name}
                        </div>
                      )}
                      <div
                        className={`rounded-lg p-3 ${
                          isCurrentUser
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form
          onSubmit={sendMessage}
          className="bg-white p-4 rounded-b-lg shadow"
        >
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力..."
              className="flex-1 p-2 border rounded-lg"
            />
            <Button type="submit" disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
