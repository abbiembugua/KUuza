import React from 'react';
import { Star } from 'lucide-react';

const SellerRow = ({ sellerName, averageRating, totalReviews, darkMode }) => {
  const initial = sellerName?.charAt(0).toUpperCase() || 'U';
  const first   = sellerName?.split(' ')[0] || 'KU Student';

  return (
    <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white text-xs font-semibold">{initial}</span>
      </div>
      <span className="font-medium truncate">{first}</span>
      <div className="ml-auto flex items-center gap-1 flex-shrink-0">
        <Star className="w-3 h-3 text-yellow-500 fill-current" />
        <span>{averageRating > 0 ? averageRating : '—'}</span>
        {totalReviews > 0 && (
          <span className="text-xs opacity-60">({totalReviews})</span>
        )}
      </div>
    </div>
  );
};

export default SellerRow;