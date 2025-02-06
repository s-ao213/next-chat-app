// src/app/user/manual/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/Button";
import Header from "@/app/_components/Header";
import { ArrowLeft } from "lucide-react";

export default function Manual() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/user")}
            className="mr-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">使い方ガイド</h1>
        </div>

        <div className="space-y-8">
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">トークルームの作成</h2>
            <p className="text-gray-600 mb-4">
              1. トークルーム一覧画面の「新規作成」ボタンをクリック
              <br />
              2. ルーム名を入力（必須）し、必要に応じてアイコン画像を設定
              <br />
              3. 「作成する」ボタンをクリックして完了
            </p>
            <div className="text-sm text-gray-500">
              ※ 一人のユーザーが作成できるトークルームは最大5つまでです。
            </div>
          </section>
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">トークルームへの参加</h2>
            <p className="text-gray-600 mb-4">
              1. トークルーム一覧画面の「チャットに参加」ボタンをクリック
              <br />
              2. 招待リンクを入力
              <br />
              3. 「参加する」ボタンをクリックして完了
            </p>
            <div className="text-sm text-gray-500">
              ※ 参加できるトークルームの数は最大5つまでです。
            </div>
          </section>
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">メンバーの招待</h2>
            <p className="text-gray-600 mb-4">
              1.
              トークルーム一覧で招待したいルームの「リンク」アイコンをクリック
              <br />
              2. 招待リンクがクリップボードにコピーされます
              <br />
              3. 招待したい相手に招待リンクを共有
            </p>
          </section>
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">ルーム名の変更</h2>
            <p className="text-gray-600 mb-4">
              1. トークルーム一覧で変更したいルームの「編集」アイコンをクリック
              <br />
              2. 新しいルーム名を入力
              <br />
              3. 「変更する」ボタンをクリックして完了
            </p>
          </section>
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              トークルームからの退出
            </h2>
            <p className="text-gray-600 mb-4">
              1.
              トークルーム一覧で退出したいルームの「ゴミ箱」アイコンをクリック
              <br />
              2. 確認ダイアログで「退出する」をクリック
            </p>
            <div className="text-sm text-gray-500">
              ※ 最後のメンバーが退出すると、トークルームは完全に削除されます。
              <br />※
              退出すると、そのルームのメッセージにはアクセスできなくなります。
            </div>
          </section>
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">アカウント設定</h2>
            <div className="text-gray-600 mb-4">
              <div className="mb-4">
                1. マイページの「アカウント設定」をクリック
              </div>

              <div className="mb-4">
                2. プロフィール設定
                <ul className="list-disc ml-8 mt-2">
                  <li>
                    プロフィール画像のアップロード（2MB以下のJPG、PNG、GIF形式）
                  </li>
                  <li>ユーザー名の設定・変更</li>
                </ul>
              </div>

              <div className="mb-4">
                3. メールアドレスの変更
                <ul className="list-disc ml-8 mt-2">
                  <li>「メールアドレスを変更する」をクリック</li>
                  <li>新しいメールアドレスを入力</li>
                  <li>確認メールの指示に従って更新を完了</li>
                </ul>
              </div>

              <div className="mb-4">
                4. パスワードの変更
                <ul className="list-disc ml-8 mt-2">
                  <li>「パスワードを変更する」をクリック</li>
                  <li>新しいパスワードを入力して更新</li>
                </ul>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              ※ プロフィール画像は2MB以下のJPG、PNG、GIF形式のみ使用可能です。
              <br />※
              アカウントを削除すると、すべてのデータが完全に削除され、元に戻すことはできません。
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
