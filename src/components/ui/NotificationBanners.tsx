import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { IconBell, IconX, IconInfoCircle, IconCheck, IconAlertTriangle } from '@tabler/icons-react';

export const NotificationBanners = () => {
  const { notifications, markAsRead } = useNotifications();

  // Only show unread notifications
  const unreadNotifs = notifications.filter(n => !n.isRead);

  // Take up to 3 to show at a time so it doesn't clutter
  const displayNotifs = unreadNotifs.slice(0, 3);

  if (displayNotifs.length === 0) return null;

  return (
    <div className="fixed top-[88px] right-6 z-50 flex flex-col gap-3 w-full max-w-sm">
      {displayNotifs.map((notif) => {
        // Simple mapping based on text or type
        const isSuccess = notif.message.toLowerCase().includes('accepted') || notif.message.toLowerCase().includes('completed');
        const isAlert = notif.message.toLowerCase().includes('rejected') || notif.message.toLowerCase().includes('failed');

        return (
          <div 
            key={notif.id}
            className="animate-in slide-in-from-right-8 fade-in-0 duration-300 transform bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-2xl p-4 shadow-xl shadow-primary-900/5 cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => markAsRead(notif.id)}
          >
            <div className="flex gap-4 items-start">
              <div className={`mt-0.5 rounded-full p-2
                ${isSuccess ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 
                  isAlert ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 
                  'bg-primary-100 text-primary-600 dark:bg-primary-900/30'}`}
              >
                {isSuccess ? <IconCheck size={20} /> : 
                 isAlert ? <IconAlertTriangle size={20} /> : 
                 <IconInfoCircle size={20} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary-950 dark:text-white leading-snug">
                  {notif.message}
                </p>
                <div className="mt-2 text-xs font-medium text-primary-400 capitalize">
                  {notif.type.replace(/_/g, ' ').toLowerCase()}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  markAsRead(notif.id);
                }}
                className="text-primary-300 hover:text-primary-600 transition-colors p-1"
              >
                <IconX size={18} />
              </button>
            </div>
          </div>
        );
      })}
      
      {unreadNotifs.length > 3 && (
        <div className="text-center text-xs font-bold text-primary-500 uppercase tracking-widest bg-white/80 dark:bg-surface-900/80 backdrop-blur rounded-full py-2 shadow-sm border border-primary-50">
          +{unreadNotifs.length - 3} more unread
        </div>
      )}
    </div>
  );
};
