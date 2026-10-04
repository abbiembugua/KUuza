import React from 'react';
import { Star } from 'lucide-react';
import Avatar from './Avatar';

const SellerRow = ({ sellerName, sellerProfilePicture, averageRating, totalReviews, darkMode }) => {
  const first = sellerName?.split(' ')[0] || 'KU Student';

  return (
    <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
      <Avatar src={sellerProfilePicture} name={sellerName} size="w-6 h-6" textSize="text-xs" />
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