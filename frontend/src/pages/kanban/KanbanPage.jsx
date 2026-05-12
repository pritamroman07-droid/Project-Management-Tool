import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, useDroppable, useDraggable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MoreHorizontal, Clock, MessageSquare } from 'lucide-react';
import { fetchTasks, updateTask } from '../../store/slices/taskSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import { taskAPI } from '../../api';
import { StatusBadge, PriorityBadge } from '../../components/common/Badge';
import { AvatarGroup } from '../../components/common/Avatar';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const COLUMNS = [
  { id: 'todo',       label: 'To Do',       color: 'bg-slate-400' },
  { id: 'inprogress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'review',     label: 'Review',      color: 'bg-yellow-500' },
  { id: 'done',       label: 'Done',        color: 'bg-green-500' },
];

// Individual draggable task card
const TaskCard = ({ task, isDragging = false }) => (
  <div className={clsx(
    'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-grab select-none transition-all',
    isDragging && 'opacity-50 shadow-2xl rotate-2 scale-105'
  )}>
    {task.labels?.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-2">
        {task.labels.map((label) => (
          <span key={label} className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
            {label}
          </span>
        ))}
      </div>
    )}
    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2 line-clamp-2">{task.title}</p>
    <div className="flex items-center justify-between">
      <PriorityBadge priority={task.priority} />
      {task.dueDate && (
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {format(new Date(task.dueDate), 'MMM d')}
        </span>
      )}
    </div>
    {(task.assignees?.length > 0 || task.subtasks?.length > 0) && (
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <AvatarGroup users={task.assignees || []} max={3} size="xs" />
        {task.subtasks?.length > 0 && (
          <span className="text-xs text-slate-400">
            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
          </span>
        )}
      </div>
    )}
  </div>
);

// Sortable wrapper
const SortableTaskCard = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
};

// Droppable column
const KanbanColumn = ({ column, tasks, onAddTask }) => {
  const { setNodeRef } = useDroppable({ id: column.id });
  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${column.color}`} />
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">{column.label}</h3>
          <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
        </div>
        <button onClick={() => onAddTask(column.id)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 space-y-3 min-h-[200px] p-1 rounded-xl transition-colors">
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => <SortableTaskCard key={task._id} task={task} />)}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl h-24 flex items-center justify-center">
            <p className="text-xs text-slate-400">Drop tasks here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function KanbanPage() {
  const dispatch = useDispatch();
  const { list: tasks, loading } = useSelector((s) => s.tasks);
  const { list: projects } = useSelector((s) => s.projects);
  const [selectedProject, setSelectedProject] = useState('');
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    dispatch(fetchProjects({}));
  }, []);

  useEffect(() => {
    if (selectedProject) {
      dispatch(fetchTasks({ projectId: selectedProject, limit: 200 }));
    }
  }, [selectedProject]);

  const getTasksByStatus = (status) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position);

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find((t) => t._id === active.id));
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const task = tasks.find((t) => t._id === active.id);
    const newStatus = COLUMNS.find((c) => c.id === over.id)?.id ||
      tasks.find((t) => t._id === over.id)?.status;

    if (!newStatus || task.status === newStatus) return;

    // Optimistic update
    dispatch(updateTask({ id: task._id, updates: { status: newStatus } }));

    // Persist and reorder
    const columnTasks = getTasksByStatus(newStatus);
    const items = [...columnTasks, { ...task, status: newStatus }].map((t, i) => ({
      id: t._id, status: newStatus, position: i,
    }));

    try {
      await taskAPI.reorder({ items, projectId: selectedProject });
    } catch {
      toast.error('Failed to save task position');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Project selector */}
      <div className="flex items-center gap-4">
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
          className="input w-auto text-sm py-2">
          <option value="">Select a project...</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        {selectedProject && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {tasks.length} tasks · Drag and drop to reorder
          </p>
        )}
      </div>

      {!selectedProject ? (
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
              <MoreHorizontal className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="font-semibold text-slate-600 dark:text-slate-400 mb-2">Select a project to view the Kanban board</h3>
          </div>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-5 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={getTasksByStatus(col.id)}
                onAddTask={(status) => console.log('Add task to', status)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
