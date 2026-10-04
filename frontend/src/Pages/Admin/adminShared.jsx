import { useState } from 'react';
import { ChevronDown, Loader2, CheckCircle, Search, FileText, X } from 'lucide-react';

export const Pill = ({ label, color }) => {
  const map = {
    green:  'bg-emerald-100 text-emerald-700',
    red:    'bg-red-100    text-red-600',
    amber:  'bg-amber-100  text-amber-700',
    gray:   'bg-gray-100   text-gray-500',
    violet: 'bg-violet-100 text-violet-700',
    sky:    'bg-sky-100    text-sky-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[color] ?? map.gray}`}>
      {label}
    </span>
  );
};

export const ConfirmButton = ({ onConfirm, label, icon: Icon, variant = 'danger', loading }) => {
  const [armed, setArmed] = useState(false);
  const styles = {
    danger:  'bg-red-50   text-red-600   hover:bg-red-100   border border-red-200',
    warning: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
  };
  if (armed) return (
    <div className="flex items-center gap-2">
      <button onClick={() => { setArmed(false); onConfirm(); }} disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
        Confirm
      </button>
      <button onClick={() => setArmed(false)}
        className="text-xs px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition">
        Cancel
      </button>
    </div>
  );
  return (
    <button onClick={() => setArmed(true)} disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition ${styles[variant]}`}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : Icon && <Icon size={13} />}
      {label}
    </button>
  );
};

export const Empty = ({ label, darkMode }) => (
  <div className={`py-16 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
    <CheckCircle size={36} className="mx-auto mb-3 opacity-40" />
    <p className="text-sm">{label}</p>
  </div>
);

export const Toolbar = ({ darkMode, placeholder, search, onSearch, selects = [], onPDF, pdfLoading, count }) => {
  const base = `py-2 rounded-xl border text-sm focus:outline-none transition ${
    darkMode
      ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-emerald-500'
      : 'bg-white border-gray-300 text-gray-800 focus:border-emerald-500'
  }`;
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative">
        <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        <input type="text" placeholder={placeholder} value={search} onChange={(e) => onSearch(e.target.value)}
          className={`${base} pl-9 pr-8 w-64`} />
        {search && (
          <button onClick={() => onSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X size={13} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
          </button>
        )}
      </div>

      {selects.map((s) => (
        <div key={s.id} className="relative">
          <select value={s.value} onChange={(e) => s.onChange(e.target.value)}
            className={`${base} pl-3 pr-7 appearance-none`}>
            {s.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
      ))}

      <span className={`text-xs ml-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {count} result{count !== 1 ? 's' : ''}
      </span>

      {onPDF && (
        <button onClick={onPDF} disabled={pdfLoading || count === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition">
          {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          PDF
        </button>
      )}
    </div>
  );
};
