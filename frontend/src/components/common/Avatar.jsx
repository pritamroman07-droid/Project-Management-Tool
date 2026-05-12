export const Avatar = ({ user, size = 'md', className = '' }) => {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-11 h-11 text-base', xl: 'w-14 h-14 text-lg' };
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  const colors = ['bg-violet-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
  const color = colors[(user?.name?.charCodeAt(0) || 0) % colors.length];

  if (user?.avatar) {
    return <img src={user.avatar} alt={user.name} className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`} />;
  }
  return (
    <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${className}`}>
      {initials}
    </div>
  );
};

export const AvatarGroup = ({ users = [], max = 4, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map((user, i) => (
        <div key={user._id || i} className="ring-2 ring-white dark:ring-slate-800 rounded-full" title={user.name}>
          <Avatar user={user} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div className={`w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-medium text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-800`}>
          +{remaining}
        </div>
      )}
    </div>
  );
};
