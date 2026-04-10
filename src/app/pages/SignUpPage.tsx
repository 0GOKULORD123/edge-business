import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ChevronRight, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import paymentQR from '../../assets/2e977c89fb06273c9b7ee869cbd90d9952ad0cb1.png';

export function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const selectedPlan = location.state?.selectedPlan;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load payment settings from localStorage
  const [paymentSettings, setPaymentSettings] = useState({
    walletAddress: '0x2a6fd66fa33b9a3e8be38b0f034fa21c14eb330a',
    qrCode: paymentQR,
  });

  useEffect(() => {
    const settings = localStorage.getItem('edge_payment_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setPaymentSettings({
        walletAddress: parsed.walletAddress || '0x2a6fd66fa33b9a3e8be38b0f034fa21c14eb330a',
        qrCode: parsed.qrCode || paymentQR,
      });
    }
  }, []);

  // Redirect if no plan selected
  useEffect(() => {
    if (!selectedPlan) {
      toast.error('Please select a plan first');
      navigate('/');
    }
  }, [selectedPlan, navigate]);

  // Step 1 data
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('');

  // Step 2 data
  const [network, setNetwork] = useState('base');
  const [credits, setCredits] = useState(10);
  const [generating, setGenerating] = useState(false);

  // Get plan details based on selectedPlan
  const planDetails = {
    starter: { name: 'Starter Access', price: '$300', credits: 30 },
    pro: { name: 'Pro Access', price: '$1,200', credits: 120 },
    firsttimer: { name: 'First Timer', price: '$99', credits: 10 },
  };

  const currentPlan = selectedPlan ? planDetails[selectedPlan as keyof typeof planDetails] : null;

  const usdAmount = currentPlan ? currentPlan.credits * 10 : credits * 10;

  const handleStep1Continue = () => {
    if (!username || !password || !purpose) {
      toast.error('Please fill in username, password, and purpose');
      return;
    }
    setStep(2);
  };

  const handleGenerateWallet = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setStep(3);
    }, 2000);
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(paymentSettings.walletAddress);
    setCopied(true);
    toast.success('Wallet address copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinueToPayment = () => {
    if (credits < 10) {
      toast.error('Minimum purchase is 10 EDGE Credits ($100)');
      return;
    }
    setStep(3);
  };

  const handleConfirmPayment = async () => {
    setLoading(true);

    // Register user with plan information
    const result = await register({
      username,
      password,
      email: email && email.trim() !== '' ? email : undefined, // Only send email if provided and not empty
      purpose,
      selectedPlan,
      planName: currentPlan?.name,
      planPrice: currentPlan?.price,
      planCredits: currentPlan?.credits,
      walletAddress: paymentSettings.walletAddress,
    });

    setTimeout(() => {
      setLoading(false);
      if (result.success) {
        toast.success('Account created successfully!');
        // Redirect to activation page with account details
        navigate('/activate', {
          state: {
            username,
            walletAddress: paymentSettings.walletAddress,
            plan: currentPlan?.name || 'Standard Plan',
            price: currentPlan?.price || `$${usdAmount}`,
            createdAt: new Date().toISOString(),
          },
        });
      } else {
        toast.error(result.error || 'Registration failed');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <button
          onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  i === step
                    ? 'bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] neon-glow scale-110'
                    : i < step
                    ? 'bg-[#0ea5e9]/50'
                    : 'bg-white/10'
                }`}
              >
                {i}
              </div>
              {i < 3 && (
                <div className={`w-12 h-1 rounded-full ${i < step ? 'bg-[#0ea5e9]' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Main Card */}
        <div className="glass-card rounded-2xl p-8 shadow-2xl">
          {/* Step 1: Account Setup */}
          {step === 1 && (
            <div>
              <h2 className="text-3xl font-bold mb-2 neon-text">Create Account</h2>
              <p className="text-muted-foreground mb-8">Set up your EDGE profile</p>

              <div className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm mb-2">
                    Username *
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm mb-2">
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm mb-2">
                    Email (Optional)
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="purpose" className="block text-sm mb-2">
                    Purpose *
                  </label>
                  <select
                    id="purpose"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                  >
                    <option value="">Select your purpose</option>
                    <option value="add-reviews">Add Reviews</option>
                    <option value="remove-reviews">Remove Reviews</option>
                    <option value="upgrade-business">Upgrade Business</option>
                    <option value="access-marketplace">Access Marketplace</option>
                  </select>
                </div>

                <button
                  onClick={handleStep1Continue}
                  className="w-full py-4 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Generate Wallet */}
          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold mb-2 neon-text">Generate Payment Wallet</h2>
              <p className="text-muted-foreground mb-8">Create your secure payment wallet</p>

              <div className="space-y-6">
                {/* Wallet Generation */}
                <div>
                  <p className="text-sm mb-3">Generate a secure wallet address for your payment</p>
                  {!generating ? (
                    <button
                      onClick={handleGenerateWallet}
                      className="w-full py-4 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all duration-300 font-semibold text-lg"
                    >
                      Generate Wallet
                    </button>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 py-12 bg-white/5 rounded-lg border border-[#0ea5e9]/30">
                      <Loader2 className="w-12 h-12 animate-spin text-[#0ea5e9]" />
                      <span className="text-lg font-semibold text-[#0ea5e9]">Generating secure wallet...</span>
                      <p className="text-sm text-muted-foreground">Please wait</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gradient-to-r from-[#0ea5e9]/10 to-[#8b5cf6]/10 border border-[#0ea5e9]/30 rounded-lg">
                  <h3 className="font-semibold mb-2">What happens next?</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• You'll receive a unique wallet address</li>
                    <li>• Send USDC on Base Network to complete payment</li>
                    <li>• Your account will be activated after confirmation</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment Confirmation */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#8b5cf6] flex items-center justify-center mx-auto mb-6 neon-glow animate-pulse">
                <Loader2 className="w-10 h-10 animate-spin text-white" />
              </div>

              <h2 className="text-3xl font-bold mb-2 neon-text">Awaiting Payment</h2>
              <p className="text-muted-foreground mb-8">
                Complete your payment to activate your account
              </p>

              <div className="space-y-6 mb-8">
                {/* QR Code */}
                <div className="flex justify-center">
                  <div className="p-6 bg-white rounded-xl shadow-lg">
                    <img
                      src={paymentSettings.qrCode}
                      alt="Payment QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                </div>

                {/* Payment Amount */}
                <div className="p-6 bg-gradient-to-r from-[#0ea5e9]/20 to-[#8b5cf6]/20 border border-[#0ea5e9]/50 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Payment Amount</p>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-3xl font-bold">{currentPlan?.price || `$${usdAmount}`} USD</p>
                    <span className="text-muted-foreground text-xl">≈</span>
                    <p className="text-3xl font-bold text-[#0ea5e9]">{currentPlan ? currentPlan.credits : credits} EDGE</p>
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="font-semibold mb-4 text-lg">Payment Instructions</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-[#0ea5e9]/10 to-[#8b5cf6]/10 border border-[#0ea5e9]/30 rounded-lg">
                      <p className="text-sm leading-relaxed">
                        <span className="font-semibold text-[#0ea5e9]">Transfer the exact amount</span> to the address below.
                        Wait a few minutes and your account will be <span className="font-semibold">automatically activated</span>.
                      </p>
                      <p className="text-sm mt-2 text-yellow-400 font-semibold">
                        ⏱️ Payment gate valid for 24 hours only.
                      </p>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-muted-foreground">Currency:</span>
                        <span className="font-semibold text-[#0ea5e9]">USDC</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-muted-foreground">Network:</span>
                        <span className="font-semibold text-[#0ea5e9]">Base Network</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">Wallet Address</p>
                    <button
                      onClick={handleCopyWallet}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg transition-all rounded-lg text-sm font-semibold"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                    <code className="text-sm text-[#0ea5e9] break-all font-mono">{paymentSettings.walletAddress}</code>
                  </div>
                </div>

                {/* Warning */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-500 text-center">
                    ⚠️ Only send USDC on Base network to this address
                  </p>
                </div>
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="w-full py-4 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all duration-300 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'I Have Completed Payment'
                )}
              </button>

              <p className="text-xs text-muted-foreground mt-4">
                Your account will be reviewed and approved by an admin after payment confirmation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
