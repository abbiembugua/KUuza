import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Wrench, MapPin, Calendar, CreditCard,
  CheckCircle, Clock, AlertCircle, Star, ChevronDown,
  ChevronUp, Phone, Mail, Shield, Loader2, RefreshCw,
  ShoppingBag, TrendingUp, ArrowRight, X
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import { useTheme } from '../context/Themecontext';
import { useAuth } from '../context/AuthContext';
import ReviewModal from '../Components/Reviewmodal'

const API_BASE = 'http://127.0.0.1:8000/api';

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchTransactions(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res   = await fetch(`${API_BASE}/transactions/${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Could not load transactions');
  return res.json();
}

async function fetchPendingReviews(token) {
  const res = await fetch(`${API_BASE}/transactions/pending_reviews/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label:   'Pending',
    color:   'text-amber-600',
    bg:      'bg-amber-50',
    border:  'border-l-amber-400',
    icon:    Clock,
  },
  completed: {
    label:   'Completed',
    color:   'text-green-600',
    bg:      'bg-green-50',
    border:  'border-l-green-400',
    icon:    CheckCircle,
  },
  auto_completed: {
    label:   'Auto-completed',
    color:   'text-blue-600',
    bg:      'bg-blue-50',
    border:  'border-l-blue-400',
    icon:    CheckCircle,
  },
  cancelled: {
    label:   'Cancelled',
    color:   'text-red-500',
    bg:      'bg-red-50',
    border:  'border-l-red-400',
    icon:    AlertCircle,
  },
};

const PAYMENT_LABELS = {
  mpesa:             'M-Pesa',
  cash_on_pickup:    'Cash on Pickup',
  pay_after_service: 'Pay After Service',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab, darkMode, onBrowse }) {
  const messages = {
    all:    { icon: ShoppingBag, title: 'No transactions yet',      sub: 'Your purchases and sales will appear here.' },
    buyer:  { icon: ShoppingBag, title: 'No purchases yet',         sub: 'Browse listings and make your first purchase.' },
    seller: { icon: TrendingUp,  title: 'No sales yet',             sub: 'Create a listing to start selling.' },
  };
  const { icon: Icon, title, sub } = messages[tab] || messages.all;

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
        darkMode ? 'bg-gray-800' : 'bg-gray-100'
      }`}>
        <Icon size={28} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
      </div>
      <p className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</p>
      <p className={`text-sm mb-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{sub}</p>
      <button
        onClick={onBrowse}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Browse Listings
      </button>
    </div>
  );
}

// ── Transaction card ──────────────────────────────────────────────────────────

