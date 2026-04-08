import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { notificationsAPI } from '../services/api';
import { X, Mail, AlertCircle, MessageSquare, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'broadcast' | 'alert' | 'info';
  title: string;
  message: string;
  requestId?: string;
  timestamp: string;
  read: boolean;
}

export function NotificationBanner() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user?.id && !user.isAdmin) {
      loadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id || user.isAdmin) return;

    try {
      const data = await notificationsAPI.getForUser(user.id);
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      await notificationsAPI.delete(user.id, notificationId);
      setNotifications(notifications.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-5 h-5" />;
      case 'broadcast':
        return <Bell className="w-5 h-5" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Mail className="w-5 h-5" />;
    }
  };

  const getBannerStyle = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200';
      case 'message':
        return 'bg-[#0ea5e9]/10 border-[#0ea5e9]/30 text-[#0ea5e9]';
      case 'broadcast':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-200';
      default:
        return 'bg-[#0ea5e9]/10 border-[#0ea5e9]/30 text-[#0ea5e9]';
    }
  };

  if (!user || user.isAdmin || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="max-w-7xl mx-auto px-4 pt-4 space-y-2">
        <AnimatePresence>
          {notifications.slice(0, 3).map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`pointer-events-auto rounded-lg border backdrop-blur-md ${getBannerStyle(
                notification.type
              )} shadow-lg`}
            >
              <div className="flex items-start gap-3 p-4">
                <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-white">{notification.title}</h4>
                  <p className="text-sm text-white/80 mt-1">{notification.message}</p>
                  <p className="text-xs text-white/60 mt-2">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(notification.id)}
                  className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                  aria-label="Dismiss notification"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
