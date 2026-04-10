import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import edgeLogo from '../../assets/66374a2ff9f02213db2cda3bff0d1c000bf7c136.png';

export function SignInPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    setTimeout(async () => {
      const result = await login(username, password);
      setLoading(false);

      if (result.success) {
        // Check if user has pending status
        if (result.user && result.user.status === 'pending') {
          // Redirect to activation page with user data
          navigate('/activate', {
            state: {
              username: result.user.username,
              walletAddress: result.user.walletAddress || '0x2a6fd66fa33b9a3e8be38b0f034fa21c14eb330a',
              plan: result.user.planName || result.user.selectedPlan || 'Standard Plan',
              price: result.user.planPrice || '$100',
              createdAt: result.user.createdAt || new Date().toISOString(),
            },
          });
          return;
        }

        toast.success('Welcome back!');
        // Admin goes to admin dashboard, users go to user dashboard
        if (username === 'edgeadmin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.error('Invalid credentials');
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Sign In Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={edgeLogo} alt="EDGE" className="h-16 w-auto" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center mb-2 neon-text">Welcome Back</h2>
          <p className="text-center text-muted-foreground mb-8">Sign in to your EDGE account</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/')}
                className="text-[#0ea5e9] hover:underline"
              >
                Get started
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}