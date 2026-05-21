import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User, MessageSquare, Circle, ChevronLeft } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface AdminLiveChatProps {
  user: any;
  onClose: () => void;
}

export default function AdminLiveChat({ user, onClose }: AdminLiveChatProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<Array<{ id: string, name: string, avatar?: string, unread: number }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatHistories, setChatHistories] = useState<Record<string, Array<{ senderRole: string, text: string, timestamp: string }>>>({});
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to WebSockets
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-admin');
    });

    newSocket.on('active-users', (users) => {
      setActiveUsers(users);
    });

    newSocket.on('new-message', (payload) => {
      setChatHistories(prev => {
        const userId = payload.userId;
        const currentHistory = prev[userId] || [];
        return {
          ...prev,
          [userId]: [...currentHistory, payload]
        };
      });

      // Increment unread if not selected
      if (payload.userId !== selectedUserId && payload.senderRole === 'customer') {
         setActiveUsers(prev => prev.map(u => u.id === payload.userId ? { ...u, unread: u.unread + 1 } : u));
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      // clear unread
      setActiveUsers(prev => prev.map(u => u.id === selectedUserId ? { ...u, unread: 0 } : u));
    }
  }, [selectedUserId, chatHistories]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistories, selectedUserId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedUserId) return;

    const payload = {
      senderName: "Admin",
      senderRole: "mechanic", // Keep legacy naming matching server
      text: inputText,
      userId: selectedUserId
    };
    
    // Optimistic UI update
    setChatHistories(prev => {
      const currentHistory = prev[selectedUserId] || [];
      return {
        ...prev,
        [selectedUserId]: [...currentHistory, { ...payload, timestamp: new Date().toLocaleTimeString() }]
      };
    });
    setInputText('');

    // Send through our standard API which produces to Kafka queue and broadcasts via socket
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-5xl h-[90vh] md:h-[80vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden ring-1 ring-gray-200 dark:ring-gray-800"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 transition-colors backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {/* Sidebar - Users List */}
        <div className={`w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 flex-col bg-gray-50/50 dark:bg-gray-950/50 ${selectedUserId ? 'hidden md:flex' : 'flex flex-1 md:flex-none'}`}>
          <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
              <MessageSquare size={20} className="text-primary" />
              Live Sessions
            </h2>
            <p className="text-sm text-gray-500 mt-1">Active customer chats</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeUsers.length === 0 ? (
              <div className="text-center text-gray-400 py-8 text-sm">
                No active users online
              </div>
            ) : (
              activeUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserId(u.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${selectedUserId === u.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-800'}`}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center overflow-hidden ${selectedUserId === u.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : <User size={18} />}
                    </div>
                    <div className="text-left flex-1 truncate">
                      <div className="font-semibold truncate w-full">{u.name}</div>
                      <div className="text-xs flex items-center gap-1 opacity-80">
                        <Circle size={8} className="fill-green-500 text-green-500" />
                        Online
                      </div>
                    </div>
                  </div>
                  {u.unread > 0 && selectedUserId !== u.id && (
                    <div className="w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                      {u.unread}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex-col bg-white dark:bg-gray-900 ${!selectedUserId ? 'hidden md:flex' : 'flex'}`}>
          {!selectedUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare size={48} className="opacity-20 mb-4" />
              <p>Select a user to start chatting</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4">
                <button 
                  onClick={() => setSelectedUserId(null)}
                  className="md:hidden w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                  <h3 className="font-bold dark:text-white truncate pr-8">
                    Chatting with {activeUsers.find(u => u.id === selectedUserId)?.name || 'Unknown'}
                  </h3>
                  <div className="text-[10px] sm:text-xs text-primary font-medium tracking-wider uppercase mt-1">Live Connection</div>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                {(chatHistories[selectedUserId] || []).map((msg, idx) => {
                  const isMechanic = msg.senderRole === 'mechanic';
                  return (
                    <div key={idx} className={`flex ${isMechanic ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-2xl ${isMechanic ? 'bg-primary text-white rounded-br-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <div className={`text-[10px] mt-2 font-mono ${isMechanic ? 'text-primary-100' : 'text-gray-500'}`}>
                          {msg.timestamp || new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(chatHistories[selectedUserId] || []).length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    No messages in current session
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-gray-100 dark:border-gray-800 flex gap-4">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a response..."
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border-none text-gray-900 dark:text-white rounded-full px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shrink-0 hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <Send size={20} className="relative -left-0.5" />
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
