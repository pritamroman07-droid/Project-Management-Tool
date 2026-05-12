import { forwardRef } from 'react';
import { clsx } from 'clsx';

export const Input = forwardRef(({ label, error, className = '', icon, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      )}
      <input
        ref={ref}
        className={clsx(
          'input',
          icon && 'pl-10',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Input.displayName = 'Input';

export const Textarea = forwardRef(({ label, error, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <textarea
      ref={ref}
      rows={3}
      className={clsx('input resize-none', error && 'border-red-400 focus:ring-red-400', className)}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ label, error, options = [], className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="label">{label}</label>}
    <select
      ref={ref}
      className={clsx('input', error && 'border-red-400 focus:ring-red-400', className)}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Select.displayName = 'Select';
