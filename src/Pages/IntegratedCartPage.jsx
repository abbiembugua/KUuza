import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import {
  ShoppingCart, Trash2, Plus, Minus, MapPin,
  ArrowLeft, Package, CreditCard,
  User, Star, Shield, Smartphone, Loader,
  CheckCircle, AlertCircle, Phone, Mail,
  Clock, Calendar, Info, Truck, Store,
  Building, ChevronDown, ChevronUp, CreditCard as CardIcon,
  Banknote, QrCode, ShoppingBag
} from 'lucide-react';
import {
  getCartItems,
  updateCartItem,
  removeFromCart,
  getCampusLocations,
  checkCartAvailability,
} from '../api/dashboardapi';
import { showToast } from '../Services/toastService';

const API_BASE = 'http://127.0.0.1:8000/api';

// ── Step indicator component ─────────────────────────────────────────────────
const StepIndicator = ({ currentStep, darkMode }) => {
  const steps = ['Review', 'Schedule & Pay', 'Confirmed'];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isActive
                    ? 'bg-emerald-600 text-white'
                    : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-400'
              }`}>
                {isCompleted ? <CheckCircle size={16} /> : stepNum}
              </div>
              <span className={`text-xs mt-1 font-medium ${
                isActive
                  ? darkMode ? 'text-white' : 'text-gray-900'
                  : darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-16 mx-2 mb-4 transition-all ${
                isCompleted ? 'bg-green-500' : darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── Payment option component ─────────────────────────────────────────────────
const PaymentOption = ({ value, selected, onSelect, icon: Icon, label, description, darkMode }) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-emerald-500 bg-emerald-500/10'
          : darkMode
            ? 'border-gray-700 hover:border-gray-500'
            : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          selected
            ? 'bg-emerald-600 text-white'
            : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
        }`}>
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {label}
          </p>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {description}
          </p>
        </div>
        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
          selected
            ? 'border-emerald-500 bg-emerald-500'
            : darkMode ? 'border-gray-600' : 'border-gray-300'
        }`}>
          {selected && <div className="w-full h-full rounded-full bg-white scale-50" />}
        </div>
      </div>
    </button>
  );
};

