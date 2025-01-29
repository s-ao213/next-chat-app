"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Header from "@/app/_components/Header";

export default function OrdersPage() {
  // 名前を明確にする
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
        }
      } catch (error) {
        console.error("認証エラー:", error);
        router.push("/login");
      }
    };

    checkUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="p-8">
        <h1 className="text-2xl font-bold mb-4">chat</h1>
      </main>
    </div>
  );
}
