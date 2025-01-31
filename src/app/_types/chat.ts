// src/app/_types/chat.ts

export interface ChatRoom {
  id: string;
  name: string;
  icon_url: string | null;
  created_at: string;
  invite_code: string;
}

export interface ChatRoomMember {
  room_id: string;
  user_id: string;
  joined_at: string;
  user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}
