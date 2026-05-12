import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, FolderKanban, CheckSquare, BarChart3,
  Calendar, Users, Bell, Settings, LogOut, ChevronLeft,
  ChevronRight, Zap, GanttChart, Moon, Sun,
} from 'lucide-react';
import { logoutUser } from '../../store/slices/authSlice';
import { toggleTheme, toggleSidebarCollapse } from '../../store/slices/uiSlice';
import { Avatar } from '../common/Avatar';
import { clsx } from 'clsx';

const navItems = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',       icon: FolderKanban,    label: 'Projects' },
  { to: '/tasks',          icon: CheckSquare,     label: 'Tasks' },
  { to: '/kanban',         icon: Zap,             label: 'Kanban Board' },
  { to: '/gantt',          icon: GanttChart,      label: 'Gantt Chart' },
  { to: '/calendar',       icon: Calendar,        label: 'Calendar' },
  { to: '/analytics',      icon: BarChart3,       label: 'Analytics' },
  { to: '/team',           icon: Users,           label: 'Team' },
  { to: '/notifications',  icon: Bell,            label: 'Notifications' },
];

export const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { sidebarCollapsed, theme } = useSelector((s) => s.ui);
  const { unreadCount } = useSelector((s) => s.notifications);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  return (
    <aside className={clsx(
      'flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex-shrink-0',
      sidebarCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-700">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg">ProManager</span>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center mx-auto">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => dispatch(toggleSidebarCollapse())}
          className={clsx(
            'p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors',
            sidebarCollapsed && 'hidden'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {sidebarCollapsed && (
        <button
          onClick={() => dispatch(toggleSidebarCollapse())}
          className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative',
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
                sidebarCollapsed && 'justify-center'
              )
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>{label}</span>}
            {to === '/notifications' && unreadCount > 0 && (
              <span className={clsx(
                'absolute bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1',
                sidebarCollapsed ? 'top-1 right-1' : 'right-2'
              )}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: theme toggle + profile */}
      <div className="px-2 py-4 border-t border-slate-200 dark:border-slate-700 space-y-1">
        <button
          onClick={() => dispatch(toggleTheme())}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all',
            sidebarCollapsed && 'justify-center'
          )}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {!sidebarCollapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        <NavLink
          to="/profile"
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <Avatar user={user} size="sm" />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-slate-900 dark:text-white font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          )}
        </NavLink>

        <button
          onClick={handleLogout}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all',
            sidebarCollapsed && 'justify-center'
          )}
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};
