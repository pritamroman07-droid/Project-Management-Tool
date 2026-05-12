import { clsx } from 'clsx';

const statusMap = {
  todo:       { label: 'To Do',       class: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
  inprogress: { label: 'In Progress', class: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  review:     { label: 'Review',      class: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' },
  done:       { label: 'Done',        class: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
  planning:   { label: 'Planning',    class: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' },
  active:     { label: 'Active',      class: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  on_hold:    { label: 'On Hold',     class: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' },
  completed:  { label: 'Completed',   class: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
  cancelled:  { label: 'Cancelled',   class: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
};

const priorityMap = {
  low:      { label: 'Low',      class: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400' },
  medium:   { label: 'Medium',   class: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' },
  high:     { label: 'High',     class: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400' },
  critical: { label: 'Critical', class: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' },
};

export const StatusBadge = ({ status, className = '' }) => {
  const config = statusMap[status] || { label: status, class: 'bg-slate-100 text-slate-600' };
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', config.class, className)}>
      {config.label}
    </span>
  );
};

export const PriorityBadge = ({ priority, className = '' }) => {
  const config = priorityMap[priority] || { label: priority, class: 'bg-slate-100 text-slate-600' };
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', config.class, className)}>
      {config.label}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  const classes = {
    admin: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    manager: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    member: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
  };
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', classes[role] || classes.member)}>
      {role}
    </span>
  );
};
