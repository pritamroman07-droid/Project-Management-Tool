import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Grid, List, FolderKanban, Calendar, Users, Loader2, Trash2, Edit } from 'lucide-react';
import { fetchProjects, createProject, deleteProject } from '../../store/slices/projectSlice';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Select, Textarea } from '../../components/common/Input';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { AvatarGroup } from '../../components/common/Avatar';
import { CardSkeleton } from '../../components/common/Skeleton';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const defaultForm = { name: '', description: '', priority: 'medium', status: 'planning', dueDate: '', color: '#6366f1', tags: '' };

export default function ProjectsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: projects, loading } = useSelector((s) => s.projects);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects({ status: statusFilter || undefined, search: search || undefined }));
  }, [statusFilter, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    const payload = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
    const result = await dispatch(createProject(payload));
    setCreating(false);
    if (createProject.fulfilled.match(result)) {
      toast.success('Project created!');
      setShowModal(false);
      setForm(defaultForm);
    } else {
      toast.error(result.payload || 'Failed to create project');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its tasks?')) return;
    const result = await dispatch(deleteProject(id));
    if (deleteProject.fulfilled.match(result)) toast.success('Project deleted');
    else toast.error('Failed to delete project');
  };

  const filtered = projects.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Projects</h2>
          <p className="text-sm text-slate-500 mt-0.5">{projects.length} total projects</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..."
            className="input pl-9 py-2 text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto py-2 text-sm">
          <option value="">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
        <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {loading ? (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="w-16 h-16 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">No projects yet</h3>
          <p className="text-slate-400 text-sm mb-6">Create your first project to get started</p>
          <Button onClick={() => setShowModal(true)} icon={<Plus className="w-4 h-4" />}>
            Create Project
          </Button>
        </div>
      ) : (
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {filtered.map((project) => (
            <div
              key={project._id}
              onClick={() => navigate(`/projects/${project._id}`)}
              className="card p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              {/* Color strip */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: project.color || '#6366f1' }}>
                    <FolderKanban className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{project.name}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project._id}`); }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => handleDelete(e, project._id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {project.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{project.description}</p>
              )}

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>{project.progress || 0}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${project.progress || 0}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <AvatarGroup users={project.members?.map((m) => m.user) || []} max={4} size="xs" />
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  {project.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(project.dueDate), 'MMM d')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {project.members?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project" size="md"
        footer={<>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button form="project-form" type="submit" loading={creating}>Create Project</Button>
        </>}>
        <form id="project-form" onSubmit={handleCreate} className="space-y-4">
          <Input label="Project Name *" value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="My awesome project" required />
          <Textarea label="Description" value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What is this project about?" rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
            <Select label="Status" value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              options={[{ value: 'planning', label: 'Planning' }, { value: 'active', label: 'Active' }, { value: 'on_hold', label: 'On Hold' }]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Due Date" type="date" value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            <div>
              <label className="label">Color</label>
              <input type="color" value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer" />
            </div>
          </div>
          <Input label="Tags (comma separated)" value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="design, frontend, urgent" />
        </form>
      </Modal>
    </div>
  );
}
