import React, { useState } from 'react';
import {
  Package, Wrench, CheckCircle, Clock,
  Star, ChevronDown, ChevronUp, Loader2,
  Download, X, ExternalLink,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { generateReceipt } from '../Checkout/generateReceipt';
import Avatar from '../shared/Avatar';

import { markComplete, cancelTransaction, fetchContactDetails } from '../../api/transactionapi';
import { STATUS_CONFIG, PAYMENT_LABELS, getTransactionQuantity, formatShortDate } from './transactionConfig';

import CancelConfirmPopup         from './CancelConfirmPopup';
import TransactionExpandedDetails from './TransactionExpandedDetails';
import ReceiptConfirmBanner       from './banners/ReceiptConfirmBanner';
import DisputedBanner             from './banners/DisputedBanner';
import SellerDisputeBanner        from './banners/SellerDisputeBanner';
import PostReceiptDisputeForm     from './banners/PostReceiptDisputeForm';
import SellerReminderBanner       from './banners/SellerReminderBanner';

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
  highlighted = false,
}) {
  const navigate = useNavigate();
  const cardRef  = React.useRef(null);

  const [expanded,           setExpanded]           = useState(highlighted);
  const [completing,         setCompleting]         = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [showCancelPrompt,   setShowCancelPrompt]   = useState(false);
  const [cancelling,         setCancelling]         = useState(false);

  React.useEffect(() => {
    if (!highlighted || !cardRef.current) return;
    cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlighted]);

  // ── Derived state ────────────────────────────────────────────────────────────

  const isBuyer  = transaction.buyer  === currentUserId;
  const isSeller = transaction.seller === currentUserId;
  const role     = isBuyer ? 'Purchased' : 'Sold';

  const isService         = transaction.listing_type === 'service';
  const statusConf        = STATUS_CONFIG[transaction.status] || STATUS_CONFIG.pending;
  const StatusIcon        = statusConf.icon;
  const transactionQuantity = getTransactionQuantity(transaction);

  const isComplete      = ['completed', 'auto_completed'].includes(transaction.status);
  const canComplete     = isSeller && transaction.status === 'pending' && !transaction.seller_confirmed;
  const canCancel       = transaction.status === 'pending' && !transaction.is_disputed && !transaction.mpesa_paid;
  const needsReview     = isComplete && !transaction.is_disputed && pendingReviewIds.includes(transaction.id);

  const deliveryDatePassed    = transaction.scheduled_date ? new Date(transaction.scheduled_date) < new Date() : false;
  const awaitingReceipt       = isBuyer && transaction.status === 'pending' && !transaction.is_disputed && (transaction.seller_confirmed || deliveryDatePassed);
  const withinDisputeWindow   = isComplete && transaction.completed_at && (Date.now() - new Date(transaction.completed_at).getTime()) < 24 * 60 * 60 * 1000;
  const canDisputeAfterReceipt = isBuyer && withinDisputeWindow && !transaction.is_disputed;
  const isBuyerDisputed       = isBuyer  && transaction.is_disputed;
  const sellerHasDispute      = isSeller && transaction.is_disputed;
  const sellerNeedsReminder   = isSeller && transaction.status === 'pending' && !transaction.seller_confirmed && !transaction.is_disputed && deliveryDatePassed;

  const reviewTarget        = isBuyer ? { id: transaction.seller, full_name: transaction.seller_name } : { id: transaction.buyer, full_name: transaction.buyer_name };
  const counterpartyName    = isBuyer ? transaction.seller_name            : transaction.buyer_name;
  const counterpartyRole    = isBuyer ? 'Seller'                           : 'Buyer';
  const counterpartyId      = isBuyer ? transaction.seller                 : transaction.buyer;
  const counterpartyPicture = isBuyer ? transaction.seller_profile_picture : transaction.buyer_profile_picture;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await markComplete(transaction.id, token);
      toast.success('Marked as delivered. Waiting for buyer confirmation.');
      onComplete(transaction.id);
    } catch (err) { toast.error(err.message); }
    finally { setCompleting(false); }
  };

  const handleCancelConfirm = async () => {
    setCancelling(true);
    try {
      await cancelTransaction(transaction.id, token);
      toast.success('Transaction cancelled.');
      setShowCancelPrompt(false);
      onCancel(transaction.id);
    } catch (err) { toast.error(err.message); }
    finally { setCancelling(false); }
  };

  const handleDownloadReceipt = async () => {
    setDownloadingReceipt(true);
    try {
      let contact = null;
      if (transaction.listing && token) {
        contact = await fetchContactDetails(transaction.listing, token).catch(() => null);
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
        transaction: { ...transaction, downloaded_by_name: downloaderName, quantity: transactionQuantity },
        scheduledDate: transaction.scheduled_date,
        scheduledTime: transaction.scheduled_time,
        paymentMethod: transaction.payment_method,
        contact,
      });
      toast.success('Receipt downloaded.');
    } catch { toast.error('Could not download the receipt right now.'); }
    finally { setDownloadingReceipt(false); }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl border-l-4 overflow-hidden transition-all ${statusConf.border} ${
        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
      } ${highlighted ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}`}
    >
      <div className="p-4">

        {/* ── Thumbnail + content ── */}
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
            {transaction.listing_image ? (
              <img src={transaction.listing_image} alt={transaction.listing_title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600/10 to-cyan-600/10">
                {isService ? <Wrench size={20} className="text-emerald-500" /> : <Package size={20} className="text-cyan-500" />}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Badges + status */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isBuyer ? 'bg-cyan-100 text-cyan-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {role}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isService ? 'bg-purple-100 text-purple-600' : darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                  {isService ? 'Service' : 'Good'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {transaction.mpesa_paid && !isComplete && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    <CheckCircle size={10} /> M-Pesa Paid
                  </span>
                )}
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusConf.bg} ${statusConf.color}`}>
                  <StatusIcon size={11} />
                  {statusConf.label}
                </div>
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
                  <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{formatShortDate(transaction.created_at)}</span>
                </div>
              )}
              {transaction.scheduled_date && (
                <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Clock size={10} className="text-emerald-500" />
                  <span>Delivery date:</span>
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatShortDate(transaction.scheduled_date)}</span>
                </div>
              )}
            </div>

            {/* Price */}
            <p className="text-sm font-bold mt-1.5 bg-emerald-600 bg-clip-text text-transparent">
              {transaction.agreed_price
                ? `KSh ${(parseFloat(transaction.agreed_price) * transactionQuantity).toLocaleString('en-KE')}`
                : 'Negotiable'}
            </p>
          </div>
        </div>

        {/* ── Counterparty strip ── */}
        <button
          type="button"
          onClick={() => counterpartyId && navigate(`/sellers/${counterpartyId}`)}
          className={`mt-3 w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-colors group ${
            darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-emerald-50'
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

        {/* ── Banners ── */}
        {awaitingReceipt        && <ReceiptConfirmBanner   transaction={transaction} darkMode={darkMode} token={token} onConfirmed={onTransactionUpdate} onDisputed={onTransactionUpdate} />}
        {canDisputeAfterReceipt && <PostReceiptDisputeForm transaction={transaction} darkMode={darkMode} token={token} onTransactionUpdate={onTransactionUpdate} />}
        {isBuyerDisputed        && <DisputedBanner         transaction={transaction} darkMode={darkMode} token={token} onResolved={onTransactionUpdate} />}
        {sellerHasDispute       && <SellerDisputeBanner    transaction={transaction} darkMode={darkMode} token={token} onTransactionUpdate={onTransactionUpdate} />}
        {sellerNeedsReminder    && <SellerReminderBanner   darkMode={darkMode} />}

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {canComplete && (
            <button onClick={handleComplete} disabled={completing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-opacity disabled:opacity-50">
              {completing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
              {completing ? 'Marking...' : 'Mark as Complete'}
            </button>
          )}
          {needsReview && (
            <button onClick={() => onReview(transaction, reviewTarget)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors">
              <Star size={13} /> Leave a Review
            </button>
          )}
          {isBuyer && (
            <button onClick={handleDownloadReceipt} disabled={downloadingReceipt}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}>
              {downloadingReceipt ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Receipt
            </button>
          )}
          {canCancel && !showCancelPrompt && (
            <button onClick={() => setShowCancelPrompt(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                darkMode ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300' : 'text-red-500 hover:bg-red-50 hover:text-red-600'
              }`}>
              <X size={12} /> Cancel
            </button>
          )}
          {isComplete && !needsReview && (
            <div className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <CheckCircle size={12} className="text-emerald-500" /> Reviewed
            </div>
          )}
          <button onClick={() => setExpanded(e => !e)}
            className={`ml-auto flex items-center gap-1 text-xs transition-colors ${
              darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {expanded ? 'Less' : 'Details'}
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>

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
        <TransactionExpandedDetails
          transaction={transaction}
          isBuyer={isBuyer}
          transactionQuantity={transactionQuantity}
          token={token}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}