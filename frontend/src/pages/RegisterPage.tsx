import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';
import { Eye, EyeOff } from 'lucide-react';

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
    if (!form.name.trim()) {
      tempErrors.name = 'Name is required';
    }

    if (!form.email) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!form.password) {
      tempErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }

    if (form.role === 'DRIVER' && !form.vehicle.plateNumber.trim()) {
      tempErrors.plateNumber = 'Plate number is required for drivers';
    }

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      return;
    }

    const loadToast = notify.loading('Creating account...');
    try {
      const payload = form.role === 'DRIVER' ? form : { ...form, vehicle: undefined };
      await register(payload);
      notify.success('Account created successfully!', { id: loadToast });
      navigate(form.role === 'SHIPPER' ? '/shipper' : '/driver');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err.message || 'Registration failed';
      notify.error(errMsg, { id: loadToast });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] py-8" style={{ fontFamily: 'var(--font-body)' }}>
      <form 
        onSubmit={handleSubmit} 
        className="bg-[var(--color-card)] p-8 w-full max-w-sm"
        style={{
          border: 'var(--border-width) solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
        }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-heading)' }}>
          Register
        </h2>
        
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
            Name
          </label>
          <input 
            placeholder="Name" 
            value={form.name} 
            onChange={(e) => {
              setForm({...form, name: e.target.value});
              if (errors.name) setErrors({ ...errors, name: undefined });
            }} 
            className={`w-full p-3 bg-white text-[var(--color-text-main)] placeholder-[#94A3B8] font-medium rounded-[var(--radius-card)] border-[var(--border-width)] focus:outline-none transition-all text-sm ${
              errors.name 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-[var(--color-input-border)] focus:border-[var(--color-primary)]'
            }`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1.5 pl-1">{errors.name}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
            Email
          </label>
          <input 
            type="email" 
            placeholder="Email" 
            value={form.email} 
            onChange={(e) => {
              setForm({...form, email: e.target.value});
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

        <div className="mb-4">
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
            Password
          </label>
          <div className="relative">
            <input 
              type={showPassword ? 'text' : 'password'} 
              placeholder="Password" 
              value={form.password} 
              onChange={(e) => {
                setForm({...form, password: e.target.value});
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
        
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
            Role
          </label>
          <select 
            value={form.role} 
            onChange={(e) => setForm({...form, role: e.target.value as 'SHIPPER' | 'DRIVER'})} 
            className="w-full p-3 bg-white text-[var(--color-text-main)] font-medium rounded-[var(--radius-card)] focus:outline-none focus:border-[var(--color-primary)] transition-all text-sm border"
            style={{ borderWidth: 'var(--border-width)', borderColor: 'var(--color-input-border)' }}
          >
            <option value="SHIPPER">Shipper</option>
            <option value="DRIVER">Driver</option>
          </select>
        </div>

        {form.role === 'DRIVER' && (
          <div className="border-t pt-4 mt-4 space-y-4" style={{ borderColor: 'var(--color-border)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
              Vehicle Information
            </h3>
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
                Plate Number
              </label>
              <input 
                placeholder="Plate Number" 
                value={form.vehicle.plateNumber} 
                onChange={(e) => {
                  setForm({...form, vehicle: {...form.vehicle, plateNumber: e.target.value}});
                  if (errors.plateNumber) setErrors({ ...errors, plateNumber: undefined });
                }} 
                className={`w-full p-3 bg-white text-[var(--color-text-main)] placeholder-[#94A3B8] font-medium rounded-[var(--radius-card)] border-[var(--border-width)] focus:outline-none transition-all text-sm ${
                  errors.plateNumber 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-[var(--color-input-border)] focus:border-[var(--color-primary)]'
                }`}
              />
              {errors.plateNumber && <p className="text-red-500 text-xs mt-1.5 pl-1">{errors.plateNumber}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-heading)' }}>
                Vehicle Type
              </label>
              <select 
                value={form.vehicle.type} 
                onChange={(e) => setForm({...form, vehicle: {...form.vehicle, type: e.target.value as any}})} 
                className="w-full p-3 bg-white text-[var(--color-text-main)] font-medium rounded-[var(--radius-card)] focus:outline-none focus:border-[var(--color-primary)] transition-all text-sm border"
                style={{ borderWidth: 'var(--border-width)', borderColor: 'var(--color-input-border)' }}
              >
                <option value="MINI_TEMPO">Mini Tempo</option>
                <option value="PICKUP_TRUCK">Pickup Truck</option>
                <option value="CONTAINER_3TON">3-Ton Container</option>
              </select>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          className="w-full text-white p-3 mt-6 rounded-[var(--radius-button)] font-bold transition-all"
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
          Register
        </button>
        <p className="mt-5 text-center text-sm text-[var(--color-text-muted)]">
          Already have an account? <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-primary)' }}>Login here</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
