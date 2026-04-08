import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * FinancialSummary
 *
 * Shows total earned (as seller) and total spent (as buyer)
 * across completed/auto_completed transactions.
 *
 * Props:
 *   transactions   {Array}   — filtered transaction list
 *   currentUserId  {string}  — logged-in user's id
 *   darkMode       {boolean}
 */
export default function FinancialSummary({ transactions, currentUserId, darkMode }) {
  const completed = transactions.filter(t =>
    ['completed', 'auto_completed'].includes(t.status)
  );

  const totalEarned = completed
    .filter(t => t.seller === currentUserId && t.agreed_price)
    .reduce((sum, t) => sum + parseFloat(t.agreed_price || 0), 0);

  const totalSpent = completed
    .filter(t => t.buyer === currentUserId && t.agreed_price)
    .reduce((sum, t) => sum + parseFloat(t.agreed_price || 0), 0);

  if (totalEarned === 0 && totalSpent === 0) return null;

  const fmt = (n) =>
    `KSh ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const card = `rounded-2xl p-4 relative overflow-hidden ${
    darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 shadow-sm'
  }`;

  return (
    <div className="grid grid-cols-2 gap-3 mb-5">

      {/* ── Earned ── */}
      {totalEarned > 0 && (
        <div className={card}>
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 blur-lg" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center">
              <TrendingUp size={13} className="text-white" />
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Total Earned
            </span>
          </div>
          <p className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
            {fmt(totalEarned)}
          </p>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            from completed sales
          </p>
        </div>
      )}

      {/* ── Spent ── */}
      {totalSpent > 0 && (
        <div className={card}>
          <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 blur-lg" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <TrendingDown size={13} className="text-white" />
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Total Spent
            </span>
          </div>
          <p className="text-lg font-bold text-amber-600">
            {fmt(totalSpent)}
          </p>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            on completed purchases
          </p>
        </div>
      )}

    </div>
  );
}