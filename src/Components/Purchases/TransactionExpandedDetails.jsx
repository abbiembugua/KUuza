import { PAYMENT_LABELS, formatShortDate } from './transactionConfig';
import ContactDetails from './ContactDetails';

export default function TransactionExpandedDetails({ transaction, isBuyer, transactionQuantity, token, darkMode }) {
  const label = (text) => (
    <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      {text}
    </p>
  );

  const value = (text, className = '') => (
    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} ${className}`}>{text}</p>
  );

  return (
    <div className={`px-4 pb-4 pt-0 border-t space-y-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <div className="pt-4 grid grid-cols-2 gap-3 text-sm">

        <div>
          {label('Payment')}
          {value(PAYMENT_LABELS[transaction.payment_method] || transaction.payment_method)}
        </div>

        <div>
          {label('Transaction ID')}
          <p className={`text-xs font-mono truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {transaction.id}
          </p>
        </div>

        {transaction.inquiry_note && (
          <div className="col-span-2">
            {label('Buyer Note')}
            <p className={`text-sm italic ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              &ldquo;{transaction.inquiry_note}&rdquo;
            </p>
          </div>
        )}

        {transaction.listing_type !== 'service' && (
          <div>
            {label('Quantity')}
            {value(transactionQuantity)}
          </div>
        )}

        {transaction.mpesa_receipt && (
          <div>
            {label('M-Pesa Receipt')}
            <p className={`font-mono text-xs ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {transaction.mpesa_receipt}
            </p>
          </div>
        )}

        {transaction.completed_at && (
          <div>
            {label('Completed on')}
            <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {formatShortDate(transaction.completed_at)}
            </p>
          </div>
        )}
      </div>

      {isBuyer && (
        <ContactDetails
          listingId={transaction.listing}
          token={token}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
