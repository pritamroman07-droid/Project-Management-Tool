import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchMe } from './store/slices/authSlice';
import { fetchNotifications } from './store/slices/notificationSlice';

import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicRoute } from './routes/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// App Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import TasksPage from './pages/tasks/TasksPage';
import KanbanPage from './pages/kanban/KanbanPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
import GanttPage from './pages/gantt/GanttPage';
import CalendarPage from './pages/calendar/CalendarPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import TeamPage from './pages/team/TeamPage';
import ProfilePage from './pages/profile/ProfilePage';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Restore session on app load
    const token = localStorage.getItem('accessToken');
    if (token) {
      dispatch(fetchMe()).then((result) => {
        if (fetchMe.fulfilled.match(result)) {
          dispatch(fetchNotifications({ limit: 20 }));
        }
      });
    } else {
      // Mark as initialized so ProtectedRoute can redirect
      dispatch({ type: 'auth/fetchMe/rejected' });
    }
  }, [dispatch]);

  return (
    <ThemeProvider>
      <SocketProvider>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected routes wrapped in AppLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/kanban" element={<KanbanPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/gantt" element={<GanttPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
