import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import BackButton from '../Components/shared/BackButton';

import {
  ShoppingCart, Trash2, Plus, Minus,
  Package, Shield, Loader,
  AlertCircle
} from 'lucide-react';
import {
  getCartItems,
  updateCartItem,
  removeFromCart,
} from '../api/dashboardapi';
import { showToast } from '../Services/toastService';

const IntegratedCartPage = () => {
  const { darkMode } = useTheme();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [unavailableItems, setUnavailableItems] = useState([]);

  // ── Load cart ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const cartData = await getCartItems();
        setCartItems(cartData || []);
      } catch (err) {
        showToast('Failed to load cart', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getListingData = (item) => item.listing_detail || item.listing || {};
  const getPrice = (item) => {
    const ld = getListingData(item);
    return ld.price ? parseFloat(ld.price) : 0;
  };

  const getImageUrl = (item) => {
    const ld = getListingData(item);
    if (ld.image) return ld.image;
    if (ld.images?.[0]?.image) return ld.images[0].image;
    return null;
  };

  // ── Quantity / remove ──────────────────────────────────────────────────────
  const handleQuantityChange = async (cartItemId, action) => {
    if (updatingItems.has(cartItemId)) return;
    setUpdatingItems(prev => new Set([...prev, cartItemId]));
    try {
      const current = cartItems.find(i => i.id === cartItemId);
      const newQty = action === 'increase'
        ? current.quantity + 1
        : Math.max(1, current.quantity - 1);
      await updateCartItem(cartItemId, newQty);
      setCartItems(prev =>
        prev.map(i => i.id === cartItemId ? { ...i, quantity: newQty } : i)
      );
    } catch (err) {
      showToast(err.message || 'Failed to update cart', 'error');
    } finally {
      setUpdatingItems(prev => { const s = new Set(prev); s.delete(cartItemId); return s; });
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    if (updatingItems.has(cartItemId)) return;
    setUpdatingItems(prev => new Set([...prev, cartItemId]));
    try {
      await removeFromCart(cartItemId);
      setCartItems(prev => prev.filter(i => i.id !== cartItemId));
      showToast('Item removed', 'success');
    } catch (err) {
      showToast('Failed to remove item', 'error');
    } finally {
      setUpdatingItems(prev => { const s = new Set(prev); s.delete(cartItemId); return s; });
    }
  };

  // ── Checkout handlers - Redirect to checkout page ─────────────────────────
  const handleCheckoutItem = (item) => {
    const listingData = getListingData(item);
    
    const checkoutItem = {
      listing_id: listingData.id,
      cart_item_id: item.id,
      title: listingData.title,
      price: getPrice(item),
      quantity: item.quantity,
      image: getImageUrl(item),
      listing_type: listingData.listing_type || 'good',
      condition: listingData.condition,
      seller_id: listingData.seller?.id
    };
    
    navigate('/checkout', { 
      state: { 
        checkoutType: 'single',
        item: checkoutItem,
        returnTo: '/cart'
      }
    });
  };

  const handleCheckoutAll = () => {
    if (cartItems.length === 0) {
      showToast('Your cart is empty', 'warning');
      return;
    }
    
    const checkoutItems = cartItems.map(item => {
      const listingData = getListingData(item);
      return {
        listing_id: listingData.id,
        cart_item_id: item.id,
        title: listingData.title,
        price: getPrice(item),
        quantity: item.quantity,
        image: getImageUrl(item),
        listing_type: listingData.listing_type || 'good',
        condition: listingData.condition,
        seller_id: listingData.seller?.id
      };
    });
    
    const totalAmount = checkoutItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );
    
    navigate('/checkout', { 
      state: { 
        checkoutType: 'bulk',
        items: checkoutItems,
        totalAmount: totalAmount,
        itemCount: cartItems.length,
        returnTo: '/cart'
      }
    });
  };

  const subtotal = cartItems.reduce((sum, item) =>
    sum + getPrice(item) * item.quantity, 0
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="text-center">
        <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-500" />
        <p className={darkMode ? 'text-white' : 'text-gray-900'}>Loading your cart...</p>
      </div>
    </div>
  );

  // ── Main Cart View ─────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar />

      <div className="max-w-7xl mx-auto px-4 py-6 pt-24">
        {/* Header */}
        <div className="mb-6">
          <BackButton
            darkMode={darkMode}
            label="Continue Shopping"
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          />
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Shopping Cart
          </h1>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className={`text-center py-16 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <ShoppingCart className={`w-20 h-20 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Your cart is empty
            </h2>
            <p className={`mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Browse listings and add items to get started
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm"
            >
              Browse Listings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const listingData = getListingData(item);
                const imgUrl = getImageUrl(item);
                const price = getPrice(item);

                return (
                  <div key={item.id} className={`rounded-xl shadow p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                        {imgUrl
                          ? <img src={imgUrl} alt={listingData.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {listingData.title || 'Item'}
                            </p>
                            {listingData.condition && (
                              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Condition: {listingData.condition}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={updatingItems.has(item.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            {updatingItems.has(item.id)
                              ? <Loader className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, 'decrease')}
                              disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                item.quantity <= 1 || updatingItems.has(item.id)
                                  ? 'opacity-40 cursor-not-allowed'
                                  : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className={`w-8 text-center text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.id, 'increase')}
                              disabled={updatingItems.has(item.id)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                                updatingItems.has(item.id)
                                  ? 'opacity-40 cursor-not-allowed'
                                  : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-emerald-600">
                              KSh {(price * item.quantity).toLocaleString('en-KE')}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCheckoutItem(item)}
                          className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                          Checkout This Item
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className={`rounded-xl shadow p-5 sticky top-24 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Order Summary
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Subtotal</span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      KSh {subtotal.toLocaleString('en-KE')}
                    </span>
                  </div>
                  <div className={`flex justify-between pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      KSh {subtotal.toLocaleString('en-KE')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckoutAll}
                  className="w-full mt-5 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all"
                >
                  Checkout All ({cartItems.length} items)
                </button>

                <div className={`mt-4 p-3 rounded-lg flex items-center justify-center gap-2 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Peer-to-peer marketplace — no platform fees
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default IntegratedCartPage;
