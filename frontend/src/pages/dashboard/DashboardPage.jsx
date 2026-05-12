import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, CheckSquare, Clock, TrendingUp, ArrowRight, Calendar, AlertTriangle } from 'lucide-react';
import { analyticsAPI } from '../../api';
import { useState } from 'react';
import { CardSkeleton } from '../../components/common/Skeleton';
import { Avatar } from '../../components/common/Avatar';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { format, formatDistanceToNow } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await analyticsAPI.getDashboard();
        setStats(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · Here's what's happening
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FolderKanban} label="Total Projects" value={stats?.projects?.total ?? 0}
            sub={`${stats?.projects?.active ?? 0} active`} color="bg-primary-600" />
          <StatCard icon={CheckSquare} label="Tasks Done" value={stats?.tasks?.done ?? 0}
            sub="this period" color="bg-green-500" />
          <StatCard icon={Clock} label="In Progress" value={(stats?.tasks?.inprogress ?? 0) + (stats?.tasks?.review ?? 0)}
            sub={`${stats?.tasks?.todo ?? 0} in backlog`} color="bg-blue-500" />
          <StatCard icon={AlertTriangle} label="Overdue" value={stats?.tasks?.overdue ?? 0}
            sub="need attention" color="bg-red-500" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
          </div>
          {loading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats?.recentActivity?.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.map((log) => (
                <div key={log._id} className="flex items-start gap-3">
                  <Avatar user={log.user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{log.user?.name}</span>{' '}
                      <span className="text-slate-500">{log.action.replace(/_/g, ' ')}</span>{' '}
                      <span className="font-medium">{log.entityName}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm text-center py-8">No recent activity. Start a project! 🚀</p>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-900 dark:text-white">Upcoming Deadlines</h3>
            <button onClick={() => navigate('/tasks')} className="text-primary-600 dark:text-primary-400 text-xs hover:underline flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats?.upcomingDeadlines?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingDeadlines.map((task) => (
                <div
                  key={task._id}
                  onClick={() => navigate(`/tasks?id=${task._id}`)}
                  className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 cursor-pointer transition-colors"
                >
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(task.dueDate), 'MMM d')}
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No upcoming deadlines</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
