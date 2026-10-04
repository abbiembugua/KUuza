import React, { useState } from 'react';
import { CalendarRange, SlidersHorizontal, X } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

const QUICK_RANGES = [
  { label: 'Today',      key: 'today' },
  { label: 'This Week',  key: 'week'  },
  { label: 'This Month', key: 'month' },
  { label: 'All Time',   key: 'all'   },
];

function getQuickRange(key) {
  const now   = new Date();
  const today = startOfDay(now);

  switch (key) {
    case 'today':
      return { from: today, to: endOfDay(now) };

    case 'week': {
      const mon = new Date(today);
      mon.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      return { from: mon, to: endOfDay(now) };
    }

    case 'month': {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: first, to: endOfDay(now) };
    }

    default:
      return { from: null, to: null };
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * DateRangeFilter
 *
 * Props:
 *   darkMode     {boolean}
 *   onRangeChange  ({ from: Date|null, to: Date|null }) => void
 */
export default function DateRangeFilter({ darkMode, onRangeChange }) {
  const [activeQuick, setActiveQuick] = useState('all');
  const [customFrom,  setCustomFrom]  = useState('');
  const [customTo,    setCustomTo]    = useState('');
  const [showCustom,  setShowCustom]  = useState(false);

  const handleQuick = (key) => {
    setActiveQuick(key);
    setShowCustom(false);
    setCustomFrom('');
    setCustomTo('');
    onRangeChange(getQuickRange(key));
  };

  const handleCustomApply = () => {
    if (!customFrom && !customTo) return;
    onRangeChange({
      from: customFrom ? startOfDay(new Date(customFrom)) : null,
      to:   customTo   ? endOfDay(new Date(customTo))     : null,
    });
    setActiveQuick('custom');
  };

  const handleCustomClear = () => {
    setCustomFrom('');
    setCustomTo('');
    setActiveQuick('all');
    setShowCustom(false);
    onRangeChange({ from: null, to: null });
  };

  const pillBase = (active) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
      active
        ? 'bg-emerald-600 text-white shadow-sm'
        : darkMode
          ? 'bg-gray-700 text-gray-400 hover:text-gray-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  const inputClass = `px-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
    darkMode
      ? 'bg-gray-700 border-gray-600 text-gray-300'
      : 'bg-gray-50 border-gray-200 text-gray-700'
  }`;

  return (
    <div className={`rounded-2xl p-4 mb-5 ${
      darkMode
        ? 'bg-gray-800 border border-gray-700'
        : 'bg-white border border-gray-100 shadow-sm'
    }`}>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <CalendarRange size={13} className="text-white" />
          </div>
          <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Filter by Date
          </span>
        </div>

        {activeQuick === 'custom' && (
          <button
            onClick={handleCustomClear}
            className={`text-xs flex items-center gap-1 ${
              darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>

      {/* Quick-select pills */}
      <div className="flex gap-2 flex-wrap mb-3">
        {QUICK_RANGES.map(r => (
          <button key={r.key} onClick={() => handleQuick(r.key)} className={pillBase(activeQuick === r.key)}>
            {r.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(s => !s)}
          className={pillBase(showCustom || activeQuick === 'custom')}
        >
          <span className="flex items-center gap-1">
            <SlidersHorizontal size={11} /> Custom
          </span>
        </button>
      </div>

      {/* Custom date inputs */}
      {showCustom && (
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex flex-col gap-1">
            <label className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>From</label>
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>To</label>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              className={inputClass}
            />
          </div>
          <button
            onClick={handleCustomApply}
            disabled={!customFrom && !customTo}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}