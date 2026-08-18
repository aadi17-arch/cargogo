import api from './api.service';

export interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
}

export const chatService = {
  getChatHistory: async (bookingId: string): Promise<ChatMessage[]> => {
    const res = await api.get(`/chat/${bookingId}`);
    return res.data.data;
  },
};
