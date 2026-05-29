import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'PM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <nav className="bg-white border-b border-[#E8E6E0] py-3.5 px-6 select-none">
      <div className="max-w-[1360px] mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-[#1A1A1A] p-2 rounded-xl flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M21 16v-4a1 1 0 00-.1-.5l-3-3a1 1 0 00-.7-.3H13m8 8H3" />
            </svg>
          </div>
          <span className="text-xl font-serif font-[600] text-[#1A1A1A]">
            Cargo<span className="text-[#D97706]">Go</span>
          </span>
        </Link>
        {token && (
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-3">
              <span className="text-slate-800 text-sm font-bold tracking-tight">{user?.name}</span>
              <button 
                onClick={logout}
                title="Sign out"
                className="bg-[#1A1A1A] hover:bg-rose-700 text-white font-bold text-xs h-9 w-9 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-sm select-none"
              >
                {user ? getInitials(user.name) : 'PM'}
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
