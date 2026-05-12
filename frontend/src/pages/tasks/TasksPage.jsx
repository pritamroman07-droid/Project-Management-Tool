import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, createTask, deleteTask, updateTask } from '../../store/slices/taskSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import { Plus, Search, Trash2, Edit, ChevronDown } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Select, Textarea } from '../../components/common/Input';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { AvatarGroup } from '../../components/common/Avatar';
import { TableSkeleton } from '../../components/common/Skeleton';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const defaultForm = { title: '', description: '', project: '', priority: 'medium', status: 'todo', dueDate: '', labels: '' };

export default function TasksPage() {
  const dispatch = useDispatch();
  const { list: tasks, loading } = useSelector((s) => s.tasks);
  const { list: projects } = useSelector((s) => s.projects);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects({}));
    dispatch(fetchTasks({ status: statusFilter || undefined, priority: priorityFilter || undefined, projectId: projectFilter || undefined, search: search || undefined, limit: 100 }));
  }, [statusFilter, priorityFilter, projectFilter, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.project) { toast.error('Please select a project'); return; }
    setCreating(true);
    const payload = { ...form, labels: form.labels.split(',').map((l) => l.trim()).filter(Boolean) };
    const result = await dispatch(createTask(payload));
    setCreating(false);
    if (createTask.fulfilled.match(result)) {
      toast.success('Task created!');
      setShowModal(false);
      setForm(defaultForm);
    } else {
      toast.error(result.payload || 'Failed to create task');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    const result = await dispatch(deleteTask(id));
    if (deleteTask.fulfilled.match(result)) toast.success('Task deleted');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tasks</h2>
          <p className="text-sm text-slate-500 mt-0.5">{tasks.length} tasks</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Task</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..."
            className="input pl-9 py-2 text-sm w-52" />
        </div>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="input w-auto py-2 text-sm">
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto py-2 text-sm">
          <option value="">All Status</option>
          <option value="todo">To Do</option>
          <option value="inprogress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input w-auto py-2 text-sm">
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      {/* Task Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              {['Task', 'Project', 'Status', 'Priority', 'Assignees', 'Due Date', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-6"><TableSkeleton rows={8} /></td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">No tasks found. Create one!</td></tr>
            ) : (
              tasks.map((task) => (
                <tr key={task._id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">{task.title}</p>
                    {task.labels?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {task.labels.slice(0, 2).map((l) => (
                          <span key={l} className="px-1.5 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded">{l}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                    {task.project?.name || '—'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-4 py-3">
                    <AvatarGroup users={task.assignees || []} max={3} size="xs" />
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDelete(task._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Task Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Task" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button form="task-form" type="submit" loading={creating}>Create Task</Button>
        </>}>
        <form id="task-form" onSubmit={handleCreate} className="space-y-4">
          <Input label="Task Title *" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Implement login flow" required />
          <Textarea label="Description" value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Task details..." rows={3} />
          <Select label="Project *" value={form.project}
            onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
            options={[{ value: '', label: 'Select project...' }, ...projects.map((p) => ({ value: p._id, label: p.name }))]} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
            <Select label="Status" value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              options={[{ value: 'todo', label: 'To Do' }, { value: 'inprogress', label: 'In Progress' }, { value: 'review', label: 'Review' }, { value: 'done', label: 'Done' }]} />
          </div>
          <Input label="Due Date" type="date" value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          <Input label="Labels (comma separated)" value={form.labels}
            onChange={(e) => setForm((f) => ({ ...f, labels: e.target.value }))}
            placeholder="bug, feature, urgent" />
        </form>
      </Modal>
    </div>
  );
}
