import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks } from '../../store/slices/taskSlice';
import { fetchProjects } from '../../store/slices/projectSlice';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar } from 'lucide-react';

export default function CalendarPage() {
  const dispatch = useDispatch();
  const { list: tasks } = useSelector((s) => s.tasks);
  const { list: projects } = useSelector((s) => s.projects);
  const [selectedProject, setSelectedProject] = useState('');
  const calendarRef = useRef(null);

  useEffect(() => { dispatch(fetchProjects({})); }, []);

  useEffect(() => {
    dispatch(fetchTasks({ projectId: selectedProject || undefined, limit: 500 }));
  }, [selectedProject]);

  const events = tasks
    .filter((t) => t.dueDate)
    .map((t) => ({
      id: t._id,
      title: t.title,
      start: t.startDate || t.dueDate,
      end: t.dueDate,
      backgroundColor:
        t.status === 'done' ? '#22c55e' :
        t.priority === 'critical' ? '#ef4444' :
        t.priority === 'high' ? '#f97316' :
        '#6366f1',
      borderColor: 'transparent',
      extendedProps: { status: t.status, priority: t.priority },
    }));

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Calendar</h2>
          <p className="text-sm text-slate-500">Task deadlines and milestones</p>
        </div>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="input w-auto text-sm py-2">
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      <div className="card p-5">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek',
          }}
          events={events}
          height={620}
          eventClick={(info) => {
            const task = tasks.find((t) => t._id === info.event.id);
            if (task) alert(`Task: ${task.title}\nStatus: ${task.status}\nPriority: ${task.priority}`);
          }}
          dayMaxEvents={3}
          eventDisplay="block"
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
        />
      </div>
    </div>
  );
}
