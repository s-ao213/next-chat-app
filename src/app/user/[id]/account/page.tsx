// src/app/user/[id]/account/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/app/_components/Header";
import {
  Pencil,
  Save,
  X,
  AlertTriangle,
  Upload,
  User,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import { UserProfile } from "@/app/_types/user";
import { Button } from "@/app/_components/ui/Button";
import { useToast } from "@/app/_components/ui/Use-Toast";
import { Toaster } from "@/app/_components/ui/Toaster";
import error from "next/error";

export default function AccountPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: params.id,
    name: null,
    avatar_url: null,
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    id: params.id,
    name: null,
    avatar_url: null,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // プロフィールデータの取得
  const fetchProfile = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        toast({
          variant: "destructive",
          title: "エラー",
          description: "セッションの取得に失敗しました",
        });
        return;
      }

      if (!session) {
        router.push("/login");
        return;
      }

      if (session.user.id !== params.id) {
        router.push("/");
        return;
      }

      setEmail(session.user.email || "");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        if (profileError.code === "PGRST116") {
          const newProfile = {
            id: session.user.id,
            name: null,
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { data: insertedProfile, error: insertError } = await supabase
            .from("profiles")
            .insert(newProfile)
            .select()
            .single();

          if (insertError) {
            toast({
              variant: "destructive",
              title: "エラー",
              description: "プロフィールの作成に失敗しました",
            });
            return;
          }

          setProfile(insertedProfile);
          setEditedProfile(insertedProfile);
          return;
        }

        toast({
          variant: "destructive",
          title: "エラー",
          description: "プロフィールの取得に失敗しました",
        });
        return;
      }

      if (profileData) {
        setProfile(profileData);
        setEditedProfile(profileData);
      }
    } catch (error: any) {
      console.error("Error in fetchProfile:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error.message || "プロフィールの取得に失敗しました",
      });
    }
  };

  useEffect(() => {
    fetchProfile();

    const channel = supabase
      .channel(`profile:${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${params.id}`,
        },
        (payload) => {
          console.log("Profile change received:", payload);
          if (payload.new) {
            setProfile(payload.new as UserProfile);
            if (!isEditing) {
              setEditedProfile(payload.new as UserProfile);
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [params.id, router, isEditing]);

  // アバターアップロード処理
  // アバターアップロード処理
  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      setUploading(true);
      const file = event.target.files[0];

      // ファイルサイズのチェック (5MB以下に緩和)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("ファイルサイズは5MB以下にしてください");
      }

      // ファイル形式のチェック
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("JPG, PNG, GIF, WebP形式のみアップロード可能です");
      }

      // ファイル名の生成
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      if (!fileExt) {
        throw new Error("ファイル形式が不正です");
      }

      const fileName = `${params.id}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      try {
        // 古いアバター画像の削除
        if (editedProfile.avatar_url) {
          const oldPath = editedProfile.avatar_url.split("/").pop();
          if (oldPath) {
            const { error: removeError } = await supabase.storage
              .from("avatars")
              .remove([oldPath]);

            if (removeError) {
              console.error("古い画像の削除に失敗しました:", removeError);
              // 古い画像の削除に失敗しても、新しい画像のアップロードは続行
            }
          }
        }

        // 新しいアバター画像のアップロード
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("avatars")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          if (uploadError.message.includes("duplicate")) {
            throw new Error(
              "同じファイル名が既に存在します。もう一度お試しください"
            );
          }
          throw new Error(
            "画像のアップロードに失敗しました: " + uploadError.message
          );
        }

        // 公開URLの取得
        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        if (!publicUrlData.publicUrl) {
          throw new Error("画像URLの取得に失敗しました");
        }

        // プロフィールの更新
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            avatar_url: publicUrlData.publicUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", params.id);

        if (updateError) {
          // プロフィール更新に失敗した場合、アップロードした画像を削除
          await supabase.storage.from("avatars").remove([fileName]);
          throw new Error(
            "プロフィールの更新に失敗しました: " + updateError.message
          );
        }

        setEditedProfile({
          ...editedProfile,
          avatar_url: publicUrlData.publicUrl,
        });

        toast({
          variant: "success",
          title: "成功",
          description: "プロフィール画像を更新しました",
        });
      } catch (error: any) {
        throw new Error(error.message || "画像の処理中にエラーが発生しました");
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description: error.message || "画像のアップロードに失敗しました",
      });
      // エラー時は編集中のプロフィールを元に戻す
      setEditedProfile({ ...profile });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({ ...profile });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile({ ...profile });
  };

  const handleSave = async () => {
    try {
      if (!editedProfile.name?.trim()) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "名前を入力してください",
        });
        return;
      }

      const updates = {
        name: editedProfile.name.trim(),
        avatar_url: editedProfile.avatar_url,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", params.id)
        .select()
        .single();

      if (error) throw error;

      // 更新されたデータで両方のステートを更新
      setProfile(data);
      setEditedProfile(data);
      setIsEditing(false);

      // 成功のトースト表示
      toast({
        variant: "success",
        title: "保存完了",
        description: "プロフィールを更新しました",
      });
    } catch (error: any) {
      console.error("Save error:", error);
      // エラー時のトースト表示
      toast({
        variant: "destructive",
        title: "エラー",
        description: error.message || "更新中にエラーが発生しました",
      });
      // エラー時は編集中のプロフィールを元に戻す
      setEditedProfile({ ...profile });
    }
  };

  const handleUpdateEmail = async () => {
    try {
      if (!newEmail.trim()) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "新しいメールアドレスを入力してください",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        email: newEmail.trim(),
      });
      if (error) throw error;

      toast({
        title: "確認メールを送信しました",
        description: "メールの指示に従って更新を完了してください",
      });
      setIsUpdatingEmail(false);
      setNewEmail("");
    } catch (error: any) {
      console.error("Email update error:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description:
          error.message || "メールアドレスの更新中にエラーが発生しました",
      });
    }
  };

  const handleUpdatePassword = async () => {
    try {
      if (!newPassword.trim()) {
        toast({
          variant: "destructive",
          title: "エラー",
          description: "新しいパスワードを入力してください",
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword.trim(),
      });
      if (error) throw error;

      toast({
        title: "成功",
        description: "パスワードを更新しました",
      });
      setIsUpdatingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: any) {
      console.error("Password update error:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description:
          error.message || "パスワードの更新中にエラーが発生しました",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      // セッションの確認
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("セッションが見つかりません");
      }

      // 削除APIの呼び出し
      const response = await fetch("/api/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: params.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "アカウントの削除に失敗しました");
      }

      // 成功メッセージを表示
      toast({
        variant: "success",
        title: "アカウント削除完了",
        description: "アカウントが削除されました。ログイン画面に移動します。",
        duration: 3000,
      });

      // セッションのクリア
      await supabase.auth.signOut();

      // 3秒後にログイン画面にリダイレクト
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Account deletion error:", error);
      toast({
        variant: "destructive",
        title: "エラー",
        description:
          error.message || "アカウントの削除中にエラーが発生しました",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-2xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/user")}
            className="mr-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">アカウント設定</h1>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center text-blue-600 hover:text-blue-700"
            >
              <Pencil size={20} className="mr-2" />
              編集
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="flex items-center text-gray-600 hover:text-gray-700"
              >
                <X size={20} className="mr-2" />
                キャンセル
              </button>
              <button
                onClick={handleSave}
                className="flex items-center text-green-600 hover:text-green-700"
              >
                <Save size={20} className="mr-2" />
                保存
              </button>
            </div>
          )}
        </div>
        {/* プロフィール設定 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">プロフィール設定</h2>

          {/* アバター設定 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              プロフィール画像
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                {editedProfile.avatar_url ? (
                  <Image
                    src={editedProfile.avatar_url}
                    alt="Profile Avatar"
                    fill
                    sizes="(max-width: 768px) 96px, 96px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <User size={40} className="text-gray-400" />
                  </div>
                )}
              </div>
              {isEditing && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md cursor-pointer hover:bg-gray-200"
                  >
                    <Upload size={20} className="mr-2" />
                    {uploading ? "アップロード中..." : "画像をアップロード"}
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* 名前設定 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ユーザー名
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedProfile.name || ""}
                onChange={(e) =>
                  setEditedProfile({ ...editedProfile, name: e.target.value })
                }
                className="w-full p-2 border rounded-md"
              />
            ) : (
              <div className="w-full p-2 border rounded-md bg-gray-50">
                {profile.name || "未設定"}
              </div>
            )}
          </div>
        </div>
        {/* メールアドレス設定 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">メールアドレス設定</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              現在のメールアドレス
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full p-2 border rounded-md bg-gray-50"
            />
          </div>

          <button
            onClick={() => setIsUpdatingEmail(!isUpdatingEmail)}
            className="text-blue-600 hover:text-blue-700"
          >
            メールアドレスを変更する
          </button>

          {isUpdatingEmail && (
            <div className="mt-4">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="新しいメールアドレス"
                className="w-full p-2 border rounded-md mb-2"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsUpdatingEmail(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleUpdateEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  更新
                </button>
              </div>
            </div>
          )}
        </div>
        {/* パスワード設定 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">パスワード設定</h2>
          <button
            onClick={() => setIsUpdatingPassword(!isUpdatingPassword)}
            className="text-blue-600 hover:text-blue-700"
          >
            パスワードを変更する
          </button>

          {isUpdatingPassword && (
            <div className="mt-4">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="新しいパスワード"
                className="w-full p-2 border rounded-md mb-2"
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsUpdatingPassword(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleUpdatePassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  更新
                </button>
              </div>
            </div>
          )}
        </div>
        {/* アカウント削除 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center text-red-600 hover:text-red-700"
          >
            <AlertTriangle size={20} className="mr-2" />
            アカウントを削除する
          </button>

          {showDeleteConfirm && (
            <div className="mt-4 p-4 bg-red-50 rounded-md">
              <p className="text-red-700 mb-4">
                アカウントを削除すると、すべてのデータが完全に削除されます。この操作は取り消せません。
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <span className="animate-spin mr-2">⚪</span>
                      削除中...
                    </>
                  ) : (
                    "削除する"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>{" "}
      </div>
      <Toaster />
    </div>
  );
}
