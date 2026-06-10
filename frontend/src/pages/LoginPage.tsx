import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/hooks/useNotification';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, clearError } = useAuth();
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const notify = useNotification();

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
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>
        
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
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

        <div className="mb-6">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
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

        <button type="submit" className="w-full bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 font-semibold shadow transition">
          Login
        </button>
        <p className="mt-4 text-center text-sm text-gray-600">
          No account? <Link to="/register" className="text-blue-600 font-medium hover:underline">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;
