import { Eye, EyeOff } from 'lucide-react';

interface FormFieldProps {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  showToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  hideLabel?: boolean;
}

export default function FormField({
  label,
  type = 'text',
  placeholder,
  value,
  error,
  onChange,
  showToggle = false,
  showPassword,
  onTogglePassword,
  hideLabel = false
}: FormFieldProps) {
  const inputClass = `w-full h-10 min-h-[40px] px-3.5 bg-white text-slate-900 placeholder:text-slate-400 font-medium rounded-md border border-slate-200 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all text-sm ${
    showToggle ? 'pr-10' : ''
  } ${
    error
      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
      : ''
  }`;

  return (
    <div className="mb-4 text-left">
      {!hideLabel && label && (
        <label
          className="block text-xs font-bold text-slate-500 font-heading mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={showToggle ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        {showToggle && onTogglePassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5 pl-1">{error}</p>}
    </div>
  );
}
