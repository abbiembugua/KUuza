import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import BackButton from '../Components/shared/BackButton';
import { useTheme } from '../context/Themecontext';
import { useAuth } from '../context/AuthContext';

import OrderReview   from '../Components/Checkout/Orderreview';
import ScheduleAndPay from '../Components/Checkout/Scheduleandpay/';
import Confirmation  from '../Components/Checkout/Confirmation';

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
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

// ── Validation ────────────────────────────────────────────────────────────────

function validateStep2({ scheduledDate, scheduledTime, paymentMethod, mpesaPhone, isGood }) {
  const e = {};
  if (!scheduledDate) e.scheduledDate = 'Please select a date';
  if (isGood && !scheduledTime) e.scheduledTime = 'Please select a time';
  if (!paymentMethod) e.paymentMethod = 'Please select a payment method';
  if (paymentMethod === 'mpesa') {
    if (!mpesaPhone.trim()) {
      e.mpesaPhone = 'Enter your M-Pesa phone number';
    } else {
      const clean = mpesaPhone.replace(/\D/g, '');
      if (!/^(254|0)[7-9][0-9]{8}$/.test(clean)) {
        e.mpesaPhone = 'Enter a valid Kenyan phone number (e.g. 0712345678)';
      }
    }
  }
  return e;
}

// ── Component ─────────────────────────────────────────────────────────────────

const CheckoutPage = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { darkMode } = useTheme();
  const { token }  = useAuth();

  // Page state
  const [step,    setStep]    = useState(1);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  // Transaction & contact
  const [transaction, setTransaction] = useState(null);
  const [contact,     setContact]     = useState(null);

  // Form state
  const [scheduledDate,   setScheduledDate]   = useState('');
  const [scheduledTime,   setScheduledTime]   = useState('');
  const [paymentMethod,   setPaymentMethod]   = useState('mpesa');
  const [inquiryNote,     setInquiryNote]     = useState('');
  const [mpesaPhone,      setMpesaPhone]      = useState('');
  const [errors,          setErrors]          = useState({});

  // Payment flow state
  const [submitting,         setSubmitting]         = useState(false);
  const [mpesaError,         setMpesaError]         = useState(null);
  const [mpesaPaymentStatus, setMpesaPaymentStatus] = useState(null);

  const isService = listing?.listing_type === 'service';
  const isGood    = listing?.listing_type === 'good';

  // ── Load listing ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    (async () => {
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
    })();
  }, [id, token]);

  // ── Confirm handler ────────────────────────────────────────────────────────
  const handleConfirm = async () => {
    const errs = validateStep2({ scheduledDate, scheduledTime, paymentMethod, mpesaPhone, isGood });
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setMpesaError(null);

    try {
      const payload = {
        listing:          listing.id,
        interaction_type: isService ? 'service_use' : 'purchase',
        agreed_price:     listing.price,
        payment_method:   paymentMethod,
        scheduled_date:   scheduledDate,
        ...(isGood && inquiryNote && { inquiry_note: inquiryNote }),
        ...(paymentMethod === 'mpesa' && { mpesa_phone: mpesaPhone }),
      };

      const txn = await createTransaction(payload, token);
      setTransaction(txn);

      if (paymentMethod === 'mpesa') {
        const mpesaRes = await fetch(`${API_BASE}/transactions/${txn.id}/initiate_mpesa/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ phone_number: mpesaPhone }),
        });
        if (!mpesaRes.ok) {
          const errData = await mpesaRes.json();
          throw new Error(errData.error || 'Could not send M-Pesa prompt');
        }
        setStep(3);
        setMpesaPaymentStatus('processing');
        toast.success('M-Pesa prompt sent! Check your phone.');
      } else {
        const contactData = await fetchContactDetails(listing.id, token);
        setContact({ ...contactData, listing_type: listing.listing_type });
        setStep(3);
        toast.success('Booking confirmed!');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      setMpesaError(err.message);
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Retry M-Pesa ───────────────────────────────────────────────────────────
  const handleRetryMpesa = async () => {
    setMpesaError(null);
    setMpesaPaymentStatus('processing');
    try {
      const res = await fetch(`${API_BASE}/transactions/${transaction.id}/initiate_mpesa/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone_number: mpesaPhone }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to initiate payment');
      }
      toast.success('M-Pesa prompt resent! Check your phone.');
    } catch (err) {
      setMpesaPaymentStatus('failed');
      setMpesaError(err.message);
      toast.error(err.message || 'Could not resend M-Pesa prompt');
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar />
      <div className="pt-24 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    </div>
  );

  if (!listing) return null;

  // ── Back button behaviour ──────────────────────────────────────────────────
  const handleBack = () => {
    if (step === 1 || step === 3) navigate(-1);
    else setStep(s => s - 1);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster toastOptions={{ style: { borderRadius: '10px', padding: '14px' } }} />
      <DashboardNavbar />

      <div className="pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 pt-6">

          <BackButton
            darkMode={darkMode}
            label={step === 1 ? 'Back to listing' : step === 2 ? 'Back' : 'Continue browsing'}
            onClick={handleBack}
            className="mb-6"
          />

          {step === 1 && (
            <OrderReview
              listing={listing}
              darkMode={darkMode}
              onContinue={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <ScheduleAndPay
              listing={listing}
              darkMode={darkMode}
              scheduledDate={scheduledDate} setScheduledDate={setScheduledDate}
              scheduledTime={scheduledTime} setScheduledTime={setScheduledTime}
              inquiryNote={inquiryNote}     setInquiryNote={setInquiryNote}
              paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
              mpesaPhone={mpesaPhone}       setMpesaPhone={setMpesaPhone}
              errors={errors}               setErrors={setErrors}
              mpesaError={mpesaError}
              submitting={submitting}
              onConfirm={handleConfirm}
            />
          )}

          {step === 3 && (
            <Confirmation
              listing={listing}
              transaction={transaction}
              darkMode={darkMode}
              token={token}
              paymentMethod={paymentMethod}
              scheduledDate={scheduledDate}
              scheduledTime={scheduledTime}
              mpesaPaymentStatus={mpesaPaymentStatus}
              setMpesaPaymentStatus={setMpesaPaymentStatus}
              contact={contact}
              setContact={setContact}
              onRetryMpesa={handleRetryMpesa}
              onNavigatePurchases={() => navigate('/purchases')}
              onNavigateDashboard={() => navigate('/dashboard')}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;