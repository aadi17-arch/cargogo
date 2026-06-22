import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import { Eye, EyeOff } from 'lucide-react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, clearError, isAuthenticated, user } = useAuth();
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const notify = useNotification();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'SHIPPER' ? '/shipper' : '/driver');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    clearError();

    // Inline validation
    const tempErrors: typeof errors = {};
    if (!email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const loadToast = notify.loading('Logging in...');
    try {
      const user = await login({ email, password });
      notify.success(`Welcome back, ${user.name}!`, { id: loadToast });
      navigate(user.role === 'SHIPPER' ? '/shipper' : '/driver');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || 'Login failed';
      notify.error(errMsg, { id: loadToast });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]" style={{ fontFamily: 'var(--font-body)' }}>
      <form 
        onSubmit={handleSubmit} 
        className="bg-[var(--color-card)] p-8 w-full max-w-sm"
        style={{
          border: 'var(--border-width) solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
        }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
          Login
        </h2>
        
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
            Email
          </label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            className={`w-full p-3 bg-white text-[var(--color-text-main)] placeholder-[#94A3B8] font-medium rounded-[var(--radius-card)] border-[var(--border-width)] focus:outline-none transition-all text-sm ${
              errors.email 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-[var(--color-input-border)] focus:border-[var(--color-primary)]'
            }`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1.5 pl-1">{errors.email}</p>}
        </div>

        <div className="mb-6">
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              className={`w-full p-3 pr-10 bg-white text-[var(--color-text-main)] placeholder-[#94A3B8] font-medium rounded-[var(--radius-card)] border-[var(--border-width)] focus:outline-none transition-all text-sm ${
                errors.password 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-[var(--color-input-border)] focus:border-[var(--color-primary)]'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1.5 pl-1">{errors.password}</p>}
        </div>

        <button 
          type="submit" 
          className="w-full text-white p-3 rounded-[var(--radius-button)] font-bold transition-all"
          style={{
            backgroundColor: 'var(--color-primary)',
            fontFamily: 'var(--font-heading)',
            fontSize: '14px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary)';
          }}
        >
          Login
        </button>
        <p className="mt-5 text-center text-sm text-[var(--color-text-muted)]">
          Don't have an account? <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>Register here</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
