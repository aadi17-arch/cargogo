import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ShipperDashboard from './pages/ShipperDashboard';
function App() {
    return (
        <Router>
            <Routes>
                {/* 1. Redirect root to /login */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* 2. Map /login path to your new LoginPage component */}
                <Route path="/login" element={<LoginPage />} />

                {/* 3. Placeholder for other routes */}
                <Route path="/register" element={<RegisterPage/>} />
                <Route path="/shipper" element={<ShipperDashboard/>} />
                <Route path="/driver" element={<div className="p-8 text-center text-2xl font-bold">Driver Dashboard (Placeholder)</div>} />
            </Routes>
        </Router>
    );
}

export default App;
