import { useState, FormEvent, useRef, ChangeEvent, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, User, MapPin, Camera, Save, Loader2, Upload, FileText, Download, Car, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationService } from '../services/dataService';
import MyRentals from './MyRentals';
import AdminRentals from './AdminRentals';

interface UserProfileProps {
  user: any;
  onClose: () => void;
  onUpdate: (updatedUser: any) => void;
}

export default function UserProfile({ user, onClose, onUpdate }: UserProfileProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || user.displayName || '');
  const [location, setLocation] = useState(user.user_metadata?.location || 'Davao City, PH');
  const isAdmin = user.email === 'admin@rent4cars.com';
  const defaultAdminAvatar = 'https://i.postimg.cc/SR63SW90/Face-Id.jpg';
  const [avatarUrl, setAvatarUrl] = useState(user.user_metadata?.avatar_url || (isAdmin ? defaultAdminAvatar : ''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportHtml, setReportHtml] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [showRentals, setShowRentals] = useState(false);
  const [showAdminRentals, setShowAdminRentals] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const html = await NotificationService.getReportHtml(user.id);
      setReportHtml(html);
      setShowReport(true);
    } catch (err) {
      setError('Failed to load activity report.');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image too large. Please select an image under 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

      // If it's a mock user (Bypass Mode) or Supabase isn't configured, handle locally
      if (user.id?.includes('mock') || isPlaceholder) {
        const updatedUser = {
          ...user,
          user_metadata: {
            ...user.user_metadata,
            full_name: fullName,
            location: location,
            avatar_url: avatarUrl
          }
        };
        onUpdate(updatedUser);
        setSuccess(true);
        setTimeout(onClose, 1500);
        return;
      }

      const { data, error } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName,
          location: location,
          avatar_url: avatarUrl
        }
      });

      if (error) throw error;
      
      onUpdate(data.user);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message);
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
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="absolute top-6 right-6">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-10">
          <div className="mb-8 text-center">
            <div className="relative inline-block group">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto overflow-hidden border-4 border-white dark:border-gray-900 shadow-lg relative"
                >
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User size={48} className="text-primary" />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload size={20} className="text-white" />
                    </div>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full border-4 border-white dark:border-gray-900 shadow-md cursor-pointer pointer-events-none">
                    <Camera size={14} />
                </div>
            </div>
            <h2 className="text-3xl font-display font-bold mt-4 text-gray-900 dark:text-white">Profile Settings</h2>
            <div className="mt-2 space-y-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.email}</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full font-mono border border-gray-200 dark:border-gray-700">ID: {user.id}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 px-1 dark:text-gray-500">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Mark Pardillo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 px-1 dark:text-gray-500">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                <input
                  type="text"
                  placeholder="e.g. Davao City, PH"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">Profile Photo URL</label>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] uppercase font-bold text-primary hover:underline"
                >
                  Browse Files
                </button>
              </div>
              <div className="relative">
                <Camera className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Paste image URL here"
                  value={avatarUrl.startsWith('data:') ? 'Local file selected' : avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm transition-all text-ellipsis"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-primary font-bold bg-primary/5 p-3 rounded-lg border border-primary/10">
                {error}
              </p>
            )}

            {success && (
              <p className="text-xs text-green-600 font-bold bg-green-50 p-3 rounded-lg border border-green-100">
                Profile updated successfully!
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl shadow-gray-900/10 hover:bg-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Save size={20} />
                  Update Profile
                </>
              )}
            </button>

            <button
              type="button"
              onClick={fetchReport}
              disabled={loadingReport}
              className="w-full py-4 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 mb-3"
            >
              {loadingReport ? (
                <Loader2 size={20} className="animate-spin text-primary" />
              ) : (
                <>
                  <FileText size={20} className="text-primary" />
                  View Activity Report (XSLT)
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowRentals(true)}
              className="w-full py-4 bg-primary/5 border-2 border-primary/10 text-primary rounded-2xl font-bold hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
            >
              <Car size={20} />
              Track My Rentals
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAdminRentals(true)}
                  className="w-full py-4 bg-gray-900 border-2 border-gray-800 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                >
                  <Car size={20} />
                  Manage All Rentals (Admin)
                </button>
              </>
            )}
          </form>

          {showRentals && <MyRentals user={user} onClose={() => setShowRentals(false)} />}
          {showAdminRentals && <AdminRentals onClose={() => setShowAdminRentals(false)} />}

          <AnimatePresence>
            {showReport && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 border-t border-gray-100 pt-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Weekly Activity Log</h3>
                  <button 
                    onClick={() => {
                        const blob = new Blob([reportHtml], { type: 'text/html' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Weekly_Report_${new Date().toISOString().split('T')[0]}.html`;
                        a.click();
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight text-primary hover:underline"
                  >
                    <Download size={12} />
                    Download PDF/HTML
                  </button>
                </div>
                <div 
                  className="xml-activity-report max-h-64 overflow-y-auto rounded-xl border border-gray-50 custom-scrollbar"
                  dangerouslySetInnerHTML={{ __html: reportHtml }} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
           <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest italic">
              "Your Journey, Our Priority"
           </p>
        </div>
      </motion.div>
    </div>
  );
}
