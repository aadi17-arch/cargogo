import { Eye, EyeOff } from 'lucide-react';

interface AuthFormFieldProps {
  label: string;
  type?: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
showToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

export default function AuthFormField({
  label,
  type = 'text',
  placeholder,
  value,
  error,
  onChange,
  showToggle = false,
  showPassword,
  onTogglePassword,
}: AuthFormFieldProps) {
  const inputClass = `w-full p-3 bg-white text-[var(--color-text-main)] placeholder-[#94A3B8] font-medium rounded-[var(--radius-card)] border-[var(--border-width)] focus:outline-none transition-all text-sm ${
    showToggle ? 'pr-10' : ''
  } ${
    error
      ? 'border-red-500 focus:border-red-500'
      : 'border-[var(--color-input-border)] focus:border-[var(--color-primary)]'
  }`;

  return (
    <div className="mb-4">
      <label
        className="block text-xs font-bold mb-1.5"
        style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}
      >
        {label}
      </label>
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
