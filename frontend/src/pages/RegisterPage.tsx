import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import AuthFormField from '@/components/ui/AuthFormField';
import PrimaryButton from '@/components/ui/PrimaryButton';

function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'SHIPPER' as 'SHIPPER' | 'DRIVER',
    vehicle: { type: 'MINI_TEMPO' as const, plateNumber: '', capacityKg: 1000 }
  });
  const [showPassword, setShowPassword] = useState(false);
  const { register, clearError, isAuthenticated, user } = useAuth();
  
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; plateNumber?: string }>({});
  
  const navigate = useNavigate();
  const notify = useNotification();

  useEffect(() => {
    if (isAuthenticated && user) navigate(user.role === 'SHIPPER' ? '/shipper' : '/driver');
  }, [isAuthenticated, user, navigate]);

  const clearFieldError = (field: keyof typeof errors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  // Real-time validators
  const handleNameChange = (v: string) => {
    setForm(prev => ({ ...prev, name: v }));
    if (!v.trim()) {
      setErrors(prev => ({ ...prev, name: 'Name is required' }));
    } else {
      clearFieldError('name');
    }
  };

  const handleEmailChange = (v: string) => {
    setForm(prev => ({ ...prev, email: v }));
    if (!v) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
    } else if (!/\S+@\S+\.\S+/.test(v)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    } else {
      clearFieldError('email');
    }
  };

  const handlePasswordChange = (v: string) => {
    setForm(prev => ({ ...prev, password: v }));
    if (!v) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
    } else if (v.length < 6) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
    } else {
      clearFieldError('password');
    }
  };

  const handlePlateChange = (v: string) => {
    setForm(prev => ({
      ...prev,
      vehicle: { ...prev.vehicle, plateNumber: v }
    }));
    if (!v.trim()) {
      setErrors(prev => ({ ...prev, plateNumber: 'Plate number is required for drivers' }));
    } else {
      clearFieldError('plateNumber');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    const nameErr = !form.name.trim() ? 'Name is required' : undefined;
    const emailErr = !form.email ? 'Email is required' : (!/\S+@\S+\.\S+/.test(form.email) ? 'Please enter a valid email address' : undefined);
    const passErr = !form.password ? 'Password is required' : (form.password.length < 6 ? 'Password must be at least 6 characters' : undefined);
    const plateErr = (form.role === 'DRIVER' && !form.vehicle.plateNumber.trim()) ? 'Plate number is required for drivers' : undefined;

    if (nameErr || emailErr || passErr || plateErr) {
      setErrors({ name: nameErr, email: emailErr, password: passErr, plateNumber: plateErr });
      return;
    }

    const loadToast = notify.loading('Creating account...');
    try {
      const payload = form.role === 'DRIVER' ? form : { ...form, vehicle: undefined };
      await register(payload);
      notify.success('Account created successfully!', { id: loadToast });
      navigate(form.role === 'SHIPPER' ? '/shipper' : '/driver');
    } catch (err: any) {
      notify.error(err?.response?.data?.message || err.message || 'Registration failed', { id: loadToast });
    }
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

      {/* Main Registration Card */}
      <form onSubmit={handleSubmit} className="bg-white p-8 w-full max-w-sm card shadow-sm space-y-4 rounded-[var(--radius-card)]">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight font-heading">
            Register Account
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-none">
            Join CargoGo logistics dispatch network
          </p>
        </div>

        <AuthFormField
          label="Name" placeholder="Full name"
          value={form.name} error={errors.name}
          onChange={handleNameChange}
        />

        <AuthFormField
          label="Email" type="email" placeholder="Email address"
          value={form.email} error={errors.email}
          onChange={handleEmailChange}
        />

        <AuthFormField
          label="Password" placeholder="Password (min 6 chars)"
          value={form.password} error={errors.password}
          showToggle showPassword={showPassword}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onChange={handlePasswordChange}
        />

        <div>
          <label className="block text-xs font-bold text-slate-500 font-heading mb-1.5">Account Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as 'SHIPPER' | 'DRIVER' })}
            className="w-full p-3 bg-white text-slate-800 font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 transition-all text-sm"
          >
            <option value="SHIPPER">Shipper (Sender)</option>
            <option value="DRIVER">Driver Partner</option>
          </select>
        </div>

        {form.role === 'DRIVER' && (
          <div className="border-t border-slate-100 pt-4 mt-4 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Vehicle Parameters
            </h3>
            
            <AuthFormField
              label="Plate Number" placeholder="e.g. MH-12-AB-1234"
              value={form.vehicle.plateNumber} error={errors.plateNumber}
              onChange={handlePlateChange}
            />
            
            <div>
              <label className="block text-xs font-bold text-slate-500 font-heading mb-1.5">Vehicle Type</label>
              <select
                value={form.vehicle.type}
                onChange={(e) => setForm({ ...form, vehicle: { ...form.vehicle, type: e.target.value as any } })}
                className="w-full p-3 bg-white text-slate-800 font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 transition-all text-sm"
              >
                <option value="MINI_TEMPO">Mini Tempo</option>
                <option value="PICKUP_TRUCK">Pickup Truck</option>
                <option value="CONTAINER_3TON">3-Ton Container</option>
              </select>
            </div>
          </div>
        )}

        <PrimaryButton
          type="submit"
          fullWidth
          className="py-3 text-sm mt-2"
        >
          Register
        </PrimaryButton>

        <p className="text-center text-xs text-slate-400 font-medium pt-2">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-slate-800 hover:underline">Back to Log In</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
