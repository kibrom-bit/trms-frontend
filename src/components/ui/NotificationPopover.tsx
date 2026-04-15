import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { Notification, NotificationType } from '../../types/api';
import { 
  IconPlus, 
  IconCircleCheck, 
  IconX, 
  IconArrowUpRight, 
  IconClipboardCheck, 
  IconActivity, 
  IconAlertCircle,
  IconChecklist,
  IconClock,
  IconCheck
} from '@tabler/icons-react';

interface NotificationPopoverProps {
  onClose: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({ onClose }) => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const getRedirectPath = (notif: Notification) => {
    switch (notif.type) {
      case NotificationType.NEW_REFERRAL:
      case NotificationType.REFERRAL_ACCEPTED:
      case NotificationType.REFERRAL_REJECTED:
      case NotificationType.REFERRAL_FORWARDED:
      case NotificationType.DISCHARGE_SUMMARY_COMPLETED:
        return notif.targetId ? `/?referralId=${notif.targetId}` : '/';
      case NotificationType.SERVICE_STATUS_UPDATED:
        return '/directory';
      case NotificationType.FACILITY_CREATED:
        return notif.targetId ? `/admin/facilities/${notif.targetId}` : '/';
      default:
        return '/';
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_REFERRAL:
        return <IconPlus size={16} className="text-blue-500" />;
      case NotificationType.REFERRAL_ACCEPTED:
        return <IconCircleCheck size={16} className="text-emerald-500" />;
      case NotificationType.REFERRAL_REJECTED:
        return <IconX size={16} className="text-red-500" />;
      case NotificationType.REFERRAL_FORWARDED:
        return <IconArrowUpRight size={16} className="text-amber-500" />;
      case NotificationType.DISCHARGE_SUMMARY_COMPLETED:
        return <IconClipboardCheck size={16} className="text-purple-500" />;
      case NotificationType.SERVICE_STATUS_UPDATED:
        return <IconActivity size={16} className="text-sky-500" />;
      default:
        return <IconAlertCircle size={16} className="text-primary-400" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-surface-900 border border-primary-100 dark:border-primary-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[100]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-primary-50 dark:border-primary-800 flex items-center justify-between bg-primary-50/30 dark:bg-surface-800/50">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-900 dark:text-white">Clinical Feed</h3>
        <button 
          onClick={() => markAllAsRead()}
          className="text-[9px] font-black uppercase tracking-widest text-primary-400 hover:text-primary-900 dark:hover:text-white transition-colors flex items-center gap-1"
        >
          <IconCheck size={12} />
          Clear All
        </button>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-primary-100">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-primary-50 dark:bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <IconChecklist className="text-primary-200" size={24} />
            </div>
            <p className="text-[10px] font-bold text-primary-300 uppercase tracking-widest">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-primary-50 dark:divide-primary-800">
            {notifications.map((notif) => (
              <Link 
                key={notif.id}
                to={getRedirectPath(notif)}
                onClick={async () => {
                  if (!notif.isRead) await markAsRead(notif.id);
                  onClose();
                }}
                className={`group flex items-start gap-4 p-4 hover:bg-primary-50 dark:hover:bg-surface-800 transition-colors cursor-pointer relative ${!notif.isRead ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''}`}
              >
                  <div className={`mt-1 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${!notif.isRead ? 'bg-white dark:bg-surface-800 border-primary-100' : 'bg-surface-50 dark:bg-surface-900 border-transparent'}`}>
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] leading-relaxed mb-1 ${!notif.isRead ? 'font-bold text-primary-950 dark:text-white' : 'font-medium text-primary-500'}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                       <span className="text-[9px] font-black text-primary-300 uppercase tracking-tighter flex items-center gap-1">
                         <IconClock size={10} />
                         {formatTime(notif.createdAt)}
                       </span>
                       <span className="text-[9px] font-black text-primary-900 dark:text-primary-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                         View Details →
                       </span>
                    </div>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary-900 dark:bg-primary-400 mt-2 shrink-0 shadow-sm" />
                  )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-surface-50 dark:bg-surface-950 border-t border-primary-50 dark:border-primary-800 text-center">
         <button 
           onClick={onClose}
           className="text-[9px] font-black uppercase tracking-[0.3em] text-primary-400 hover:text-primary-900 transition-colors"
         >
           Close Console
         </button>
      </div>
    </div>
  );
};
