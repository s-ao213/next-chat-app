"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Header from "@/app/_components/Header";
import { UserCog, BookOpen, ArrowLeft } from "lucide-react"; // BookOpenアイコンを追加
import { Button } from "@/app/_components/ui/Button";

export default function UserPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUserId(session.user.id);
    };

    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/")}
            className="mr-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">マイページ</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* アカウント情報カード */}
          <div
            onClick={() => userId && router.push(`/user/${userId}/account`)}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-4 mb-4">
              <UserCog size={32} className="text-blue-600" />
              <h2 className="text-xl font-semibold">アカウント設定</h2>
            </div>
            <p className="text-gray-600">
              アカウント情報の確認・変更ができます。
            </p>
          </div>

          {/* 使い方ガイドカード */}
          <div
            onClick={() => router.push("/user/manual")}
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-4 mb-4">
              <BookOpen size={32} className="text-green-600" />
              <h2 className="text-xl font-semibold">使い方ガイド</h2>
            </div>
            <p className="text-gray-600">
              アプリケーションの使い方や便利な機能を確認できます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
