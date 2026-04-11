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
import { useEffect, useState } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-api-loader': any;
    }
  }
}

function AppContent() {
  const { hasAcceptedInvite } = useAuth();
  const [mapsScriptLoaded, setMapsScriptLoaded] = useState(false);

  // Set page title
  useEffect(() => {
    document.title = 'Control Your Online Reputation with EDGE';
  }, []);

  // Load Google Maps Extended Component Library once for the entire app
  useEffect(() => {
    const existingScript = document.querySelector('script[src*="googlemaps/extended-component-library"]');

    if (existingScript) {
      setMapsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js';
    script.onload = () => {
      // Wait for custom elements to be defined
      Promise.all([
        customElements.whenDefined('gmpx-api-loader'),
        customElements.whenDefined('gmp-map'),
        customElements.whenDefined('gmpx-place-picker'),
      ]).then(() => {
        setMapsScriptLoaded(true);
      });
    };
    document.head.appendChild(script);
  }, []);

  return (
    <>
      {/* Google Maps API Loader - Only render after script is loaded */}
      {mapsScriptLoaded && (
        <gmpx-api-loader key="AIzaSyCdcJw0VNCxMwtiJmGu3dDsDcgnH4_0AD8" solution-channel="GMP_GE_mapsandplacesautocomplete_v2" />
      )}

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
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
