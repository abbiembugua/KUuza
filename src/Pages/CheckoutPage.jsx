import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Calendar, Clock, CreditCard,
  Smartphone, Banknote, CheckCircle, AlertCircle,
  Loader2, Package, Wrench, Shield, Phone, Mail,
  ChevronRight, MessageSquare, RefreshCw, XCircle
} from 'lucide-react';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import { useTheme } from '../context/Themecontext';
import { useAuth } from '../context/AuthContext';
import { toast, Toaster } from 'react-hot-toast';

const API_BASE = 'http://127.0.0.1:8000/api';

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchListing(id, token) {
  const res = await fetch(`${API_BASE}/listings/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not load listing');
  return res.json();
}

async function createTransaction(payload, token) {
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
}

async function fetchContactDetails(listingId, token) {
  const res = await fetch(`${API_BASE}/listings/${listingId}/contact_details/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not retrieve contact details');
  return res.json();
}

async function checkTransactionStatus(transactionId, token) {
  const res = await fetch(`${API_BASE}/transactions/${transactionId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not check transaction status');
  return res.json();
}

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ currentStep, darkMode }) {
  const steps = ['Review', 'Schedule & Pay', 'Confirmed'];
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive    = stepNum === currentStep;
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
}

// ── Payment method card ───────────────────────────────────────────────────────

function PaymentOption({ value, selected, onSelect, icon: Icon, label, description, darkMode }) {
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
}

// ── Contact reveal box ────────────────────────────────────────────────────────

function ContactRevealBox({ contact, darkMode }) {
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
      <p className={`text-xs mt-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Reach out to coordinate your {contact?.listing_type === 'service' ? 'service appointment' : 'pickup'}.
      </p>
    </div>
  );
}

// ── M-Pesa Payment Status Component ────────────────────────────────────────────

function MpesaPaymentStatus({ transactionId, token, darkMode, onRetry, onComplete }) {
  const [status, setStatus] = useState('checking'); // checking, processing, completed, failed
  const [errorMessage, setErrorMessage] = useState('');
  const [checkCount, setCheckCount] = useState(0);
  const [transaction, setTransaction] = useState(null);

  useEffect(() => {
    let interval;
    let timeout;

    const checkStatus = async () => {
      try {
        const txn = await checkTransactionStatus(transactionId, token);
        setTransaction(txn);
        
        if (txn.status === 'completed') {
          setStatus('completed');
          if (interval) clearInterval(interval);
          if (timeout) clearTimeout(timeout);
          onComplete(txn);
          toast.success('Payment successful! Your transaction is now complete.');
        } else if (txn.status === 'cancelled' || txn.status === 'failed') {
          setStatus('failed');
          setErrorMessage(txn.payment_status_message || 'Payment was cancelled or failed');
          if (interval) clearInterval(interval);
          if (timeout) clearTimeout(timeout);
        } else if (checkCount >= 30) { // Check for 30 attempts (about 60 seconds)
          setStatus('failed');
          setErrorMessage('Payment confirmation timeout. Please check your M-Pesa app or contact support.');
          if (interval) clearInterval(interval);
          if (timeout) clearTimeout(timeout);
        } else {
          setCheckCount(prev => prev + 1);
        }
      } catch (err) {
        console.error('Status check error:', err);
      }
    };

    // Start checking status every 2 seconds
    setStatus('processing');
    interval = setInterval(checkStatus, 2000);
    
    // Stop checking after 60 seconds
    timeout = setTimeout(() => {
      if (interval) clearInterval(interval);
      if (status === 'processing') {
        setStatus('failed');
        setErrorMessage('Payment is taking longer than expected. Please check your transaction in the Purchases page.');
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
            <Loader2 size={24} className="animate-spin text-emerald-500" />
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
            <XCircle size={24} className="text-red-500" />
            <div>
              <h3 className={`font-bold text-red-500 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Payment Failed
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {errorMessage || 'The payment was not completed successfully'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} />
              Retry Payment
            </button>
            <button
              onClick={() => navigate('/purchases')}
              className="flex-1 py-2 border-2 border-gray-300 hover:border-emerald-500 rounded-lg font-semibold transition-colors"
            >
              View Purchases
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const CheckoutPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { token } = useAuth();

  const [step, setStep] = useState(1);
  const [listing, setListing]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transaction, setTransaction] = useState(null);
  const [contact, setContact]       = useState(null);
  const [mpesaPaymentStatus, setMpesaPaymentStatus] = useState(null);
  const [mpesaError, setMpesaError] = useState(null);

  // Form state
  const [scheduledDate, setScheduledDate]   = useState('');
  const [scheduledTime, setScheduledTime]   = useState('');
  const [paymentMethod, setPaymentMethod]   = useState('');
  const [inquiryNote, setInquiryNote]       = useState('');
  const [mpesaPhone, setMpesaPhone]         = useState('');
  const [errors, setErrors]                 = useState({});

  const isService = listing?.listing_type === 'service';
  const isGood    = listing?.listing_type === 'good';

  // ── Load listing ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchListing(id, token);
        setListing(data);
      } catch (err) {
        toast.error(err.message);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token]);

  // ── Set default payment method when listing loads ──────────────────────────
  useEffect(() => {
    if (listing) {
      setPaymentMethod(isService ? 'mpesa' : 'mpesa');
    }
  }, [listing]);

  // ── Min date (tomorrow) ────────────────────────────────────────────────────
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep2 = () => {
    const e = {};
    if (!scheduledDate) e.scheduledDate = 'Please select a date';
    if (isGood && !scheduledTime) e.scheduledTime = 'Please select a time';
    if (!paymentMethod) e.paymentMethod = 'Please select a payment method';
    if (paymentMethod === 'mpesa') {
      if (!mpesaPhone.trim()) {
        e.mpesaPhone = 'Enter your M-Pesa phone number';
      } else {
        // Validate Kenyan phone number format
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

  // ── Handle M-Pesa payment completion ───────────────────────────────────────
  const handleMpesaComplete = (completedTransaction) => {
    setTransaction(completedTransaction);
    setMpesaPaymentStatus('completed');
    
    // Fetch contact details after successful payment
    const fetchContact = async () => {
      try {
        const contactData = await fetchContactDetails(listing.id, token);
        setContact({ ...contactData, listing_type: listing.listing_type });
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
      
      toast.success('M-Pesa prompt sent! Please check your phone.');
    } catch (err) {
      setMpesaPaymentStatus('failed');
      setMpesaError(err.message);
      toast.error(err.message || 'Could not send M-Pesa prompt');
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!validateStep2()) return;
    setSubmitting(true);
    setMpesaError(null);
    
    try {
      // Build transaction payload
      const payload = {
        listing:        listing.id,
        interaction_type: isService ? 'service_use' : 'purchase',
        agreed_price:   listing.price,
        payment_method: paymentMethod,
        scheduled_date: scheduledDate,
        ...(isGood && inquiryNote && { inquiry_note: inquiryNote }),
        ...(paymentMethod === 'mpesa' && { mpesa_phone: mpesaPhone }),
      };

      const txn = await createTransaction(payload, token);
      setTransaction(txn);

      // Handle M-Pesa payment
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
          
          // Payment initiated successfully - proceed to step 3 with payment status
          setStep(3);
          setMpesaPaymentStatus('processing');
          toast.success('M-Pesa prompt sent! Please check your phone to complete payment.');
          
          // Do NOT fetch contact details yet - only after payment completes
          // The MpesaPaymentStatus component will handle payment verification
          
        } catch (err) {
          // Payment initiation failed - show error and stay on step 2
          setMpesaError(err.message);
          toast.error(err.message || 'Could not send M-Pesa prompt. Please check your phone number and try again.');
          setSubmitting(false);
          return; // Don't proceed to step 3
        }
      } else {
        // For non-M-Pesa payments, proceed to step 3 and fetch contact details
        setStep(3);
        const contactData = await fetchContactDetails(listing.id, token);
        setContact({ ...contactData, listing_type: listing.listing_type });
        toast.success('Booking confirmed!');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    } finally {
      if (paymentMethod !== 'mpesa') {
        setSubmitting(false);
      }
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar />
      <div className="pt-24 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    </div>
  );

  if (!listing) return null;

  const coverImage = listing.images?.[0]?.image
    ? `${listing.images[0].image}`
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster toastOptions={{ style: { borderRadius: '10px', padding: '14px' } }} />
      <DashboardNavbar />

      <div className="pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 pt-6">

          {/* Back */}
          <button
            onClick={() => step > 1 && step < 3 ? setStep(s => s - 1) : navigate(-1)}
            className={`flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors ${
              darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ArrowLeft size={16} />
            {step === 1 ? 'Back to listing' : step === 2 ? 'Back' : 'Continue browsing'}
          </button>

          {/* Step indicator */}
          <StepIndicator currentStep={step} darkMode={darkMode} />

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* STEP 1 — Review order                                           */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className={`rounded-2xl overflow-hidden shadow-sm ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="p-6">
                <h2 className={`text-xl font-bold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Review your order
                </h2>

                {/* Listing summary card */}
                <div className={`flex gap-4 p-4 rounded-xl mb-6 ${
                  darkMode ? 'bg-gray-700/60' : 'bg-gray-50'
                }`}>
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                    {coverImage
                      ? <img src={coverImage} alt={listing.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          {isService ? <Wrench size={24} className="text-gray-400" /> : <Package size={24} className="text-gray-400" />}
                        </div>
                    }
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isService ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isService ? 'Service' : 'Good'}
                      </span>
                    </div>
                    <p className={`font-semibold text-sm line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {listing.title}
                    </p>
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Sold by {listing.seller_name || 'KU Student'}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={11} className={darkMode ? 'text-gray-400' : 'text-gray-400'} />
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {listing.area_of_operation}
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {listing.price
                        ? `KSh ${parseFloat(listing.price).toLocaleString('en-KE')}`
                        : 'Negotiable'}
                    </p>
                    {listing.negotiable && listing.price && (
                      <span className="text-xs text-amber-500 font-medium">Negotiable</span>
                    )}
                  </div>
                </div>

                {/* What happens next info box */}
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
                      <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                      {isService
                        ? 'Select your preferred service date and payment method'
                        : 'Choose a pickup date, time, and how you want to pay'}
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                      After confirming, the seller&apos;s contact details will be revealed
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                      Coordinate the {isService ? 'appointment' : 'pickup'} directly with the seller
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

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* STEP 2 — Schedule & Payment                                     */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4">

              {/* Date selection */}
              <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Calendar size={18} className="text-emerald-500" />
                  {isService ? 'Preferred Service Date' : 'Pickup Details'}
                </h3>

                <div className={`grid gap-4 ${isGood ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {/* Date picker */}
                  <div>
                    <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {isService ? 'Date' : 'Pickup date'}
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

                  {/* Time picker — goods only */}
                  {isGood && (
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
                          const hour   = Math.floor(i / 2) + 7;
                          const minute = i % 2 === 0 ? '00' : '30';
                          const label  = `${hour > 12 ? hour - 12 : hour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
                          const value  = `${String(hour).padStart(2, '0')}:${minute}`;
                          return <option key={value} value={value}>{label}</option>;
                        })}
                      </select>
                      {errors.scheduledTime && (
                        <p className="text-red-500 text-xs mt-1">{errors.scheduledTime}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Inquiry note — goods only */}
                {isGood && (
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
                    <p className={`text-xs mt-1 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {inquiryNote.length}/300
                    </p>
                  </div>
                )}
              </div>

              {/* Payment method */}
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
                    value={isService ? 'pay_after_service' : 'cash_on_pickup'}
                    selected={paymentMethod === (isService ? 'pay_after_service' : 'cash_on_pickup')}
                    onSelect={setPaymentMethod}
                    icon={Banknote}
                    label={isService ? 'Pay After Service' : 'Cash on Pickup'}
                    description={isService
                      ? 'Settle payment with the seller after the service is delivered'
                      : 'Pay in cash when you collect the item'}
                    darkMode={darkMode}
                  />
                </div>

                {errors.paymentMethod && (
                  <p className="text-red-500 text-xs mt-2">{errors.paymentMethod}</p>
                )}

                {/* M-Pesa phone input */}
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
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      An STK push will be sent to this number to complete payment.
                    </p>
                  </div>
                )}
              </div>

              {/* M-Pesa Error Display */}
              {mpesaError && (
                <div className={`rounded-2xl p-4 shadow-sm border-l-4 border-red-500 ${
                  darkMode ? 'bg-red-900/20 border-red-500' : 'bg-red-50'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={`text-sm font-semibold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                        Payment Error
                      </p>
                      <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {mpesaError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order summary mini */}
              <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Order Summary
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Item</span>
                    <span className={`font-medium truncate max-w-[200px] text-right ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{listing.title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Seller</span>
                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                      {listing.seller_name || 'KU Student'}
                    </span>
                  </div>
                  {scheduledDate && (
                    <div className="flex justify-between text-sm">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {isService ? 'Service date' : 'Pickup date'}
                      </span>
                      <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                        {new Date(scheduledDate).toLocaleDateString('en-KE', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                        })}
                        {scheduledTime && ` at ${scheduledTime}`}
                      </span>
                    </div>
                  )}
                  <div className={`flex justify-between text-sm pt-2 border-t ${
                    darkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total</span>
                    <span className={`font-bold text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {listing.price
                        ? `KSh ${parseFloat(listing.price).toLocaleString('en-KE')}`
                        : 'Negotiable'}
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
                    <Loader2 size={18} className="animate-spin" />
                    {paymentMethod === 'mpesa' ? 'Initiating payment...' : 'Confirming...'}
                  </span>
                ) : (
                  paymentMethod === 'mpesa'
                    ? 'Confirm & Pay via M-Pesa'
                    : `Confirm ${isService ? 'Booking' : 'Order'}`
                )}
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* STEP 3 — Confirmation                                           */}
          {/* ════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-4">

              {/* Success header */}
              <div className={`rounded-2xl p-6 text-center shadow-sm ${
                darkMode ? 'bg-gray-800' : 'bg-white'
              }`}>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h2 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {isService ? 'Booking Confirmed!' : 'Order Confirmed!'}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {paymentMethod === 'mpesa' 
                    ? 'Complete the M-Pesa payment to finalize your order'
                    : 'Your transaction has been created successfully'}
                </p>
              </div>

              {/* M-Pesa Payment Status - Only show if payment method is M-Pesa */}
              {paymentMethod === 'mpesa' && (
                <MpesaPaymentStatus
                  transactionId={transaction?.id}
                  token={token}
                  darkMode={darkMode}
                  onRetry={handleRetryMpesa}
                  onComplete={handleMpesaComplete}
                />
              )}

              {/* Transaction receipt - Only show if payment is completed or non-M-Pesa */}
              {(paymentMethod !== 'mpesa' || mpesaPaymentStatus === 'completed') && (
                <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Transaction Details
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Item</span>
                      <span className={`font-medium text-right max-w-[200px] ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>{listing.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Amount</span>
                      <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {listing.price
                          ? `KSh ${parseFloat(listing.price).toLocaleString('en-KE')}`
                          : 'Negotiable'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Payment</span>
                      <span className={`font-medium capitalize ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {paymentMethod === 'mpesa'
                          ? 'M-Pesa'
                          : paymentMethod === 'pay_after_service'
                            ? 'Pay After Service'
                            : 'Cash on Pickup'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {isService ? 'Service date' : 'Pickup date'}
                      </span>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {scheduledDate && new Date(scheduledDate).toLocaleDateString('en-KE', {
                          weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                        })}
                        {scheduledTime && ` · ${scheduledTime}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Status</span>
                      <span className={`font-semibold ${
                        mpesaPaymentStatus === 'completed' 
                          ? 'text-green-500' 
                          : paymentMethod === 'mpesa' 
                            ? 'text-amber-500' 
                            : 'text-amber-500'
                      }`}>
                        {mpesaPaymentStatus === 'completed' 
                          ? 'Paid' 
                          : paymentMethod === 'mpesa' 
                            ? 'Awaiting Payment' 
                            : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact reveal - Only show if payment is completed or non-M-Pesa */}
              {(paymentMethod !== 'mpesa' || mpesaPaymentStatus === 'completed') && contact && (
                <ContactRevealBox contact={contact} darkMode={darkMode} />
              )}

              {/* Note about seller marking complete */}
              <div className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
                darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
              }`}>
                <Shield size={16} className="flex-shrink-0 mt-0.5 text-emerald-400" />
                <p>
                  Once the {isService ? 'service is delivered' : 'item is handed over'}, the seller
                  will mark the transaction as complete and you will both be prompted to leave a review.
                  If no action is taken within 7 days of the scheduled date, the transaction
                  auto-completes.
                </p>
              </div>

              {/* Actions */}
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
                  onClick={() => navigate('/dashboard')}
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
};

export default CheckoutPage;