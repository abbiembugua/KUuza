import React from 'react';
import {
  Calendar, CreditCard, Smartphone, Banknote,
  AlertCircle, Loader2, ShoppingBag,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getTodayStr = () => new Date().toISOString().split('T')[0];

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const hour   = Math.floor(i / 2) + 7;
  const minute = i % 2 === 0 ? '00' : '30';
  const label  = `${hour > 12 ? hour - 12 : hour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
  const value  = `${String(hour).padStart(2, '0')}:${minute}`;
  return { label, value };
});

// ── PaymentOption ─────────────────────────────────────────────────────────────

function PaymentOption({ value, selected, onSelect, icon: Icon, label, description, darkMode }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all active:scale-[0.99] ${
        selected
          ? 'border-emerald-500 bg-emerald-500/10'
          : darkMode
            ? 'border-gray-700 hover:border-gray-500'
            : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${
          selected
            ? 'bg-emerald-600 text-white'
            : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
        }`}>
          <Icon size={18} />
        </div>
        <div className="flex-1">
          <p className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</p>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
        </div>
        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
          selected ? 'border-emerald-500 bg-emerald-500' : darkMode ? 'border-gray-600' : 'border-gray-300'
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const ScheduleAndPay = ({
  // single-mode listing
  listing,
  darkMode,
  // schedule state
  scheduledDate, setScheduledDate,
  scheduledTime, setScheduledTime,
  inquiryNote,   setInquiryNote,
  // payment state
  paymentMethod, setPaymentMethod,
  mpesaPhone,    setMpesaPhone,
  // errors
  errors, setErrors,
  // actions
  mpesaError,
  submitting,
  onConfirm,
  // bulk props
  isBulk   = false,
  bulkItems = [],
  bulkTotal = 0,
}) => {
  // In bulk mode all items are goods; single mode respects listing_type
  const isService = !isBulk && listing?.listing_type === 'service';
  const isGood    = isBulk || listing?.listing_type === 'good';

  // Bulk: cash option is always cash_on_pickup (no services in bulk)
  const cashValue = isService ? 'pay_after_service' : 'cash_on_pickup';
  const cashLabel = isService ? 'Pay After Service' : 'Cash on Pickup';
  const cashDesc  = isService
    ? 'Settle payment with the seller after the service is delivered'
    : 'Pay in cash when you collect the item';

  const clearError = (field) => setErrors(prev => ({ ...prev, [field]: '' }));
  const todayStr   = getTodayStr();

  return (
    <div className="space-y-4">

      {/* ── Date / time section ── */}
      <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <Calendar size={18} className="text-emerald-500" />
          {isService ? 'Preferred Service Date' : isBulk ? 'Pickup Details' : 'Pickup Details'}
        </h3>

        <div className={`grid gap-4 ${isGood ? 'grid-cols-2' : 'grid-cols-1'}`}>

          {/* Date picker */}
          <div>
            <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {isService ? 'Date' : 'Pickup date'}
            </label>
            <input
              type="date"
              value={scheduledDate}
              min={todayStr}
              onChange={e => { setScheduledDate(e.target.value); clearError('scheduledDate'); }}
              className={`w-full p-3 rounded-xl border-2 text-sm transition-all focus:outline-none ${
                errors.scheduledDate
                  ? 'border-red-500'
                  : darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
                    : 'bg-white border-gray-200 focus:border-emerald-500'
              }`}
            />
            {errors.scheduledDate && (
              <p className="text-red-500 text-xs mt-1">{errors.scheduledDate}</p>
            )}
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Earliest available: today
            </p>
          </div>

          {/* Time picker — goods / bulk only */}
          {isGood && (
            <div>
              <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Pickup time
              </label>
              <select
                value={scheduledTime}
                onChange={e => { setScheduledTime(e.target.value); clearError('scheduledTime'); }}
                className={`w-full p-3 rounded-xl border-2 text-sm transition-all focus:outline-none ${
                  errors.scheduledTime
                    ? 'border-red-500'
                    : darkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
                      : 'bg-white border-gray-200 focus:border-emerald-500'
                }`}
              >
                <option value="">Select a time</option>
                {TIME_SLOTS.map(({ label, value }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.scheduledTime && (
                <p className="text-red-500 text-xs mt-1">{errors.scheduledTime}</p>
              )}
            </div>
          )}
        </div>

        {/* Note to seller */}
        {isGood && (
          <div className="mt-4">
            <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {isBulk ? 'Note to sellers' : 'Note to seller'}{' '}
              <span className="font-normal normal-case">(optional)</span>
            </label>
            <textarea
              value={inquiryNote}
              onChange={e => setInquiryNote(e.target.value)}
              rows={2}
              maxLength={300}
              placeholder={
                isBulk
                  ? 'Any special instructions for your sellers?'
                  : 'Any questions or special instructions for the seller?'
              }
              className={`w-full p-3 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500'
                  : 'bg-white border-gray-200 placeholder-gray-400 focus:border-emerald-500'
              }`}
            />
            <p className={`text-xs mt-1 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {inquiryNote.length}/300
            </p>
          </div>
        )}
      </div>

      {/* ── Payment method section ── */}
      <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          <CreditCard size={18} className="text-emerald-500" />
          Payment Method
        </h3>

        <div className="space-y-3">
          <PaymentOption
            value="mpesa"
            selected={paymentMethod === 'mpesa'}
            onSelect={setPaymentMethod}
            icon={Smartphone}
            label="Pay Now via M-Pesa"
            description={
              isBulk
                ? `One STK push for the full total — KSh ${bulkTotal.toLocaleString('en-KE')}`
                : 'Instant and secure — STK push sent to your phone'
            }
            darkMode={darkMode}
          />
          <PaymentOption
            value={cashValue}
            selected={paymentMethod === cashValue}
            onSelect={setPaymentMethod}
            icon={Banknote}
            label={cashLabel}
            description={cashDesc}
            darkMode={darkMode}
          />
        </div>

        {errors.paymentMethod && (
          <p className="text-red-500 text-xs mt-2">{errors.paymentMethod}</p>
        )}

        {/* M-Pesa phone input */}
        {paymentMethod === 'mpesa' && (
          <div className="mt-4">
            <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              value={mpesaPhone}
              onChange={e => { setMpesaPhone(e.target.value); clearError('mpesaPhone'); }}
              placeholder="0712345678 or 254712345678"
              className={`w-full p-3 rounded-xl border-2 text-sm transition-all focus:outline-none ${
                errors.mpesaPhone
                  ? 'border-red-500'
                  : darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500'
                    : 'bg-white border-gray-200 placeholder-gray-400 focus:border-emerald-500'
              }`}
            />
            {errors.mpesaPhone && (
              <p className="text-red-500 text-xs mt-1">{errors.mpesaPhone}</p>
            )}
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {isBulk
                ? `An STK push for KSh ${bulkTotal.toLocaleString('en-KE')} will be sent to this number.`
                : 'An STK push will be sent to this number to complete payment.'}
            </p>
          </div>
        )}
      </div>

      {/* ── M-Pesa error banner ── */}
      {mpesaError && (
        <div className={`rounded-2xl p-4 shadow-sm border-l-4 border-red-500 ${
          darkMode ? 'bg-red-900/20' : 'bg-red-50'
        }`}>
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className={`text-sm font-semibold ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                Payment Error
              </p>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {mpesaError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Order summary mini ── */}
      <div className={`rounded-2xl p-5 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h3 className={`font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {isBulk && <ShoppingBag size={16} className="text-emerald-500" />}
          Order Summary
        </h3>

        <div className="space-y-2 text-sm">
          {isBulk ? (
            <>
              {/* Bulk: compact item list */}
              {bulkItems.map((item, i) => (
                <div key={item.cart_item_id || item.listing_id || i} className="flex justify-between">
                  <span className={`truncate max-w-[200px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.title}
                    {item.quantity > 1 && (
                      <span className="ml-1 text-xs">×{item.quantity}</span>
                    )}
                  </span>
                  <span className={`font-medium flex-shrink-0 ml-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    KSh {(item.price * item.quantity).toLocaleString('en-KE')}
                  </span>
                </div>
              ))}

              {scheduledDate && (
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Pickup date</span>
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                    {new Date(scheduledDate).toLocaleDateString('en-KE', {
                      weekday: 'short', day: 'numeric', month: 'short',
                    })}
                    {scheduledTime && ` at ${scheduledTime}`}
                  </span>
                </div>
              )}

              <div className={`flex justify-between pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Total ({bulkItems.length} items)
                </span>
                <span className={`font-bold text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  KSh {bulkTotal.toLocaleString('en-KE')}
                </span>
              </div>
            </>
          ) : (
            <>
              {/* Single: existing summary */}
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Item</span>
                <span className={`font-medium truncate max-w-[200px] text-right ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {listing?.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Seller</span>
                <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                  {listing?.seller_name || 'KU Student'}
                </span>
              </div>
              {scheduledDate && (
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {isService ? 'Service date' : 'Pickup date'}
                  </span>
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                    {new Date(scheduledDate).toLocaleDateString('en-KE', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                    })}
                    {scheduledTime && ` at ${scheduledTime}`}
                  </span>
                </div>
              )}
              <div className={`flex justify-between pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total</span>
                <span className={`font-bold text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  {listing?.price
                    ? `KSh ${parseFloat(listing.price).toLocaleString('en-KE')}`
                    : 'Negotiable'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Confirm button ── */}
      <button
        onClick={onConfirm}
        disabled={submitting}
        className={`w-full py-4 rounded-xl font-bold text-white transition-all active:scale-[0.98] ${
          submitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700'
        }`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            {paymentMethod === 'mpesa' ? 'Initiating payment...' : 'Confirming...'}
          </span>
        ) : paymentMethod === 'mpesa' ? (
          isBulk
            ? `Confirm & Pay KSh ${bulkTotal.toLocaleString('en-KE')} via M-Pesa`
            : 'Confirm & Pay via M-Pesa'
        ) : (
          isBulk
            ? `Confirm ${bulkItems.length} Orders`
            : `Confirm ${isService ? 'Booking' : 'Order'}`
        )}
      </button>
    </div>
  );
};

export default ScheduleAndPay;