import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'SHIPPER' as 'SHIPPER' | 'DRIVER',
    vehicle: {
      type: 'MINI_TEMPO' as 'TWO_WHEELER' | 'THREE_WHEELER' | 'MINI_TEMPO' | 'PICKUP_TRUCK' | 'CONTAINER_3TON' | 'HEAVY_DUTY_TRUCK',
      plateNumber: '',
      capacityKg: 1000
    }
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = form.role === 'DRIVER' ? form : {
        ...form,
        vehicle: undefined
      };
      const res = await axios.post(`http://${window.location.hostname}:5000/api/auth/register`, payload);
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
      navigate(form.role === 'SHIPPER' ? '/shipper' : '/driver');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0] p-4 font-sans select-none">
      <div className="bg-[#ffffff] border border-[#E8E6E0] p-6 sm:p-8 rounded-2xl w-full max-w-sm shadow-sm">
        {/* Logo block */}
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-[#1A1A1A] p-2 rounded-xl flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M21 16v-4a1 1 0 00-.1-.5l-3-3a1 1 0 00-.7-.3H13m8 8H3" />
            </svg>
          </div>
          <span className="text-xl font-serif font-[600] text-[#1A1A1A]">
            Cargo<span className="text-[#D97706]">Go</span>
          </span>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#E8E6E0] mb-6">
          <button 
            type="button" 
            onClick={() => navigate('/login')} 
            className="pb-2.5 px-1 font-medium text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Sign in
          </button>
          <button className="pb-2.5 px-6 font-bold text-sm text-[#1A1A1A] border-b-2 border-[#1A1A1A] -mb-[1px]">
            Create account
          </button>
        </div>

        {/* Header Text */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">Create account</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Fill in the details to get started</p>
        </div>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="input-field"
              required
            />
          </div>

          {/* Email field */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              className="input-field"
              required
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              className="input-field"
              required
            />
          </div>

          {/* Account Role Selector */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Register As
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({...form, role: 'SHIPPER'})}
                className={`py-3 px-4 text-xs font-bold transition-all rounded-xl border text-center ${
                  form.role === 'SHIPPER'
                    ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
                }`}
              >
                Shipper
              </button>
              <button
                type="button"
                onClick={() => setForm({...form, role: 'DRIVER'})}
                className={`py-3 px-4 text-xs font-bold transition-all rounded-xl border text-center ${
                  form.role === 'DRIVER'
                    ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-800'
                }`}
              >
                Driver
              </button>
            </div>
          </div>

          {/* Driver specific vehicle registration */}
          {form.role === 'DRIVER' && (
            <div className="space-y-4 pt-2 border-t border-dashed border-[#E8E6E0]">
              {/* Plate Number */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Plate Number
                </label>
                <input 
                  placeholder="MH-12-XX-XXXX" 
                  value={form.vehicle.plateNumber} 
                  onChange={(e) => setForm({...form, vehicle: {...form.vehicle, plateNumber: e.target.value}})} 
                  className="input-field" 
                  required 
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                  Vehicle Configuration Type
                </label>
                <select 
                  value={form.vehicle.type} 
                  onChange={(e) => setForm({...form, vehicle: {...form.vehicle, type: e.target.value as any}})} 
                  className="input-field"
                >
                  <option value="TWO_WHEELER">Two Wheeler</option>
                  <option value="THREE_WHEELER">Three Wheeler</option>
                  <option value="MINI_TEMPO">Mini Tempo</option>
                  <option value="PICKUP_TRUCK">Pickup Truck</option>
                  <option value="CONTAINER_3TON">3-Ton Container</option>
                  <option value="HEAVY_DUTY_TRUCK">Heavy Duty Truck</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit button */}
          <button 
            type="submit" 
            className="btn-primary mt-2"
          >
            Create account &rarr;
          </button>

          {/* Login Redirection Call */}
          <p className="text-center text-sm text-slate-500 mt-4">
            Have an account?{' '}
            <Link to="/login" className="font-bold text-[#1A1A1A] hover:underline">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
