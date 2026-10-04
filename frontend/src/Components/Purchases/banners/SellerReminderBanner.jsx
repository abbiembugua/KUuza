import { Bell } from 'lucide-react';

export default function SellerReminderBanner({ darkMode }) {
  return (
    <div className={`mt-3 rounded-xl border p-3 flex items-start gap-2.5 ${
      darkMode ? 'bg-amber-950/25 border-amber-800/40' : 'bg-amber-50 border-amber-200'
    }`}>
      <Bell size={13} className={`mt-0.5 flex-shrink-0 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
      <div>
        <p className={`text-xs font-semibold ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
          Reminder: mark as delivered once you've handed over the item
        </p>
        <p className={`text-xs mt-0.5 ${darkMode ? 'text-amber-500/70' : 'text-amber-600'}`}>
          The buyer can also mark it as received at any time to complete the transaction.
        </p>
      </div>
    </div>
  );
}