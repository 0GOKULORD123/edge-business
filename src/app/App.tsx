import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InviteGate } from './components/InviteGate';
import { Toaster } from 'sonner';
import { HomePage } from './pages/HomePage';
import { SignUpPage } from './pages/SignUpPage';
import { SignInPage } from './pages/SignInPage';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFoundPage } from './pages/NotFoundPage';
import { ActivateAccountPage } from './pages/ActivateAccountPage';

function AppContent() {
  const { hasAcceptedInvite } = useAuth();

  return (
    <div className="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={hasAcceptedInvite ? <HomePage /> : <InviteGate />} />
          <Route path="/signup" element={hasAcceptedInvite ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="/signin" element={hasAcceptedInvite ? <SignInPage /> : <Navigate to="/" />} />
          <Route path="/activate" element={hasAcceptedInvite ? <ActivateAccountPage /> : <Navigate to="/" />} />
          <Route path="/dashboard" element={hasAcceptedInvite ? <UserDashboard /> : <Navigate to="/" />} />
          <Route path="/admin" element={hasAcceptedInvite ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="/topup" element={hasAcceptedInvite ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(20, 20, 30, 0.95)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
