import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Send, MessageCircle } from 'lucide-react';
import { useSocket, useSocketListener } from '@/hooks/useSocket';

interface ChatMessage {
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

interface ChatDrawerProps {
  bookingId: string;
  currentUser: {
    id: string;
    name: string;
    role: string;
  };
  onClose: () => void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ bookingId, currentUser, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const token = localStorage.getItem('token');
  const { emit } = useSocket(token);

  const fetchChatHistory = async () => {
    try {
      const res = await axios.get(`https://cargogo-api.onrender.com/api/chat/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.data);
    } catch (err) {
      console.error('Failed to load chat logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      emit('join-chat', { bookingId });
      fetchChatHistory();
    }
  }, [bookingId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useSocketListener('receive-chat-message', (newMessage: ChatMessage) => {
    if (newMessage.bookingId === bookingId) {
      setMessages((prev) => {
        if (prev.some(m => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    }
  }, [bookingId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    emit('send-chat-message', {
      bookingId,
      message: inputText.trim()
    });
    setInputText('');
  };

  return (
    /* Minimal container layout: no background blur overlay, thin borders */
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-xs bg-white shadow-xl flex flex-col border-l border-slate-200 font-body">
      
      {/* Minimal Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-slate-500" />
          <span className="font-heading font-bold text-xs text-slate-800 tracking-tight">Delivery Chat</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 bg-white space-y-3 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-4 w-4 border border-slate-300 border-t-slate-800" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-1.5">
            <p className="text-[10px] font-medium text-slate-400">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-1.5 text-xs font-medium leading-tight ${
                    isSelf
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[8px] text-slate-400 mt-0.5 px-0.5">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type message..."
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-slate-950 hover:bg-slate-800 disabled:opacity-30 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default ChatDrawer;
