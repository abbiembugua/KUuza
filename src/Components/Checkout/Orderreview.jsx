import React from 'react';
import { MapPin, Package, Wrench, ChevronRight, ShoppingBag, Tag } from 'lucide-react';

const OrderReview = ({ listing, darkMode, onContinue, isBulk, bulkItems = [], bulkTotal = 0, singleQuantity = 1 }) => {
  const isService  = listing?.listing_type === 'service';
  const coverImage = listing?.images?.[0]?.image ?? null;

  // ── What-happens-next bullets ─────────────────────────────────────────────
  const nextSteps = isBulk
    ? [
        'Choose a shared pickup date, time, and payment method',
        "After confirming, each seller's contact details will be revealed",
        'Coordinate pickup directly with each seller',
      ]
    : [
        isService
          ? 'Select your preferred service date and payment method'
          : 'Choose a pickup date, time, and how you want to pay',
        "After confirming, the seller's contact details will be revealed",
        `Coordinate the ${isService ? 'appointment' : 'pickup'} directly with the seller`,
      ];

  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="p-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-xl ${darkMode ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
            <ShoppingBag size={20} className="text-emerald-500" />
          </div>
          <div>
            <h2 className={`text-xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Review your order
            </h2>
            {isBulk && (
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {bulkItems.length} {bulkItems.length === 1 ? 'item' : 'items'} from your cart
              </p>
            )}
          </div>
        </div>

        {/* ── BULK: item list ── */}
        {isBulk ? (
          <div className="mb-6 space-y-2.5">
            {bulkItems.map((item, i) => (
              <div
                key={item.cart_item_id || item.listing_id || i}
                className={`flex gap-3 p-3 rounded-xl transition-colors ${
                  darkMode ? 'bg-gray-700/60' : 'bg-gray-50'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                      darkMode ? 'bg-gray-600' : 'bg-gray-100'
                    }`}>
                      <Package size={18} className="text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {item.condition && (
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.condition}
                      </span>
                    )}
                    <span className={`text-xs flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Tag size={10} />
                      Qty: {item.quantity}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <p className="text-sm font-bold text-emerald-600 flex-shrink-0 self-center">
                  KSh {(item.price * item.quantity).toLocaleString('en-KE')}
                </p>
              </div>
            ))}

            {/* Bulk total row */}
            <div className={`flex justify-between items-center p-3.5 rounded-xl border-2 ${
              darkMode
                ? 'border-emerald-500/30 bg-emerald-900/20'
                : 'border-emerald-200 bg-emerald-50'
            }`}>
              <span className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Total ({bulkItems.length} {bulkItems.length === 1 ? 'item' : 'items'})
              </span>
              <span className="font-bold text-lg text-emerald-600">
                KSh {bulkTotal.toLocaleString('en-KE')}
              </span>
            </div>
          </div>

        ) : (
          /* ── SINGLE: listing card ── */
          <div className={`flex gap-4 p-4 rounded-xl mb-6 ${darkMode ? 'bg-gray-700/60' : 'bg-gray-50'}`}>
            {/* Thumbnail */}
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
              {coverImage ? (
                <img src={coverImage} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${
                  darkMode ? 'bg-gray-600' : 'bg-gray-100'
                }`}>
                  {isService
                    ? <Wrench size={24} className="text-gray-400" />
                    : <Package size={24} className="text-gray-400" />}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-1 ${
                isService ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {isService ? 'Service' : 'Good'}
              </span>
              <p className={`font-semibold text-sm line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {listing.title}
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Sold by {listing.seller_name || 'KU Student'}
              </p>
              {!isService && (
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Quantity: {singleQuantity}
                </p>
              )}
              {listing.area_of_operation && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={11} className="text-gray-400" />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {listing.area_of_operation}
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="text-right flex-shrink-0">
              <p className={`font-bold text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                {listing.price
                  ? `KSh ${(parseFloat(listing.price) * singleQuantity).toLocaleString('en-KE')}`
                  : 'Price on request'}
              </p>
            </div>
          </div>
        )}

        {/* ── What happens next ── */}
        <div className={`p-4 rounded-xl mb-6 ${
          darkMode
            ? 'bg-emerald-900/20 border border-emerald-800'
            : 'bg-emerald-50 border border-emerald-100'
        }`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-2.5 ${
            darkMode ? 'text-emerald-400' : 'text-emerald-600'
          }`}>
            What happens next
          </p>
          <ul className={`text-sm space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {nextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* ── CTA ── */}
        <button
          onClick={onContinue}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
        >
          Continue to Schedule &amp; Pay
        </button>
      </div>
    </div>
  );
};

export default OrderReview;
