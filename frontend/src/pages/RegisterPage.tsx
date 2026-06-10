import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';

function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'SHIPPER' as 'SHIPPER' | 'DRIVER',
    vehicle: { type: 'MINI_TEMPO' as const, plateNumber: '', capacityKg: 1000 }
  });
  const { register, clearError } = useAuth();
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; plateNumber?: string }>({});
  const navigate = useNavigate();
  const notify = useNotification();

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Register</h2>
        
        <div className="mb-4">
          <input 
            placeholder="Name" 
            value={form.name} 
            onChange={(e) => {
              setForm({...form, name: e.target.value});
              if (errors.name) setErrors({ ...errors, name: undefined });
            }} 
            className={`w-full p-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2 ${
              errors.name 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
            }`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1.5 pl-1">{errors.name}</p>}
        </div>

        <div className="mb-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={form.email} 
            onChange={(e) => {
              setForm({...form, email: e.target.value});
              if (errors.email) setErrors({ ...errors, email: undefined });
            }} 
            className={`w-full p-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2 ${
              errors.email 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
            }`}
          />
          {errors.email && <p className="text-red-500 text-xs mt-1.5 pl-1">{errors.email}</p>}
        </div>

        <div className="mb-4">
          <input 
            type="password" 
            placeholder="Password" 
            value={form.password} 
            onChange={(e) => {
              setForm({...form, password: e.target.value});
              if (errors.password) setErrors({ ...errors, password: undefined });
            }} 
            className={`w-full p-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2 ${
              errors.password 
                ? 'border-red-500 focus:ring-red-200' 
                : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
            }`}
          />
          {errors.password && <p className="text-red-500 text-xs mt-1.5 pl-1">{errors.password}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select 
            value={form.role} 
            onChange={(e) => setForm({...form, role: e.target.value as 'SHIPPER' | 'DRIVER'})} 
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          >
            <option value="SHIPPER">Shipper</option>
            <option value="DRIVER">Driver</option>
          </select>
        </div>

        {form.role === 'DRIVER' && (
          <div className="border-t pt-4 mt-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">Vehicle Details</h3>
            <div>
              <input 
                placeholder="Plate Number" 
                value={form.vehicle.plateNumber} 
                onChange={(e) => {
                  setForm({...form, vehicle: {...form.vehicle, plateNumber: e.target.value}});
                  if (errors.plateNumber) setErrors({ ...errors, plateNumber: undefined });
                }} 
                className={`w-full p-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2 ${
                  errors.plateNumber 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'
                }`}
              />
              {errors.plateNumber && <p className="text-red-500 text-xs mt-1.5 pl-1">{errors.plateNumber}</p>}
            </div>
            
            <div>
              <select 
                value={form.vehicle.type} 
                onChange={(e) => setForm({...form, vehicle: {...form.vehicle, type: e.target.value as any}})} 
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="MINI_TEMPO">Mini Tempo</option>
                <option value="PICKUP_TRUCK">Pickup Truck</option>
                <option value="CONTAINER_3TON">3-Ton Container</option>
              </select>
            </div>
          </div>
        )}

        <button type="submit" className="w-full bg-green-600 text-white p-2.5 mt-6 rounded-lg hover:bg-green-700 font-semibold shadow transition">
          Register
        </button>
        <p className="mt-4 text-center text-sm text-gray-600">
          Have account? <Link to="/login" className="text-blue-600 font-medium hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
