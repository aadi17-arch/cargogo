import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Send, MessageSquare, RotateCw } from 'lucide-react';
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

  
  useSocketListener('error', (err: any) => {
    import('react-hot-toast').then(({ toast }) => {
      toast.error(err?.message || 'Socket error occurred');
    });
  }, []);

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
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-24 sm:right-6 sm:left-auto z-[2000] w-full sm:w-[360px] h-[50vh] sm:h-[480px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col border-t sm:border border-slate-200 overflow-hidden font-body animate-in slide-in-from-bottom-5 duration-200">

      {}
      <div className="flex justify-center py-1.5 sm:hidden shrink-0 bg-slate-900">
        <div className="w-10 h-1 bg-slate-700 rounded-full" />
      </div>

      {}
      <div className="px-4 py-2.5 sm:py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-xs tracking-tight">Support</h3>
            <p className="text-[9px] text-slate-400 font-medium">Talk to Agent</p>
          </div>
        </div>

        {}
        <div className="flex items-center gap-2">
          <button
            onClick={fetchChatHistory}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reload Chat"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3.5 scrollbar-thin">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-semibold text-slate-600">No messages yet</p>
            <p className="text-[10px] max-w-[180px] text-slate-400">Type a message below to coordinate delivery details.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-0.5`}
              >
                {}
                <span className="text-[9px] font-bold text-slate-400 px-1">
                  {msg.sender.name}
                </span>

                {}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-normal shadow-sm font-medium ${
                    isSelf
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-200/60'
                  }`}
                >
                  {msg.message}
                </div>

                {}
                <span className="text-[8px] text-slate-400 px-1 mt-0.5">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-200"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default ChatDrawer;
