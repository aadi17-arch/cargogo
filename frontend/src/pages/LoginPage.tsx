import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import AuthFormField from '@/components/ui/AuthFormField';
import BaseModal from '@/components/ui/BaseModal';
import PrimaryButton from '@/components/ui/PrimaryButton';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, clearError, isAuthenticated, user } = useAuth();
  
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const navigate = useNavigate();
  const notify = useNotification();

  useEffect(() => {
    if (isAuthenticated && user) navigate(user.role === 'SHIPPER' ? '/shipper' : '/driver');
  }, [isAuthenticated, user, navigate]);

  // Real-time inline email validator
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (!val) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
    } else if (!/\S+@\S+\.\S+/.test(val)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (!val) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
    } else {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Final checks
    const emailErr = !email ? 'Email is required' : (!/\S+@\S+\.\S+/.test(email) ? 'Please enter a valid email address' : undefined);
    const passErr = !password ? 'Password is required' : undefined;

    if (emailErr || passErr) {
      setErrors({ email: emailErr, password: passErr });
      return;
    }

    const loadToast = notify.loading('Logging in...');
    try {
      const user = await login({ email, password });
      notify.success(`Welcome back, ${user.name}!`, { id: loadToast });
      navigate(user.role === 'SHIPPER' ? '/shipper' : '/driver');
    } catch (err: any) {
      notify.error(err?.response?.data?.message || err.message || 'Login failed', { id: loadToast });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      notify.error('Please enter a valid email address');
      return;
    }
    setResetLoading(true);
    // Simulate reset request
    setTimeout(() => {
      setResetLoading(false);
      setShowResetModal(false);
      notify.success('Password reset link sent to your email!');
      setResetEmail('');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 px-4 py-8 font-body">
      {/* Brand Logo Header */}
      <div className="flex items-center gap-2 mb-4 cursor-pointer select-none font-tech-space">
        <span className="font-black text-sm text-white bg-slate-900 px-3 py-1 rounded-[var(--radius-card)] tracking-tight shadow-sm">
          Cargo
        </span>
        <span className="font-bold text-2xl text-slate-800 tracking-tight">
          Go
        </span>
      </div>

      {/* Main Login Card */}
      <form onSubmit={handleSubmit} className="bg-white p-8 w-full max-w-sm card shadow-sm space-y-5 rounded-[var(--radius-card)]">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight font-heading">
            Welcome Back
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-none">
            Sign in to manage your shipments
          </p>
        </div>

        <AuthFormField
          label="Email" type="email" placeholder="Email address"
          value={email} error={errors.email}
          onChange={handleEmailChange}
        />

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-bold text-slate-500 font-heading">Password</label>
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="text-[11px] font-bold text-indigo-600 hover:underline bg-transparent border-none outline-none cursor-pointer"
            >
              Reset password?
            </button>
          </div>
          <AuthFormField
            label="Password"
            placeholder="Password"
            value={password} error={errors.password}
            showToggle showPassword={showPassword}
            onTogglePassword={() => setShowPassword(!showPassword)}
            onChange={handlePasswordChange}
            hideLabel
          />
        </div>

        <PrimaryButton
          type="submit"
          fullWidth
          className="py-3 text-sm"
        >
          Log In
        </PrimaryButton>

        <p className="text-center text-xs text-slate-400 font-medium">
          New here?{' '}
          <Link to="/register" className="font-bold text-slate-800 hover:underline">Create an account</Link>
        </p>
      </form>

      {/* Password Reset Modal */}
      <BaseModal 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)} 
        title="Reset Password"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter your registered email address below, and we'll send you instructions to reset your account password.
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500">Email Address</label>
            <input
              type="email"
              placeholder="e.g. user@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full p-3 bg-white text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all"
              required
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <PrimaryButton 
              type="button" 
              variant="outline" 
              onClick={() => setShowResetModal(false)}
            >
              Cancel
            </PrimaryButton>
            <PrimaryButton 
              type="submit" 
              isLoading={resetLoading}
            >
              Send Reset Link
            </PrimaryButton>
          </div>
        </form>
      </BaseModal>
    </div>
  );
}

export default LoginPage;
