import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, notificationsAPI, storeAPI, paymentAPI } from '../services/api';
import {
  Users,
  Coins,
  Key,
  Bell,
  Store as StoreIcon,
  LogOut,
  Check,
  X,
  Plus,
  Sparkles,
  ShoppingBag,
  Trash2,
  FileText,
  Wallet,
  Upload,
  Send,
  DollarSign,
  Edit,
  UserCog,
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminRequests } from '../components/AdminRequests';
import { AdminUserManagement } from '../components/AdminUserManagement';
import { AdminWithdrawals } from '../components/AdminWithdrawals';
import paymentQRDefault from '../../assets/d1f691fef65f70cf00a69020cf5f9a5db29724d5.png';
import edgeLogo from '../../assets/66374a2ff9f02213db2cda3bff0d1c000bf7c136.png';

interface PendingUser {
  id: string;
  username: string;
  email?: string;
  purpose?: string;
  selectedPlan?: string;
  planName?: string;
  planPrice?: string;
  planCredits?: number;
  status: string;
  credits: number;
}

interface StoreProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  fileUrl: string;
  added: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [inviteCodes, setInviteCodes] = useState<string[]>(['EDGE2026']);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [storeItems, setStoreItems] = useState<StoreProduct[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Product form state
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState(10);
  const [productFileUrl, setProductFileUrl] = useState('');

  // Broadcast notification state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  // Payment settings
  const [paymentSettings, setPaymentSettings] = useState({
    walletAddress: '0x2a6fd66fa33b9a3e8be38b0f034fa21c14eb330a',
    qrCode: paymentQRDefault,
  });
  const [editingWallet, setEditingWallet] = useState(false);
  const [newWalletAddress, setNewWalletAddress] = useState('');

  useEffect(() => {
    loadUsers();
    loadPaymentSettings();
    loadStoreProducts();
  }, []);

  const loadPaymentSettings = () => {
    const settings = localStorage.getItem('edge_payment_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setPaymentSettings(parsed);
      setNewWalletAddress(parsed.walletAddress);
    } else {
      setNewWalletAddress(paymentSettings.walletAddress);
    }
  };

  const loadUsers = async () => {
    try {
      const users = await authAPI.getAllUsers();
      setPendingUsers(users.filter((u: any) => u.status === 'pending'));
      setAllUsers(users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleApproveUser = async (userId: string, creditsToAdd: number) => {
    try {
      await authAPI.updateUser(userId, {
        status: 'active',
        credits: creditsToAdd,
      });
      loadUsers();
      toast.success(`User approved with ${creditsToAdd} EDGE credits`);
    } catch (error) {
      toast.error('Failed to approve user');
      console.error(error);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      await authAPI.updateUser(userId, {
        status: 'suspended',
      });
      loadUsers();
      toast.success('User rejected');
    } catch (error) {
      toast.error('Failed to reject user');
      console.error(error);
    }
  };

  const handleAddCredits = async (userId: string, amount: number) => {
    try {
      const users = await authAPI.getAllUsers();
      const user = users.find((u: any) => u.id === userId);

      if (user) {
        await authAPI.updateUser(userId, {
          credits: user.credits + amount,
        });
        loadUsers();
        toast.success(`Added ${amount} EDGE credits`);
      }
    } catch (error) {
      toast.error('Failed to add credits');
      console.error(error);
    }
  };

  const handleAddInviteCode = () => {
    if (!newInviteCode) return;
    setInviteCodes([...inviteCodes, newInviteCode]);
    setNewInviteCode('');
    toast.success('Invite code added');
  };

  const handleRemoveInviteCode = (code: string) => {
    setInviteCodes(inviteCodes.filter(c => c !== code));
    toast.success('Invite code removed');
  };

  const handleSendNotification = async (userId: string, message: string) => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await notificationsAPI.create({
        userId,
        type: 'message',
        title: 'Message from Admin',
        message: message.trim(),
        broadcast: false,
      });
      toast.success('Notification sent to user');
    } catch (error) {
      toast.error('Failed to send notification');
      console.error(error);
    }
  };

  const handleBroadcastNotification = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Please enter both title and message');
      return;
    }

    try {
      const response = await notificationsAPI.create({
        type: 'broadcast',
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        broadcast: true,
      });
      toast.success(`Broadcast sent to ${response.sent} users!`);
      setBroadcastTitle('');
      setBroadcastMessage('');
    } catch (error) {
      toast.error('Failed to send broadcast');
      console.error(error);
    }
  };

  const loadStoreProducts = async () => {
    try {
      const products = await storeAPI.getProducts();
      setStoreItems(products || []);
    } catch (error) {
      console.error('Failed to load store products:', error);
    }
  };

  const handleAddStoreItem = async () => {
    if (!productName || !productDescription || productPrice <= 0 || !productFileUrl) {
      toast.error('Please fill in all product fields');
      return;
    }

    try {
      await storeAPI.addProduct({
        name: productName,
        description: productDescription,
        price: productPrice,
        fileUrl: productFileUrl,
        added: new Date().toISOString(),
      });

      // Reset form
      setProductName('');
      setProductDescription('');
      setProductPrice(10);
      setProductFileUrl('');
      setShowAddProduct(false);

      toast.success('Store product added');
      loadStoreProducts();
    } catch (error) {
      toast.error('Failed to add store product');
      console.error(error);
    }
  };

  const handleRemoveStoreItem = async (itemId: string) => {
    try {
      await storeAPI.deleteProduct(itemId);
      toast.success('Store product removed');
      loadStoreProducts();
    } catch (error) {
      toast.error('Failed to remove store product');
      console.error(error);
    }
  };

  const handleUpdateWalletAddress = () => {
    if (!newWalletAddress) {
      toast.error('Wallet address cannot be empty');
      return;
    }

    const updatedSettings = {
      ...paymentSettings,
      walletAddress: newWalletAddress,
    };

    setPaymentSettings(updatedSettings);
    localStorage.setItem('edge_payment_settings', JSON.stringify(updatedSettings));
    setEditingWallet(false);
    toast.success('Payment wallet address updated');
  };

  const handleQRCodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedSettings = {
          ...paymentSettings,
          qrCode: reader.result as string,
        };
        setPaymentSettings(updatedSettings);
        localStorage.setItem('edge_payment_settings', JSON.stringify(updatedSettings));
        toast.success('QR Code updated');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Admin signed out');
  };

  if (!user || !user.isAdmin) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={edgeLogo} alt="EDGE" className="h-10 w-auto" />
              <div>
                <p className="text-xs text-muted-foreground">Administrative Panel</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 px-4 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0ea5e9]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#0ea5e9]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{allUsers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingUsers.length}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{allUsers.filter(u => u.status === 'active').length}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invite Codes</p>
                <p className="text-2xl font-bold">{inviteCodes.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {[
            { id: 'users', label: 'Pending Approvals', icon: Users },
            { id: 'user-management', label: 'User Management', icon: UserCog },
            { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
            { id: 'requests', label: 'Requests', icon: FileText },
            { id: 'credits', label: 'Credits', icon: Coins },
            { id: 'payment', label: 'Payment Settings', icon: Wallet },
            { id: 'invites', label: 'Invite Codes', icon: Key },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'store', label: 'Store Items', icon: StoreIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] neon-glow'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* User Management */}
          {activeTab === 'users' && (
            <div>
              {pendingUsers.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-4">Pending Approvals</h3>
                  <div className="space-y-3">
                    {pendingUsers.map((user) => (
                      <div key={user.id} className="glass-card rounded-xl p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{user.username}</p>
                            <p className="text-sm text-muted-foreground">{user.email || 'No email provided'}</p>
                            <p className="text-xs text-muted-foreground mt-1">Purpose: {user.purpose}</p>

                            {/* Plan Information */}
                            {user.planName && (
                              <div className="mt-3 p-3 bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-lg">
                                <p className="text-sm font-semibold text-[#0ea5e9] mb-1">Selected Plan</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-base font-bold">{user.planName}</p>
                                  <span className="text-muted-foreground">•</span>
                                  <p className="text-base font-semibold text-[#0ea5e9]">{user.planPrice}</p>
                                  <span className="text-muted-foreground">•</span>
                                  <p className="text-sm text-muted-foreground">{user.planCredits} EDGE Credits</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              placeholder="Credits"
                              defaultValue={user.planCredits || 10}
                              min="0"
                              className="w-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                              id={`credits-${user.id}`}
                            />
                            <button
                              onClick={() => {
                                const input = document.getElementById(`credits-${user.id}`) as HTMLInputElement;
                                handleApproveUser(user.id, parseInt(input.value) || 0);
                              }}
                              className="p-2 rounded-lg bg-green-500/20 text-green-500 hover:bg-green-500/30 transition-colors"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRejectUser(user.id)}
                              className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="text-xl font-bold mb-4">All Users</h3>
              <div className="space-y-3">
                {allUsers.map((user) => (
                  <div key={user.id} className="glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{user.username}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            user.status === 'active' ? 'bg-green-500/20 text-green-500' :
                            user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-red-500/20 text-red-500'
                          }`}>
                            {user.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email || 'No email'}</p>
                        <p className="text-sm text-[#0ea5e9] mt-1">{user.credits} EDGE</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Management */}
          {activeTab === 'user-management' && (
            <AdminUserManagement />
          )}

          {/* Withdrawals */}
          {activeTab === 'withdrawals' && (
            <AdminWithdrawals />
          )}

          {/* Requests */}
          {activeTab === 'requests' && (
            <div>
              <h3 className="text-xl font-bold mb-4">User Requests</h3>
              <AdminRequests />
            </div>
          )}

          {/* Credits Management */}
          {activeTab === 'credits' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Manage User Credits</h3>
              <div className="space-y-3">
                {allUsers.filter(u => u.status === 'active').map((user) => (
                  <div key={user.id} className="glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{user.username}</p>
                        <p className="text-sm text-[#0ea5e9]">Current: {user.credits} EDGE</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="Amount"
                          defaultValue={10}
                          min="0"
                          className="w-24 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                          id={`add-credits-${user.id}`}
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(`add-credits-${user.id}`) as HTMLInputElement;
                            handleAddCredits(user.id, parseInt(input.value) || 0);
                          }}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg transition-all text-sm font-semibold"
                        >
                          Add Credits
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Payment Settings</h3>
              <p className="text-muted-foreground mb-6">Manage USDC payment wallet and QR code</p>

              <div className="space-y-6">
                {/* Current QR Code */}
                <div className="glass-card rounded-xl p-6">
                  <h4 className="font-semibold mb-4">Current Payment QR Code</h4>
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white rounded-lg">
                      <img
                        src={paymentSettings.qrCode}
                        alt="Payment QR Code"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQRCodeUpload}
                      className="hidden"
                      id="qr-upload"
                    />
                    <label
                      htmlFor="qr-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload New QR Code
                    </label>
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="glass-card rounded-xl p-6">
                  <h4 className="font-semibold mb-4">USDC Wallet Address (Base Network)</h4>

                  {!editingWallet ? (
                    <div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
                        <code className="text-sm text-[#0ea5e9] break-all">{paymentSettings.walletAddress}</code>
                      </div>
                      <button
                        onClick={() => setEditingWallet(true)}
                        className="px-4 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg transition-all rounded-lg font-semibold"
                      >
                        Edit Wallet Address
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={newWalletAddress}
                        onChange={(e) => setNewWalletAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all mb-4"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleUpdateWalletAddress}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg transition-all rounded-lg font-semibold"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => {
                            setEditingWallet(false);
                            setNewWalletAddress(paymentSettings.walletAddress);
                          }}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-500">
                      ⚠️ This wallet address will be shown to all users during signup. Only accept USDC on Base network.
                    </p>
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="glass-card rounded-xl p-6">
                  <h4 className="font-semibold mb-4">Payment Instructions</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-muted-foreground">Currency:</span>
                      <span className="font-semibold text-[#0ea5e9]">USDC</span>
                    </p>
                    <p className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-muted-foreground">Network:</span>
                      <span className="font-semibold text-[#0ea5e9]">Base Network</span>
                    </p>
                    <p className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-muted-foreground">Rate:</span>
                      <span className="font-semibold text-[#0ea5e9]">1 EDGE = $10 USD</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invite Codes */}
          {activeTab === 'invites' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Manage Invite Codes</h3>
              
              <div className="glass-card rounded-xl p-4 mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInviteCode}
                    onChange={(e) => setNewInviteCode(e.target.value)}
                    placeholder="Enter new invite code"
                    className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                  />
                  <button
                    onClick={handleAddInviteCode}
                    className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg transition-all font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {inviteCodes.map((code) => (
                  <div key={code} className="glass-card rounded-xl p-4 flex items-center justify-between">
                    <code className="text-[#0ea5e9] font-mono">{code}</code>
                    <button
                      onClick={() => handleRemoveInviteCode(code)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {/* Broadcast Notification */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Bell className="w-6 h-6 text-[#0ea5e9]" />
                  Broadcast to All Users
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2">Notification Title *</label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="Important Announcement"
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Message *</label>
                    <textarea
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Your message to all users..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none resize-none"
                    />
                  </div>
                  <button
                    onClick={handleBroadcastNotification}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Send Broadcast to All Users
                  </button>
                </div>
              </div>

              {/* Individual Notifications */}
              <div>
                <h3 className="text-xl font-bold mb-4">Send to Individual Users</h3>
                <div className="space-y-3">
                  {allUsers.map((user) => (
                    <div key={user.id} className="glass-card rounded-xl p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold mb-2">{user.username}</p>
                          <input
                            type="text"
                            placeholder="Enter message..."
                            id={`msg-${user.id}`}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const input = document.getElementById(`msg-${user.id}`) as HTMLInputElement;
                            handleSendNotification(user.id, input.value);
                            input.value = '';
                          }}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg transition-all text-sm font-semibold"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Store Items */}
          {activeTab === 'store' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Manage Store Products</h3>
              <p className="text-muted-foreground mb-6">Add products with EDGE pricing. All users will see these products.</p>

              {!showAddProduct ? (
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="glass-card rounded-xl p-6 w-full text-center hover:scale-[1.02] transition-all mb-6"
                >
                  <Plus className="w-12 h-12 mx-auto mb-3 text-[#0ea5e9]" />
                  <p className="font-semibold">Add New Product</p>
                </button>
              ) : (
                <div className="glass-card rounded-xl p-6 mb-6">
                  <h4 className="font-semibold mb-4">New Product Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2">Product Name *</label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g., Premium SEO Guide"
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Description *</label>
                      <textarea
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        placeholder="Describe the product..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Price (EDGE) *</label>
                      <input
                        type="number"
                        value={productPrice}
                        onChange={(e) => setProductPrice(Number(e.target.value))}
                        min="1"
                        placeholder="10"
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                      />
                      <p className="text-xs text-muted-foreground mt-1">≈ ${productPrice * 10} USD</p>
                    </div>

                    <div>
                      <label className="block text-sm mb-2">Download URL *</label>
                      <input
                        type="url"
                        value={productFileUrl}
                        onChange={(e) => setProductFileUrl(e.target.value)}
                        placeholder="https://... (PDF, ZIP, etc.)"
                        className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none transition-all"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Direct link to downloadable file</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleAddStoreItem}
                        className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg transition-all font-semibold"
                      >
                        Add Product
                      </button>
                      <button
                        onClick={() => {
                          setShowAddProduct(false);
                          setProductName('');
                          setProductDescription('');
                          setProductPrice(10);
                          setProductFileUrl('');
                        }}
                        className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {storeItems.length === 0 ? (
                  <div className="text-center py-12 glass-card rounded-xl">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No products added yet</p>
                  </div>
                ) : (
                  storeItems.map((item) => (
                    <div key={item.id} className="glass-card rounded-xl p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-2">{item.name}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Coins className="w-4 h-4 text-[#0ea5e9]" />
                              <span className="font-semibold text-[#0ea5e9]">{item.price} EDGE</span>
                              <span className="text-muted-foreground">(${item.price * 10})</span>
                            </div>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              Added {new Date(item.added).toLocaleDateString()}
                            </span>
                          </div>
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#0ea5e9] hover:underline mt-2 inline-block break-all"
                          >
                            {item.fileUrl}
                          </a>
                        </div>
                        <button
                          onClick={() => handleRemoveStoreItem(item.id)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}