function TransactionCard({
  transaction,
  currentUserId,
  darkMode,
  token,
  onComplete,
  onReview,
  pendingReviewIds,
}) {
  const [expanded,   setExpanded]   = useState(false);
  const [completing, setCompleting] = useState(false);

  const isBuyer  = transaction.buyer  === currentUserId;
  const isSeller = transaction.seller === currentUserId;
  const role     = isBuyer ? 'Purchased' : 'Sold';

  const isService  = transaction.listing_type === 'service';
  const statusConf = STATUS_CONFIG[transaction.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConf.icon;

  const isComplete   = ['completed', 'auto_completed'].includes(transaction.status);
  const canComplete  = isSeller && transaction.status === 'pending';
  const needsReview  = isComplete && pendingReviewIds.includes(transaction.id);

  // Who to review: buyer reviews seller, seller reviews buyer
  const reviewTarget = isBuyer
    ? { id: transaction.seller, name: transaction.seller_name }
    : { id: transaction.buyer,  name: transaction.buyer_name  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await markComplete(transaction.id, token);
      toast.success('Transaction marked as complete.');
      onComplete(transaction.id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className={`rounded-2xl border-l-4 overflow-hidden transition-all ${
      statusConf.border
    } ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'}`}>

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
              <div className="w-full h-full flex items-center justify-center">
                {isService
                  ? <Wrench size={20} className="text-gray-400" />
                  : <Package size={20} className="text-gray-400" />}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Role badge */}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isBuyer
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {role}
                </span>
                {/* Type badge */}
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isService
                    ? 'bg-purple-100 text-purple-600'
                    : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  {isService ? 'Service' : 'Good'}
                </span>
              </div>

              {/* Status */}
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${
                statusConf.bg
              } ${statusConf.color}`}>
                <StatusIcon size={11} />
                {statusConf.label}
              </div>
            </div>

            {/* Title */}
            <p className={`font-semibold text-sm line-clamp-1 mb-1 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {transaction.listing_title || 'Listing no longer available'}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                With: <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {isBuyer ? transaction.seller_name : transaction.buyer_name}
                </span>
              </span>
              <span className={`text-xs flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Calendar size={11} />
                {formatDate(transaction.scheduled_date)}
              </span>
              <span className={`text-xs font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {transaction.agreed_price
                  ? `KSh ${parseFloat(transaction.agreed_price).toLocaleString('en-KE')}`
                  : 'Negotiable'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">

          {/* Seller: mark complete */}
          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {completing
                ? <Loader2 size={13} className="animate-spin" />
                : <CheckCircle size={13} />}
              {completing ? 'Marking...' : 'Mark as Complete'}
            </button>
          )}

          {/* Review prompt */}
          {needsReview && (
            <button
              onClick={() => onReview(transaction, reviewTarget)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Star size={13} />
              Leave a Review
            </button>
          )}

          {/* Already reviewed indicator */}
          {isComplete && !needsReview && (
            <div className={`flex items-center gap-1 text-xs ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              <CheckCircle size={12} className="text-green-500" />
              Reviewed
            </div>
          )}

          {/* Auto-complete note */}
          {transaction.status === 'pending' && transaction.auto_complete_date && (
            <span className={`text-xs ml-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Auto-completes {formatDate(transaction.auto_complete_date)}
            </span>
          )}

          {/* Expand toggle */}
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
      </div>

      {/* ── Expanded details ── */}
      {expanded && (
        <div className={`px-4 pb-4 pt-0 border-t space-y-4 ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <div className="pt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>Payment</p>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                {PAYMENT_LABELS[transaction.payment_method] || transaction.payment_method}
              </p>
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>Transaction ID</p>
              <p className={`text-xs font-mono truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {transaction.id}
              </p>
            </div>
            {transaction.inquiry_note && (
              <div className="col-span-2">
                <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>Buyer Note</p>
                <p className={`text-sm italic ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  &ldquo;{transaction.inquiry_note}&rdquo;
                </p>
              </div>
            )}
            {transaction.mpesa_receipt && (
              <div>
                <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>M-Pesa Receipt</p>
                <p className={`font-mono text-xs ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {transaction.mpesa_receipt}
                </p>
              </div>
            )}
            {transaction.completed_at && (
              <div>
                <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>Completed</p>
                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {formatDate(transaction.completed_at)}
                </p>
              </div>
            )}
          </div>

          {/* Contact details — always visible in expanded view */}
          <ContactDetails
            transactionId={transaction.id}
            listingId={transaction.listing}
            token={token}
            darkMode={darkMode}
          />
        </div>
      )}
    </div>
  );
}

// ── Contact details (fetched on demand in expanded view) ──────────────────────

function ContactDetails({ transactionId, listingId, token, darkMode }) {
  const [contact,  setContact]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);

  useEffect(() => {
    if (!listingId || !token) { setLoading(false); return; }
    const load = async () => {
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
    };
    load();
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
  const Icon       = isWhatsApp ? Phone : Mail;
  const href       = isWhatsApp
    ? `https://wa.me/${contact.contact_value.replace(/[^0-9]/g, '')}`
    : `mailto:${contact.contact_value}`;

  return (
    <div className={`rounded-xl p-3 border-l-4 border-blue-500 ${
      darkMode ? 'bg-gray-700/50' : 'bg-blue-50'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <Shield size={13} className="text-blue-500" />
        <span className="text-xs font-bold uppercase tracking-wider text-blue-500">
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
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
        >
          {isWhatsApp ? 'WhatsApp' : 'Email'}
        </a>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PurchasesPage = () => {
  const navigate          = useNavigate();
  const { darkMode }      = useTheme();
  const { token, user }   = useAuth();

  const [transactions,     setTransactions]     = useState([]);
  const [pendingReviewIds, setPendingReviewIds] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [activeTab,        setActiveTab]        = useState('all');
  const [statusFilter,     setStatusFilter]     = useState('');

  // Review modal state
  const [reviewModal, setReviewModal] = useState({
    isOpen:        false,
    transaction:   null,
    reviewTarget:  null,
  });

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(async (showRefreshing = false) => {
    if (!token) return;
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {};
      if (activeTab    !== 'all') params.role   = activeTab;
      if (statusFilter !== '')    params.status = statusFilter;

      const [txnData, pendingData] = await Promise.all([
        fetchTransactions(token, params),
        fetchPendingReviews(token),
      ]);

      const txns   = Array.isArray(txnData)   ? txnData   : txnData?.results   || [];
      const pending = Array.isArray(pendingData) ? pendingData : pendingData?.results || [];

      setTransactions(txns);
      setPendingReviewIds(pending.map(t => t.id));

    } catch (err) {
      toast.error('Could not load transactions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, activeTab, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleComplete = (transactionId) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId ? { ...t, status: 'completed' } : t
      )
    );
    // Reload pending reviews after completion
    fetchPendingReviews(token)
      .then(data => {
        const arr = Array.isArray(data) ? data : data?.results || [];
        setPendingReviewIds(arr.map(t => t.id));
      })
      .catch(() => {});
  };

  const handleOpenReview = (transaction, reviewTarget) => {
    setReviewModal({ isOpen: true, transaction, reviewTarget });
  };

  const handleReviewSubmitted = () => {
    // Remove from pending reviews
    if (reviewModal.transaction) {
      setPendingReviewIds(prev => prev.filter(id => id !== reviewModal.transaction.id));
    }
    setReviewModal({ isOpen: false, transaction: null, reviewTarget: null });
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total:    transactions.length,
    pending:  transactions.filter(t => t.status === 'pending').length,
    complete: transactions.filter(t => ['completed', 'auto_completed'].includes(t.status)).length,
    reviews:  pendingReviewIds.length,
  };

  const tabs = [
    { key: 'all',    label: 'All' },
    { key: 'buyer',  label: 'Purchases' },
    { key: 'seller', label: 'Sales' },
  ];

  const statusOptions = [
    { value: '',               label: 'All statuses' },
    { value: 'pending',        label: 'Pending' },
    { value: 'completed',      label: 'Completed' },
    { value: 'auto_completed', label: 'Auto-completed' },
    { value: 'cancelled',      label: 'Cancelled' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster toastOptions={{ style: { borderRadius: '10px', padding: '14px' } }} />
      <DashboardNavbar />

      <div className="pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 pt-6">

          {/* ── Page header ── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Purchases & Sales
              </h1>
              <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Your complete buying and selling history
              </p>
            </div>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className={`p-2 rounded-xl transition-colors ${
                darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* ── Stats strip ── */}
          {!loading && transactions.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total',    value: stats.total,    color: 'text-blue-600'  },
                { label: 'Pending',  value: stats.pending,  color: 'text-amber-500' },
                { label: 'Complete', value: stats.complete, color: 'text-green-600' },
                { label: 'Reviews',  value: stats.reviews,  color: 'text-purple-600', badge: stats.reviews > 0 },
              ].map(s => (
                <div
                  key={s.label}
                  className={`rounded-xl p-3 text-center ${
                    darkMode ? 'bg-gray-800' : 'bg-white border border-gray-100 shadow-sm'
                  }`}
                >
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {s.label}
                    {s.badge && s.value > 0 && (
                      <span className="ml-1 w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── Pending review banner ── */}
          {pendingReviewIds.length > 0 && (
            <div className={`mb-5 p-4 rounded-xl flex items-center gap-3 ${
              darkMode ? 'bg-amber-900/20 border border-amber-800' : 'bg-amber-50 border border-amber-200'
            }`}>
              <Star size={18} className="text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                  {pendingReviewIds.length} transaction{pendingReviewIds.length > 1 ? 's' : ''} waiting for your review
                </p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-amber-500/70' : 'text-amber-600'}`}>
                  Help your fellow KU students by leaving honest feedback.
                </p>
              </div>
            </div>
          )}

          {/* ── Tabs + filter ── */}
          <div className="flex items-center justify-between mb-4 gap-3">
            {/* Tabs */}
            <div className={`flex rounded-xl p-1 gap-1 ${
              darkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.key
                      ? darkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-white text-gray-900 shadow-sm'
                      : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-sm border transition-all focus:outline-none ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-300 focus:border-blue-500'
                  : 'bg-white border-gray-200 text-gray-700 focus:border-blue-500'
              }`}
            >
              {statusOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* ── Transaction list ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={28} className="animate-spin text-blue-500" />
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading your transactions...
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              tab={activeTab}
              darkMode={darkMode}
              onBrowse={() => navigate('/dashboard')}
            />
          ) : (
            <div className="space-y-3">
              {transactions.map(transaction => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  currentUserId={user?.id}
                  darkMode={darkMode}
                  token={token}
                  onComplete={handleComplete}
                  onReview={handleOpenReview}
                  pendingReviewIds={pendingReviewIds}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Review modal ── */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ isOpen: false, transaction: null, reviewTarget: null })}
        onSubmitted={handleReviewSubmitted}
        transactionId={reviewModal.transaction?.id}
        reviewee={reviewModal.reviewTarget}
        listingTitle={reviewModal.transaction?.listing_title}
        token={token}
        darkMode={darkMode}
      />
    </div>
  );
};

export default PurchasesPage;