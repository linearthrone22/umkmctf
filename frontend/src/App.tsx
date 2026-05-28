import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SellerDashboardPage from './features/seller-dashboard/SellerDashboardPage';
import BuyerMarketplacePage from './features/buyer-dashboard/BuyerMarketplacePage';
import AdminPage from './features/admin/AdminPage';
import LoginPage from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerDashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/buyer-marketplace" 
          element={
            <ProtectedRoute allowedRoles={['buyer']}>
              <BuyerMarketplacePage />
            </ProtectedRoute>
          } 
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all for logged in users */}
        <Route 
          path="/home" 
          element={
            loading ? (
              <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
                Memuat sesi aplikasi...
              </div>
            ) : !user ? (
              <Navigate to="/login" replace />
            ) : user.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : user.role === 'seller' ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/buyer-marketplace" replace />
            )
          } 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </Router>
    </>
  );
}

export default App;
