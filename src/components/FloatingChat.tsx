import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import AdminLiveChat from './AdminLiveChat';

interface Message {
  role: 'user' | 'mechanic' | 'system';
  text: string;
  timestamp: string;
}

interface FloatingChatProps {
  user: any | null;
}

export default function FloatingChat({ user }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  
  const userName = user?.user_metadata?.full_name || user?.displayName || user?.email?.split('@')[0] || '';
  const isAdmin = user?.email === 'admin@rent4cars.com';
  const greeting = `Mabuhay! ${userName ? userName + ' ' : ''}You are connected to a live session. How can our admins help you today?`;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', text: greeting, timestamp: new Date().toLocaleTimeString() }
  ]);

  const [socket, setSocket] = useState<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !user) return; // Connect only when opened and logged in

    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      const avatar = user.user_metadata?.avatar_url || '';
      newSocket.emit('join-user', { id: user.id, name: userName || 'Customer', avatar });
    });

    newSocket.on('new-message', (payload) => {
      if (payload.senderRole === 'mechanic') {
        const aiMsg: Message = {
          role: 'mechanic',
          text: payload.text,
          timestamp: payload.timestamp || new Date().toLocaleTimeString()
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isOpen, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || !user) return;

    const userMsg: Message = {
      role: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    
    const payload = {
      senderName: userName || 'Customer',
      senderRole: 'customer',
      text: message,
      userId: user.id
    };
    
    setMessage('');

    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!isAdmin && (
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 -right-2 sm:right-0 w-[calc(100vw-2rem)] sm:w-96 max-h-[80vh] min-h-[450px] bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col"
          >
            {/* Header */}
            <div className="bg-primary p-4 sm:p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base">Live Customer Support</h3>
                  <div className="text-xs text-primary-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse mr-1"></span>
                    Rent4Cars Online
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            {!user ? (
               <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <User size={48} className="text-gray-300 dark:text-gray-700 mx-auto" />
                  <p className="text-gray-500 dark:text-gray-400">Please sign in to access live support.</p>
               </div>
            ) : (
              <>
                <div 
                  ref={scrollRef}
                  className="flex-1 p-5 overflow-y-auto bg-gray-50/50 dark:bg-gray-950/50 flex flex-col custom-scrollbar h-[350px]"
                >
                  {messages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                          msg.role === 'user' 
                            ? 'bg-primary text-white rounded-br-sm' 
                            : msg.role === 'mechanic' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-gray-800' 
                            : 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-[13px] sm:text-sm leading-relaxed">{msg.text}</p>
                        <div className={`text-[10px] mt-1.5 font-mono ${
                          msg.role === 'user' ? 'text-primary-100' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                  <form 
                    onSubmit={handleSend}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 sm:px-5 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white transition-all shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim()}
                      className="w-11 h-11 sm:w-12 sm:h-12 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:hover:shadow-md shrink-0"
                      aria-label="Send message"
                    >
                      <Send size={18} className="relative -left-0.5" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-primary-dark transition-all transform hover:scale-105 active:scale-95 group relative z-[51]"
        aria-label="Toggle live chat"
      >
        <MessageCircle size={28} className={`transition-transform duration-300 ${isOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
        <X size={28} className={`absolute transition-transform duration-300 ${isOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`} />
      </button>
    </div>
    
    <AnimatePresence>
      {isOpen && isAdmin && (
        <AdminLiveChat user={user} onClose={() => setIsOpen(false)} />
      )}
    </AnimatePresence>
    </>
  );
}
