import { useState, useEffect, useRef, FormEvent } from 'react';
import { MessagingService } from '../services/dataService';
import { Send, Wrench, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';

interface ChatProps {
  user: any | null;
  openAuth: () => void;
}

export default function Chat({ user, openAuth }: ChatProps) {
  const [messagesHtml, setMessagesHtml] = useState('');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchHistory = async () => {
    const html = await MessagingService.getChatHistoryHtml(user.id);
    setMessagesHtml(html);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchHistory();
    
    // Connect to WebSocket
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      const name = user.user_metadata?.full_name || user.displayName || user.email?.split('@')[0] || 'Customer';
      const avatar = user.user_metadata?.avatar_url || '';
      newSocket.emit('join-user', { id: user.id, name, avatar });
    });

    newSocket.on('new-message', (payload) => {
      // Re-fetch XSLT history since we are mixing rendering styles (backend xslt vs frontend rendering).
      // Or we can just re-fetch the history entirely when a new message arrives over the socket.
      setTimeout(fetchHistory, 500); // Give backend time to save XML
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesHtml]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    setIsSending(true);
    const senderName = user.user_metadata?.full_name || user.displayName || user.email?.split('@')[0] || 'Customer';
    await MessagingService.sendMessage(senderName, 'customer', inputText, user.id);
    setInputText('');
    setIsSending(false);
    // Note: The socket will trigger fetchHistory automatically via 'new-message'
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center space-y-8">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageSquare size={48} />
        </div>
        <h2 className="text-4xl font-display font-bold dark:text-white">Secure Gateway Access</h2>
        <div className="space-y-4 max-w-xl mx-auto">
          <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed">
            Our proprietary <span className="text-primary font-bold">Logistics Support Portal</span> utilizes state-of-the-art event streaming. 
            Once authenticated, you gain access to:
          </p>
          <ul className="grid grid-cols-2 gap-4 text-left text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Live Mechanic Diagnostics
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Transit Document Clearing
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Davao Hub Coordination
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
              Fleet Status Telemetry
            </li>
          </ul>
        </div>
        <button 
          onClick={openAuth}
          className="bg-primary text-white px-10 py-5 rounded-2xl font-bold shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all transform hover:-translate-y-1"
        >
          Authorize Secure Session
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-12 py-12">
      <div className="glass rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[700px]">
        {/* Chat Header */}
        <div className="bg-gray-900 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white relative">
              <Wrench size={24} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-bold">Logistics Support Gateway</h3>
            </div>
          </div>
          <button 
            onClick={fetchHistory}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Message Log (XSLT Rendered) */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar bg-gray-50/50 dark:bg-gray-950/50"
        >
          {loading ? (
            <div className="h-full flex items-center justify-center">
               <div className="animate-spin text-primary"><RefreshCw size={32} /></div>
            </div>
          ) : messagesHtml ? (
            <div dangerouslySetInnerHTML={{ __html: messagesHtml }} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 space-y-4">
              <MessageSquare size={48} className="opacity-20" />
              <p className="text-sm">No message logs found in XML persistent storage.</p>
            </div>
          )}
        </div>



        {/* Input Area */}
        <form onSubmit={handleSend} className="p-6 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message to the mechanics..."
            className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Send size={24} className={isSending ? 'animate-pulse' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform'} />
          </button>
        </form>
      </div>
    </div>
  );
}
