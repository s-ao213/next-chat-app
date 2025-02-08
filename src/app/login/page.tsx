// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("ログインに失敗しました: " + error.message);
      return;
    }

    router.push("/chat");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 sm:p-8 rounded shadow-md w-full max-w-md relative"
      >
        <Link
          href="/login/help"
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
          title="ヘルプ"
        >
          <FontAwesomeIcon icon={faQuestionCircle} className="text-xl" />
        </Link>

        <h2 className="text-2xl mb-4 text-center">ログイン</h2>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          ログイン
        </button>
        <div className="mt-4 text-center space-y-2">
          <Link
            href="/login/new"
            className="block text-blue-500 hover:underline"
          >
            アカウントをお持ちでない方はこちら
          </Link>
          <Link
            href="/login/reissue"
            className="block text-blue-500 hover:underline"
          >
            パスワードを忘れた方はこちら
          </Link>
        </div>
      </form>
    </div>
  );
}
