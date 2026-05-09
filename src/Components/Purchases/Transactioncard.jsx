import React, { useState, useEffect } from 'react';
import {
  Package, Wrench, CheckCircle, Clock, AlertCircle, Flag,
  Star, ChevronDown, ChevronUp, Phone, Mail, Shield, Loader2, MapPin, Download, X, ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { generateReceipt } from '../Checkout/generateReceipt';
import Avatar from '../shared/Avatar';

const API_BASE = 'http://127.0.0.1:8000/api';

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label:  'Pending',
    color:  'text-amber-600',
    bg:     'bg-amber-50',
    border: 'border-l-amber-400',
    icon:   Clock,
  },
  completed: {
    label:  'Completed',
    color:  'text-emerald-600',
    bg:     'bg-emerald-50',
    border: 'border-l-emerald-400',
    icon:   CheckCircle,
  },
  auto_completed: {
    label:  'Auto-completed',
    color:  'text-cyan-600',
    bg:     'bg-cyan-50',
    border: 'border-l-cyan-400',
    icon:   CheckCircle,
  },
  cancelled: {
    label:  'Cancelled',
    color:  'text-red-500',
    bg:     'bg-red-50',
    border: 'border-l-red-400',
    icon:   AlertCircle,
  },
};

const PAYMENT_LABELS = {
  mpesa:             'M-Pesa',
  cash_on_pickup:    'Cash on Pickup',
  pay_after_service: 'Pay After Service',
};

