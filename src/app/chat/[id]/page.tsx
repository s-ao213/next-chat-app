"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "../../_components/ui/Button";
import Header from "../../_components/Header";
import { supabase } from "@/lib/supabaseClient";
import type { Message, ChatRoom, ChatRoomMember } from "../../_types/chat";
import { Send, Users, ArrowDown, Bell } from "lucide-react";
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
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // スクロールを処理する関数
  const scrollToBottom = () => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 初期化用のuseEffect（最初のページ読み込み時の処理）
  useEffect(() => {
    const initialize = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user?.id || null);
      await Promise.all([loadRoom(), loadMembers(), loadMessages()]);
    };

    initialize();
  }, [id]); // idが変更されたときにも再読み込み

  useEffect(() => {
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

            // 自分のメッセージでない場合、かつ画面下部を見ていない場合
            if (newMessage.user_id !== currentUser && !shouldAutoScroll) {
              setUnreadCount((prev) => prev + 1);
            }

            if (newMessage.user_id === currentUser || shouldAutoScroll) {
              scrollToBottom();
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [id, currentUser, shouldAutoScroll]);

  // スクロールイベントのハンドラを追加
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 100;
      setShouldAutoScroll(isNearBottom);
      if (isNearBottom) {
        setUnreadCount(0);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // 3秒ごとの自動更新を追加
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages(false); // falseを渡してスクロールを制御
    }, 3000);

    return () => clearInterval(interval);
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

  const loadMessages = async (shouldScroll = true) => {
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

    setMessages(
      data?.map((message) => ({
        ...message,
        user: message.users,
      })) || []
    );

    if (shouldScroll) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
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
      setShouldAutoScroll(true); // 自分のメッセージを送信したら自動スクロールを有効に
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
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{room?.name}</h1>
              {!shouldAutoScroll && unreadCount > 0 && (
                <span className="inline-flex items-center justify-center bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
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

        <div className="relative">
          <div
            className="bg-white h-[60vh] overflow-y-auto p-4"
            ref={messagesContainerRef}
          >
            <div className="space-y-4">
              {messages.map((message, index) => {
                const isCurrentUser = message.user_id === currentUser;
                const isLastMessage = index === messages.length - 1;
                const messageTime = new Date(
                  message.created_at
                ).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} ${
                      isLastMessage ? "animate-fade-in-highlight" : ""
                    } transition-all duration-300 ease-out`}
                  >
                    <div
                      className={`flex ${
                        isCurrentUser ? "flex-row-reverse" : "flex-row"
                      } items-end gap-2`}
                    >
                      {!isCurrentUser && message.user.avatar_url && (
                        <img
                          src={message.user.avatar_url}
                          alt=""
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      )}
                      <div
                        className={`flex flex-col ${isCurrentUser ? "items-end mr-2" : "items-start ml-2"}`}
                      >
                        {!isCurrentUser && (
                          <div className="text-sm text-gray-600 mb-1">
                            {message.user.name}
                          </div>
                        )}
                        <div className="flex items-end gap-2">
                          {!isCurrentUser && <div className="w-2" />}
                          <div
                            className={`rounded-lg p-3 ${
                              isCurrentUser
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            } max-w-sm break-words`}
                          >
                            {message.content}
                          </div>
                          <div className="text-xs text-gray-500 min-w-[4em]">
                            {messageTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* 新着メッセージ通知 */}
          {!shouldAutoScroll && unreadCount > 0 && (
            <div className="absolute bottom-4 right-4 z-10">
              <button
                onClick={scrollToBottom}
                className="bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 hover:bg-blue-600 transition-colors animate-bounce shadow-lg hover:shadow-xl"
              >
                <Bell className="h-4 w-4" />
                <span className="mx-1">{unreadCount}件の新着メッセージ</span>
                <ArrowDown className="h-4 w-4 animate-bounce" />
              </button>
            </div>
          )}
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
