import React from 'react';
import { useNavigate } from 'react-router';
import { Home, Sparkles } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center mx-auto mb-6 neon-glow">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-6xl font-bold mb-4 neon-text">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all duration-300 font-semibold"
        >
          <Home className="w-5 h-5" />
          Back to Home
        </button>
      </div>
    </div>
  );
}
