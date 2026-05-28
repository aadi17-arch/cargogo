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
  return (
    <nav className="bg-slate-900 text-white p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">CargoGo</Link>
        {token && (
          <div className="flex gap-4 items-center">
            <span className="text-sm">{user?.name} ({user?.role})</span>
            {user?.role === 'SHIPPER' && <Link to="/shipper" className="hover:text-blue-400">Dashboard</Link>}
            {user?.role === 'DRIVER' && <Link to="/driver" className="hover:text-blue-400">Dashboard</Link>}
            <button onClick={logout} className="text-sm bg-red-600 px-3 py-1 rounded hover:bg-red-700">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
export default Navbar;
