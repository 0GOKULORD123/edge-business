import { createBrowserRouter, RouterProvider, Navigate } from 'react-router';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InviteGate } from './components/InviteGate';
import { Toaster } from 'sonner';
import { HomePage } from './pages/HomePage';
import { SignUpPage } from './pages/SignUpPage';
import { SignInPage } from './pages/SignInPage';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotFoundPage } from './pages/NotFoundPage';

function AppContent() {
  const { hasAcceptedInvite } = useAuth();

  const router = createBrowserRouter([
    {
      path: '/',
      element: hasAcceptedInvite ? <HomePage /> : <InviteGate />,
    },
    {
      path: '/signup',
      element: hasAcceptedInvite ? <SignUpPage /> : <Navigate to="/" />,
    },
    {
      path: '/signin',
      element: hasAcceptedInvite ? <SignInPage /> : <Navigate to="/" />,
    },
    {
      path: '/dashboard',
      element: hasAcceptedInvite ? <UserDashboard /> : <Navigate to="/" />,
    },
    {
      path: '/admin',
      element: hasAcceptedInvite ? <AdminDashboard /> : <Navigate to="/" />,
    },
    {
      path: '/topup',
      element: hasAcceptedInvite ? <SignUpPage /> : <Navigate to="/" />,
    },
    {
      path: '*',
      element: <NotFoundPage />,
    },
  ]);

  return (
    <div className="dark">
      <RouterProvider router={router} />
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
