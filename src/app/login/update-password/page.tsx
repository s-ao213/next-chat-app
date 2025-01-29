"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSessionSet, setIsSessionSet] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const setupSession = async () => {
      // URLからハッシュパラメータを取得
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (error) {
            console.error("Session setup error:", error);
            alert("セッションの設定に失敗しました");
            router.push("/login");
            return;
          }

          setIsSessionSet(true);
        } catch (error) {
          console.error("Session setup error:", error);
          alert("セッションの設定に失敗しました");
          router.push("/login");
        }
      } else {
        console.error("No access token found in URL");
        alert("認証情報が見つかりません");
        router.push("/login");
      }
    };

    setupSession();
  }, [router]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSessionSet) {
      alert("セッションが設定されていません。もう一度お試しください。");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("パスワードが一致しません");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      alert("パスワードが正常に更新されました");
      router.push("/login");
    } catch (error: any) {
      console.error("Password update error:", error);
      alert(`パスワード更新に失敗しました: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form
        onSubmit={handlePasswordUpdate}
        className="bg-white p-6 sm:p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl mb-4 text-center">新しいパスワードの設定</h2>
        <input
          type="password"
          placeholder="新しいパスワード"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
          minLength={6}
        />
        <input
          type="password"
          placeholder="パスワード（確認）"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
          minLength={6}
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={!isSessionSet}
        >
          パスワードを更新
        </button>
      </form>
    </div>
  );
}
