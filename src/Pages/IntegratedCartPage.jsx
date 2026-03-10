import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import MobileNavBar from '../Components/Layout/MobileNavBar';
import { 
  ShoppingCart, Trash2, Plus, Minus, MapPin, Clock, Phone,
  MessageSquare, ChevronRight, ArrowLeft, Package, CreditCard,
  User, Star, Shield, Check, X, Info, Smartphone, Loader,
  AlertCircle, CheckCircle
} from 'lucide-react';
import {
  getCartItems,
  updateCartItem,
  removeFromCart,
  getCampusLocations
} from '../api/dashboardapi';
import { showToast } from '../Services/toastService';

const IntegratedCartPage = () => {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [cartItems, setCartItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  
  // Checkout states
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState('mpesa');
  const [pickupDetails, setPickupDetails] = useState({
    date: '',
    time: '',
    location: '',
    notes: ''
  });
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Load cart data
  useEffect(() => {
    const loadCartData = async () => {
      setIsLoading(true);
      try {
        const [cartData, locationsData] = await Promise.all([
          getCartItems(),
          getCampusLocations()
        ]);
        
        setCartItems(cartData);
        setLocations(locationsData);
      } catch (error) {
        console.error('Error loading cart data:', error);
        showToast('Failed to load cart data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadCartData();
  }, []);

  const handleQuantityChange = async (cartItemId, action) => {
    if (updatingItems.has(cartItemId)) return;
    
    setUpdatingItems(prev => new Set([...prev, cartItemId]));
    
    try {
      const currentItem = cartItems.find(item => item.id === cartItemId);
      const newQuantity = action === 'increase' 
        ? currentItem.quantity + 1 
        : Math.max(1, currentItem.quantity - 1);
      
      await updateCartItem(cartItemId, newQuantity);
      
      // Update local state
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.id === cartItemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
      
      showToast('Cart updated', 'success');
    } catch (error) {
      console.error('Error updating cart:', error);
      showToast('Failed to update cart', 'error');
    } finally {
      setUpdatingItems(prev => {
        const updated = new Set(prev);
        updated.delete(cartItemId);
        return updated;
      });
    }
  };

  const handleRemoveItem = async (cartItemId) => {
    if (updatingItems.has(cartItemId)) return;
    
    setUpdatingItems(prev => new Set([...prev, cartItemId]));
    
    try {
      await removeFromCart(cartItemId);
      setCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
      showToast('Item removed from cart', 'success');
    } catch (error) {
      console.error('Error removing item:', error);
      showToast('Failed to remove item', 'error');
    } finally {
      setUpdatingItems(prev => {
        const updated = new Set(prev);
        updated.delete(cartItemId);
        return updated;
      });
    }
  };

  const handleCheckout = async () => {
    if (!agreedToTerms) {
      showToast('Please agree to the terms and conditions', 'error');
      return;
    }

    if (!pickupDetails.date || !pickupDetails.time || !pickupDetails.location) {
      showToast('Please fill in all pickup details', 'error');
      return;
    }

    if (selectedPayment === 'mpesa' && !mpesaNumber) {
      showToast('Please enter your M-Pesa number', 'error');
      return;
    }

    setIsProcessingCheckout(true);

    try {
      // Simulate checkout process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowCheckout(true);
      showToast('Order placed successfully!', 'success');
    } catch (error) {
      console.error('Error processing checkout:', error);
      showToast('Failed to process checkout', 'error');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => 
    sum + (item.listing?.price * item.quantity), 0
  );
  const serviceFee = Math.round(subtotal * 0.05); // 5% service fee
  const total = subtotal + serviceFee;

  // Group items by seller
  const itemsBySeller = cartItems.reduce((acc, item) => {
    const sellerId = item.listing?.seller?.id;
    const sellerName = item.listing?.seller?.full_name || 'Unknown Seller';
    
    if (!acc[sellerId]) {
      acc[sellerId] = {
        seller: item.listing?.seller,
        items: []
      };
    }
    acc[sellerId].items.push(item);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-500" />
          <p className={`text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Loading your cart...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <DashboardNavbar />
      <MobileNavBar cartItemsCount={cartItems.length} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className={`mb-4 flex items-center space-x-2 ${
              darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            } transition-colors`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Continue Shopping</span>
          </button>
          
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Shopping Cart
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          // Empty Cart
          <div className={`text-center py-16 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg`}>
            <ShoppingCart className={`w-24 h-24 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <h2 className={`text-2xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Your cart is empty
            </h2>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Looks like you haven't added anything yet
            </p>
            <button
              onClick={() => navigate('/browse')}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg hover:from-emerald-700 hover:to-cyan-700 transition-colors font-medium"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(itemsBySeller).map(([sellerId, sellerGroup]) => (
                <div key={sellerId} className={`${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                } rounded-xl shadow-lg p-6`}>
                  {/* Seller Header */}
                  <div className={`flex items-center justify-between pb-4 mb-4 border-b ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        darkMode ? 'bg-gray-700' : 'bg-emerald-100'
                      }`}>
                        <User className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {sellerGroup.seller?.full_name || 'Unknown Seller'}
                          </h3>
                          {sellerGroup.seller?.is_verified && (
                            <Shield className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                        <div className="flex items-center space-x-3 mt-1">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {sellerGroup.seller?.rating || '4.5'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {sellerGroup.seller?.campus_location || 'Campus'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors font-medium text-sm">
                      Contact Seller
                    </button>
                  </div>

                  {/* Seller's Items */}
                  <div className="space-y-4">
                    {sellerGroup.items.map(item => (
                      <div key={item.id} className={`flex gap-4 pb-4 ${
                        sellerGroup.items.indexOf(item) !== sellerGroup.items.length - 1 
                          ? `border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}` 
                          : ''
                      }`}>
                        <img
                          src={item.listing?.images?.[0]?.image || '/placeholder.jpg'}
                          alt={item.listing?.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.listing?.title}
                              </h4>
                              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Condition: {item.listing?.condition}
                              </p>
                              {item.listing?.category && (
                                <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
                                  darkMode ? 'bg-gray-700 text-gray-300' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {item.listing.category.name}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={updatingItems.has(item.id)}
                              className={`p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
                                updatingItems.has(item.id) ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {updatingItems.has(item.id) ? (
                                <Loader className="w-5 h-5 animate-spin text-gray-400" />
                              ) : (
                                <Trash2 className="w-5 h-5 text-red-500" />
                              )}
                            </button>
                          </div>

                          <div className="flex justify-between items-end mt-3">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleQuantityChange(item.id, 'decrease')}
                                disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                                className={`p-1 rounded-lg ${
                                  item.quantity <= 1 || updatingItems.has(item.id)
                                    ? 'opacity-50 cursor-not-allowed'
                                    : darkMode 
                                      ? 'bg-gray-700 hover:bg-gray-600' 
                                      : 'bg-gray-100 hover:bg-gray-200'
                                } transition-colors`}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className={`font-medium px-3 min-w-[40px] text-center ${
                                darkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {updatingItems.has(item.id) ? (
                                  <Loader className="w-4 h-4 animate-spin mx-auto" />
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, 'increase')}
                                disabled={updatingItems.has(item.id)}
                                className={`p-1 rounded-lg ${
                                  updatingItems.has(item.id)
                                    ? 'opacity-50 cursor-not-allowed'
                                    : darkMode 
                                      ? 'bg-gray-700 hover:bg-gray-600' 
                                      : 'bg-gray-100 hover:bg-gray-200'
                                } transition-colors`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-emerald-600">
                                KSh {(item.listing?.price * item.quantity)?.toLocaleString()}
                              </p>
                              {item.quantity > 1 && (
                                <p className={`text-sm text-right ${
                                  darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  KSh {item.listing?.price?.toLocaleString()} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className={`${
                darkMode ? 'bg-gray-800' : 'bg-white'
              } rounded-xl shadow-lg p-6 sticky top-24`}>
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Order Summary
                </h2>

                <div className="space-y-3 mb-4">
                  <div className={`flex justify-between ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span className="font-medium">KSh {subtotal?.toLocaleString()}</span>
                  </div>
                  <div className={`flex justify-between ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="flex items-center space-x-1">
                      <span>Service Fee (5%)</span>
                      <Info className="w-4 h-4 text-gray-400" />
                    </span>
                    <span className="font-medium">KSh {serviceFee?.toLocaleString()}</span>
                  </div>
                  <div className={`pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between">
                      <span className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Total
                      </span>
                      <span className="text-2xl font-bold text-emerald-600">
                        KSh {total?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pickup Details */}
                <div className={`mb-4 p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Pickup Information
                  </h3>
                  <div className="space-y-3">
                    <input
                      type="date"
                      value={pickupDetails.date}
                      onChange={(e) => setPickupDetails({...pickupDetails, date: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg ${
                        darkMode 
                          ? 'bg-gray-600 text-white border-gray-500' 
                          : 'bg-white text-gray-900 border-gray-200'
                      } border focus:ring-2 focus:ring-emerald-500`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <input
                      type="time"
                      value={pickupDetails.time}
                      onChange={(e) => setPickupDetails({...pickupDetails, time: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg ${
                        darkMode 
                          ? 'bg-gray-600 text-white border-gray-500' 
                          : 'bg-white text-gray-900 border-gray-200'
                      } border focus:ring-2 focus:ring-emerald-500`}
                    />
                    <select
                      value={pickupDetails.location}
                      onChange={(e) => setPickupDetails({...pickupDetails, location: e.target.value})}
                      className={`w-full px-3 py-2 rounded-lg ${
                        darkMode 
                          ? 'bg-gray-600 text-white border-gray-500' 
                          : 'bg-white text-gray-900 border-gray-200'
                      } border focus:ring-2 focus:ring-emerald-500`}
                    >
                      <option value="">Select pickup location</option>
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={pickupDetails.notes}
                      onChange={(e) => setPickupDetails({...pickupDetails, notes: e.target.value})}
                      placeholder="Additional notes for sellers (optional)"
                      rows="2"
                      className={`w-full px-3 py-2 rounded-lg ${
                        darkMode 
                          ? 'bg-gray-600 text-white border-gray-500' 
                          : 'bg-white text-gray-900 border-gray-200'
                      } border focus:ring-2 focus:ring-emerald-500`}
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-4">
                  <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Payment Method
                  </h3>
                  <div className="space-y-2">
                    <label className={`flex items-center p-3 rounded-lg cursor-pointer ${
                      selectedPayment === 'mpesa'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-600'
                        : darkMode
                          ? 'bg-gray-700 border border-gray-600'
                          : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="mpesa"
                        checked={selectedPayment === 'mpesa'}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="mr-3"
                      />
                      <Smartphone className="w-5 h-5 mr-2 text-green-600" />
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        M-Pesa
                      </span>
                    </label>
                    <label className={`flex items-center p-3 rounded-lg cursor-pointer ${
                      selectedPayment === 'cash'
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-600'
                        : darkMode
                          ? 'bg-gray-700 border border-gray-600'
                          : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <input
                        type="radio"
                        name="payment"
                        value="cash"
                        checked={selectedPayment === 'cash'}
                        onChange={(e) => setSelectedPayment(e.target.value)}
                        className="mr-3"
                      />
                      <CreditCard className="w-5 h-5 mr-2 text-gray-600" />
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Cash on Pickup
                      </span>
                    </label>
                  </div>
                </div>

                {/* M-Pesa Number Input */}
                {selectedPayment === 'mpesa' && (
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      M-Pesa Phone Number
                    </label>
                    <input
                      type="tel"
                      value={mpesaNumber}
                      onChange={(e) => setMpesaNumber(e.target.value)}
                      placeholder="254 7XX XXX XXX"
                      className={`w-full px-3 py-2 rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 text-white border-gray-600' 
                          : 'bg-white text-gray-900 border-gray-200'
                      } border focus:ring-2 focus:ring-emerald-500`}
                    />
                  </div>
                )}

                {/* Terms and Conditions */}
                <label className="flex items-start mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 mr-2"
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    I agree to the Terms & Conditions and understand that seller contact information 
                    will be revealed after successful checkout
                  </span>
                </label>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={
                    !agreedToTerms || 
                    !pickupDetails.date || 
                    !pickupDetails.time || 
                    !pickupDetails.location ||
                    isProcessingCheckout
                  }
                  className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                    agreedToTerms && pickupDetails.date && pickupDetails.time && pickupDetails.location && !isProcessingCheckout
                      ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white hover:from-emerald-700 hover:to-cyan-700'
                      : darkMode
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isProcessingCheckout ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>
                      {selectedPayment === 'mpesa' ? 'Proceed to M-Pesa' : 'Confirm Order'}
                    </span>
                  )}
                </button>

                {/* Security Badge */}
                <div className={`mt-4 p-3 rounded-lg text-center ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <div className="flex items-center justify-center space-x-2">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Secure Checkout
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Your information is protected
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Success Modal */}
        {showCheckout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${
              darkMode ? 'bg-gray-800' : 'bg-white'
            } rounded-xl p-8 max-w-md w-full`}>
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Order Confirmed!
                </h2>
                <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Your order has been successfully placed. Seller contact details have been sent to your email.
                </p>
                
                {/* Seller Contact Info */}
                <div className={`text-left p-4 rounded-lg mb-6 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Seller Contact Information:
                  </h3>
                  {Object.values(itemsBySeller).map(sellerGroup => (
                    <div key={sellerGroup.seller?.id} className="mb-3">
                      <p className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {sellerGroup.seller?.full_name}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Phone className="w-4 h-4 inline mr-1" />
                        {sellerGroup.seller?.phone || '+254 7XX XXX XXX'}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {sellerGroup.seller?.campus_location || 'Campus'}
                      </p>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-lg hover:from-emerald-700 hover:to-cyan-700 transition-colors font-medium"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegratedCartPage;
