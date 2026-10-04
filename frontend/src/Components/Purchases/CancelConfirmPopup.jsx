import { AlertCircle, Loader2, X } from 'lucide-react';

export default function CancelConfirmPopup({ darkMode, onConfirm, onDismiss, loading }) {
  return (
    <div className={`mt-3 rounded-xl border p-3 flex items-start gap-3 ${
      darkMode ? 'bg-red-950/30 border-red-900/50' : 'bg-red-50 border-red-200'
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