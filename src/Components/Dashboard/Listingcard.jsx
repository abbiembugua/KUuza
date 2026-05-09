import React from 'react';
import SellerRow from '../shared/SellerRow';
import { useAuth } from '../../context/AuthContext';

const ListingCard = ({ item, darkMode, onView }) => {
  const { user } = useAuth();
  const normalizeId = (v) => {
    if (!v) return '';
    if (typeof v === 'object') return String(v.id || v.pk || '');
    return String(v);
  };
  const isMyListing = user && item.seller &&
    normalizeId(item.seller) === normalizeId(user.id);

  const quantityAvailable = Number(item?.quantity ?? item?.listing_quantity ?? 0);
  const isOutOfStock = item.listing_type !== 'service' && quantityAvailable <= 0;
  const isMarkedSold = item.status === 'sold';
  const isUnavailable = item.listing_type === 'service' ? isMarkedSold : isOutOfStock;

  return (
    <div
      onClick={() => onView(item.id)}
      className={`flex-shrink-0 w-44 rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl
        ${isMyListing
          ? darkMode
            ? 'bg-gray-800 border-2 border-green-600'
            : 'bg-white border-2 border-green-600 shadow-sm'
          : darkMode
            ? 'bg-gray-800 border border-gray-700'
            : 'bg-white border border-gray-100 shadow-sm'
        }`}
    >
      <div className="relative h-36">
        <img
          src={item.images?.[0]?.image || '/placeholder.jpg'}
          alt={item.title}
          className="w-full h-full object-cover"
        />
        {isMyListing && (
          <div className="absolute top-2 right-2 bg-green-700 text-white px-2 py-0.5 rounded-full text-xs font-bold tracking-wide shadow">
            YOUR LISTING
          </div>
        )}
        {isUnavailable && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
            {item.listing_type === 'service' ? 'UNAVAILABLE' : 'OUT'}
          </div>
        )}
        {item.category && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-1.5 py-0.5 rounded-md text-xs backdrop-blur-sm">
            {item.category}
          </div>
        )}
      </div>

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

        {item.listing_type !== 'service' && (
          <p className={`mb-2 text-xs font-medium ${isOutOfStock ? 'text-red-500' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {isOutOfStock ? 'Out of stock' : `${quantityAvailable} available`}
          </p>
        )}

        <SellerRow
          sellerName={item.seller_name}
          sellerProfilePicture={item.seller_profile_picture}
          averageRating={item.average_rating}
          totalReviews={item.total_reviews}
          darkMode={darkMode}
        />

        <p className={`mt-2 text-center text-xs font-medium py-1.5 rounded-lg transition-colors ${
          isUnavailable
            ? darkMode ? 'text-red-300 bg-red-900/20' : 'text-red-700 bg-red-50'
            : darkMode
              ? 'text-emerald-400 bg-emerald-900/30 hover:bg-emerald-900/50'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
        }`}>
          {isUnavailable ? item.listing_type === 'service' ? 'Unavailable' : 'Sold out' : 'View details ->'}
        </p>
      </div>
    </div>
  );
};

export default ListingCard;
