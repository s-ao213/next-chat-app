"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function PasswordReset() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return; // 二重送信防止
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL ||
          "https://next-chat-app-rouge.vercel.app/login/update-password",
      });

      if (error) {
        if (error.status === 429) {
          alert("しばらく時間をおいてから再度お試しください。");
        } else {
          alert("パスワードリセットに失敗しました: " + error.message);
        }
        return;
      }

      alert("パスワードリセット用のメールを送信しました");
      router.push("/login");
    } catch (error) {
      alert("エラーが発生しました。もう一度お試しください。");
    } finally {
      // 5秒後にボタンを再度有効化
      setTimeout(() => {
        setLoading(false);
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handlePasswordResetRequest}
        className="bg-white p-6 sm:p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl mb-4 text-center">パスワード再設定</h2>
        <p className="text-center mb-4">
          パスワード再設定用のメールを送信します。登録済みのメールアドレスを入力してください。
        </p>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
          disabled={loading}
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? "送信中..." : "パスワードリセットメールを送信"}
        </button>
      </form>
    </div>
  );
}
