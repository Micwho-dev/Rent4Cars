import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, User, Terminal } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthProps {
  onClose: () => void;
  onBypass: (user: any) => void;
}

export default function Auth({ onClose, onBypass }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // MASTER ACCESS BYPASS for testing in AI Studio
    if (email === 'admin@rent4cars.com' && password === 'password123') {
       onBypass({
         displayName: name || 'Admin User',
         email: 'admin@rent4cars.com',
         id: 'mock-admin-123',
         user_metadata: { full_name: name || 'Admin User' }
       });
       if (!isLogin) {
         alert("Bypass Registration successful! Logging in as Admin.");
       }
       setLoading(false);
       return;
    }

    // Check if using placeholders or missing config
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const isPlaceholder = !supabaseUrl || supabaseUrl.includes('placeholder');
    
    if (isPlaceholder) {
       setError("Supabase Setup Required: Go to 'Settings > Secrets' and add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. For now, use email: admin@rent4cars.com / pass: password123 to enter.");
       setLoading(false);
       return;
    }

    try {
      // Set a safety timeout - sometimes Supabase can hang if network is weird or keys are invalid
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("The connection to Supabase timed out. CHECK YOUR SECRETS: Look for extra spaces or typos in VITE_SUPABASE_URL in Project Settings > Secrets.")), 15000)
      );

      if (isLogin) {
        const loginPromise = supabase.auth.signInWithPassword({ email, password });
        const result: any = await Promise.race([loginPromise, timeoutPromise]);
        
        if (result.error) throw result.error;
        
        const { data } = result;
        if (!data.session && data.user) {
           setError("Email not confirmed. Please check your inbox for a verification link from Supabase before you can log in.");
           setLoading(false);
           return;
        }

        if (data?.user) {
           console.log("Login successful", data.user.id);
        }
      } else {
        const signupPromise = supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: name }
          }
        });
        const result: any = await Promise.race([signupPromise, timeoutPromise]);
        
        if (result.error) throw result.error;
        
        const { data } = result;
        // If Supabase is configured to require email confirmation, session will be null
        if (!data.session) {
           alert("Registration successful! Check your email for a verification link to activate your account.");
           setIsLogin(true);
           setLoading(false);
           return;
        }
      }
      onClose();
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message || "An unexpected authentication error occurred.";
      if (msg.includes("Failed to fetch") || msg.includes("timeout")) {
        msg = `Connection Error: ${msg}. Please ensure your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your local .env file are correct.`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl shadow-gray-900/20 overflow-hidden"
      >
        <div className="absolute top-6 right-6">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-10">
          <div className="mb-8 text-center">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
               <img src="https://i.postimg.cc/m2R4f9Fv/Rent4Cars.png" alt="Rent4Cars Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white">{isLogin ? 'Login' : 'Register'}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Welcome to Rent4Cars</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
              />
            </div>

            {error && (
              <p className="text-xs text-primary font-bold bg-primary/5 p-3 rounded-lg border border-primary/10">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold hover:underline"
            >
              {isLogin ? 'Register' : 'Login Now'}
            </button>
          </p>
        </div>
        

      </motion.div>
    </div>
  );
}
