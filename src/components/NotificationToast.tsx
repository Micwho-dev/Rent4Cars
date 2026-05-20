import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { Notification } from '../services/dataService';
import { useEffect } from 'react';

interface NotificationToastProps {
  notification: Notification | null;
  onClose: () => void;
}

export default function NotificationToast({ notification, onClose }: NotificationToastProps) {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'rental': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'maintenance': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="fixed top-24 right-6 z-[9999] w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="p-4 flex items-start gap-4">
          <div className="mt-1">{getIcon()}</div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {notification.title}
            </h4>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {notification.message_body}
            </p>
            <div className="mt-2 text-[10px] text-gray-400 font-mono">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
