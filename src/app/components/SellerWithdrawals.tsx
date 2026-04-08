import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { withdrawalAPI, marketplaceAPI } from '../services/api';
import { DollarSign, Wallet, Clock, CheckCircle, XCircle, AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface Withdrawal {
  id: string;
  userId: string;
  username: string;
  amount: number;
  walletAddress: string;
  status: 'pending' | 'approved' | 'declined' | 'completed';
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export function SellerWithdrawals() {
  const { user, updateUser } = useAuth();
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || '');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadSellerData();
    }
  }, [user]);

  const loadSellerData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // First check if user is a seller
      const sellerCheck = await marketplaceAPI.checkSeller(user.id);
      if (!sellerCheck || !sellerCheck.isSeller) {
        setSellerProfile(null);
        setLoading(false);
        return;
      }

      // Load seller data if verified
      const [profile, withdrawalsList] = await Promise.all([
        marketplaceAPI.getProfile(user.id),
        withdrawalAPI.getAll(user.id)
      ]);
      setSellerProfile(profile);
      setWithdrawals(withdrawalsList);
    } catch (error) {
      console.error('Failed to load seller data:', error);
      setSellerProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWallet = async () => {
    if (!walletAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Please enter a valid Ethereum wallet address');
      return;
    }

    try {
      await updateUser({ walletAddress });
      toast.success('Wallet address saved successfully');
    } catch (error) {
      console.error('Failed to save wallet:', error);
      toast.error('Failed to save wallet address');
    }
  };

  const handleWithdraw = async () => {
    if (!user || !sellerProfile) return;

    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount < 100) {
      toast.error('Minimum withdrawal amount is $100');
      return;
    }

    if (amount > sellerProfile.totalEarnings) {
      toast.error('Insufficient balance');
      return;
    }

    if (!user.walletAddress) {
      toast.error('Please set your wallet address first');
      return;
    }

    try {
      const response = await withdrawalAPI.create({
        userId: user.id,
        username: user.username,
        amount: amount,
        walletAddress: user.walletAddress
      });

      if (response.success) {
        toast.success('Withdrawal request submitted!');
        setWithdrawAmount('');
        setShowWithdrawForm(false);
        await loadSellerData();
      }
    } catch (error) {
      console.error('Failed to create withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    }
  };

  const getStatusIcon = (status: Withdrawal['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <DollarSign className="w-5 h-5 text-[#0ea5e9]" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'declined':
        return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  const getStatusColor = (status: Withdrawal['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'approved':
        return 'bg-[#0ea5e9]/20 text-[#0ea5e9] border-[#0ea5e9]/50';
      case 'completed':
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'declined':
        return 'bg-destructive/20 text-destructive border-destructive/50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-16 h-16 text-[#0ea5e9] mx-auto mb-4 animate-pulse" />
        <p className="text-muted-foreground">Loading seller data...</p>
      </div>
    );
  }

  if (!sellerProfile) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">You need to be a marketplace seller to access withdrawals</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4">Seller Balance</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
            <p className="text-2xl font-bold text-[#0ea5e9]">{(sellerProfile.totalEarnings || 0) / 10} EDGE</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
            <p className="text-2xl font-bold">{sellerProfile.totalSales || 0}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-green-500">{(sellerProfile.totalEarnings || 0) / 10} EDGE</p>
              <p className="text-sm text-muted-foreground">≈ ${sellerProfile.totalEarnings || 0} USDC</p>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Address */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-[#0ea5e9]" />
          <h3 className="text-lg font-bold">Wallet Address</h3>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all font-mono text-sm"
          />
          <button
            onClick={handleSaveWallet}
            className="px-6 py-3 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 rounded-lg transition-all font-semibold"
          >
            Save
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-2">Enter your Ethereum wallet address to receive USDC payments</p>
      </div>

      {/* Withdraw Button */}
      {!showWithdrawForm && (
        <button
          onClick={() => setShowWithdrawForm(true)}
          disabled={!user?.walletAddress || (sellerProfile.totalEarnings || 0) < 100}
          className="w-full px-6 py-4 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          Request Withdrawal
        </button>
      )}

      {/* Withdraw Form */}
      {showWithdrawForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold mb-4">Request Withdrawal</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Amount (USD)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Minimum $100"
                min="100"
                max={sellerProfile.totalEarnings || 0}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>Minimum: $100</span>
                <span>Available: ${sellerProfile.totalEarnings || 0}</span>
              </div>
            </div>

            <div className="p-4 bg-[#0ea5e9]/10 border border-[#0ea5e9]/50 rounded-lg">
              <p className="text-sm font-semibold text-[#0ea5e9] mb-1">Receiving</p>
              <p className="text-2xl font-bold">{withdrawAmount || '0'} USDC</p>
              <p className="text-xs text-muted-foreground mt-1">Sent to: {user?.walletAddress?.substring(0, 10)}...{user?.walletAddress?.substring(user.walletAddress.length - 8)}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || parseFloat(withdrawAmount) < 100}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 rounded-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
              <button
                onClick={() => { setShowWithdrawForm(false); setWithdrawAmount(''); }}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Withdrawal History */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4">Withdrawal History</h3>
        <div className="space-y-3">
          {withdrawals.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No withdrawal requests yet</p>
          ) : (
            withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(withdrawal.status)}
                    <div>
                      <p className="font-bold">${withdrawal.amount} USDC</p>
                      <p className="text-sm text-muted-foreground">{formatDate(withdrawal.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(withdrawal.status)}`}>
                    {withdrawal.status}
                  </span>
                </div>
                {withdrawal.status === 'declined' && withdrawal.reason && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/50 rounded-lg">
                    <p className="text-sm font-semibold text-destructive mb-1">Declined Reason:</p>
                    <p className="text-sm text-muted-foreground">{withdrawal.reason}</p>
                  </div>
                )}
                {withdrawal.status === 'approved' && (
                  <div className="mt-3 p-3 bg-[#0ea5e9]/10 border border-[#0ea5e9]/50 rounded-lg">
                    <p className="text-sm text-[#0ea5e9]">Withdrawal approved! USDC will be sent shortly.</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
