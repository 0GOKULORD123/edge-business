import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { storeAPI, paymentAPI } from '../services/api';
import {
  Coins,
  ShoppingCart,
  Trash2,
  Plus,
  Store,
  TrendingUp,
  LogOut,
  Lock,
  Sparkles,
  Search,
  Loader2,
  DollarSign,
  Package,
  FileText,
  Copy,
  Check,
  Download,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { AddReviewsForm } from '../components/AddReviewsForm';
import { RemoveReviewsForm } from '../components/RemoveReviewsForm';
import { RemoveReviewsPage } from '../components/RemoveReviewsPage';
import { UserRequests } from '../components/UserRequests';
import { MarketplaceSection } from '../components/MarketplaceSection';
import { NotificationBanner } from '../components/NotificationBanner';
import { SellerWithdrawals } from '../components/SellerWithdrawals';
import { MobileNavigation } from '../components/MobileNavigation';
import paymentQRDefault from '../../assets/d1f691fef65f70cf00a69020cf5f9a5db29724d5.png';
import edgeLogo from '../../assets/66374a2ff9f02213db2cda3bff0d1c000bf7c136.png';

interface StoreProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  fileUrl: string;
  added: string;
}

export function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [reviewCount, setReviewCount] = useState(3);
  const [businessLink, setBusinessLink] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showAddReviewsForm, setShowAddReviewsForm] = useState(false);
  const [showRemoveReviewsForm, setShowRemoveReviewsForm] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [storeProducts, setStoreProducts] = useState<StoreProduct[]>([]);
  const [purchasedProducts, setPurchasedProducts] = useState<string[]>([]);
  const [loadingStore, setLoadingStore] = useState(false);

  // Load payment settings from Supabase
  const [paymentSettings, setPaymentSettings] = useState({
    walletAddress: '0x2a6fd66fa33b9a3e8be38b0f034fa21c14eb330a',
    qrCode: paymentQRDefault,
  });

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    setLoadingStore(true);
    try {
      // Load payment settings
      const settings = await paymentAPI.getSettings();
      setPaymentSettings({
        walletAddress: settings.walletAddress || '0x2a6fd66fa33b9a3e8be38b0f034fa21c14eb330a',
        qrCode: settings.qrCode || paymentQRDefault,
      });

      // Load store products
      const products = await storeAPI.getProducts();
      setStoreProducts(products || []);

      // Load user's purchased products
      const purchased = await storeAPI.getPurchases(user.id);
      setPurchasedProducts(purchased.map((p: any) => p.productId) || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoadingStore(false);
    }
  };

  const handleCopyWallet = () => {
    navigator.clipboard.writeText(paymentSettings.walletAddress);
    setCopiedWallet(true);
    toast.success('Wallet address copied!');
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const handlePurchaseProduct = async (product: StoreProduct) => {
    if (!user) return;

    if (user.credits < product.price) {
      toast.error('Insufficient EDGE credits');
      return;
    }

    try {
      // Purchase product via API
      await storeAPI.purchase(user.id, product.id);

      // Deduct credits
      await updateUser({ credits: user.credits - product.price });

      // Update purchased products locally
      const newPurchased = [...purchasedProducts, product.id];
      setPurchasedProducts(newPurchased);

      toast.success(`Purchased ${product.name}! ${product.price} EDGE deducted`);
    } catch (error) {
      toast.error('Failed to purchase product');
      console.error(error);
    }
  };

  const handleDownloadProduct = (product: StoreProduct) => {
    window.open(product.fileUrl, '_blank');
    toast.success('Opening download link...');
  };

  if (!user) {
    navigate('/signin');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Signed out successfully');
  };

  const handleBuyReviews = () => {
    const packages = [
      { count: 3, credits: 6 },
      { count: 5, credits: 10 },
      { count: 10, credits: 20 },
      { count: 25, credits: 50 },
      { count: 50, credits: 100 },
      { count: 100, credits: 200 },
      { count: 500, credits: 1000 },
    ];

    const selectedPackage = packages.find(p => p.count === reviewCount) || packages[0];

    if (user.credits < selectedPackage.credits) {
      toast.error('Insufficient credits. Please top up your account.');
      setActiveSection('topup');
      return;
    }

    toast.success(`Order placed: ${reviewCount} reviews`);
  };

  const handleScanBusiness = () => {
    if (!businessLink) {
      toast.error('Please enter a Google Business link');
      return;
    }

    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanResult({
        negativeReviews: Math.floor(Math.random() * 20) + 5,
        estimatedCost: Math.floor(Math.random() * 50) + 30,
      });
    }, 3000);
  };

  const renderStatusBadge = () => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
      active: 'bg-green-500/20 text-green-500 border-green-500/30',
      suspended: 'bg-red-500/20 text-red-500 border-red-500/30',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${colors[user.status]}`}>
        {user.status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Notification Banners */}
      <NotificationBanner />

      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={edgeLogo} alt="EDGE" className="h-10 w-auto" />
              <div>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
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
      </div>

      {/* Main Content */}
      <div className="pt-24 px-4 max-w-7xl mx-auto">
        {/* Balance Card */}
        <div className="glass-card rounded-2xl p-6 mb-6 neon-glow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">EDGE Balance</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl font-bold neon-text">{user.credits}</h2>
                <span className="text-muted-foreground">EDGE</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">≈ ${user.credits * 10} USD value</p>
            </div>
            {renderStatusBadge()}
          </div>
          
          {user.status === 'pending' && (
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-500">
                ⏳ Your account is pending approval. Credits will be added once approved by admin.
              </p>
            </div>
          )}
        </div>

        {/* Navigation Pills */}
        <MobileNavigation activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="hidden md:flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles },
            { id: 'my-requests', label: 'My Requests', icon: FileText },
            { id: 'buy-reviews', label: 'Buy Reviews', icon: ShoppingCart },
            { id: 'remove-reviews', label: 'Remove Reviews', icon: Trash2 },
            { id: 'topup', label: 'Top Up', icon: Plus },
            { id: 'marketplace', label: 'Marketplace', icon: Store },
            { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
            { id: 'upgrade', label: 'Business Upgrade', icon: TrendingUp },
            { id: 'store', label: 'EDGE Store', icon: Package },
          ].map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] neon-glow'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Overview */}
          {activeSection === 'overview' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'Buy Reviews', desc: 'Boost your reputation', icon: ShoppingCart, action: () => setActiveSection('buy-reviews') },
                { title: 'Remove Reviews', desc: 'Clean negative feedback', icon: Trash2, action: () => setActiveSection('remove-reviews'), locked: user.credits < 30 },
                { title: 'Marketplace', desc: 'Open business exchange', icon: Store, action: () => setActiveSection('marketplace'), locked: user.credits < 50 },
                { title: 'Top Up Credits', desc: 'Add more EDGE credits', icon: Plus, action: () => setActiveSection('topup') },
                { title: 'Business Upgrade', desc: 'Premium optimization', icon: TrendingUp, action: () => setActiveSection('upgrade') },
                { title: 'EDGE Store', desc: 'Premium products', icon: Package, action: () => setActiveSection('store') },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  disabled={item.locked}
                  className="glass-card rounded-xl p-6 text-left hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative"
                >
                  {item.locked && (
                    <div className="absolute top-3 right-3">
                      <Lock className="w-4 h-4 text-yellow-500" />
                    </div>
                  )}
                  <item.icon className="w-8 h-8 mb-3 text-[#0ea5e9]" />
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                  {item.locked && (
                    <p className="text-xs text-yellow-500 mt-2">
                      Requires {item.title.includes('Remove') ? '30' : '50'} EDGE credits
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* My Requests */}
          {activeSection === 'my-requests' && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">My Requests</h2>
              <UserRequests />
            </div>
          )}

          {/* Buy Reviews */}
          {activeSection === 'buy-reviews' && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Buy Reviews</h2>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {[
                  { count: 3, credits: 6 },
                  { count: 5, credits: 10 },
                  { count: 10, credits: 20 },
                  { count: 25, credits: 50 },
                  { count: 50, credits: 100 },
                  { count: 100, credits: 200 },
                  { count: 500, credits: 1000 },
                ].map((pkg) => (
                  <button
                    key={pkg.count}
                    onClick={() => setReviewCount(pkg.count)}
                    className={`p-4 rounded-lg border transition-all ${
                      reviewCount === pkg.count
                        ? 'border-[#0ea5e9] bg-[#0ea5e9]/10 neon-glow'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-2xl font-bold mb-1">{pkg.count}</p>
                    <p className="text-sm text-muted-foreground">Reviews</p>
                    <div className="mt-2">
                      <p className="text-[#0ea5e9] font-semibold">{pkg.credits} EDGE</p>
                      <p className="text-xs text-muted-foreground">≈ ${pkg.credits * 10} USD</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  if (user.status !== 'active') {
                    toast.error('Account pending approval');
                    return;
                  }
                  setShowAddReviewsForm(true);
                }}
                disabled={user.status !== 'active'}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {user.status !== 'active' ? 'Account Pending Approval' : 'Create Request'}
              </button>
            </div>
          )}

          {/* Remove Reviews Tool */}
          {activeSection === 'remove-reviews' && (
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Remove Reviews Tool</h2>
                {user.credits < 30 && (
                  <Lock className="w-6 h-6 text-yellow-500" />
                )}
              </div>

              {user.credits < 30 ? (
                <div className="text-center py-12">
                  <Lock className="w-16 h-16 mx-auto mb-4 text-yellow-500 opacity-50" />
                  <p className="text-lg font-semibold mb-2">Feature Locked</p>
                  <p className="text-muted-foreground">Requires 30 EDGE credits to unlock</p>
                </div>
              ) : (
                <RemoveReviewsPage />
              )}
            </div>
          )}

          {/* Top Up */}
          {activeSection === 'topup' && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Top Up Credits</h2>
              <p className="text-muted-foreground mb-8">Add more EDGE credits to your account</p>

              <div className="space-y-6">
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

                {/* Payment Instructions */}
                <div className="p-6 bg-gradient-to-r from-[#0ea5e9]/20 to-[#8b5cf6]/20 border border-[#0ea5e9]/50 rounded-xl">
                  <h3 className="font-semibold mb-4 text-lg text-center">Payment Instructions</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-muted-foreground">Currency:</span>
                      <span className="font-semibold text-[#0ea5e9]">USDC</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-muted-foreground">Network:</span>
                      <span className="font-semibold text-[#0ea5e9]">Base Network</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-muted-foreground">Rate:</span>
                      <span className="font-semibold text-[#0ea5e9]">1 EDGE = $10 USD</span>
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
                      {copiedWallet ? (
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

                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400 text-center">
                    💡 After payment, contact admin to credit your account
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Marketplace */}
          {activeSection === 'marketplace' && <MarketplaceSection />}

          {/* Withdrawals */}
          {activeSection === 'withdrawals' && <SellerWithdrawals />}

          {/* Business Upgrade */}
          {activeSection === 'upgrade' && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">Business Upgrade Service</h2>
              <p className="text-muted-foreground mb-6">Premium optimization and reputation management</p>
              
              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="font-semibold mb-2">📈 Reputation Optimization</h3>
                  <p className="text-sm text-muted-foreground mb-3">Complete business profile enhancement</p>
                  <button
                    onClick={() => toast.info('Contact admin for upgrade services')}
                    className="px-4 py-2 rounded-lg bg-[#0ea5e9]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/30 transition-colors"
                  >
                    Learn More
                  </button>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h3 className="font-semibold mb-2">🎯 Authority Building</h3>
                  <p className="text-sm text-muted-foreground mb-3">Strategic review management</p>
                  <button
                    onClick={() => toast.info('Contact admin for upgrade services')}
                    className="px-4 py-2 rounded-lg bg-[#0ea5e9]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/30 transition-colors"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EDGE Store */}
          {activeSection === 'store' && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">EDGE Store</h2>
              <p className="text-muted-foreground mb-6">Premium products and services</p>

              {storeProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No products available yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {storeProducts.map((product) => {
                    const isPurchased = purchasedProducts.includes(product.id);
                    const canAfford = user.credits >= product.price;

                    return (
                      <div key={product.id} className="glass-card rounded-xl p-6 border border-white/10">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                            <div className="flex items-center gap-2">
                              <Coins className="w-5 h-5 text-[#0ea5e9]" />
                              <span className="text-lg font-bold text-[#0ea5e9]">{product.price} EDGE</span>
                              <span className="text-muted-foreground text-sm">≈ ${product.price * 10} USD</span>
                            </div>
                          </div>

                          {isPurchased ? (
                            <div className="flex flex-col items-end gap-2">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-500 border border-green-500/30">
                                PURCHASED
                              </span>
                              <button
                                onClick={() => handleDownloadProduct(product)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg transition-all font-semibold text-sm"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handlePurchaseProduct(product)}
                              disabled={!canAfford || user.status !== 'active'}
                              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {user.status !== 'active' ? 'Account Pending' : !canAfford ? 'Insufficient Credits' : 'Purchase'}
                            </button>
                          )}
                        </div>

                        {isPurchased && (
                          <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2 text-sm">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            <a
                              href={product.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0ea5e9] hover:underline break-all"
                            >
                              {product.fileUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Request Forms */}
      {showAddReviewsForm && (
        <AddReviewsForm
          reviewCount={reviewCount}
          onComplete={() => {
            setShowAddReviewsForm(false);
            setActiveSection('my-requests');
          }}
          onCancel={() => setShowAddReviewsForm(false)}
        />
      )}

      {showRemoveReviewsForm && (
        <RemoveReviewsForm
          onComplete={() => {
            setShowRemoveReviewsForm(false);
            setActiveSection('my-requests');
          }}
          onCancel={() => setShowRemoveReviewsForm(false)}
        />
      )}
    </div>
  );
}