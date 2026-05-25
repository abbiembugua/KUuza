import { useState } from 'react';
import { Package, CheckCircle, Loader2, Phone, Flag, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { confirmReceipt, disputeTransaction } from '../../../api/transactionapi';

export default function ReceiptConfirmBanner({ transaction, darkMode, token, onConfirmed, onDisputed }) {
  const [confirming,     setConfirming]     = useState(false);
  const [showSheet,      setShowSheet]      = useState(false);
  const [disputing,      setDisputing]      = useState(false);
  const [disputeReason,  setDisputeReason]  = useState('');

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const updated = await confirmReceipt(transaction.id, token);
      toast.success('Marked as received — transaction complete!');
      onConfirmed(updated);
    } catch (err) { toast.error(err.message); }
    finally { setConfirming(false); }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) return;
    setDisputing(true);
    try {
      const updated = await disputeTransaction(transaction.id, token, disputeReason.trim());
      toast.success('Dispute raised. The seller has been notified.');
      onDisputed(updated);
      setShowSheet(false);
      setDisputeReason('');
    } catch (err) { toast.error(err.message); }
    finally { setDisputing(false); }
  };

  return (
    <>
      <div className={`mt-3 rounded-xl border p-3.5 ${
        darkMode ? 'bg-amber-950/30 border-amber-800/40' : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-start gap-2.5">
          <Package size={14} className={`mt-0.5 flex-shrink-0 ${darkMode ? 'text-violet-400' : 'text-violet-600'}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-semibold ${darkMode ? 'text-violet-300' : 'text-violet-800'}`}>
              {transaction.seller_confirmed
                ? `${transaction.seller_name} marked this as delivered`
                : 'Have you received this item?'}
            </p>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-violet-400/70' : 'text-violet-600'}`}>
              {transaction.seller_confirmed
                ? 'Confirm receipt to complete the transaction and unlock your review.'
                : 'Mark it as received to complete the transaction. You can also raise a dispute if something went wrong.'}
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {confirming ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                {confirming ? 'Confirming…' : 'Mark as Received'}
              </button>
              <button
                onClick={() => setShowSheet(true)}
                className={`text-xs underline underline-offset-2 transition-colors ${
                  darkMode ? 'text-violet-500 hover:text-violet-300' : 'text-violet-500 hover:text-violet-700'
                }`}
              >
                Didn't get it?
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSheet && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !disputing && setShowSheet(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-6">
            <div className={`w-full max-w-md mx-auto rounded-2xl p-5 shadow-2xl ${
              darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-stone-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                  What's going on?
                </p>
                <button
                  onClick={() => setShowSheet(false)}
                  disabled={disputing}
                  className={`p-1 rounded-lg ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-stone-100 text-stone-500'}`}
                >
                  <X size={15} />
                </button>
              </div>

              <div className="space-y-2.5">
                <div className={`flex items-center gap-3 w-full rounded-xl p-3.5 ${darkMode ? 'bg-gray-800' : 'bg-stone-50'}`}>
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

                <div>
                  <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-gray-300' : 'text-stone-700'}`}>
                    Describe the issue <span className={darkMode ? 'text-gray-400' : 'text-stone-400'}>*</span>
                  </label>
                  <textarea
                    value={disputeReason}
                    onChange={e => setDisputeReason(e.target.value)}
                    placeholder="e.g. Item was not received, item is damaged, not as described…"
                    rows={3}
                    maxLength={500}
                    className={`w-full px-3 py-2 rounded-xl border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-600'
                        : 'bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400'
                    }`}
                  />
                  <p className={`text-xs mt-0.5 text-right ${darkMode ? 'text-gray-600' : 'text-stone-400'}`}>
                    {disputeReason.length}/500
                  </p>
                </div>

                <button
                  onClick={handleDispute}
                  disabled={disputing || !disputeReason.trim()}
                  className={`flex items-center gap-3 w-full rounded-xl p-3.5 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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