// ── Contact reveal component ─────────────────────────────────────────────────
const ContactRevealBox = ({ contact, darkMode }) => {
  const isWhatsApp = contact?.contact_preference === 'whatsapp';
  const Icon = isWhatsApp ? Phone : Mail;
  const label = isWhatsApp ? 'WhatsApp' : 'Email';
  const action = isWhatsApp
    ? `https://wa.me/${contact.contact_value.replace(/[^0-9]/g, '')}`
    : `mailto:${contact.contact_value}`;

  return (
    <div className={`rounded-xl border-l-4 border-emerald-500 p-5 ${
      darkMode ? 'bg-gray-800' : 'bg-emerald-50'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <Shield size={16} className="text-emerald-500" />
        <p className={`text-xs font-bold uppercase tracking-wider text-emerald-500`}>
          Seller Contact Details
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
          <Icon size={18} />
        </div>
        <div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Contact via {label}
          </p>
          <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {contact?.contact_value}
          </p>
        </div>
        <a
          href={action}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          {isWhatsApp ? 'Open WhatsApp' : 'Send Email'}
        </a>
      </div>
    </div>
  );
};

// ── M-Pesa Payment Status Component ──────────────────────────────────────────
const MpesaPaymentStatus = ({ transactionId, token, darkMode, onRetry, onComplete }) => {
  const [status, setStatus] = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkCount, setCheckCount] = useState(0);
  const [transaction, setTransaction] = useState(null);

  const checkTransactionStatus = async (txnId) => {
    const res = await fetch(`${API_BASE}/transactions/${txnId}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Could not check transaction status');
    return res.json();
  };

  useEffect(() => {
    let interval;
    let timeout;

    const checkStatus = async () => {
      try {
        const txn = await checkTransactionStatus(transactionId);
        setTransaction(txn);
        
        if (txn.status === 'completed') {
          setStatus('completed');
          if (interval) clearInterval(interval);
          if (timeout) clearTimeout(timeout);
          onComplete(txn);
        } else if (txn.status === 'cancelled' || txn.status === 'failed') {
          setStatus('failed');
          setErrorMessage(txn.payment_status_message || 'Payment was cancelled or failed');
          if (interval) clearInterval(interval);
          if (timeout) clearTimeout(timeout);
        } else if (checkCount >= 30) {
          setStatus('failed');
          setErrorMessage('Payment confirmation timeout. Please check your M-Pesa app.');
          if (interval) clearInterval(interval);
          if (timeout) clearTimeout(timeout);
        } else {
          setCheckCount(prev => prev + 1);
        }
      } catch (err) {
        console.error('Status check error:', err);
      }
    };

    setStatus('processing');
    interval = setInterval(checkStatus, 2000);
    
    timeout = setTimeout(() => {
      if (interval) clearInterval(interval);
      if (status === 'processing') {
        setStatus('failed');
        setErrorMessage('Payment is taking longer than expected.');
      }
    }, 60000);

    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [transactionId, token, checkCount]);

  return (
    <div className={`rounded-2xl p-6 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      {status === 'processing' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Loader size={24} className="animate-spin text-emerald-500" />
            <div>
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Processing Payment
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Please check your phone and enter your M-Pesa PIN
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '100%' }} />
            </div>
            <p className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Waiting for payment confirmation... {Math.floor(checkCount * 2)}s
            </p>
          </div>
        </>
      )}

      {status === 'completed' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle size={24} className="text-green-500" />
            <div>
              <h3 className={`font-bold text-green-500 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Payment Successful!
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Your payment has been received and confirmed
              </p>
            </div>
          </div>
          {transaction?.mpesa_receipt && (
            <div className={`p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                M-Pesa Receipt
              </p>
              <p className={`font-mono text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {transaction.mpesa_receipt}
              </p>
            </div>
          )}
        </>
      )}

      {status === 'failed' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle size={24} className="text-red-500" />
            <div>
              <h3 className={`font-bold text-red-500 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Payment Failed
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {errorMessage || 'The payment was not completed successfully'}
              </p>
            </div>
          </div>
          <button
            onClick={onRetry}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
          >
            Retry Payment
          </button>
        </>
      )}
    </div>
  );
};

const IntegratedCartPage = () => {
  const { darkMode } = useTheme();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  
  // Checkout state
  const [checkoutMode, setCheckoutMode] = useState(null); // 'all' or 'single'
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [step, setStep] = useState(1);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [inquiryNote, setInquiryNote] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [contact, setContact] = useState(null);
  const [mpesaPaymentStatus, setMpesaPaymentStatus] = useState(null);
  const [mpesaError, setMpesaError] = useState(null);
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

  // ── Checkout specific item ─────────────────────────────────────────────────
  const handleCheckoutItem = (item) => {
    setCheckoutMode('single');
    setCheckoutItem(item);
    setStep(1);
    setScheduledDate('');
    setScheduledTime('');
    setPaymentMethod('mpesa');
    setInquiryNote('');
    setMpesaPhone('');
    setErrors({});
    setTransaction(null);
    setContact(null);
    setMpesaPaymentStatus(null);
    setMpesaError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Checkout all items ─────────────────────────────────────────────────────
  const handleCheckoutAll = () => {
    setCheckoutMode('all');
    setCheckoutItem(null);
    setStep(1);
    setScheduledDate('');
    setScheduledTime('');
    setPaymentMethod('mpesa');
    setInquiryNote('');
    setMpesaPhone('');
    setErrors({});
    setTransaction(null);
    setContact(null);
    setMpesaPaymentStatus(null);
    setMpesaError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Cancel checkout ────────────────────────────────────────────────────────
  const handleCancelCheckout = () => {
    setCheckoutMode(null);
    setCheckoutItem(null);
    setStep(1);
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep2 = () => {
    const e = {};
    if (!scheduledDate) e.scheduledDate = 'Please select a date';
    if (!scheduledTime) e.scheduledTime = 'Please select a time';
    if (!paymentMethod) e.paymentMethod = 'Please select a payment method';
    if (paymentMethod === 'mpesa') {
      if (!mpesaPhone.trim()) {
        e.mpesaPhone = 'Enter your M-Pesa phone number';
      } else {
        const phoneRegex = /^(254|0)[7-9][0-9]{8}$/;
        const cleanedPhone = mpesaPhone.replace(/\D/g, '');
        if (!phoneRegex.test(cleanedPhone)) {
          e.mpesaPhone = 'Enter a valid Kenyan phone number (e.g., 254712345678 or 0712345678)';
        }
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Create transaction ─────────────────────────────────────────────────────
  const createTransactionAPI = async (listingId, price) => {
    const payload = {
      listing: listingId,
      interaction_type: 'purchase',
      agreed_price: price,
      payment_method: paymentMethod,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      inquiry_note: inquiryNote || '',
      ...(paymentMethod === 'mpesa' && { mpesa_phone: mpesaPhone }),
    };

    const res = await fetch(`${API_BASE}/transactions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || err.error || 'Transaction failed');
    }
    return res.json();
  };

  const fetchContactDetails = async (listingId) => {
    const res = await fetch(`${API_BASE}/listings/${listingId}/contact_details/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Could not retrieve contact details');
    return res.json();
  };

  // ── Handle M-Pesa payment completion ───────────────────────────────────────
  const handleMpesaComplete = (completedTransaction) => {
    setTransaction(completedTransaction);
    setMpesaPaymentStatus('completed');
    
    const fetchContact = async () => {
      try {
        const listingId = checkoutMode === 'single' 
          ? getListingData(checkoutItem).id 
          : null;
        if (listingId) {
          const contactData = await fetchContactDetails(listingId);
          setContact({ ...contactData });
        }
      } catch (err) {
        console.error('Failed to fetch contact details:', err);
      }
    };
    fetchContact();
  };

  // ── Handle M-Pesa retry ────────────────────────────────────────────────────
  const handleRetryMpesa = async () => {
    setMpesaError(null);
    setMpesaPaymentStatus('processing');
    
    try {
      const response = await fetch(
        `${API_BASE}/transactions/${transaction.id}/initiate_mpesa/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ phone_number: mpesaPhone }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initiate payment');
      }
      
      showToast('M-Pesa prompt sent! Please check your phone.', 'success');
    } catch (err) {
      setMpesaPaymentStatus('failed');
      setMpesaError(err.message);
      showToast(err.message || 'Could not send M-Pesa prompt', 'error');
    }
  };

  // ── Submit checkout ────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!validateStep2()) return;
    setSubmitting(true);
    setMpesaError(null);
    
    try {
      let txn;
      
      if (checkoutMode === 'single' && checkoutItem) {
        const listingData = getListingData(checkoutItem);
        txn = await createTransactionAPI(listingData.id, getPrice(checkoutItem));
      } else {
        // For "checkout all", we need to create separate transactions for each item
        // For now, we'll create one transaction for the first item as a demo
        // In a real implementation, you'd want to create multiple transactions or a bulk checkout
        const firstItem = cartItems[0];
        const listingData = getListingData(firstItem);
        txn = await createTransactionAPI(listingData.id, getPrice(firstItem));
        showToast('Note: For multiple items, each will create a separate transaction', 'info');
      }
      
      setTransaction(txn);

      if (paymentMethod === 'mpesa') {
        try {
          const mpesaRes = await fetch(
            `${API_BASE}/transactions/${txn.id}/initiate_mpesa/`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ phone_number: mpesaPhone }),
            }
          );
          
          if (!mpesaRes.ok) {
            const errData = await mpesaRes.json();
            throw new Error(errData.error || 'Could not send M-Pesa prompt');
          }
          
          setStep(3);
          setMpesaPaymentStatus('processing');
          showToast('M-Pesa prompt sent! Please check your phone to complete payment.', 'success');
          
        } catch (err) {
          setMpesaError(err.message);
          showToast(err.message || 'Could not send M-Pesa prompt', 'error');
          setSubmitting(false);
          return;
        }
      } else {
        setStep(3);
        if (checkoutMode === 'single') {
          const listingData = getListingData(checkoutItem);
          const contactData = await fetchContactDetails(listingData.id);
          setContact({ ...contactData });
        }
        showToast('Order confirmed!', 'success');
      }

      // Remove checked out items from cart
      if (checkoutMode === 'single' && checkoutItem) {
        await removeFromCart(checkoutItem.id);
        setCartItems(prev => prev.filter(i => i.id !== checkoutItem.id));
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      showToast(err.message || 'Something went wrong. Please try again.', 'error');
      setSubmitting(false);
    } finally {
      if (paymentMethod !== 'mpesa') {
        setSubmitting(false);
      }
    }
  };

  // ── Min date (tomorrow) ────────────────────────────────────────────────────
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

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

  // ── Checkout Screen ────────────────────────────────────────────────────────
  if (checkoutMode) {
    const currentItem = checkoutMode === 'single' ? checkoutItem : null;
    const listingData = currentItem ? getListingData(currentItem) : null;
    const coverImage = currentItem ? getImageUrl(currentItem) : null;
    const itemPrice = currentItem ? getPrice(currentItem) : subtotal;
    const itemTitle = currentItem ? listingData?.title : `${cartItems.length} items`;

    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <DashboardNavbar />
        <div className="pt-20 pb-16">
          <div className="max-w-2xl mx-auto px-4 pt-6">
            
            {/* Back button */}
            <button
              onClick={step > 1 && step < 3 ? () => setStep(prev => prev - 1) : handleCancelCheckout}
              className={`flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors ${
                darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ArrowLeft size={16} />
              {step === 1 ? 'Back to cart' : step === 2 ? 'Back' : 'Continue browsing'}
            </button>

            <StepIndicator currentStep={step} darkMode={darkMode} />

            {/* Step 1 - Review Order */}
            {step === 1 && (
              <div className={`rounded-2xl overflow-hidden shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="p-6">
                  <h2 className={`text-xl font-bold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Review your order
                  </h2>

                  <div className={`flex gap-4 p-4 rounded-xl mb-6 ${
                    darkMode ? 'bg-gray-700/60' : 'bg-gray-50'
                  }`}>
                    {currentItem && (
                      <>
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                          {coverImage
                            ? <img src={coverImage} alt={itemTitle} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center">
                                <Package size={24} className="text-gray-400" />
                              </div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {itemTitle}
                          </p>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Quantity: {currentItem.quantity}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`font-bold text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            KSh {(itemPrice * currentItem.quantity).toLocaleString('en-KE')}
                          </p>
                        </div>
                      </>
                    )}
                    {!currentItem && (
                      <div className="w-full">
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {cartItems.length} items in your cart
                        </p>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Total: KSh {subtotal.toLocaleString('en-KE')}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className={`p-4 rounded-xl mb-6 ${
                    darkMode ? 'bg-emerald-900/20 border border-emerald-800' : 'bg-emerald-50 border border-emerald-100'
                  }`}>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                      darkMode ? 'text-emerald-400' : 'text-emerald-600'
                    }`}>
                      What happens next
                    </p>
                    <ul className={`text-sm space-y-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <li className="flex items-start gap-2">
                        <ChevronDown size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                        Select your pickup date, time, and payment method
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronDown size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                        After confirming, the seller's contact details will be revealed
                      </li>
                      <li className="flex items-start gap-2">
                        <ChevronDown size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                        Coordinate pickup directly with the seller
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all"
                  >
                    Continue to Schedule & Pay
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 - Schedule & Payment */}
            {step === 2 && (
              <div className="space-y-4">
                <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Calendar size={18} className="text-emerald-500" />
                    Pickup Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Pickup date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        min={minDateStr}
                        onChange={e => {
                          setScheduledDate(e.target.value);
                          setErrors(prev => ({ ...prev, scheduledDate: '' }));
                        }}
                        className={`w-full p-3 rounded-xl border-2 text-sm transition-all focus:outline-none ${
                          errors.scheduledDate
                            ? 'border-red-500'
                            : darkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
                              : 'bg-white border-gray-200 focus:border-emerald-500'
                        }`}
                      />
                      {errors.scheduledDate && (
                        <p className="text-red-500 text-xs mt-1">{errors.scheduledDate}</p>
                      )}
                    </div>

                    <div>
                      <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Pickup time
                      </label>
                      <select
                        value={scheduledTime}
                        onChange={e => {
                          setScheduledTime(e.target.value);
                          setErrors(prev => ({ ...prev, scheduledTime: '' }));
                        }}
                        className={`w-full p-3 rounded-xl border-2 text-sm transition-all focus:outline-none ${
                          errors.scheduledTime
                            ? 'border-red-500'
                            : darkMode
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
                              : 'bg-white border-gray-200 focus:border-emerald-500'
                        }`}
                      >
                        <option value="">Select a time</option>
                        {Array.from({ length: 28 }, (_, i) => {
                          const hour = Math.floor(i / 2) + 7;
                          const minute = i % 2 === 0 ? '00' : '30';
                          const label = `${hour > 12 ? hour - 12 : hour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
                          const value = `${String(hour).padStart(2, '0')}:${minute}`;
                          return <option key={value} value={value}>{label}</option>;
                        })}
                      </select>
                      {errors.scheduledTime && (
                        <p className="text-red-500 text-xs mt-1">{errors.scheduledTime}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      Note to seller <span className="font-normal normal-case">(optional)</span>
                    </label>
                    <textarea
                      value={inquiryNote}
                      onChange={e => setInquiryNote(e.target.value)}
                      rows={2}
                      maxLength={300}
                      placeholder="Any questions or special instructions for the seller?"
                      className={`w-full p-3 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500'
                          : 'bg-white border-gray-200 placeholder-gray-400 focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <CreditCard size={18} className="text-emerald-500" />
                    Payment Method
                  </h3>

                  <div className="space-y-3">
                    <PaymentOption
                      value="mpesa"
                      selected={paymentMethod === 'mpesa'}
                      onSelect={setPaymentMethod}
                      icon={Smartphone}
                      label="Pay Now via M-Pesa"
                      description="Instant and secure — STK push sent to your phone"
                      darkMode={darkMode}
                    />
                    <PaymentOption
                      value="cash_on_pickup"
                      selected={paymentMethod === 'cash_on_pickup'}
                      onSelect={setPaymentMethod}
                      icon={Banknote}
                      label="Cash on Pickup"
                      description="Pay in cash when you collect the item"
                      darkMode={darkMode}
                    />
                  </div>

                  {paymentMethod === 'mpesa' && (
                    <div className="mt-4">
                      <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        M-Pesa Phone Number
                      </label>
                      <input
                        type="tel"
                        value={mpesaPhone}
                        onChange={e => {
                          setMpesaPhone(e.target.value);
                          setErrors(prev => ({ ...prev, mpesaPhone: '' }));
                        }}
                        placeholder="0712345678 or 254712345678"
                        className={`w-full p-3 rounded-xl border-2 text-sm transition-all focus:outline-none ${
                          errors.mpesaPhone
                            ? 'border-red-500'
                            : darkMode
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500'
                              : 'bg-white border-gray-200 placeholder-gray-400 focus:border-emerald-500'
                        }`}
                      />
                      {errors.mpesaPhone && (
                        <p className="text-red-500 text-xs mt-1">{errors.mpesaPhone}</p>
                      )}
                    </div>
                  )}
                </div>

                {mpesaError && (
                  <div className={`rounded-2xl p-4 shadow-sm border-l-4 border-red-500 ${
                    darkMode ? 'bg-red-900/20' : 'bg-red-50'
                  }`}>
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {mpesaError}
                      </p>
                    </div>
                  </div>
                )}

                <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Order Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Item(s)</span>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {currentItem ? listingData?.title : `${cartItems.length} items`}
                      </span>
                    </div>
                    {currentItem && currentItem.quantity > 1 && (
                      <div className="flex justify-between text-sm">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Quantity</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>{currentItem.quantity}</span>
                      </div>
                    )}
                    <div className={`flex justify-between text-sm pt-2 border-t ${
                      darkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total</span>
                      <span className={`font-bold text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        KSh {(currentItem ? itemPrice * currentItem.quantity : subtotal).toLocaleString('en-KE')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                    submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader size={18} className="animate-spin" />
                      {paymentMethod === 'mpesa' ? 'Initiating payment...' : 'Confirming...'}
                    </span>
                  ) : (
                    paymentMethod === 'mpesa'
                      ? 'Confirm & Pay via M-Pesa'
                      : 'Confirm Order'
                  )}
                </button>
              </div>
            )}

            {/* Step 3 - Confirmation */}
            {step === 3 && (
              <div className="space-y-4">
                <div className={`rounded-2xl p-6 text-center shadow-sm ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-green-500" />
                  </div>
                  <h2 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Order Confirmed!
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {paymentMethod === 'mpesa' 
                      ? 'Complete the M-Pesa payment to finalize your order'
                      : 'Your transaction has been created successfully'}
                  </p>
                </div>

                {paymentMethod === 'mpesa' && (
                  <MpesaPaymentStatus
                    transactionId={transaction?.id}
                    token={token}
                    darkMode={darkMode}
                    onRetry={handleRetryMpesa}
                    onComplete={handleMpesaComplete}
                  />
                )}

                {(paymentMethod !== 'mpesa' || mpesaPaymentStatus === 'completed') && contact && (
                  <ContactRevealBox contact={contact} darkMode={darkMode} />
                )}

                <div className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
                  darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
                }`}>
                  <Shield size={16} className="flex-shrink-0 mt-0.5 text-emerald-400" />
                  <p>
                    Once the item is handed over, the seller will mark the transaction as complete.
                    If no action is taken within 7 days of the scheduled date, the transaction auto-completes.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate('/purchases')}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                      darkMode
                        ? 'border-gray-600 text-gray-200 hover:border-emerald-500'
                        : 'border-gray-200 text-gray-700 hover:border-emerald-500'
                    }`}
                  >
                    View Purchases
                  </button>
                  <button
                    onClick={() => {
                      setCheckoutMode(null);
                      navigate('/dashboard');
                    }}
                    className="py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white transition-all"
                  >
                    Continue Browsing
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // ── Main Cart View ─────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar />

      <div className="max-w-7xl mx-auto px-4 py-6 pt-24">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className={`mb-4 flex items-center gap-2 text-sm ${
              darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </button>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Shopping Cart
          </h1>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        {/* Unavailable items warning */}
        {unavailableItems.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                {unavailableItems.length} item{unavailableItems.length > 1 ? 's' : ''} no longer available
              </p>
            </div>
          </div>
        )}

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
                const isUnavailable = unavailableItems.some(u => u.cart_item_id === item.id);

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
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
                              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
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
                              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
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
                  <div className="flex justify-between pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}">
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