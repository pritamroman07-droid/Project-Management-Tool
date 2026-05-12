import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAllNotificationsRead, markNotificationsRead } from '../../store/slices/notificationSlice';
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckSquare, MessageSquare, UserPlus } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

const typeIcons = {
  task_assigned: CheckSquare,
  task_completed: CheckSquare,
  task_comment: MessageSquare,
  task_mentioned: MessageSquare,
  task_due_soon: AlertTriangle,
  task_overdue: AlertTriangle,
  project_invite: UserPlus,
  project_update: Info,
  team_invite: UserPlus,
  general: Info,
};

const typeColors = {
  task_assigned: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  task_comment: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  task_mentioned: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  task_due_soon: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  task_overdue: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  task_completed: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  project_invite: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
  general: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
};

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const { list, unreadCount, loading } = useSelector((s) => s.notifications);

  useEffect(() => { dispatch(fetchNotifications({ limit: 50 })); }, []);

  const handleMarkAllRead = () => dispatch(markAllNotificationsRead());
  const handleMarkRead = (id) => dispatch(markNotificationsRead([id]));

  return (
    <div className="max-w-2xl space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h2>
          {unreadCount > 0 && <p className="text-sm text-slate-500 mt-0.5">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" icon={<CheckCheck className="w-4 h-4" />} onClick={handleMarkAllRead}>
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => <div key={i} className="card p-4 h-20 skeleton" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
          <p className="font-medium text-slate-500">You're all caught up!</p>
          <p className="text-sm text-slate-400 mt-1">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((notif) => {
            const Icon = typeIcons[notif.type] || Info;
            const iconColor = typeColors[notif.type] || typeColors.general;
            return (
              <div
                key={notif._id}
                onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                className={clsx(
                  'card p-4 flex items-start gap-3 cursor-pointer transition-all hover:shadow-md',
                  !notif.isRead && 'border-l-4 border-l-primary-500'
                )}
              >
                <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', iconColor)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={clsx('text-sm', !notif.isRead ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300')}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
