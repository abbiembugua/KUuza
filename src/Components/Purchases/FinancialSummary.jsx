import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function FinancialSummary({ transactions, currentUserId, darkMode }) {
  const completed = transactions.filter((transaction) =>
    ['completed', 'auto_completed'].includes(transaction.status)
  );

  const totalEarned = completed
    .filter((transaction) => transaction.seller === currentUserId && transaction.agreed_price)
    .reduce((sum, transaction) => sum + parseFloat(transaction.agreed_price || 0), 0);

  const totalSpent = completed
    .filter((transaction) => transaction.buyer === currentUserId && transaction.agreed_price)
    .reduce((sum, transaction) => sum + parseFloat(transaction.agreed_price || 0), 0);

  if (totalEarned === 0 && totalSpent === 0) return null;

  const formatAmount = (amount) =>
    `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cardClassName = `relative overflow-hidden rounded-2xl p-4 ${
    darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-gray-50 border border-gray-200'
  }`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {totalEarned > 0 && (
        <div className={cardClassName}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="absolute -top-6 -right-5 h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-500/10 blur-2xl" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 shadow-sm">
                  <TrendingUp size={14} className="text-white" />
                </div>
                <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Money earned
                </span>
              </div>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatAmount(totalEarned)}
              </p>
              <p className={`mt-1 text-sm ${darkMode ? 'text-emerald-300/90' : 'text-emerald-700'}`}>
                From completed sales you&apos;ve closed on KUUza
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
            }`}>
              Incoming
            </span>
          </div>
        </div>
      )}

      {totalSpent > 0 && (
        <div className={cardClassName}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
          <div className="absolute -top-6 -right-5 h-20 w-20 rounded-full bg-gradient-to-br from-amber-400/15 to-orange-500/10 blur-2xl" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm">
                  <TrendingDown size={14} className="text-white" />
                </div>
                <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Money spent
                </span>
              </div>
              <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatAmount(totalSpent)}
              </p>
              <p className={`mt-1 text-sm ${darkMode ? 'text-amber-300/90' : 'text-amber-700'}`}>
                From completed purchases you&apos;ve paid for
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              darkMode ? 'bg-amber-500/10 text-amber-300' : 'bg-amber-100 text-amber-700'
            }`}>
              Outgoing
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
