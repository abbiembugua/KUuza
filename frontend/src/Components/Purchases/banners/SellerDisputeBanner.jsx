import { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { submitSellerResponse } from '../../../api/transactionapi';

export default function SellerDisputeBanner({ transaction, darkMode, token, onTransactionUpdate }) {
  const escalated      = transaction.dispute_escalated;
  const deadline       = transaction.dispute_deadline ? new Date(transaction.dispute_deadline) : null;
  const deadlineStr    = deadline?.toLocaleString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
  });

  const [responseText, setResponseText] = useState(transaction.seller_response || '');
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(!!transaction.seller_response);

  const handleSubmit = async () => {
    if (!responseText.trim()) return;
    setSubmitting(true);
    try {
      const updated = await submitSellerResponse(transaction.id, token, responseText.trim());
      setSubmitted(true);
      onTransactionUpdate(updated);
    } catch (e) { toast.error(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className={`mt-3 rounded-xl border p-3.5 space-y-3 ${
      escalated
        ? darkMode ? 'bg-red-950/50 border-red-800' : 'bg-red-100 border-red-300'
        : darkMode ? 'bg-red-950/30 border-red-900/40' : 'bg-red-50 border-red-200'
    }`}>
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <Flag size={14} className={`mt-0.5 flex-shrink-0 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
            {escalated ? 'Dispute escalated — admin review underway' : `${transaction.buyer_name} raised a dispute`}
          </p>
          {deadlineStr && !escalated && (
            <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
              Resolve by {deadlineStr} or this escalates to admin.
            </p>
          )}
          {escalated && (
            <p className={`text-xs mt-1 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
              The 48-hour window has passed. KUuza admin is now reviewing this dispute.
            </p>
          )}
        </div>
      </div>

      {/* Buyer's claim */}
      {transaction.buyer_reason && (
        <div className={`rounded-lg p-2.5 text-xs ${
          darkMode ? 'bg-gray-900/60 border border-gray-800' : 'bg-white border border-red-100'
        }`}>
          <p className={`font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>BUYER'S CLAIM</p>
          <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {transaction.buyer_reason}
          </p>
        </div>
      )}

      {/* Seller response */}
      <div>
        <p className={`text-xs font-semibold mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          YOUR RESPONSE {submitted ? '(submitted)' : '(required)'}
        </p>
        {submitted ? (
          <div className={`rounded-lg p-2.5 text-xs ${
            darkMode ? 'bg-gray-900/60 border border-gray-800' : 'bg-white border border-gray-200'
          }`}>
            <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{responseText}</p>
          </div>
        ) : (
          <>
            <textarea
              rows={3}
              value={responseText}
              onChange={e => setResponseText(e.target.value)}
              maxLength={500}
              placeholder="Explain what happened from your side — did you deliver? Was there a miscommunication? Any context you want on record."
              className={`w-full rounded-lg border px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                darkMode
                  ? 'bg-gray-900 border-gray-700 text-gray-200 placeholder-gray-600'
                  : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'
              }`}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{responseText.length}/500</p>
              <button
                onClick={handleSubmit}
                disabled={submitting || !responseText.trim()}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? 'Submitting…' : 'Submit response'}
              </button>
            </div>
          </>
        )}
      </div>

      <p className={`text-xs italic ${darkMode ? 'text-red-500/60' : 'text-red-400'}`}>
        {escalated
          ? 'Contact hello.kuuza@gmail.com if you have questions about this review.'
          : 'Your response is recorded and will be read by admin if this escalates.'}
      </p>
    </div>
  );
}