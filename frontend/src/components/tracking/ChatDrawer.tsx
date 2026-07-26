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
  
  // Pass auth token to socket connection hook
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

  // Join chat room
  useEffect(() => {
    if (token) {
      emit('join-chat', { bookingId });
      fetchChatHistory();
    }
  }, [bookingId, token]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Live listener
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
    <>
      {/* Backdrop blur overlay for mobile & tablet */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
      />

      {/* Slide-over panel: 100% width on mobile, max-w-sm on desktop */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out border-l border-slate-100 font-body">
        
        {/* Header - Glassmorphic look */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/10 rounded-xl">
              <MessageCircle className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide">Shipment Chat</h3>
              <p className="text-[10px] text-slate-400">Direct line between Shipper & Driver</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Messages list - Custom scrollbar & light gray background */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3.5 scrollbar-thin">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2">
              <MessageCircle className="w-10 h-10 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-semibold text-slate-600">No messages yet</p>
              <p className="text-[10px] max-w-[180px]">Say hello or coordinate pickup directions here.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[9px] font-semibold text-slate-400 mb-0.5 px-1">
                    {isSelf ? 'You' : msg.sender.name}
                  </span>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm font-medium ${
                      isSelf
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[8px] text-slate-400 mt-0.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input container - Fixed at bottom */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type coordination message..."
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatDrawer;
