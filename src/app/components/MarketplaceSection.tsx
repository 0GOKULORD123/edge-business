import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { marketplaceAPI, storeAPI } from '../services/api';
import { Store, Plus, X, DollarSign, Package, TrendingUp, Loader2, ShoppingCart, Download } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  sellerId: string;
  sellerName: string;
  fileUrl?: string;
  type: 'store' | 'marketplace';
  createdAt: string;
}

interface SellerProfile {
  userId: string;
  activatedAt: string;
  totalSales: number;
  totalEarnings: number;
}

export function MarketplaceSection() {
  const { user, updateUser } = useAuth();
  const [isSeller, setIsSeller] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [tab, setTab] = useState<'explore' | 'my-products'>('explore');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [myProducts, setMyProducts] = useState<MarketplaceProduct[]>([]);

  // New product form
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productFileUrl, setProductFileUrl] = useState('');

  useEffect(() => {
    loadMarketplaceData();
  }, [user?.id]);

  const loadMarketplaceData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Check if user is a seller
      const sellerData = await marketplaceAPI.checkSeller(user.id);
      setIsSeller(sellerData.isSeller);
      setSellerProfile(sellerData.seller);

      // Load all marketplace products
      const marketProducts = await marketplaceAPI.getProducts();

      // Load EDGE Store products
      const storeProducts = await storeAPI.getProducts();

      // Combine products with EDGE Store first
      const allProducts = [
        ...storeProducts.map((p: any) => ({ ...p, type: 'store' as const, sellerName: 'EDGE Official' })),
        ...marketProducts.map((p: any) => ({ ...p, type: 'marketplace' as const })),
      ];
      setProducts(allProducts);

      // Load my products if seller
      if (sellerData.isSeller) {
        const myProds = await marketplaceAPI.getSellerProducts(user.id);
        setMyProducts(myProds);
      }
    } catch (error) {
      console.error('Failed to load marketplace:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSeller = async () => {
    if (!user) return;

    if (user.credits < 50) {
      toast.error('Insufficient credits. You need 50 EDGE to become a seller.');
      return;
    }

    try {
      await marketplaceAPI.activateSeller(user.id);
      await updateUser({ credits: user.credits - 50 });

      setIsSeller(true);
      toast.success('Seller access unlocked! You can now sell products in the marketplace.');
      loadMarketplaceData();
    } catch (error) {
      toast.error('Failed to activate seller account');
      console.error(error);
    }
  };

  const handleAddProduct = async () => {
    if (!user) return;

    if (!productName || !productDescription || !productPrice) {
      toast.error('Please fill in all required fields');
      return;
    }

    const price = parseInt(productPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      await marketplaceAPI.addProduct({
        name: productName,
        description: productDescription,
        price,
        sellerId: user.id,
        sellerName: user.username,
        fileUrl: productFileUrl || '',
      });

      toast.success('Product listed successfully!');
      setShowAddProduct(false);
      setProductName('');
      setProductDescription('');
      setProductPrice('');
      setProductFileUrl('');
      loadMarketplaceData();
    } catch (error) {
      toast.error('Failed to add product');
      console.error(error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await marketplaceAPI.deleteProduct(productId);
      toast.success('Product removed');
      loadMarketplaceData();
    } catch (error) {
      toast.error('Failed to remove product');
      console.error(error);
    }
  };

  const handlePurchaseProduct = async (product: MarketplaceProduct) => {
    if (!user) return;

    if (user.credits < product.price) {
      toast.error('Insufficient EDGE credits');
      return;
    }

    try {
      if (product.type === 'store') {
        await storeAPI.purchase(user.id, product.id);
      } else {
        await marketplaceAPI.purchase(user.id, product.id, product.sellerId, product.price);
      }

      await updateUser({ credits: user.credits - product.price });
      toast.success(`Purchased ${product.name}! ${product.price} EDGE deducted`);

      if (product.fileUrl) {
        window.open(product.fileUrl, '_blank');
      }
    } catch (error) {
      toast.error('Failed to purchase product');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#0ea5e9]" />
        </div>
      </div>
    );
  }

  if (!isSeller) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Marketplace</h2>
        </div>

        <div className="p-6 bg-white/5 rounded-lg border border-white/10 mb-6 text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-[#0ea5e9]" />
          <p className="text-lg font-semibold mb-2">Become a Seller</p>
          <p className="text-sm text-muted-foreground mb-4">
            Unlock seller features and list your services. Earn EDGE by selling to other users!
          </p>
          <p className="text-2xl font-bold text-[#0ea5e9] mb-4">50 EDGE One-Time Fee</p>
          <button
            onClick={handleActivateSeller}
            disabled={user ? user.credits < 50 : true}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Unlock Seller Access
          </button>
          <p className="text-xs text-muted-foreground mt-4">
            Your balance: {user?.credits || 0} EDGE credits
          </p>
        </div>

        {/* Explore Products (Non-Seller View) */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4">Explore Marketplace</h3>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No products available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  {product.type === 'store' && (
                    <div className="inline-block px-2 py-1 rounded text-xs font-semibold bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] mb-2">
                      EDGE Official
                    </div>
                  )}
                  <h4 className="font-semibold mb-2">{product.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#0ea5e9]">{product.price} EDGE</span>
                    <button
                      onClick={() => handlePurchaseProduct(product)}
                      disabled={user ? user.credits < product.price : true}
                      className="px-4 py-2 rounded-lg bg-[#0ea5e9]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Buy
                    </button>
                  </div>
                  {product.type === 'marketplace' && (
                    <p className="text-xs text-muted-foreground mt-2">Seller: {product.sellerName}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Seller View
  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Marketplace</h2>
        <div className="flex items-center gap-4">
          {sellerProfile && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Your Earnings</p>
              <p className="text-lg font-bold text-[#0ea5e9]">{sellerProfile.totalEarnings} EDGE</p>
            </div>
          )}
          <button
            onClick={() => setShowAddProduct(true)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Seller Stats */}
      {sellerProfile && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
            <p className="text-2xl font-bold">{sellerProfile.totalSales}</p>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-[#0ea5e9]">{sellerProfile.totalEarnings} EDGE</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-white/10">
        <button
          onClick={() => setTab('explore')}
          className={`pb-3 px-4 transition-colors ${
            tab === 'explore'
              ? 'border-b-2 border-[#0ea5e9] text-[#0ea5e9]'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          Explore
        </button>
        <button
          onClick={() => setTab('my-products')}
          className={`pb-3 px-4 transition-colors ${
            tab === 'my-products'
              ? 'border-b-2 border-[#0ea5e9] text-[#0ea5e9]'
              : 'text-muted-foreground hover:text-white'
          }`}
        >
          My Products ({myProducts.length})
        </button>
      </div>

      {/* Content */}
      {tab === 'explore' && (
        <div>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No products available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => (
                <div key={product.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  {product.type === 'store' && (
                    <div className="inline-block px-2 py-1 rounded text-xs font-semibold bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] mb-2">
                      EDGE Official
                    </div>
                  )}
                  <h4 className="font-semibold mb-2">{product.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#0ea5e9]">{product.price} EDGE</span>
                    <button
                      onClick={() => handlePurchaseProduct(product)}
                      disabled={user ? user.credits < product.price : true}
                      className="px-4 py-2 rounded-lg bg-[#0ea5e9]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Buy
                    </button>
                  </div>
                  {product.type === 'marketplace' && (
                    <p className="text-xs text-muted-foreground mt-2">Seller: {product.sellerName}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'my-products' && (
        <div>
          {myProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">No products listed yet</p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-4 py-2 rounded-lg bg-[#0ea5e9]/20 text-[#0ea5e9] hover:bg-[#0ea5e9]/30 transition-colors"
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myProducts.map((product) => (
                <div key={product.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{product.name}</h4>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#0ea5e9]">{product.price} EDGE</span>
                    <span className="text-xs text-muted-foreground">
                      Listed {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal */}
      <AnimatePresence>
        {showAddProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Add Product</h3>
                <button onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Description *</label>
                  <textarea
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Describe your product"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Price (EDGE) *</label>
                  <input
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="0"
                    min="1"
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">File URL (optional)</label>
                  <input
                    type="url"
                    value={productFileUrl}
                    onChange={(e) => setProductFileUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9] outline-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Link to downloadable file or resource</p>
                </div>

                <button
                  onClick={handleAddProduct}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-[#0ea5e9] to-[#8b5cf6] hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all font-semibold"
                >
                  List Product
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