const getTransactionQuantity = (transaction) => {
  const q = Number(transaction?.quantity);
  return Number.isFinite(q) && q > 0 ? q : 1;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatShortDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

async function markComplete(transactionId, token) {
  const res = await fetch(
    `${API_BASE}/transactions/${transactionId}/mark_complete/`,
    {
      method:  'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Could not mark as complete');
  }
  return res.json();
}

async function cancelTransaction(transactionId, token) {
  const res = await fetch(
    `${API_BASE}/transactions/${transactionId}/cancel/`,
    {
      method:  'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Could not cancel transaction');
  }
  return res.json();
}


async function confirmReceipt(transactionId, token) {
  const res = await fetch(`${API_BASE}/transactions/${transactionId}/confirm_receipt/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Could not confirm receipt'); }
  return res.json();
}

async function disputeTransaction(transactionId, token) {
  const res = await fetch(`${API_BASE}/transactions/${transactionId}/dispute/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Could not raise dispute'); }
  return res.json();
}

// ── ReceiptConfirmBanner ──────────────────────────────────────────

function ReceiptConfirmBanner({ transaction, darkMode, token, onConfirmed, onDisputed }) {
  const [confirming, setConfirming] = useState(false);
  const [showDisputeSheet, setShowDisputeSheet] = useState(false);
  const [disputing, setDisputing] = useState(false);

  const hoursLeft = transaction.confirmation_deadline
    ? Math.max(0, Math.ceil((new Date(transaction.confirmation_deadline) - Date.now()) / 3_600_000))
    : 48;

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const updated = await confirmReceipt(transaction.id, token);
      toast.success('Receipt confirmed!');
      onConfirmed(updated);
    } catch (err) { toast.error(err.message); }
    finally { setConfirming(false); }
  };

  const handleDispute = async () => {
    setDisputing(true);
    try {
      const updated = await disputeTransaction(transaction.id, token);
      toast.success('Dispute raised. The seller has been notified.');
      onDisputed(updated);
      setShowDisputeSheet(false);
    } catch (err) { toast.error(err.message); }
    finally { setDisputing(false); }
  };

  return (
    <>
      <div className={`mt-3 rounded-xl border p-3.5 ${
        darkMode ? 'bg-violet-950/30 border-violet-800/40' : 'bg-violet-50 border-violet-200'
      }`}>
        <div className="flex items-start gap-2.5">
          <Package size={14} className={`mt-0.5 flex-shrink-0 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold ${darkMode ? 'text-violet-300' : 'text-violet-800'}`}>
              {transaction.seller_name} marked this as delivered
            </p>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-violet-400/70' : 'text-violet-600'}`}>
              Confirm receipt to unlock your review.
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {confirming ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                {confirming ? 'Confirming…' : 'Yes, I received it'}
              </button>
              <button
                onClick={() => setShowDisputeSheet(true)}
                className={`text-xs underline underline-offset-2 transition-colors ${
                  darkMode ? 'text-violet-500 hover:text-violet-300' : 'text-violet-500 hover:text-violet-700'
                }`}
              >
                Didn’t get it?
              </button>
            </div>
            <p className={`text-xs mt-2 ${darkMode ? 'text-violet-600' : 'text-violet-400'}`}>
              Auto-confirms in {hoursLeft}h if no action taken
            </p>
          </div>
        </div>
      </div>

      {showDisputeSheet && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !disputing && setShowDisputeSheet(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6">
            <div className={`w-full max-w-md mx-auto rounded-2xl p-5 shadow-2xl ${
              darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-stone-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                  What’s going on?
                </p>
                <button
                  onClick={() => setShowDisputeSheet(false)}
                  disabled={disputing}
                  className={`p-1 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-stone-100 text-stone-500'}`}
                >
                  <X size={15} />
                </button>
              </div>
              <div className="space-y-2.5">
                <div className={`flex items-center gap-3 w-full rounded-xl p-3.5 ${
                  darkMode ? 'bg-gray-800' : 'bg-stone-50'
                }`}>
                  <Phone size={15} className="text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                      Contact {transaction.seller_name} directly
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>
                      Expand the card details below to get their contact info
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDispute}
                  disabled={disputing}
                  className={`flex items-center gap-3 w-full rounded-xl p-3.5 text-left transition-colors disabled:opacity-50 ${
                    darkMode
                      ? 'bg-red-950/30 hover:bg-red-950/50 border border-red-900/40'
                      : 'bg-red-50 hover:bg-red-100 border border-red-200'
                  }`}
                >
                  {disputing
                    ? <Loader2 size={15} className="text-red-500 flex-shrink-0 animate-spin" />
                    : <Flag size={15} className="text-red-500 flex-shrink-0" />}
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                      {disputing ? 'Raising dispute…' : 'Report to KUuza'}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-red-500/70' : 'text-red-500'}`}>
                      A flag is raised and auto-confirm is paused.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ── DisputedBanner ────────────────────────────────────────────

function DisputedBanner({ transaction, darkMode }) {
  return (
    <div className={`mt-3 rounded-xl border p-3.5 ${
      darkMode ? 'bg-red-950/30 border-red-900/40' : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-start gap-2.5">
        <Flag size={14} className={`mt-0.5 flex-shrink-0 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
            Dispute raised
          </p>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-red-400/70' : 'text-red-500'}`}>
            You reported not receiving this item. KUuza has been notified. Expand the card to contact {transaction.seller_name}.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── ContactDetails (internal sub-component) ───────────────────────────────────

function ContactDetails({ listingId, token, darkMode }) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!listingId || !token) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/listings/${listingId}/contact_details/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) setContact(await res.json());
        else setError(true);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [listingId, token]);

  if (loading) return (
    <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      <Loader2 size={12} className="animate-spin" /> Loading contact details...
    </div>
  );

  if (error || !contact) return (
    <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      <Shield size={12} /> Contact details unavailable
    </div>
  );

  const isWhatsApp = contact.contact_preference === 'whatsapp';
  const Icon = isWhatsApp ? Phone : Mail;
  const href = isWhatsApp
    ? `https://wa.me/${contact.contact_value.replace(/[^0-9]/g, '')}`
    : `mailto:${contact.contact_value}`;

  return (
    <div className={`rounded-xl p-3 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Shield size={13} className="text-emerald-500" />
        <span className={`text-xs font-bold uppercase tracking-wider ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Seller Contact
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={14} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {contact.contact_value}
          </span>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-opacity flex-shrink-0"
        >
          {isWhatsApp ? 'WhatsApp' : 'Email'}
        </a>
      </div>
    </div>
  );
}

// ── CancelConfirmPopup ────────────────────────────────────────────────────────

function CancelConfirmPopup({ darkMode, onConfirm, onDismiss, loading }) {
  return (
    <div className={`mt-3 rounded-xl border p-3 flex items-start gap-3 ${
      darkMode
        ? 'bg-red-950/30 border-red-900/50'
        : 'bg-red-50 border-red-200'
    }`}>
      <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
          Cancel this transaction?
        </p>
        <p className={`text-xs mt-0.5 ${darkMode ? 'text-red-500/70' : 'text-red-500'}`}>
          This can't be undone.
        </p>
        <div className="flex items-center gap-2 mt-2.5">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
            {loading ? 'Cancelling…' : 'Yes, cancel'}
          </button>
          <button
            onClick={onDismiss}
            disabled={loading}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            Keep it
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TransactionCard ───────────────────────────────────────────────────────────

/**
 * TransactionCard
 *
 * Props:
 *   transaction      {object}   — transaction data from API
 *   currentUserId    {string}   — logged-in user's id
 *   darkMode         {boolean}
 *   token            {string}   — JWT access token
 *   onComplete       (transactionId: string) => void
 *   onCancel         (transactionId: string) => void
 *   onReview         (transaction, reviewTarget) => void
 *   pendingReviewIds {string[]} — ids that still need a review
 */
export default function TransactionCard({
  transaction,
  currentUserId,
  darkMode,
  token,
  downloaderName,
  onComplete,
  onCancel,
  onReview,
  onTransactionUpdate,
  pendingReviewIds,
}) {
  const navigate = useNavigate();

  const [expanded,           setExpanded]           = useState(false);
  const [completing,         setCompleting]         = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [showCancelPrompt,   setShowCancelPrompt]   = useState(false);
  const [cancelling,         setCancelling]         = useState(false);

  const isBuyer  = transaction.buyer  === currentUserId;
  const isSeller = transaction.seller === currentUserId;
  const role     = isBuyer ? 'Purchased' : 'Sold';

  const isService  = transaction.listing_type === 'service';
  const statusConf = STATUS_CONFIG[transaction.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConf.icon;

  const isComplete      = ['completed', 'auto_completed'].includes(transaction.status);
  const canComplete     = isSeller && transaction.status === 'pending' && !transaction.seller_confirmed;
  const canCancel       = transaction.status === 'pending' && !transaction.seller_confirmed;
  const needsReview     = isComplete && pendingReviewIds.includes(transaction.id);
  const awaitingReceipt = isBuyer && transaction.status === 'pending' && transaction.seller_confirmed && !transaction.is_disputed;
  const isDisputed      = isBuyer && transaction.is_disputed && transaction.status === 'pending';

  const reviewTarget = isBuyer
    ? { id: transaction.seller, full_name: transaction.seller_name }
    : { id: transaction.buyer,  full_name: transaction.buyer_name  };

  const counterpartyName    = isBuyer ? transaction.seller_name            : transaction.buyer_name;
  const counterpartyRole    = isBuyer ? 'Seller'                           : 'Buyer';
  const counterpartyId      = isBuyer ? transaction.seller                 : transaction.buyer;
  const counterpartyPicture = isBuyer ? transaction.seller_profile_picture : transaction.buyer_profile_picture;
  const transactionQuantity = getTransactionQuantity(transaction);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await markComplete(transaction.id, token);
      toast.success('Marked as delivered. Waiting for buyer confirmation.');
      onComplete(transaction.id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const handleCancelConfirm = async () => {
    setCancelling(true);
    try {
      await cancelTransaction(transaction.id, token);
      toast.success('Transaction cancelled.');
      setShowCancelPrompt(false);
      onCancel(transaction.id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadReceipt = async () => {
    setDownloadingReceipt(true);

    try {
      let contact = null;

      if (transaction.listing && token) {
        const response = await fetch(`${API_BASE}/listings/${transaction.listing}/contact_details/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          contact = await response.json();
        }
      }

      generateReceipt({
        listing: {
          id: transaction.listing,
          title: transaction.listing_title,
          seller_name: transaction.seller_name,
          listing_type: transaction.listing_type,
          category: transaction.listing_category,
          price: transaction.agreed_price || transaction.price,
        },
        transaction: {
          ...transaction,
          downloaded_by_name: downloaderName,
          quantity: transactionQuantity,
        },
        scheduledDate: transaction.scheduled_date,
        scheduledTime: transaction.scheduled_time,
        paymentMethod: transaction.payment_method,
        contact,
      });

      toast.success('Receipt downloaded.');
    } catch (error) {
      console.error('Receipt download failed:', error);
      toast.error('Could not download the receipt right now.');
    } finally {
      setDownloadingReceipt(false);
    }
  };

  return (
    <div className={`rounded-2xl border-l-4 overflow-hidden transition-all ${statusConf.border} ${
      darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
    }`}>

      {/* ── Main row ── */}
      <div className="p-4">
        <div className="flex gap-3">

          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
            {transaction.listing_image ? (
              <img
                src={transaction.listing_image}
                alt={transaction.listing_title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600/10 to-cyan-600/10">
                {isService
                  ? <Wrench size={20} className="text-emerald-500" />
                  : <Package size={20} className="text-cyan-500" />}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* Badges + status */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isBuyer ? 'bg-cyan-100 text-cyan-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {role}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isService
                    ? 'bg-purple-100 text-purple-600'
                    : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isService ? 'Service' : 'Good'}
                </span>
              </div>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${statusConf.bg} ${statusConf.color}`}>
                <StatusIcon size={11} />
                {statusConf.label}
              </div>
            </div>

            {/* Title */}
            <p className={`font-semibold text-sm line-clamp-1 mb-1.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {transaction.listing_title || 'Listing no longer available'}
            </p>
            {transaction.listing_type !== 'service' && (
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Quantity: {transactionQuantity}
              </p>
            )}

            {/* Dates */}
            <div className="flex flex-col gap-1">
              {transaction.created_at && (
                <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Clock size={10} />
                  <span>Transacted:</span>
                  <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatShortDate(transaction.created_at)}
                  </span>
                </div>
              )}
              {transaction.scheduled_date && (
                <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <MapPin size={10} className="text-emerald-500" />
                  <span>Delivery date:</span>
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {formatShortDate(transaction.scheduled_date)}
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <p className="text-sm font-bold mt-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              {transaction.agreed_price
                ? `KSh ${(parseFloat(transaction.agreed_price) * transactionQuantity).toLocaleString('en-KE')}`
                : 'Negotiable'}
            </p>
          </div>
        </div>

        {/* ── Counterparty strip — clickable ── */}
        <button
          type="button"
          onClick={() => counterpartyId && navigate(`/sellers/${counterpartyId}`)}
          className={`mt-3 w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-colors group ${
            darkMode
              ? 'bg-gray-700/50 hover:bg-gray-700'
              : 'bg-gray-50 hover:bg-emerald-50'
          }`}
        >
          <Avatar src={counterpartyPicture} name={counterpartyName} size="w-7 h-7" textSize="text-xs" />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold truncate ${darkMode ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-emerald-700'}`}>
              {counterpartyName}
            </p>
            <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {counterpartyRole} · View profile
            </p>
          </div>
          <ExternalLink size={13} className={`flex-shrink-0 ${darkMode ? 'text-gray-600 group-hover:text-emerald-400' : 'text-gray-300 group-hover:text-emerald-500'}`} />
        </button>

        {/* ── Receipt confirmation banner (buyer only) ── */}
        {awaitingReceipt && (
          <ReceiptConfirmBanner
            transaction={transaction}
            darkMode={darkMode}
            token={token}
            onConfirmed={onTransactionUpdate}
            onDisputed={onTransactionUpdate}
          />
        )}

        {/* ── Dispute banner (buyer only, after dispute raised) ── */}
        {isDisputed && (
          <DisputedBanner transaction={transaction} darkMode={darkMode} />
        )}

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">

          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-opacity disabled:opacity-50"
            >
              {completing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
              {completing ? 'Marking...' : 'Mark as Complete'}
            </button>
          )}

          {needsReview && (
            <button
              onClick={() => onReview(transaction, reviewTarget)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Star size={13} /> Leave a Review
            </button>
          )}

          <button
            onClick={handleDownloadReceipt}
            disabled={downloadingReceipt}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {downloadingReceipt ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            Receipt
          </button>

          {/* ── Cancel button — only on pending ── */}
          {canCancel && !showCancelPrompt && (
            <button
              onClick={() => setShowCancelPrompt(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                darkMode
                  ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
                  : 'text-red-500 hover:bg-red-50 hover:text-red-600'
              }`}
            >
              <X size={12} /> Cancel
            </button>
          )}

          {isComplete && !needsReview && (
            <div className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <CheckCircle size={12} className="text-emerald-500" /> Reviewed
            </div>
          )}

          {transaction.status === 'pending' && transaction.auto_complete_date && (
            <span className={`text-xs ml-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Auto-completes {formatShortDate(transaction.auto_complete_date)}
            </span>
          )}

          <button
            onClick={() => setExpanded(e => !e)}
            className={`ml-auto flex items-center gap-1 text-xs transition-colors ${
              darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {expanded ? 'Less' : 'Details'}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

        {/* ── Inline cancel confirmation ── */}
        {showCancelPrompt && (
          <CancelConfirmPopup
            darkMode={darkMode}
            onConfirm={handleCancelConfirm}
            onDismiss={() => setShowCancelPrompt(false)}
            loading={cancelling}
          />
        )}
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className={`px-4 pb-4 pt-0 border-t space-y-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="pt-4 grid grid-cols-2 gap-3 text-sm">

            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Payment
              </p>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                {PAYMENT_LABELS[transaction.payment_method] || transaction.payment_method}
              </p>
            </div>

            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Transaction ID
              </p>
              <p className={`text-xs font-mono truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {transaction.id}
              </p>
            </div>

            {transaction.inquiry_note && (
              <div className="col-span-2">
                <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Buyer Note
                </p>
                <p className={`text-sm italic ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  &ldquo;{transaction.inquiry_note}&rdquo;
                </p>
              </div>
            )}

            {transaction.listing_type !== 'service' && (
              <div>
                <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Quantity
                </p>
                <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                  {transactionQuantity}
                </p>
              </div>
            )}

            {transaction.mpesa_receipt && (
              <div>
                <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  M-Pesa Receipt
                </p>
                <p className={`font-mono text-xs ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {transaction.mpesa_receipt}
                </p>
              </div>
            )}

            {transaction.completed_at && (
              <div>
                <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Completed on
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {formatShortDate(transaction.completed_at)}
                </p>
              </div>
            )}
          </div>

          <ContactDetails
            listingId={transaction.listing}
            token={token}
            darkMode={darkMode}
          />
        </div>
      )}
    </div>
  );
}