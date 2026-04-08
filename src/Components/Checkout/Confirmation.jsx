import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Loader2, RefreshCw,
  Shield, Phone, Mail, Download,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateReceipt } from './generateReceipt';

const API_BASE = 'http://127.0.0.1:8000/api';

// ── M-Pesa status poller ──────────────────────────────────────────────────────

async function checkTransactionStatus(transactionId, token) {
  const res = await fetch(`${API_BASE}/transactions/${transactionId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not check transaction status');
  return res.json();
}

function MpesaPaymentStatus({ transactionId, token, darkMode, onRetry, onComplete }) {
  const [status,       setStatus]       = useState('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkCount,   setCheckCount]   = useState(0);
  const [txn,          setTxn]          = useState(null);

  useEffect(() => {
    let interval;
    let timeout;

    const check = async () => {
      try {
        const data = await checkTransactionStatus(transactionId, token);
        setTxn(data);

        if (data.status === 'completed') {
          setStatus('completed');
          clearInterval(interval);
          clearTimeout(timeout);
          onComplete(data);
          toast.success('Payment confirmed!');
        } else if (['cancelled', 'failed'].includes(data.status)) {
          setStatus('failed');
          setErrorMessage(data.payment_status_message || 'Payment was cancelled or failed');
          clearInterval(interval);
          clearTimeout(timeout);
        } else if (checkCount >= 30) {
          setStatus('failed');
          setErrorMessage('Payment timeout. Check your M-Pesa app or contact support.');
          clearInterval(interval);
          clearTimeout(timeout);
        } else {
          setCheckCount(c => c + 1);
        }
      } catch (err) {
        console.error('Status check error:', err);
      }
    };

    interval = setInterval(check, 2000);
    timeout  = setTimeout(() => {
      clearInterval(interval);
      if (status === 'processing') {
        setStatus('failed');
        setErrorMessage('Payment is taking longer than expected. Check your Purchases page.');
      }
    }, 60000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [transactionId, token, checkCount]);

  return (
    <div className={`rounded-2xl p-6 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>

      {status === 'processing' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <Loader2 size={24} className="animate-spin text-emerald-500" />
            <div>
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Processing Payment</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Please check your phone and enter your M-Pesa PIN
              </p>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full animate-pulse w-full" />
          </div>
          <p className={`text-xs text-center mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Waiting for confirmation… {checkCount * 2}s
          </p>
        </>
      )}

      {status === 'completed' && (
        <div className="flex items-center gap-3">
          <CheckCircle size={24} className="text-green-500" />
          <div>
            <h3 className="font-bold text-green-500">Payment Confirmed!</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Your payment has been received
            </p>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <XCircle size={24} className="text-red-500" />
            <div>
              <h3 className="font-bold text-red-500">Payment Failed</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {errorMessage || 'The payment was not completed successfully'}
              </p>
            </div>
          </div>
          <button
            onClick={onRetry}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} /> Retry Payment
          </button>
        </>
      )}
    </div>
  );
}

// ── Contact reveal box ────────────────────────────────────────────────────────

function ContactRevealBox({ contact, darkMode }) {
  const isWhatsApp = contact?.contact_preference === 'whatsapp';
  const Icon       = isWhatsApp ? Phone : Mail;
  const label      = isWhatsApp ? 'WhatsApp' : 'Email';
  const action     = isWhatsApp
    ? `https://wa.me/${contact.contact_value.replace(/[^0-9]/g, '')}`
    : `mailto:${contact.contact_value}`;

  return (
    <div className={`rounded-xl border-l-4 border-emerald-500 p-5 ${darkMode ? 'bg-gray-800' : 'bg-emerald-50'}`}>
      <div className="flex items-center gap-2 mb-3">
        <Shield size={16} className="text-emerald-500" />
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">
          Seller Contact Details
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white">
          <Icon size={18} />
        </div>
        <div>
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contact via {label}</p>
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

// ── Main ──────────────────────────────────────────────────────────────────────

const Confirmation = ({
  listing,
  transaction,
  darkMode,
  token,
  paymentMethod,
  scheduledDate,
  scheduledTime,
  mpesaPaymentStatus, setMpesaPaymentStatus,
  contact,            setContact,
  onRetryMpesa,
  onNavigatePurchases,
  onNavigateDashboard,
}) => {
  const isService = listing?.listing_type === 'service';
  const paymentDone = paymentMethod !== 'mpesa' || mpesaPaymentStatus === 'completed';

  const handleMpesaComplete = async (completedTxn) => {
    setMpesaPaymentStatus('completed');
    try {
      const res = await fetch(`${API_BASE}/listings/${listing.id}/contact_details/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setContact({ ...data, listing_type: listing.listing_type });
      }
    } catch (err) {
      console.error('Contact fetch failed:', err);
    }
  };

  const handleDownloadReceipt = () => {
    try {
      generateReceipt({
        listing,
        transaction,
        scheduledDate,
        scheduledTime,
        paymentMethod,
        contact,
      });
      toast.success('Receipt downloaded!');
    } catch (err) {
      console.error('Receipt error:', err);
      toast.error('Could not generate receipt. Please try again.');
    }
  };

  const fmtPaymentLabel = () => {
    if (paymentMethod === 'mpesa')            return 'M-Pesa';
    if (paymentMethod === 'pay_after_service') return 'Pay After Service';
    return 'Cash on Pickup';
  };

  return (
    <div className="space-y-4">

      {/* ── Success header ── */}
      <div className={`rounded-2xl p-6 text-center shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {isService ? 'Booking Confirmed!' : 'Order Confirmed!'}
        </h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {paymentMethod === 'mpesa'
            ? 'Complete the M-Pesa payment to finalise your order'
            : 'Your transaction has been created successfully'}
        </p>
      </div>

      {/* ── M-Pesa status poller ── */}
      {paymentMethod === 'mpesa' && (
        <MpesaPaymentStatus
          transactionId={transaction?.id}
          token={token}
          darkMode={darkMode}
          onRetry={onRetryMpesa}
          onComplete={handleMpesaComplete}
        />
      )}

      {/* ── Transaction details + receipt download ── */}
      {paymentDone && (
        <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Transaction Details
            </h3>
            <button
              onClick={handleDownloadReceipt}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
            >
              <Download size={13} />
              Download Receipt
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Item</span>
              <span className={`font-medium text-right max-w-[200px] ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {listing.title}
              </span>
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
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {fmtPaymentLabel()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                {isService ? 'Service date' : 'Pickup date'}
              </span>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {scheduledDate && new Date(scheduledDate).toLocaleDateString('en-KE', {
                  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                })}
                {scheduledTime && ` · ${scheduledTime}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Status</span>
              <span className={`font-semibold ${
                mpesaPaymentStatus === 'completed' || paymentMethod !== 'mpesa'
                  ? 'text-green-500'
                  : 'text-amber-500'
              }`}>
                {mpesaPaymentStatus === 'completed'
                  ? 'Paid'
                  : paymentMethod === 'mpesa' ? 'Awaiting Payment' : 'Pending'}
              </span>
            </div>
            {transaction?.mpesa_receipt && (
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>M-Pesa Receipt</span>
                <span className={`font-mono text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {transaction.mpesa_receipt}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Contact reveal ── */}
      {paymentDone && contact && (
        <ContactRevealBox contact={contact} darkMode={darkMode} />
      )}

      {/* ── Info note ── */}
      <div className={`p-4 rounded-xl text-sm flex items-start gap-3 ${
        darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
      }`}>
        <Shield size={16} className="flex-shrink-0 mt-0.5 text-emerald-400" />
        <p>
          Once the {isService ? 'service is delivered' : 'item is handed over'}, the seller will mark
          the transaction as complete and you will both be prompted to leave a review. If no action is
          taken within 7 days of the scheduled date, the transaction auto-completes.
        </p>
      </div>

      {/* ── Actions ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onNavigatePurchases}
          className={`py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
            darkMode
              ? 'border-gray-600 text-gray-200 hover:border-emerald-500'
              : 'border-gray-200 text-gray-700 hover:border-emerald-500'
          }`}
        >
          View Purchases
        </button>
        <button
          onClick={onNavigateDashboard}
          className="py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white transition-all"
        >
          Continue Browsing
        </button>
      </div>
    </div>
  );
};

export default Confirmation;