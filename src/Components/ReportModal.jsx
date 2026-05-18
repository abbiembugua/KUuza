import { useState, useEffect, useRef } from 'react';
import { X, Flag, Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { submitReport, submitSellerReport } from '../api/reportsapi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';

const LISTING_REASONS = [
  { value: 'fake_misleading',       label: 'Fake or misleading listing' },
  { value: 'prohibited_item',       label: 'Prohibited item' },
  { value: 'suspected_scam',        label: 'Suspected scam' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'other',                 label: 'Other' },
];

const SELLER_REASONS = [
  { value: 'suspected_scam',        label: 'Suspected scam or fraud' },
  { value: 'fake_misleading',       label: 'Fake profile or false credentials' },
  { value: 'inappropriate_content', label: 'Harassment or inappropriate communication' },
  { value: 'prohibited_item',       label: 'Selling prohibited items' },
  { value: 'other',                 label: 'Other' },
];

/**
 * ReportModal — inline modal for reporting a listing or a seller.
 *
 * Props:
 *   listingId   string   UUID of the listing (listing-report mode)
 *   sellerId    string   UUID of the seller  (seller-report mode)
 *   sellerName  string   Display name shown in the modal title
 *   isOpen      bool
 *   onClose     fn
 */
const ReportModal = ({ listingId, sellerId, sellerName, isOpen, onClose }) => {
  const isSeller = Boolean(sellerId && !listingId);
  const { darkMode } = useTheme();
  const { user } = useAuth();

  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setDetails('');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please log in to submit a report.');
      return;
    }
    if (!reason) {
      toast.error('Please select a reason.');
      return;
    }

    setLoading(true);
    try {
      if (isSeller) {
        await submitSellerReport({ sellerId, reason, details });
      } else {
        await submitReport({ listingId, reason, details });
      }
      toast.success("Report submitted. We'll review this shortly.", { duration: 4000 });
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border ${
          darkMode
            ? 'bg-gray-900 border-gray-800 text-gray-100'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-emerald-500" />
            <h2 id="report-modal-title" className="font-semibold text-base">
              {isSeller ? `Report ${sellerName || 'Seller'}` : 'Report Listing'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {/* Reason */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Reason <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className={`w-full appearance-none px-4 py-3 pr-9 rounded-xl border text-sm focus:outline-none transition ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
              >
                <option value="" disabled>Select a reason…</option>
                {(isSeller ? SELLER_REASONS : LISTING_REASONS).map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <ChevronDown size={15} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            </div>
          </div>

          {/* Details */}
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Details <span className={`font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>(optional)</span>
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Anything else we should know…"
              className={`w-full px-4 py-3 rounded-xl border text-sm resize-none focus:outline-none transition ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
          </div>

          {!user && (
            <p className={`text-xs ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              You need to be logged in to submit a report.
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !user}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all duration-200 ${
              loading || !user ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Flag size={15} />
                Submit Report
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
