import { IMediaFile } from 'src/models/chats.model';

export interface SetSocketIdData {
  user_id: string;
  socket_id: string;
  device_token: string;
}

export interface CheckUserIsOnlineData {
  user_id: string;
}

export interface SendMessageData {
  sender_id: string;
  chat_room_id: string;
  receiver_id: string;
  message: string;
  message_type: string;
  media_file?: IMediaFile[];
  ln?: string;
}

export interface CreateRoomData {
  user_id: string;
  other_user_id: string;
  ln?: string;
}

export interface DeleteChatRoomData {
  chat_room_id: string;
  user_id: string;
  ln?: string;
}

export interface ChangeScreenStatusData {
  user_id: string;
  screen_status: boolean;
  chat_room_id: string;
  socket_id: string;
  ln?: string;
}

export interface ChatUserListData {
  user_id: string;
  search?: string;
  page?: number;
  limit?: number;
  ln?: string;
}

export interface UpdatedChatRoomData {
  user_id: string;
  chat_room_id: string;
  ln?: string;
}

export interface GetAllMessageData {
  chat_room_id: string;
  user_id: string;
  page?: number;
  limit?: number;
  ln?: string;
}

export interface EditMessageData {
  chat_id: string;
  chat_room_id: string;
  user_id: string;
  message: string;
  ln?: string;
}

export interface DeleteMessageData {
  chat_room_id: string;
  chat_id: string;
  user_id: string;
  ln?: string;
}

export interface ReadMessageData {
  chat_room_id: string;
  user_id: string;
  ln?: string;
}
