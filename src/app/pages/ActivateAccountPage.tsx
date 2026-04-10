import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Copy, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import edgeLogo from '../../assets/66374a2ff9f02213db2cda3bff0d1c000bf7c136.png';
import qrCode from '../../assets/2e977c89fb06273c9b7ee869cbd90d9952ad0cb1.png';

interface LocationState {
  username: string;
  walletAddress: string;
  plan: string;
  price: string;
  createdAt: string;
}

export function ActivateAccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [timeLeft, setTimeLeft] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // If no state, redirect to signin
  useEffect(() => {
    if (!state) {
      navigate('/signin');
      return;
    }
  }, [state, navigate]);

  // Calculate countdown
  useEffect(() => {
    if (!state?.createdAt) return;

    const calculateTimeLeft = () => {
      const created = new Date(state.createdAt);
      const deadline = new Date(created.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [state?.createdAt]);

  const handleCopyAddress = async () => {
    if (!state?.walletAddress) return;

    try {
      await navigator.clipboard.writeText(state.walletAddress);
      setCopied(true);
      toast.success('Wallet address copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  if (!state) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/signin')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </button>

        {/* Activation Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={edgeLogo} alt="EDGE" className="h-16 w-auto" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center mb-2 neon-text">Account Activation Required</h2>
          <p className="text-center text-muted-foreground mb-8">
            Welcome, <span className="text-[#0ea5e9]">{state.username}</span>! Please fund your account to activate it.
          </p>

          {/* Countdown Timer */}
          <div className="bg-gradient-to-r from-[#0ea5e9]/10 to-[#8b5cf6]/10 border border-[#0ea5e9]/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-[#0ea5e9]" />
              <h3 className="text-xl font-semibold">Time Remaining</h3>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold neon-text mb-2">
                {timeLeft}
              </div>
              <p className="text-sm text-muted-foreground">
                If your account is not activated within 24 hours, you will need another invite code to be eligible again.
              </p>
            </div>
          </div>

          {/* Plan Details */}
          <div className="space-y-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Selected Plan</div>
              <div className="text-xl font-semibold text-[#0ea5e9]">{state.plan}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Required Amount</div>
              <div className="text-xl font-semibold">{state.price}</div>
            </div>

            {/* Wallet Address */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">Payment Address (ETH Network - Send USDC)</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/30 rounded-lg px-3 py-2 font-mono text-sm break-all">
                  {state.walletAddress}
                </div>
                <button
                  onClick={handleCopyAddress}
                  className="p-2 rounded-lg bg-[#0ea5e9]/20 hover:bg-[#0ea5e9]/30 transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-[#0ea5e9]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-gradient-to-r from-[#0ea5e9]/10 to-[#8b5cf6]/10 border border-[#0ea5e9]/30 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-center">Payment Instructions</h3>
            <div className="space-y-2 text-sm">
              <p className="text-center">
                <span className="font-semibold text-[#0ea5e9]">Transfer the exact amount</span> ({state.price}) to the address below.
              </p>
              <p className="text-center">
                Wait a few minutes and your account will be <span className="font-semibold text-green-400">automatically activated</span>.
              </p>
              <p className="text-center text-yellow-400 font-semibold mt-3">
                ⏱️ Payment gate valid for 24 hours only.
              </p>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
            <div className="text-sm text-muted-foreground text-center mb-4">
              Scan QR Code to Send USDC on ETH Network
            </div>
            <div className="flex justify-center">
              <img
                src={qrCode}
                alt="Payment QR Code"
                className="w-64 h-64 rounded-lg bg-white p-2"
              />
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-center">
              <span className="font-semibold">Important:</span> Send only USDC on the Ethereum network to the address above.
              Sending any other token or using a different network may result in permanent loss of funds.
            </p>
          </div>

          {/* Refresh Button */}
          <div className="text-center">
            <button
              onClick={() => navigate('/signin')}
              className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#0ea5e9]/50 transition-all font-medium"
            >
              Already Paid? Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
