import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, TrendingUp, Star, Loader2, RefreshCw, ChevronDown, Wallet, Pencil, Trash2, MessageSquare, Search, X } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import BackButton from '../Components/shared/BackButton';
import ReviewModal from '../Components/Reviewmodal';
import EditReviewModal from '../Components/EditReviewModal';
import { useTheme } from '../context/Themecontext';
import { useAuth } from '../context/AuthContext';
import DateRangeFilter from '../Components/Purchases/Daterangefilter';
import FinancialSummary from '../Components/Purchases/FinancialSummary';
import TransactionCard from '../Components/Purchases/Transactioncard';
import ReportGenerator from '../Components/Purchases/Reportgenerator';
import { getMyGivenReviews, deleteReview } from '../api/reviewsapi';

const API_BASE = 'http://127.0.0.1:8000/api';

async function fetchTransactions(token, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/transactions/${query ? `?${query}` : ''}`, {
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

function EmptyState({ tab, darkMode, onBrowse }) {
  const messages = {
    all: { icon: ShoppingBag, title: 'No transactions yet', sub: 'Your purchases and sales will appear here.' },
    buyer: { icon: ShoppingBag, title: 'No purchases yet', sub: 'Browse listings and make your first purchase.' },
    seller: { icon: TrendingUp, title: 'No sales yet', sub: 'Create a listing to start selling.' },
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
        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Browse Listings
      </button>
    </div>
  );
}

const TABS = [
  { key: 'all',     label: 'All'        },
  { key: 'buyer',   label: 'Purchases'  },
  { key: 'seller',  label: 'Sales'      },
  { key: 'reviews', label: 'My Reviews' },
];

// ── cancelled added here ──────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: '',               label: 'All statuses'   },
  { value: 'pending',        label: 'Pending'        },
  { value: 'completed',      label: 'Completed'      },
  { value: 'auto_completed', label: 'Auto-completed' },
  { value: 'cancelled',      label: 'Cancelled'      },
];

const PurchasesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { darkMode } = useTheme();
  const { token, user } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [pendingReviewIds, setPendingReviewIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab,    setActiveTab]    = useState(searchParams.get('tab') || 'all');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [dateRange,    setDateRange]    = useState({ from: null, to: null });
  const [showInsights, setShowInsights] = useState(false);

  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    transaction: null,
    reviewTarget: null,
  });

  const [myReviews,         setMyReviews]         = useState([]);
  const [reviewsLoading,    setReviewsLoading]    = useState(false);
  const [editReview,        setEditReview]        = useState(null);
  const [confirmDeleteId,   setConfirmDeleteId]   = useState(null);
  const [deletingId,        setDeletingId]        = useState(null);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (!token) return;
    showRefreshing ? setRefreshing(true) : setLoading(true);

    try {
      const params = {};
      if (activeTab !== 'all') params.role = activeTab;
      if (statusFilter !== '') params.status = statusFilter;

      const [txnData, pendingData] = await Promise.all([
        fetchTransactions(token, params),
        fetchPendingReviews(token),
      ]);

      const txns = Array.isArray(txnData) ? txnData : txnData?.results || [];
      const pending = Array.isArray(pendingData) ? pendingData : pendingData?.results || [];

      setTransactions(txns);
      setPendingReviewIds(pending.map((item) => item.id));
    } catch {
      toast.error('Could not load transactions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, activeTab, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'all') {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    if (activeTab !== 'reviews' || !token) return;
    setReviewsLoading(true);
    getMyGivenReviews()
      .then(data => setMyReviews(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Could not load your reviews.'))
      .finally(() => setReviewsLoading(false));
  }, [activeTab, token]);

  const filtered = transactions.filter((transaction) => {
    // Date range filter
    if (dateRange.from || dateRange.to) {
      const created = transaction.created_at ? new Date(transaction.created_at) : null;
      if (created) {
        if (dateRange.from && created < dateRange.from) return false;
        if (dateRange.to   && created > dateRange.to)   return false;
      }
    }
    // Search filter — matches listing title or counterparty name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const title = (transaction.listing_title || '').toLowerCase();
      const buyer = (transaction.buyer_name    || '').toLowerCase();
      const seller= (transaction.seller_name   || '').toLowerCase();
      if (!title.includes(q) && !buyer.includes(q) && !seller.includes(q)) return false;
    }
    return true;
  });

  const handleComplete = (id) => {
    setTransactions((prev) => prev.map((transaction) => (
      transaction.id === id ? { ...transaction, status: 'completed' } : transaction
    )));

    fetchPendingReviews(token)
      .then((data) => {
        const arr = Array.isArray(data) ? data : data?.results || [];
        setPendingReviewIds(arr.map((item) => item.id));
      })
      .catch(() => {});
  };

  // ── optimistically flip status to cancelled in local state ────────────────
  const handleCancel = (id) => {
    setTransactions((prev) => prev.map((transaction) => (
      transaction.id === id ? { ...transaction, status: 'cancelled' } : transaction
    )));
  };

  const handleReviewSubmitted = () => {
    if (reviewModal.transaction) {
      setPendingReviewIds((prev) => prev.filter((id) => id !== reviewModal.transaction.id));
    }
    setReviewModal({ isOpen: false, transaction: null, reviewTarget: null });
  };

  const handleReviewSaved = (updated) => {
    setMyReviews(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleDeleteReview = async (id) => {
    setDeletingId(id);
    try {
      await deleteReview(id);
      setMyReviews(prev => prev.filter(r => r.id !== id));
      toast.success('Review deleted.');
    } catch {
      toast.error('Could not delete review.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster toastOptions={{ style: { borderRadius: '10px', padding: '14px' } }} />
      <DashboardNavbar />

      <div className="pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <BackButton darkMode={darkMode} onClick={() => navigate(-1)} className="mb-6" />

          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Purchases &amp; Sales
              </h1>
              <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Your marketplace activity, without the clutter
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className={`p-2 rounded-xl transition-colors ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-white hover:bg-gray-100 text-gray-500 border border-gray-200'
                }`}
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

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

          <div className={`rounded-2xl p-4 mb-5 ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
          }`}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className={`flex rounded-xl p-1 gap-1 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  {TABS.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === tab.key
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {activeTab === 'reviews' ? myReviews.length : filtered.length} shown
                  </p>
                  {activeTab !== 'reviews' && (
                    <ReportGenerator
                      transactions={filtered}
                      currentUserId={user?.id}
                      dateRange={dateRange}
                      activeTab={activeTab}
                      downloaderName={user?.full_name}
                      statusFilter={statusFilter}
                    />
                  )}
                </div>
              </div>

              {activeTab !== 'reviews' && (
                <div className="flex flex-col gap-3">
                  {/* Search */}
                  <div className="relative">
                    <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by item or person…"
                      className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        darkMode
                          ? 'bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-600'
                          : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400'
                      }`}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Date + Status */}
                  <div className="flex flex-col md:flex-row gap-3 md:items-start">
                    <div className="md:flex-1">
                      <DateRangeFilter darkMode={darkMode} onRangeChange={setDateRange} />
                    </div>

                    <div className="md:w-56">
                      <label className={`block text-xs uppercase tracking-[0.18em] mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`w-full px-3 py-2.5 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          darkMode
                            ? 'bg-gray-900 border-gray-700 text-gray-300'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab !== 'reviews' && !loading && filtered.length > 0 && (
                <button
                  onClick={() => setShowInsights((prev) => !prev)}
                  className={`w-full flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-all ${
                    darkMode
                      ? 'bg-gray-900 border border-gray-700 hover:border-emerald-700 hover:bg-gray-950'
                      : 'bg-gray-50 border border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white text-emerald-600 border border-emerald-100'
                    }`}>
                      <Wallet size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Money summary
                      </p>
                      <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        View how much you&apos;ve earned from sales and spent on purchases.
                      </p>
                    </div>
                  </div>
                  <ChevronDown size={18} className={`shrink-0 transition-transform ${showInsights ? 'rotate-180' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              )}
            </div>
          </div>

          {activeTab !== 'reviews' && !loading && filtered.length > 0 && showInsights && (
            <div className={`rounded-2xl p-4 mb-5 ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
            }`}>
              <div className="mb-3">
                <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Money summary
                </p>
                <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  A quick view of what you&apos;ve earned from completed sales and spent on completed purchases.
                </p>
              </div>
              <FinancialSummary
                transactions={filtered}
                currentUserId={user?.id}
                darkMode={darkMode}
              />
            </div>
          )}

          {activeTab === 'reviews' ? (
            reviewsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={28} className="animate-spin text-emerald-500" />
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading your reviews...
                </p>
              </div>
            ) : myReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <MessageSquare size={28} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                </div>
                <p className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  No reviews yet
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Reviews you leave after completed transactions will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myReviews.map(review => {
                  const revieweeName =
                    review.reviewee_name ||
                    review.reviewee_full_name ||
                    review.reviewee?.full_name ||
                    'KU Student';
                  const isConfirming = confirmDeleteId === review.id;
                  const isDeleting   = deletingId === review.id;

                  return (
                    <div
                      key={review.id}
                      className={`rounded-2xl p-4 border ${
                        darkMode
                          ? 'bg-gray-800 border-gray-700'
                          : 'bg-white border-gray-100 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {revieweeName.charAt(0).toUpperCase()}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                              {revieweeName}
                            </p>
                            <div className="flex gap-1">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < review.score
                                    ? 'fill-amber-400 text-amber-400'
                                    : darkMode ? 'text-gray-600' : 'text-gray-300'
                                  }
                                />
                              ))}
                            </div>
                          </div>

                          {review.listing_title && (
                            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              Re: {review.listing_title}
                            </p>
                          )}

                          {review.comment ? (
                            <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              &ldquo;{review.comment}&rdquo;
                            </p>
                          ) : (
                            <p className={`text-xs mt-2 italic ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                              No comment left.
                            </p>
                          )}

                          {review.created_at && (
                            <p className={`text-xs mt-2 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                              {new Date(review.created_at).toLocaleDateString('en-KE', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </p>
                          )}

                          {/* Actions */}
                          {isConfirming ? (
                            <div className={`mt-3 flex items-center gap-2 p-3 rounded-xl border ${
                              darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                            }`}>
                              <p className={`text-xs flex-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                                Delete this review? This cannot be undone.
                              </p>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                  darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteReview(review.id)}
                                disabled={isDeleting}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 flex items-center gap-1"
                              >
                                {isDeleting && <Loader2 size={12} className="animate-spin" />}
                                Delete
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => setEditReview(review)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                  darkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                              >
                                <Pencil size={12} />
                                Edit
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(review.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                  darkMode
                                    ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                }`}
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : loading ? (
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
              {filtered.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  currentUserId={user?.id}
                  darkMode={darkMode}
                  token={token}
                  downloaderName={user?.full_name}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  onReview={(txn, target) => setReviewModal({ isOpen: true, transaction: txn, reviewTarget: target })}
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

      {editReview && (
        <EditReviewModal
          review={editReview}
          onClose={() => setEditReview(null)}
          onSaved={handleReviewSaved}
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default PurchasesPage;