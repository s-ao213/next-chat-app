"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../_components/ui/Button";
import Header from "../../_components/Header";
import { supabase } from "@/lib/supabaseClient";
import type { Message, ChatRoom, ChatRoomMember } from "../../_types/chat";
import { Send, Users, ArrowDown, Bell, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../../_components/ui/Dialog";
import { DialogClose } from "@radix-ui/react-dialog";

export default function ChatRoom() {
  const router = useRouter();
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGoBack = () => {
    router.push("/chat"); // チャット一覧ページに戻る
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
        // リアルタイム更新の処理内
        async (payload) => {
          // プロファイル情報を取得
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

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
                user: {
                  id: newMessage.user_id,
                  name:
                    profile?.name || newMessage.users?.name || "Unknown User",
                  avatar_url:
                    profile?.avatar_url || newMessage.users?.avatar_url,
                },
              },
            ]);

            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [id]);

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
      loadMessages(false);
    }, 1000);

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
    try {
      // プロファイル情報を含めたメンバー情報を取得
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, avatar_url");

      // プロファイル情報をマップとして保持
      const profilesMap = new Map(
        profilesData?.map((profile) => [profile.id, profile]) || []
      );

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

      // プロファイル情報を優先してメンバー情報を設定
      setMembers(
        data?.map((member) => ({
          ...member,
          user: {
            id: member.user_id,
            name:
              profilesMap.get(member.user_id)?.name ||
              member.users?.name ||
              "Unknown User",
            avatar_url:
              profilesMap.get(member.user_id)?.avatar_url ||
              member.users?.avatar_url,
          },
        })) || []
      );
    } catch (error) {
      console.error("Error in loadMembers:", error);
    }
  };

  const loadMessages = async (shouldScroll = true) => {
    try {
      // プロファイル情報を別途取得
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name, avatar_url");

      // プロファイル情報をマップとして保持
      const profilesMap = new Map(
        profilesData?.map((profile) => [profile.id, profile]) || []
      );

      // メッセージを取得
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
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.error("Error loading messages:", error);
        return;
      }

      // メッセージを昇順に戻して設定（プロフィール情報があれば優先）
      setMessages(
        data?.reverse().map((message) => ({
          ...message,
          user: {
            id: message.user_id,
            name:
              profilesMap.get(message.user_id)?.name ||
              message.users?.name ||
              "Unknown User",
            avatar_url:
              profilesMap.get(message.user_id)?.avatar_url ||
              message.users?.avatar_url,
          },
        })) || []
      );

      if (shouldScroll) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    } catch (error) {
      console.error("Error in loadMessages:", error);
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
            <Button
              variant="outline"
              size="icon"
              onClick={handleGoBack}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

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
              <DialogClose className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <X className="h-4 w-4" />
                <span className="sr-only">閉じる</span>
              </DialogClose>
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
                    {member.user.avatar_url ? (
                      <img
                        src={member.user.avatar_url}
                        alt=""
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-lg font-medium">
                          {member.user.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {member.user.name || "Unknown User"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {member.user_id === currentUser ? "あなた" : "メンバー"}
                      </span>
                    </div>
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
                      {!isCurrentUser && (
                        <div className="flex-shrink-0">
                          {message.user.avatar_url ? (
                            <img
                              src={message.user.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">
                                {message.user.name?.charAt(0).toUpperCase() ||
                                  "?"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      <div
                        className={`flex flex-col ${
                          isCurrentUser ? "items-end mr-2" : "items-start ml-2"
                        }`}
                      >
                        {!isCurrentUser && (
                          <div className="text-sm font-medium text-gray-600 mb-1">
                            {message.user.name || "Unknown User"}
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
