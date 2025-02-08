// src/app/login/help/page.tsx
"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

export default function LoginHelp() {
  const faqs = [
    {
      question: "アカウントを作成したがログインできない",
      answer: `メールアドレスによる認証ができていない可能性があります。
登録したメールアドレス宛に認証メールが来ているか確認お願いしてします。
注意：初回は迷惑メールとして届いている可能性があります。`,
    },
    {
      question: "パスワードの再発行のやり方がわからない",
      answer:
        "ログイン画面の「パスワードをお忘れの方はこちら」をクリックすると、パスワード再発行の手続きができます。登録済みのメールアドレスに再設定用のリンクが送信されます。",
    },
    {
      question: "メールアドレスの認証メールが届かない",
      answer:
        "迷惑メールフォルダをご確認ください。また、メールアドレスの入力に誤りがないかご確認ください。しばらく待っても届かない場合は、再度アカウント登録を行ってください。",
    },
    {
      question: "ログインに何度も失敗する",
      answer:
        "パスワードは大文字・小文字を区別します。パスワードをご確認いただき、それでもログインできない場合は、パスワードの再設定をお試しください。",
    },
    {
      question: "アプリの使い方がわからない",
      answer:
        "ログイン後ヘッダーの人型アイコンからマイページに移動します。そこから使い方ガイドが確認できます。",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 flex items-center">
          <Link
            href="/login"
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="text-xl mr-2" />
            ログイン画面に戻る
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-8 text-center">ログインヘルプ</h1>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b pb-4 last:border-b-0">
              <h2 className="text-lg font-semibold mb-2 text-blue-600">
                Q. {faq.question}
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                A. {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
