import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'SHIPPER' as 'SHIPPER' | 'DRIVER',
    vehicle: { type: 'MINI_TEMPO' as const, plateNumber: '', capacityKg: 1000 }
  });
  const { register, error: authError, clearError } = useAuth();
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    try {
      const payload = form.role === 'DRIVER' ? form : { ...form, vehicle: undefined };
      await register(payload);
      navigate(form.role === 'SHIPPER' ? '/shipper' : '/driver');
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed');
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {displayError && <p className="text-red-500 mb-4 text-sm">{displayError}</p>}
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded mb-4" required />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full p-2 border rounded mb-4" required />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="w-full p-2 border rounded mb-4" required />
        
        <select value={form.role} onChange={(e) => setForm({...form, role: e.target.value as 'SHIPPER' | 'DRIVER'})} className="w-full p-2 border rounded mb-4">
          <option value="SHIPPER">Shipper</option>
          <option value="DRIVER">Driver</option>
        </select>

        {form.role === 'DRIVER' && (
          <>
            <input placeholder="Plate Number" value={form.vehicle.plateNumber} onChange={(e) => setForm({...form, vehicle: {...form.vehicle, plateNumber: e.target.value}})} className="w-full p-2 border rounded mb-4" required />
            <select value={form.vehicle.type} onChange={(e) => setForm({...form, vehicle: {...form.vehicle, type: e.target.value as 'MINI_TEMPO'}})} className="w-full p-2 border rounded mb-4">
              <option value="MINI_TEMPO">Mini Tempo</option>
              <option value="PICKUP_TRUCK">Pickup Truck</option>
              <option value="CONTAINER_3TON">3-Ton Container</option>
            </select>
          </>
        )}

        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Register
        </button>
        <p className="mt-4 text-center text-sm">
          Have account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
