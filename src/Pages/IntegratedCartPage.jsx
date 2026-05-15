import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import BackButton from '../Components/shared/BackButton';
import { ShoppingCart, Trash2, Plus, Minus, Package, Shield, Loader, AlertTriangle } from 'lucide-react';
import { getCartItems, updateCartItem, removeFromCart } from '../api/dashboardapi';
import { showToast } from '../Services/toastService';

const IntegratedCartPage = () => {
  const { darkMode } = useTheme();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [cartItems,     setCartItems]     = useState([]);
  const [updatingItems, setUpdatingItems] = useState(new Set());

  useEffect(() => {
    getCartItems()
      .then(data => setCartItems(data || []))
      .catch(() => showToast('Failed to load cart', 'error'));
  }, []);

  const getListingData = (item) => item.listing_detail || item.listing || {};
  const getPrice       = (item) => { const ld = getListingData(item); return ld.price ? parseFloat(ld.price) : 0; };
  const getImageUrl    = (item) => {
    const ld = getListingData(item);
    if (ld.image) return ld.image;
    if (ld.images?.[0]?.image) return ld.images[0].image;
    return null;
  };

  const handleQuantityChange = async (cartItemId, action) => {
    if (updatingItems.has(cartItemId)) return;
    setUpdatingItems(prev => new Set([...prev, cartItemId]));
    try {
      const current = cartItems.find(i => i.id === cartItemId);
      const newQty  = action === 'increase' ? current.quantity + 1 : Math.max(1, current.quantity - 1);
      await updateCartItem(cartItemId, newQty);
      setCartItems(prev => prev.map(i => i.id === cartItemId ? { ...i, quantity: newQty } : i));
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

  const handleCheckoutItem = (item) => {
    const listingData = getListingData(item);
    navigate('/checkout', {
      state: {
        checkoutType: 'single',
        item: {
          listing_id: listingData.id,
          cart_item_id: item.id,
          title: listingData.title,
          price: getPrice(item),
          quantity: item.quantity,
          image: getImageUrl(item),
          listing_type: listingData.listing_type || 'good',
          condition: listingData.condition,
          seller_id: listingData.seller?.id,
        },
        returnTo: '/cart',
      },
    });
  };

  const handleCheckoutAll = () => {
    if (cartItems.length === 0) { showToast('Your cart is empty', 'warning'); return; }
    const checkoutItems  = cartItems.map(item => {
      const ld = getListingData(item);
      return { listing_id: ld.id, cart_item_id: item.id, title: ld.title, price: getPrice(item), quantity: item.quantity, image: getImageUrl(item), listing_type: ld.listing_type || 'good', condition: ld.condition, seller_id: ld.seller?.id };
    });
    const totalAmount = checkoutItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    navigate('/checkout', { state: { checkoutType: 'bulk', items: checkoutItems, totalAmount, itemCount: cartItems.length, returnTo: '/cart' } });
  };

  const subtotal = cartItems.reduce((sum, item) => sum + getPrice(item) * item.quantity, 0);

  const anyIssue = cartItems.some(item => {
    const ld = getListingData(item);
    return ld.is_draft || ld.status === 'deactivated' || ld.status === 'sold' || ld.is_out_of_stock
      || (ld.listing_type === 'good' && ld.quantity_remaining != null && item.quantity > ld.quantity_remaining);
  });

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar />

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-12">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-4">
          <BackButton darkMode={darkMode} onClick={() => navigate('/dashboard')} />
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Shopping Cart</h1>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
            <ShoppingCart className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            <h2 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Your cart is empty</h2>
            <p className={`mb-5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Browse listings and add items to get started.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium text-sm"
            >
              Browse Listings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Cart items */}
            <div className="lg:col-span-2 space-y-3">
              {cartItems.map((item) => {
                const listingData = getListingData(item);
                const imgUrl      = getImageUrl(item);
                const price       = getPrice(item);

                const isUnavailable = listingData.is_draft || listingData.status === 'deactivated';
                const isSoldOut     = listingData.status === 'sold' || listingData.is_out_of_stock;
                const stockShort    = !isSoldOut && listingData.listing_type === 'good'
                  && listingData.quantity_remaining != null
                  && item.quantity > listingData.quantity_remaining;
                const hasIssue = isUnavailable || isSoldOut || stockShort;

                return (
                  <div key={item.id} className={`rounded-2xl border p-4 ${
                    hasIssue
                      ? darkMode ? 'bg-gray-800 border-amber-700/50' : 'bg-white border-amber-300 shadow-sm'
                      : darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'
                  }`}>
                    <div className="flex gap-3">
                      <div className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {imgUrl
                          ? <img src={imgUrl} alt={listingData.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>
                        }
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 pr-2">
                            <p className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {listingData.title || 'Item'}
                            </p>
                            {listingData.condition && (
                              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {listingData.condition}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={updatingItems.has(item.id)}
                            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-400 hover:bg-red-50'}`}
                          >
                            {updatingItems.has(item.id)
                              ? <Loader className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
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
                            <span className={`w-7 text-center text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
                          <p className="text-sm font-bold text-emerald-600">
                            KSh {(price * item.quantity).toLocaleString('en-KE')}
                          </p>
                        </div>

                        {hasIssue && (
                          <div className={`mt-2 flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                            darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'
                          }`}>
                            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <span>
                              {isUnavailable && 'This listing has been unpublished by the seller and cannot be purchased.'}
                              {isSoldOut && 'This item is sold out and cannot be purchased.'}
                              {stockShort && `Only ${listingData.quantity_remaining} left — reduce your quantity to continue.`}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => handleCheckoutItem(item)}
                          disabled={isUnavailable || isSoldOut}
                          className={`mt-2 w-full py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                            isUnavailable || isSoldOut
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {isUnavailable ? 'Unavailable' : isSoldOut ? 'Sold Out' : 'Checkout this item'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className={`rounded-2xl border p-4 sticky top-20 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                <h2 className={`text-base font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Order Summary</h2>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Subtotal</span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      KSh {subtotal.toLocaleString('en-KE')}
                    </span>
                  </div>
                  <div className={`flex justify-between pt-2 border-t text-sm ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total</span>
                    <span className="font-bold text-emerald-600">KSh {subtotal.toLocaleString('en-KE')}</span>
                  </div>
                </div>

                {anyIssue && (
                  <div className={`mb-2 flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                    darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>Some items in your cart are unavailable. Remove or fix them before checking out together.</span>
                  </div>
                )}
                <button
                  onClick={handleCheckoutAll}
                  disabled={anyIssue}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                    anyIssue
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  Checkout all ({cartItems.length} items)
                </button>

                <div className={`mt-3 p-2.5 rounded-lg flex items-center justify-center gap-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
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
