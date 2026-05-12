import { useEffect, useState } from 'react';
import { analyticsAPI } from '../../api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CardSkeleton } from '../../components/common/Skeleton';
import { Button } from '../../components/common/Button';
import { Sparkles, Download, RefreshCw, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

const PRIORITY_COLORS = { low: '#94a3b8', medium: '#3b82f6', high: '#f97316', critical: '#ef4444' };

export default function AnalyticsPage() {
  const [trends, setTrends] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, p, pr] = await Promise.all([
        analyticsAPI.getTaskTrends(),
        analyticsAPI.getTeamPerformance(),
        analyticsAPI.getPriorityDistribution(),
      ]);
      setTrends(t.data.data.map((d) => ({ date: d._id, completed: d.count })));
      setPerformance(p.data.data.map((d) => ({ name: d.user?.name, tasks: d.completed })));
      setPriorities(pr.data.data.map((d) => ({ name: d._id, value: d.count, color: PRIORITY_COLORS[d._id] || '#94a3b8' })));
    } catch { toast.error('Failed to load analytics'); }
    finally { setLoading(false); }
  };

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const { data } = await analyticsAPI.getAiInsights();
      setInsights(data.data.insights || []);
    } catch { toast.error('Failed to load AI insights'); }
    finally { setLoadingInsights(false); }
  };

  useEffect(() => { loadData(); }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('ProManager Analytics Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 32);
    if (insights.length) {
      doc.setFontSize(14);
      doc.text('AI Insights:', 20, 48);
      insights.forEach((insight, i) => {
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(`${i + 1}. ${insight}`, 170);
        doc.text(lines, 20, 60 + i * 18);
      });
    }
    doc.save('analytics-report.pdf');
    toast.success('Report exported!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analytics & Reports</h2>
          <p className="text-sm text-slate-500 mt-0.5">Team performance and project insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={loadData}>Refresh</Button>
          <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={exportPDF}>Export PDF</Button>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white">AI Productivity Insights</h3>
          </div>
          <Button size="sm" variant="secondary" loading={loadingInsights} icon={<Sparkles className="w-3.5 h-3.5" />} onClick={loadInsights}>
            {insights.length ? 'Refresh' : 'Generate'} Insights
          </Button>
        </div>
        {insights.length > 0 ? (
          <ul className="space-y-3">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                <span className="w-6 h-6 rounded-full bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <p className="text-sm text-slate-700 dark:text-slate-300">{insight}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">Click "Generate Insights" to get AI-powered recommendations from Gemini.</p>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" /> Task Completion Trend
          </h3>
          {loading ? <div className="h-48 skeleton rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                <Line type="monotone" dataKey="completed" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Priority Distribution</h3>
          {loading ? <div className="h-48 skeleton rounded-lg" /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={priorities} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {priorities.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Team Performance</h3>
        {loading ? <div className="h-48 skeleton rounded-lg" /> : performance.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '13px' }} />
              <Bar dataKey="tasks" fill="#6366f1" radius={[6, 6, 0, 0]} name="Tasks Done" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-400 text-sm text-center py-8">No team performance data yet.</p>
        )}
      </div>
    </div>
  );
}
