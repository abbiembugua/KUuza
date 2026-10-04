import { useState } from 'react';
import { Flag, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { resolveDispute } from '../../../api/transactionapi';

export default function DisputedBanner({ transaction, darkMode, token, onResolved }) {
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    setResolving(true);
    try {
      const updated = await resolveDispute(transaction.id, token);
      toast.success('Dispute closed. Glad it worked out!');
      onResolved(updated);
    } catch (err) { toast.error(err.message); }
    finally { setResolving(false); }
  };

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
          {transaction.buyer_reason && (
            <div className={`mt-2 rounded-lg p-2.5 text-xs ${darkMode ? 'bg-gray-900/60 border border-gray-800' : 'bg-white border border-red-100'}`}>
              <p className={`font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>YOUR CLAIM</p>
              <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{transaction.buyer_reason}</p>
            </div>
          )}
          <p className={`text-xs mt-2 ${darkMode ? 'text-red-400/70' : 'text-red-500'}`}>
            {transaction.seller_name} has been notified. Expand this card to get their contact details.
          </p>
          {transaction.dispute_deadline && !transaction.dispute_escalated && (
            <p className={`text-xs mt-1.5 font-medium ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
              Resolution deadline: {new Date(transaction.dispute_deadline).toLocaleString('en-KE', {
                weekday: 'short', day: 'numeric', month: 'short',
                hour: '2-digit', minute: '2-digit', hour12: true,
              })}. If unresolved by then, admin will step in.
            </p>
          )}
          {transaction.dispute_escalated && (
            <p className={`text-xs mt-1.5 font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
              The 48-hour window has passed — this dispute is now with KUuza admin for review.
            </p>
          )}
          <p className={`text-xs mt-2 ${darkMode ? 'text-red-400/60' : 'text-red-400'}`}>
            If the seller has resolved your issue, close the dispute below.
          </p>
          <button
            onClick={handleResolve}
            disabled={resolving}
            className={`mt-2.5 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            {resolving ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} className="text-emerald-500" />}
            {resolving ? 'Closing…' : 'Seller resolved it — close dispute'}
          </button>
        </div>
      </div>
    </div>
  );
}