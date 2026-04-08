import React from 'react';
import SellerRow from '../shared/SellerRow';

const ListingCard = ({ item, darkMode, onView }) => {
  return (
    <div
      onClick={() => onView(item.id)}
      className={`flex-shrink-0 w-44 rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl
        ${darkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white border border-gray-100 shadow-sm'
        }`}
    >
      {/* Image */}
      <div className="relative h-36">
        <img
          src={item.images?.[0]?.image || '/placeholder.jpg'}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        {item.status === 'sold' && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
            SOLD
          </div>
        )}
        {item.category && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-1.5 py-0.5 rounded-md text-xs backdrop-blur-sm">
            {item.category}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className={`text-xs font-semibold line-clamp-2 mb-1.5 leading-snug ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {item.title}
        </p>

        <p className="text-emerald-600 font-bold text-sm mb-2">
          {item.price
            ? `KSh ${parseFloat(item.price).toLocaleString('en-KE')}`
            : 'Negotiable'}
        </p>

        <SellerRow
          sellerName={item.seller_name}
          averageRating={item.average_rating}
          totalReviews={item.total_reviews}
          darkMode={darkMode}
        />

        {item.status !== 'sold' && (
          <p className={`mt-2 text-center text-xs font-medium py-1.5 rounded-lg transition-colors ${
            darkMode
              ? 'text-emerald-400 bg-emerald-900/30 hover:bg-emerald-900/50'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
          }`}>
            View details →
          </p>
        )}
      </div>
    </div>
  );
};

export default ListingCard;