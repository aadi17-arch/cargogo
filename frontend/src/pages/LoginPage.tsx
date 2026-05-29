import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post(`http://${window.location.hostname}:5000/api/auth/login`, {
        email, password
      });
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
      navigate(res.data.data.user.role === 'SHIPPER' ? '/shipper' : '/driver');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F4F0] p-4 font-sans select-none">
      <div className="bg-[#ffffff] border border-[#E8E6E0] p-6 sm:p-8 rounded-2xl w-full max-w-sm shadow-sm">
        {/* Logo block */}
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-[#1A1A1A] p-2 rounded-xl flex items-center justify-center">
            {/* Custom SVG icon representing a cargo truck / cargo box */}
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
          <button className="pb-2.5 px-1 font-bold text-sm text-[#1A1A1A] border-b-2 border-[#1A1A1A] -mb-[1px]">
            Sign in
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="pb-2.5 px-4 font-medium text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Create account
          </button>
        </div>

        {/* Welcome Text */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] tracking-tight">Welcome back</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Enter your credentials to continue</p>
        </div>

        {error && (
          <div className="alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
              Forgot password?
            </a>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="btn-primary"
          >
            Sign in &rarr;
          </button>

          {/* Secondary Sign Up Call */}
          <p className="text-center text-sm text-slate-500 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-[#1A1A1A] hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
