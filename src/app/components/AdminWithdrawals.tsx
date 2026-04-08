import React, { useState, useEffect } from 'react';
import { withdrawalAPI } from '../services/api';
import { DollarSign, Clock, CheckCircle, XCircle, Loader2, Copy, AlertTriangle } from 'lucide-react';
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

export function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      setLoading(true);
      const data = await withdrawalAPI.getAll();
      setWithdrawals(data);
    } catch (error) {
      console.error('Failed to load withdrawals:', error);
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawal: Withdrawal) => {
    if (!confirm(`Approve withdrawal of $${withdrawal.amount} to ${withdrawal.walletAddress}?`)) {
      return;
    }

    try {
      const response = await withdrawalAPI.update(withdrawal.id, {
        status: 'approved'
      });
      if (response.success) {
        toast.success('Withdrawal approved. Please send USDC manually.');
        await loadWithdrawals();
        setSelectedWithdrawal(null);
      }
    } catch (error) {
      console.error('Failed to approve withdrawal:', error);
      toast.error('Failed to approve withdrawal');
    }
  };

  const handleComplete = async (withdrawal: Withdrawal) => {
    if (!confirm('Mark this withdrawal as completed? This confirms that USDC has been sent.')) {
      return;
    }

    try {
      const response = await withdrawalAPI.update(withdrawal.id, {
        status: 'completed'
      });
      if (response.success) {
        toast.success('Withdrawal marked as completed');
        await loadWithdrawals();
        setSelectedWithdrawal(null);
      }
    } catch (error) {
      console.error('Failed to complete withdrawal:', error);
      toast.error('Failed to complete withdrawal');
    }
  };

  const handleDecline = async (withdrawal: Withdrawal) => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }

    try {
      const response = await withdrawalAPI.update(withdrawal.id, {
        status: 'declined',
        reason: declineReason
      });
      if (response.success) {
        toast.success('Withdrawal declined');
        await loadWithdrawals();
        setSelectedWithdrawal(null);
        setDeclineReason('');
      }
    } catch (error) {
      console.error('Failed to decline withdrawal:', error);
      toast.error('Failed to decline withdrawal');
    }
  };

  const copyWalletAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success('Wallet address copied!');
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

  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    completed: withdrawals.filter(w => w.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-16 h-16 text-[#0ea5e9] mx-auto mb-4 animate-spin" />
        <p className="text-muted-foreground">Loading withdrawals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Requests</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Approved</p>
          <p className="text-2xl font-bold text-[#0ea5e9]">{stats.approved}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Amount (USD)</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Wallet Address</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Date</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No withdrawal requests
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium">{withdrawal.username}</td>
                    <td className="px-6 py-4 font-bold text-[#0ea5e9]">${withdrawal.amount}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono">
                          {withdrawal.walletAddress.substring(0, 6)}...{withdrawal.walletAddress.substring(withdrawal.walletAddress.length - 4)}
                        </span>
                        <button
                          onClick={() => copyWalletAddress(withdrawal.walletAddress)}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(withdrawal.status)}
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(withdrawal.status)}`}>
                          {withdrawal.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(withdrawal.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedWithdrawal(withdrawal)}
                        className="px-4 py-2 bg-[#0ea5e9]/20 hover:bg-[#0ea5e9]/30 rounded-lg transition-colors text-sm"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg glass-card rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold neon-text">Withdrawal Request</h3>
              <button
                onClick={() => { setSelectedWithdrawal(null); setDeclineReason(''); }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-white/5 rounded-lg space-y-3">
                <div>
                  <span className="text-sm text-muted-foreground">User</span>
                  <p className="font-medium">{selectedWithdrawal.username}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <p className="text-2xl font-bold text-[#0ea5e9]">${selectedWithdrawal.amount} USDC</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Wallet Address</span>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-mono text-sm break-all">{selectedWithdrawal.walletAddress}</p>
                    <button
                      onClick={() => copyWalletAddress(selectedWithdrawal.walletAddress)}
                      className="p-2 hover:bg-white/10 rounded transition-colors shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedWithdrawal.status)}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedWithdrawal.status)}`}>
                      {selectedWithdrawal.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Requested</span>
                  <p className="text-sm">{formatDate(selectedWithdrawal.createdAt)}</p>
                </div>
                {selectedWithdrawal.reason && (
                  <div className="pt-3 border-t border-white/10">
                    <span className="text-sm text-muted-foreground">Decline Reason</span>
                    <p className="text-sm mt-1">{selectedWithdrawal.reason}</p>
                  </div>
                )}
              </div>

              {selectedWithdrawal.status === 'pending' && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-500 mb-1">Action Required</p>
                    <p className="text-muted-foreground">Review this withdrawal request and approve or decline.</p>
                  </div>
                </div>
              )}

              {selectedWithdrawal.status === 'approved' && (
                <div className="p-4 bg-[#0ea5e9]/10 border border-[#0ea5e9]/50 rounded-lg flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-[#0ea5e9] shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-[#0ea5e9] mb-1">Send USDC</p>
                    <p className="text-muted-foreground">Send ${selectedWithdrawal.amount} USDC to the wallet address above, then mark as completed.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {selectedWithdrawal.status === 'pending' && (
              <div className="space-y-3">
                <button
                  onClick={() => handleApprove(selectedWithdrawal)}
                  className="w-full px-4 py-3 bg-green-500/20 border border-green-500/50 text-green-500 hover:bg-green-500/30 rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve Withdrawal
                </button>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Reason for declining (required)"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-destructive focus:ring-1 focus:ring-destructive outline-none transition-all"
                  />
                  <button
                    onClick={() => handleDecline(selectedWithdrawal)}
                    disabled={!declineReason.trim()}
                    className="w-full px-4 py-3 bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30 rounded-lg transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-5 h-5" />
                    Decline Withdrawal
                  </button>
                </div>
              </div>
            )}

            {selectedWithdrawal.status === 'approved' && (
              <button
                onClick={() => handleComplete(selectedWithdrawal)}
                className="w-full px-4 py-3 bg-green-500/20 border border-green-500/50 text-green-500 hover:bg-green-500/30 rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Mark as Completed
              </button>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
