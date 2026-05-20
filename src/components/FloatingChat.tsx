import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'ai';
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
  const greeting = `Mabuhay! ${userName ? userName + ' ' : ''}I'm your Rent4Cars Davao AI guide. How can I help you find the right car for your Mindanao road trip today?`;

  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: greeting, timestamp: new Date().toLocaleTimeString() }
  ]);

  // Update greeting when user changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === 'ai' && prev[0].text !== greeting) {
        return [{ role: 'ai', text: greeting, timestamp: new Date().toLocaleTimeString() }];
      }
      return prev;
    });
  }, [greeting]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMsg: Message = {
      role: 'user',
      text: message,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setMessage('');
    setIsLoading(true);

    let attempts = 0;
    const maxRetries = 3;
    let backoffDelay = 1000; // start with 1 second delay
    let success = false;

    while (attempts < maxRetries && !success) {
      try {
        const response = await fetch('/api/support/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: userMsg.text,
            history: messages.map(m => ({ role: m.role, text: m.text })),
            userName: userName
          })
        });

        // Determine if response is JSON before parsing
        const contentType = response.headers.get("content-type");
        let data: any = {};
        
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          // If not JSON, it's likely a 502/503 HTML page from a reverse proxy or server restart
          const text = (await response.text());
          const snippet = text.substring(0, 100).replace(/\n|\r/g, '');
          
          if (response.status === 403 || response.status === 401) {
             throw new Error("API Key Rejected: Google has blocked or rejected your API key.");
          }
          if (response.status === 429) {
             throw new Error("Service busy or quota exceeded.");
          }
          if (response.status === 503) {
             throw new Error("Service unavailable. The AI assistant is experiencing high demand.");
          }
          
          // Throw a special error message for HTML fallback
          throw new Error("html_fallback");
        }
        
        if (!response.ok) {
          // Print complete error context to browser console for debugging
          console.error(`Attempt ${attempts + 1} - AI Error context:`, data);
          
          // Force retry for 429 quota or 503 unavailable
          if ((response.status === 429 || response.status === 503) && attempts < maxRetries - 1) {
             throw new Error("Service busy or quota exceeded, triggering backoff retry.");
          }

          // If we are here, it's either not a retryable error or we've exhausted retries
          let errorMessage = "I'm sorry, I'm having trouble connecting to my AI services right now.";
          
          if (response.status === 429) {
            errorMessage = data.message || "The daily chat limit (20 messages) has been reached. Please try again tomorrow.";
          } else if (response.status === 503) {
            errorMessage = data.message || "The AI assistant is temporarily unavailable due to high demand. Please try again in a few moments.";
          } else if (data.error && (data.error.includes("API Key Missing") || data.error.includes("Invalid Configuration"))) {
            errorMessage = data.message || "AI services are not configured correctly. Please check your Gemini API key.";
          } else if (data.message || data.error) {
            errorMessage = data.message || data.error;
          }

          const aiMsg: Message = {
            role: 'ai',
            text: errorMessage,
            timestamp: new Date().toLocaleTimeString()
          };

          setMessages(prev => [...prev, aiMsg]);
          success = true; // Stop retrying since we handled it
          continue;
        }
        
        const aiMsg: Message = {
          role: 'ai',
          text: data.text || "I'm sorry, I couldn't process that request.",
          timestamp: new Date().toLocaleTimeString()
        };

        setMessages(prev => [...prev, aiMsg]);
        success = true;
        
      } catch (error: any) {
        if (error.message !== 'html_fallback') {
          console.error("Chat Error:", error.message || error);
        }
        attempts++;
        if (attempts >= maxRetries) {
          const errorMessage = error.message || '';
          const isNetworkError = errorMessage === 'Failed to fetch' || errorMessage === 'html_fallback';
          const isQuotaError = errorMessage.includes('Quota exceeded') || errorMessage.includes('Service busy');
          const isUnavailable = errorMessage.includes('Service unavailable');
          
          let displayText = `System Error: ${errorMessage || 'An unexpected error occurred'}. Please try again later.`;
          
          if (isNetworkError) {
            displayText = "The backend server is temporarily unavailable (syncing or restarting updates). Please wait a few moments and try again.";
          } else if (isQuotaError) {
            displayText = "The AI is currently at maximum capacity (Quota exceeded). Please wait a minute before sending another message.";
          } else if (isUnavailable) {
            displayText = "The AI model is experiencing high demand. Please try again soon.";
          }

          setMessages(prev => [...prev, { 
            role: 'ai', 
            text: displayText, 
            timestamp: new Date().toLocaleTimeString() 
          }]);
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          backoffDelay *= 2;
        }
      }
    }
    setIsLoading(false);
  };

  return (
    <>
      <button
        id="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-black text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
            1
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[350px] sm:w-[400px] h-[500px] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gray-900 text-white p-6 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <Bot size={24} />
              </div>
              <div>
                <h4 className="font-display font-bold text-white">Rent4Cars Support</h4>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-gray-950/50"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`p-4 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-white rounded-br-none shadow-lg shadow-primary/20' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700'
                    }`}>
                      {msg.text}
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 px-1">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-700 flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form 
              onSubmit={handleSend}
              className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2"
            >
              <input 
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about car availability..."
                className="flex-1 bg-gray-100 dark:bg-gray-800 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white transition-all outline-none"
              />
              <button 
                type="submit"
                disabled={isLoading}
                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
