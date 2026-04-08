import React from 'react';
import { MapPin, Package, Wrench, ChevronRight } from 'lucide-react';

const OrderReview = ({ listing, darkMode, onContinue }) => {
  const isService = listing?.listing_type === 'service';

  const coverImage = listing?.images?.[0]?.image ?? null;

  return (
    <div className={`rounded-2xl overflow-hidden shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="p-6">
        <h2 className={`text-xl font-bold mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Review your order
        </h2>

        {/* Listing summary card */}
        <div className={`flex gap-4 p-4 rounded-xl mb-6 ${darkMode ? 'bg-gray-700/60' : 'bg-gray-50'}`}>
          {/* Thumbnail */}
          <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
            {coverImage ? (
              <img src={coverImage} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {isService
                  ? <Wrench size={24} className="text-gray-400" />
                  : <Package size={24} className="text-gray-400" />}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-1 ${
              isService ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {isService ? 'Service' : 'Good'}
            </span>
            <p className={`font-semibold text-sm line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {listing.title}
            </p>
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Sold by {listing.seller_name || 'KU Student'}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} className="text-gray-400" />
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {listing.area_of_operation}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="text-right flex-shrink-0">
            <p className={`font-bold text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {listing.price
                ? `KSh ${parseFloat(listing.price).toLocaleString('en-KE')}`
                : 'Negotiable'}
            </p>
            {listing.negotiable && listing.price && (
              <span className="text-xs text-amber-500 font-medium">Negotiable</span>
            )}
          </div>
        </div>

        {/* What happens next */}
        <div className={`p-4 rounded-xl mb-6 ${
          darkMode
            ? 'bg-emerald-900/20 border border-emerald-800'
            : 'bg-emerald-50 border border-emerald-100'
        }`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
            darkMode ? 'text-emerald-400' : 'text-emerald-600'
          }`}>
            What happens next
          </p>
          <ul className={`text-sm space-y-1.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {[
              isService
                ? 'Select your preferred service date and payment method'
                : 'Choose a pickup date, time, and how you want to pay',
              "After confirming, the seller's contact details will be revealed",
              `Coordinate the ${isService ? 'appointment' : 'pickup'} directly with the seller`,
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all"
        >
          Continue to Schedule &amp; Pay
        </button>
      </div>
    </div>
  );
};

export default OrderReview;