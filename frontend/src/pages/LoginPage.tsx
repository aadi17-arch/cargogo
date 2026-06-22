import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import AuthFormField from '@/components/ui/AuthFormField';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, clearError, isAuthenticated, user } = useAuth();
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const notify = useNotification();

  useEffect(() => {
    if (isAuthenticated && user) navigate(user.role === 'SHIPPER' ? '/shipper' : '/driver');
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    clearError();

    const tempErrors: typeof errors = {};
    if (!email) tempErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) tempErrors.email = 'Please enter a valid email address';
    if (!password) tempErrors.password = 'Password is required';
    if (Object.keys(tempErrors).length > 0) { setErrors(tempErrors); return; }

    const loadToast = notify.loading('Logging in...');
    try {
      const user = await login({ email, password });
      notify.success(`Welcome back, ${user.name}!`, { id: loadToast });
      navigate(user.role === 'SHIPPER' ? '/shipper' : '/driver');
    } catch (err: any) {
      notify.error(err?.response?.data?.message || err.message || 'Login failed', { id: loadToast });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]" style={{ fontFamily: 'var(--font-body)' }}>
      <form onSubmit={handleSubmit} className="bg-[var(--color-card)] p-8 w-full max-w-sm card">
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
          Login
        </h2>

        <AuthFormField
          label="Email" type="email" placeholder="Email"
          value={email} error={errors.email}
          onChange={(v) => { setEmail(v); if (errors.email) setErrors({ ...errors, email: undefined }); }}
        />

        <AuthFormField
          label="Password" placeholder="Password"
          value={password} error={errors.password}
          showToggle showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onChange={(v) => { setPassword(v); if (errors.password) setErrors({ ...errors, password: undefined }); }}
        />

        <button
          type="submit"
          className="w-full text-white p-3 font-bold transition-all hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-button)', fontFamily: 'var(--font-heading)', fontSize: '14px' }}
        >
          Login
        </button>
        <p className="mt-5 text-center text-sm text-[var(--color-text-muted)]">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>Register here</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
