import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks } from '../../store/slices/taskSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { GanttChart } from 'lucide-react';

export default function GanttPage() {
  const dispatch = useDispatch();
  const { list: tasks } = useSelector((s) => s.tasks);
  const { list: projects } = useSelector((s) => s.projects);
  const [selectedProject, setSelectedProject] = useState('');
  const [view, setView] = useState(ViewMode.Week);

  useEffect(() => { dispatch(fetchProjects({})); }, []);

  useEffect(() => {
    if (selectedProject) dispatch(fetchTasks({ projectId: selectedProject, limit: 200 }));
  }, [selectedProject]);

  const ganttTasks = tasks
    .filter((t) => t.startDate && t.dueDate)
    .map((t) => ({
      start: new Date(t.startDate),
      end: new Date(t.dueDate),
      name: t.title,
      id: t._id,
      type: t.isMilestone ? 'milestone' : 'task',
      progress: t.status === 'done' ? 100 : t.status === 'inprogress' ? 50 : t.status === 'review' ? 75 : 0,
      isDisabled: false,
      styles: {
        progressColor: '#6366f1',
        progressSelectedColor: '#4f46e5',
        backgroundColor: t.status === 'done' ? '#22c55e' : t.priority === 'critical' ? '#ef4444' : '#6366f1',
      },
      dependencies: t.dependencies?.map((d) => (typeof d === 'object' ? d._id : d)) || [],
    }));

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Gantt Chart</h2>
          <p className="text-sm text-slate-500">Visual project timeline with dependencies</p>
        </div>
        <div className="flex gap-2">
          {[ViewMode.Day, ViewMode.Week, ViewMode.Month].map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === v ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="input w-auto text-sm py-2">
        <option value="">Select a project...</option>
        {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
      </select>

      {!selectedProject ? (
        <div className="flex items-center justify-center py-32 text-center">
          <div>
            <GanttChart className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Select a project to view the Gantt chart</p>
          </div>
        </div>
      ) : ganttTasks.length === 0 ? (
        <div className="card p-12 text-center">
          <GanttChart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No tasks with start and due dates found.</p>
          <p className="text-slate-400 text-sm mt-1">Add start dates and due dates to tasks to see them here.</p>
        </div>
      ) : (
        <div className="card p-4 overflow-x-auto">
          <Gantt tasks={ganttTasks} viewMode={view} listCellWidth="200px"
            columnWidth={view === ViewMode.Month ? 150 : 60}
            ganttHeight={400}
          />
        </div>
      )}
    </div>
  );
}
