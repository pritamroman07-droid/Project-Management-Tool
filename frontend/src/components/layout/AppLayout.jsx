import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Toaster } from 'react-hot-toast';

const pageTitles = {
  '/dashboard':     'Dashboard',
  '/projects':      'Projects',
  '/tasks':         'Tasks',
  '/kanban':        'Kanban Board',
  '/gantt':         'Gantt Chart',
  '/calendar':      'Calendar',
  '/analytics':     'Analytics',
  '/team':          'Team',
  '/notifications': 'Notifications',
  '/profile':       'Profile',
};

export const AppLayout = () => {
  const { sidebarOpen } = useSelector((s) => s.ui);
  const location = useLocation();
  const title = pageTitles[location.pathname] || '';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex`}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'var(--surface, #fff)',
            color: 'var(--text, #0f172a)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
};
