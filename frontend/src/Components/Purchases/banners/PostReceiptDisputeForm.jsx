import { useState } from 'react';
import { AlertCircle, Flag, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { disputeTransaction } from '../../../api/transactionapi';

export default function PostReceiptDisputeForm({ transaction, darkMode, token, onTransactionUpdate }) {
  const [showForm,    setShowForm]    = useState(false);
  const [reason,      setReason]      = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      const updated = await disputeTransaction(transaction.id, token, reason.trim());
      toast.success('Dispute raised. The seller has been notified.');
      onTransactionUpdate(updated);
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className={`mt-3 rounded-xl border p-3.5 ${
      darkMode ? 'bg-amber-950/25 border-amber-800/40' : 'bg-amber-50 border-amber-200'
    }`}>
      <div className="flex items-start gap-2.5">
        <AlertCircle size={14} className={`mt-0.5 flex-shrink-0 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
            Something wrong with what you received?
          </p>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-amber-400/70' : 'text-amber-600'}`}>
            You can raise a dispute within 24 hours of confirming receipt — for example if the item is defective or not as described.
          </p>

          {!showForm ? (
            <button
              className={`mt-2.5 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                darkMode
                  ? 'bg-amber-900/40 hover:bg-amber-900/60 text-amber-300'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
              }`}
              onClick={() => setShowForm(true)}
            >
              <Flag size={11} /> Report an issue
            </button>
          ) : (
            <div className="mt-2.5 space-y-2">
              <textarea
                autoFocus
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Describe the issue — e.g. item is damaged, not as described…"
                rows={3}
                maxLength={500}
                className={`w-full px-3 py-2 rounded-xl border text-xs resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  darkMode
                    ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-600'
                    : 'bg-white border-stone-200 text-stone-800 placeholder-stone-400'
                }`}
              />
              <div className="flex gap-2">
                <button
                  disabled={submitting || !reason.trim()}
                  onClick={handleSubmit}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-stone-800 hover:bg-stone-700 text-white'
                  }`}
                >
                  {submitting ? <Loader2 size={11} className="animate-spin" /> : <Flag size={11} />}
                  {submitting ? 'Raising…' : 'Submit dispute'}
                </button>
                <button
                  onClick={() => { setShowForm(false); setReason(''); }}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    darkMode ? 'text-gray-400 hover:bg-gray-800' : 'text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}