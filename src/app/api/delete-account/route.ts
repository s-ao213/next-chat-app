import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    // プロフィールの削除を試みる
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .match({ id: userId });

    if (profileError) {
      console.error("Profile deletion error:", profileError);
    }

    // ユーザーの削除
    const { error: userError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (userError) {
      console.error("User deletion error:", userError);
      return NextResponse.json(
        { error: "ユーザーの削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "アカウントが正常に削除されました",
    });
  } catch (error: any) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: error.message || "アカウントの削除に失敗しました" },
      { status: 500 }
    );
  }
}
