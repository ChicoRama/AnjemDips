import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerBeranda from './pages/customer/CustomerBeranda';
import CustomerAnjem from './pages/customer/CustomerAnjem';
import CustomerJastip from './pages/customer/CustomerJastip';
import CustomerMencari from './pages/customer/CustomerMencari';
import CustomerTawaran from './pages/customer/CustomerTawaran';
import CustomerPesanan from './pages/customer/CustomerPesanan';
import CustomerLacak from './pages/customer/CustomerLacak';
import CustomerHistory from './pages/customer/CustomerHistory';
import CustomerProfil from './pages/customer/CustomerProfil';
import CustomerHapusAkun from './pages/customer/CustomerHapusAkun';
import DriverBeranda from './pages/driver/DriverBeranda';
import DriverRequestDetail from './pages/driver/DriverRequestDetail';
import DriverNego from './pages/driver/DriverNego';
import DriverPesanan from './pages/driver/DriverPesanan';
import DriverNavigasi from './pages/driver/DriverNavigasi';
import DriverHistory from './pages/driver/DriverHistory';
import DriverProfil from './pages/driver/DriverProfil';
import DriverHapusAkun from './pages/driver/DriverHapusAkun';

function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Memuat...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'driver' ? '/driver' : '/customer'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rute Pemesan (KELOMPOK A) */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerBeranda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/anjem"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerAnjem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/jastip"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerJastip />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/mencari"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerMencari />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/tawaran"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerTawaran />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/tawaran-kelebihan"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerTawaran forceOverCapacity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/pesanan"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerPesanan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/lacak"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerLacak />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/history"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profil"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerProfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/hapus-akun"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerHapusAkun />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/*"
            element={
              <ProtectedRoute allowedRole="customer">
                <Navigate to="/customer" replace />
              </ProtectedRoute>
            }
          />

          {/* Rute Driver (KELOMPOK B) */}
          <Route
            path="/driver"
            element={
              <ProtectedRoute allowedRole="driver">
                <DriverBeranda />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/request/:id"
            element={
              <ProtectedRoute allowedRole="driver">
                <DriverRequestDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/nego"
            element={
              <ProtectedRoute allowedRole="driver">
                <DriverNego />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/pesanan"
            element={
              <ProtectedRoute allowedRole="driver">
                <DriverPesanan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/navigasi"
            element={
              <ProtectedRoute allowedRole="driver">
                <DriverNavigasi />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/history"
            element={
              <ProtectedRoute allowedRole="driver">
                <DriverHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/profil"
            element={
              <ProtectedRoute allowedRole="driver">
                <DriverProfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/hapus-akun"
            element={
              <ProtectedRoute allowedRole="driver">
                <DriverHapusAkun />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver/*"
            element={
              <ProtectedRoute allowedRole="driver">
                <Navigate to="/driver" replace />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

