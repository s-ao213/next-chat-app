// src/app/api/chat/join/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { inviteCode } = await request.json();

  try {
    // ルームの取得
    const { data: room, error: roomError } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("invite_code", inviteCode)
      .single();

    if (roomError) throw roomError;
    if (!room) {
      return NextResponse.json(
        { error: "無効な招待コードです" },
        { status: 404 }
      );
    }

    // 現在のユーザーを取得
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // メンバーとして追加
    const { error: memberError } = await supabase
      .from("chat_room_members")
      .insert({
        room_id: room.id,
        user_id: user.id,
      });

    if (memberError) {
      if (memberError.code === "23505") {
        // 一意性制約違反
        return NextResponse.json(
          { error: "すでにルームに参加しています" },
          { status: 400 }
        );
      }
      throw memberError;
    }

    return NextResponse.json({ roomId: room.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "エラーが発生しました" },
      { status: 500 }
    );
  }
}
