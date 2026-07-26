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
  const { emit } = useSocket();

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
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

  // Join the chat room on mount
  useEffect(() => {
    emit('join-chat', { bookingId });
    fetchChatHistory();
  }, [bookingId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listener for new messages
  useSocketListener('receive-chat-message', (newMessage: ChatMessage) => {
    if (newMessage.bookingId === bookingId) {
      // Append if it doesn't already exist in state
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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-100 transition-transform duration-300 transform translate-x-0">
      {/* Header */}
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MessageCircle className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-display font-bold text-sm tracking-wide">Coordination Chat</h3>
            <p className="text-[10px] text-slate-400">Direct link to your delivery operator</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 space-y-2">
            <MessageCircle className="w-10 h-10 text-slate-300 stroke-[1.5]" />
            <p className="font-body text-xs">No coordination messages yet.</p>
            <p className="text-[10px] max-w-[200px]">Send directions or delivery updates below.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderId === currentUser.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                  {isSelf ? 'You' : msg.sender.name} ({msg.sender.role})
                </span>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs font-body shadow-sm leading-relaxed ${
                    isSelf
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}
                >
                  {msg.message}
                </div>
                <span className="text-[8px] text-slate-400 mt-1 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-body text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatDrawer;
