import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

import DashboardNavbar  from '../Components/Layout/DashboardNavbar';
import BackButton       from '../Components/shared/BackButton';
import { useTheme }     from '../context/Themecontext';
import { useAuth }      from '../context/AuthContext';

import OrderReview    from '../Components/Checkout/Orderreview';
import ScheduleAndPay from '../Components/Checkout/Scheduleandpay/';
import Confirmation   from '../Components/Checkout/Confirmation';

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
      if (!/^(254|0)(1[0-9]|[7-9][0-9])[0-9]{7}$/.test(clean)) {
        e.mpesaPhone = 'Enter a valid Kenyan number (e.g. 0712345678, 0110123456 or 254712345678)';
      }
    }
  }
  return e;
}

// ── Component ─────────────────────────────────────────────────────────────────

const CheckoutPage = () => {
  const { id }       = useParams();
  const location     = useLocation();
  const navigate     = useNavigate();
  const { darkMode } = useTheme();
  const { token }    = useAuth();

  // ── Detect mode ────────────────────────────────────────────────────────────
  const locationState = location.state || {};
  const isBulk        = locationState.checkoutType === 'bulk';
  const singleItem    = !isBulk ? (locationState.item || null) : null;
  const listingId     = id || singleItem?.listing_id;
  const bulkItems     = isBulk ? (locationState.items    || []) : [];
  const bulkTotal     = isBulk ? (locationState.totalAmount || 0) : 0;

  // ── Page state ─────────────────────────────────────────────────────────────
  const [step,    setStep]    = useState(1);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(!isBulk); // bulk skips the listing fetch

  // ── Transaction & contact ──────────────────────────────────────────────────
  const [transaction, setTransaction] = useState(null);
  const [bulkTxns,    setBulkTxns]    = useState([]);
  const [contact,     setContact]     = useState(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [inquiryNote,   setInquiryNote]   = useState('');
  const [mpesaPhone,    setMpesaPhone]    = useState('');
  const [errors,        setErrors]        = useState({});

  // ── Payment flow state ─────────────────────────────────────────────────────
  const [submitting,         setSubmitting]         = useState(false);
  const [mpesaError,         setMpesaError]         = useState(null);
  const [mpesaPaymentStatus, setMpesaPaymentStatus] = useState(null);

  const isService = !isBulk && listing?.listing_type === 'service';
  // Bulk is always goods; single respects listing_type
  const isGood    = isBulk || listing?.listing_type === 'good';
  const singleQuantity = Math.max(1, Number(singleItem?.quantity || 1));
  const singleTotal = listing?.price ? parseFloat(listing.price) * singleQuantity : 0;

  // ── Load listing (single mode only) ───────────────────────────────────────
  useEffect(() => {
    if (isBulk) return;
    if (!token) { navigate('/login'); return; }
    if (!listingId) {
      toast.error('Missing listing details for checkout.');
      navigate(locationState.returnTo || '/cart');
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const data = await fetchListing(listingId, token);
        setListing(data);
      } catch (err) {
        toast.error(err.message);
        navigate(-1);
      } finally {
        setLoading(false);
      }
    })();
  }, [listingId, token, isBulk, navigate, locationState.returnTo]);

  // ── Single confirm ─────────────────────────────────────────────────────────
  const handleSingleConfirm = async () => {
    const payload = {
      listing:          listing.id,
      interaction_type: isService ? 'service_use' : 'purchase',
      agreed_price:     listing.price,
      quantity:         singleQuantity,
      payment_method:   paymentMethod,
      scheduled_date:   scheduledDate,
      ...(isGood && scheduledTime && { scheduled_time: scheduledTime }),
      ...(isGood && inquiryNote && { inquiry_note: inquiryNote }),
      ...(paymentMethod === 'mpesa' && { mpesa_phone: mpesaPhone }),
    };

    const txn = await createTransaction(payload, token);
    setTransaction(txn);

    if (paymentMethod === 'mpesa') {
      const mpesaRes = await fetch(`${API_BASE}/transactions/${txn.id}/initiate_mpesa/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone_number: mpesaPhone, amount: singleTotal }),
      });
      if (!mpesaRes.ok) {
        const errData = await mpesaRes.json();
        throw new Error(errData.error || 'Could not send M-Pesa prompt');
      }
      setMpesaPaymentStatus('processing');
      toast.success('M-Pesa prompt sent! Check your phone.');
    } else {
      const contactData = await fetchContactDetails(listing.id, token);
      setContact({ ...contactData, listing_type: listing.listing_type });
      toast.success('Booking confirmed!');
    }

    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Bulk confirm ───────────────────────────────────────────────────────────
  const handleBulkConfirm = async () => {
    // Create one transaction per item sequentially
    const createdTxns = [];
    for (const item of bulkItems) {
      const payload = {
        listing:          item.listing_id,
        interaction_type: 'purchase',
        agreed_price:     item.price,
        quantity:         Math.max(1, Number(item.quantity || 1)),
        payment_method:   paymentMethod,
        scheduled_date:   scheduledDate,
        ...(scheduledTime && { scheduled_time: scheduledTime }),
        ...(inquiryNote && { inquiry_note: inquiryNote }),
        ...(paymentMethod === 'mpesa' && { mpesa_phone: mpesaPhone }),
      };
      const txn = await createTransaction(payload, token);
      createdTxns.push(txn);
    }
    setBulkTxns(createdTxns);

    if (paymentMethod === 'mpesa') {
      // One STK push for the combined total, referencing the first transaction
      const mpesaRes = await fetch(`${API_BASE}/transactions/${createdTxns[0].id}/initiate_mpesa/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          phone_number:           mpesaPhone,
          amount:                 bulkTotal,
          bulk_transaction_ids:   createdTxns.map(t => t.id),
        }),
      });
      if (!mpesaRes.ok) {
        const errData = await mpesaRes.json();
        throw new Error(errData.error || 'Could not send M-Pesa prompt');
      }
      setMpesaPaymentStatus('processing');
      toast.success(`M-Pesa prompt sent for ${bulkItems.length} items! Check your phone.`);
    } else {
      toast.success(`${bulkItems.length} orders confirmed!`);
    }

    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Confirm dispatcher ─────────────────────────────────────────────────────
  const handleConfirm = async () => {
    const errs = validateStep2({ scheduledDate, scheduledTime, paymentMethod, mpesaPhone, isGood });
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setMpesaError(null);

    try {
      if (isBulk) {
        await handleBulkConfirm();
      } else {
        await handleSingleConfirm();
      }
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
    const txnId = isBulk ? bulkTxns[0]?.id : transaction?.id;
    try {
      const res = await fetch(`${API_BASE}/transactions/${txnId}/initiate_mpesa/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          phone_number: mpesaPhone,
          ...(isBulk && {
            amount:               bulkTotal,
            bulk_transaction_ids: bulkTxns.map(t => t.id),
          }),
        }),
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

  // ── Back button ────────────────────────────────────────────────────────────
  const handleBack = () => {
    if (step === 1 || step === 3) navigate(locationState.returnTo || -1);
    else setStep(s => s - 1);
  };

  const backLabel =
    step === 1 ? (isBulk ? 'Back to cart' : 'Back to listing')
    : step === 2 ? 'Back'
    : 'Continue browsing';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar />
      <div className="pt-24 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    </div>
  );

  if (!isBulk && !listing) return null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster toastOptions={{ style: { borderRadius: '10px', padding: '14px' } }} />
      <DashboardNavbar />

      <div className="pt-20 pb-16">
        <div className="max-w-2xl mx-auto px-4 pt-6">

          <BackButton
            darkMode={darkMode}
            label={backLabel}
            onClick={handleBack}
            className="mb-6"
          />

          {step === 1 && (
            <OrderReview
              listing={listing}
              darkMode={darkMode}
              onContinue={() => setStep(2)}
              isBulk={isBulk}
              bulkItems={bulkItems}
              bulkTotal={bulkTotal}
              singleQuantity={singleQuantity}
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
              isBulk={isBulk}
              bulkItems={bulkItems}
              bulkTotal={bulkTotal}
              singleQuantity={singleQuantity}
              singleTotal={singleTotal}
            />
          )}

          {step === 3 && (
            <Confirmation
              listing={listing}
              transaction={isBulk ? bulkTxns[0] : transaction}
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
              isBulk={isBulk}
              bulkItems={bulkItems}
              bulkTotal={bulkTotal}
              bulkTxns={bulkTxns}
              singleQuantity={singleQuantity}
              singleTotal={singleTotal}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
