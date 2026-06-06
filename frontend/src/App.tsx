import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ShipperDashboard from '@/pages/ShipperDashboard';
import DriverDashboard from '@/pages/DriverDashboard';
import TrackingPage from '@/pages/TrackingPage';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<Layout />}>
          {/* Shipper Dashboard Guard */}
          <Route element={<ProtectedRoute allowedRoles={['SHIPPER']} />}>
            <Route path="/shipper" element={<ShipperDashboard />} />
          </Route>

          {/* Driver Dashboard Guard */}
          <Route element={<ProtectedRoute allowedRoles={['DRIVER']} />}>
            <Route path="/driver" element={<DriverDashboard />} />
          </Route>

          {/* General Protected Routes (Any logged-in role can track) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/track/:bookingId" element={<TrackingPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
