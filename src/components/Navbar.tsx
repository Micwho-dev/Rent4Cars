import { LogIn, LogOut, User as UserIcon, Menu, Bell, Circle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Notification, NotificationService } from '../services/dataService';
import DarkModeToggle from './DarkModeToggle';

interface NavbarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  user: any;
  setUser: (user: any) => void;
  onAuthClick: () => void;
  onLogout: () => void;
  onProfileClick: () => void;
  notifications: Notification[];
}

export default function Navbar({ 
  activeSection, 
  setActiveSection, 
  user, 
  setUser, 
  onAuthClick, 
  onLogout, 
  onProfileClick,
  notifications 
}: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleNotifications = async () => {
    if (!showNotifications && unreadCount > 0 && user) {
      await NotificationService.markRead(user.id);
    }
    setShowNotifications(!showNotifications);
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'cars', label: 'Cars' },
    { id: 'locations', label: 'Locations' },
    { id: 'service', label: 'Service' },
    { id: 'contact', label: 'Contact Us' },
  ];

  const handleLogout = () => {
    onLogout();
  };

  const isAdmin = user?.email === 'admin@rent4cars.com';
  const defaultAdminAvatar = 'https://i.postimg.cc/SR63SW90/Face-Id.jpg';
  const avatarUrl = user?.user_metadata?.avatar_url || (isAdmin ? defaultAdminAvatar : null);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="w-full flex items-center justify-between px-6 md:px-12 py-4 shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveSection('home')}>
          <img 
            src="https://i.postimg.cc/m2R4f9Fv/Rent4Cars.png" 
            alt="Rent4Cars Logo" 
            className="h-10 w-auto object-contain"
          />
          <span className="text-xl font-display font-bold tracking-tight text-gray-900 dark:text-white">Rent4Cars<span className="text-primary">.</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className="relative text-sm font-medium transition-colors hover:text-primary text-gray-600 dark:text-gray-300 xl:dark:bg-transparent"
            >
              {item.label}
              {activeSection === item.id && (
                <motion.div layoutId="nav-pill" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <DarkModeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={toggleNotifications}
                  className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-all relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Notifications</span>
                        <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full font-bold">{unreadCount} New</span>
                      </div>
                      <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div key={n.id} className="p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                              <div className="flex gap-3">
                                <div className="mt-1 shrink-0">
                                  {n.type === 'rental' && <CheckCircle size={14} className="text-green-500" />}
                                  {n.type === 'maintenance' && <AlertTriangle size={14} className="text-yellow-500" />}
                                  {n.type === 'system' && <Info size={14} className="text-blue-500" />}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">{n.title}</h4>
                                    {!n.read && <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-sm" />}
                                  </div>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">{n.message_body}</p>
                                  <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-2 font-mono">{new Date(n.timestamp).toLocaleTimeString()}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <Bell className="mx-auto text-gray-200 dark:text-gray-700 mb-2" size={32} />
                            <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">No alerts today</p>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => {
                          setShowNotifications(false);
                          onProfileClick();
                        }}
                        className="w-full py-3 bg-gray-50 dark:bg-gray-800 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary transition-colors border-t border-gray-100 dark:border-gray-800"
                      >
                        View Weekly Activity Report
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

              <button 
                onClick={onProfileClick}
                className="flex items-center gap-3 group text-left"
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                    {user.user_metadata?.full_name || user.displayName || user.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest leading-none">
                    {user.user_metadata?.location || 'Logged In'}
                  </span>
                </div>
                <div className="w-9 h-9 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden group-hover:border-primary dark:group-hover:border-primary transition-colors">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={18} className="text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors" />
                  )}
                </div>
              </button>
              <button 
                onClick={handleLogout}
                className="text-gray-400 dark:text-gray-500 hover:text-primary transition-colors ml-2"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-2"
            >
              <LogIn size={16} />
              Login
            </button>
          )}
          <Menu className="md:hidden text-gray-600" />
        </div>
      </div>
    </nav>
  );
}
