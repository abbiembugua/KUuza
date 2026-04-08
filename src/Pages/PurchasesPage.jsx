import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, TrendingUp, Star, Loader2, RefreshCw,
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import BackButton      from '../Components/shared/BackButton';
import ReviewModal     from '../Components/Reviewmodal';
import { useTheme }    from '../context/Themecontext';
import { useAuth }     from '../context/AuthContext';

// ── Extracted components (live in Components/transactions/) ───────────────────
import DateRangeFilter  from '../Components/Purchases/Daterangefilter';
import FinancialSummary from '../Components/Purchases/FinancialSummary';
import TransactionCard  from '../Components/Purchases/Transactioncard';
import ReportGenerator from '../Components/Purchases/Reportgenerator';

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

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab, darkMode, onBrowse }) {
  const messages = {
    all:    { icon: ShoppingBag, title: 'No transactions yet',  sub: 'Your purchases and sales will appear here.' },
    buyer:  { icon: ShoppingBag, title: 'No purchases yet',     sub: 'Browse listings and make your first purchase.' },
    seller: { icon: TrendingUp,  title: 'No sales yet',         sub: 'Create a listing to start selling.' },
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
        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:opacity-90 text-white text-sm font-semibold rounded-xl transition-opacity"
      >
        Browse Listings
      </button>
    </div>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'all',    label: 'All'       },
  { key: 'buyer',  label: 'Purchases' },
  { key: 'seller', label: 'Sales'     },
];

const STATUS_OPTIONS = [
  { value: '',               label: 'All statuses'  },
  { value: 'pending',        label: 'Pending'        },
  { value: 'completed',      label: 'Completed'      },
  { value: 'auto_completed', label: 'Auto-completed' },
  { value: 'cancelled',      label: 'Cancelled'      },
];

// ── Page ──────────────────────────────────────────────────────────────────────

const PurchasesPage = () => {
  const navigate        = useNavigate();
  const { darkMode }    = useTheme();
  const { token, user } = useAuth();

  const [transactions,     setTransactions]     = useState([]);
  const [pendingReviewIds, setPendingReviewIds] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [activeTab,        setActiveTab]        = useState('all');
  const [statusFilter,     setStatusFilter]     = useState('');
  const [dateRange,        setDateRange]        = useState({ from: null, to: null });

  const [reviewModal, setReviewModal] = useState({
    isOpen: false, transaction: null, reviewTarget: null,
  });

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadData = useCallback(async (showRefreshing = false) => {
    if (!token) return;
    showRefreshing ? setRefreshing(true) : setLoading(true);

    try {
      const params = {};
      if (activeTab    !== 'all') params.role   = activeTab;
      if (statusFilter !== '')    params.status = statusFilter;

      const [txnData, pendingData] = await Promise.all([
        fetchTransactions(token, params),
        fetchPendingReviews(token),
      ]);

      const txns    = Array.isArray(txnData)     ? txnData     : txnData?.results     || [];
      const pending = Array.isArray(pendingData)  ? pendingData : pendingData?.results || [];

      setTransactions(txns);
      setPendingReviewIds(pending.map(t => t.id));
    } catch {
      toast.error('Could not load transactions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, activeTab, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Client-side date filter ────────────────────────────────────────────────
  const filtered = transactions.filter(t => {
    if (!dateRange.from && !dateRange.to) return true;
    const created = t.created_at ? new Date(t.created_at) : null;
    if (!created) return true;
    if (dateRange.from && created < dateRange.from) return false;
    if (dateRange.to   && created > dateRange.to)   return false;
    return true;
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleComplete = (id) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    fetchPendingReviews(token)
      .then(data => {
        const arr = Array.isArray(data) ? data : data?.results || [];
        setPendingReviewIds(arr.map(t => t.id));
      })
      .catch(() => {});
  };

  const handleReviewSubmitted = () => {
    if (reviewModal.transaction) {
      setPendingReviewIds(prev => prev.filter(id => id !== reviewModal.transaction.id));
    }
    setReviewModal({ isOpen: false, transaction: null, reviewTarget: null });
  };

  // ── Stats (react to date filter) ───────────────────────────────────────────
  const stats = {
    total:    filtered.length,
    pending:  filtered.filter(t => t.status === 'pending').length,
    complete: filtered.filter(t => ['completed', 'auto_completed'].includes(t.status)).length,
    reviews:  pendingReviewIds.filter(id => filtered.some(t => t.id === id)).length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster toastOptions={{ style: { borderRadius: '10px', padding: '14px' } }} />
      <DashboardNavbar />

      <div className="pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <BackButton darkMode={darkMode} onClick={() => navigate(-1)} className="mb-6" />

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Purchases &amp; Sales
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
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Total',    value: stats.total,    color: 'text-cyan-600'    },
                { label: 'Pending',  value: stats.pending,  color: 'text-amber-500'   },
                { label: 'Complete', value: stats.complete, color: 'text-emerald-600' },
                { label: 'Reviews',  value: stats.reviews,  color: 'text-purple-600', badge: stats.reviews > 0 },
              ].map(s => (
                <div key={s.label} className={`rounded-xl p-3 text-center ${
                  darkMode ? 'bg-gray-800' : 'bg-white border border-gray-100 shadow-sm'
                }`}>
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

          {/* ── Financial summary ── */}
          {!loading && filtered.length > 0 && (
            <FinancialSummary
              transactions={filtered}
              currentUserId={user?.id}
              darkMode={darkMode}
            />
          )}

          {/* ── Date filter ── */}
          <DateRangeFilter darkMode={darkMode} onRangeChange={setDateRange} />
          <ReportGenerator
      transactions={filtered}   // your already-filtered array
      currentUserId={user?.id}              // from AuthContext
      dateRange={dateRange}                 // { from, to } — for the report title
    />
 


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

          {/* ── Tabs + status filter ── */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className={`flex rounded-xl p-1 gap-1 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-sm'
                      : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-300'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* ── List ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={28} className="animate-spin text-emerald-500" />
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Loading your transactions...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState tab={activeTab} darkMode={darkMode} onBrowse={() => navigate('/dashboard')} />
          ) : (
            <div className="space-y-3">
              {filtered.map(transaction => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  currentUserId={user?.id}
                  darkMode={darkMode}
                  token={token}
                  onComplete={handleComplete}
                  onReview={(txn, target) =>
                    setReviewModal({ isOpen: true, transaction: txn, reviewTarget: target })
                  }
                  pendingReviewIds={pendingReviewIds}
                />
              ))}
            </div>
          )}

        </div>
      </div>

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