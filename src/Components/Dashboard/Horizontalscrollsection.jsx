import React from 'react';
import { ArrowRight } from 'lucide-react';
import ListingCard from './Listingcard';

const SkeletonCard = ({ darkMode }) => (
  <div className={`flex-shrink-0 w-44 rounded-2xl overflow-hidden ${
    darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
  }`}>
    <div className="h-36 bg-gray-300 dark:bg-gray-700 animate-pulse" />
    <div className="p-3 space-y-2">
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-4 w-2/3 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  </div>
);

const HorizontalScrollSection = ({
  title,
  listings,
  isLoading,
  darkMode,
  onView,
  onViewAll,
  emptyMessage,
}) => (
  <div>
    <div className="flex items-center justify-between mb-4">
      <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h2>
      <button
        onClick={onViewAll}
        className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
      >
        View all <ArrowRight className="w-4 h-4" />
      </button>
    </div>

    {isLoading ? (
      <div className="flex gap-4 overflow-x-auto pb-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i} darkMode={darkMode} />
        ))}
      </div>
    ) : listings.length === 0 ? (
      <div
        className={`text-center py-8 rounded-2xl border-2 border-dashed ${
          darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-600'
        }`}
      >
        <p className="text-sm">{emptyMessage}</p>
      </div>
    ) : (
      <div
        className="flex gap-4 overflow-x-auto pb-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {listings.map((item) => (
          <ListingCard
            key={item.id}
            item={item}
            darkMode={darkMode}
            onView={onView}
          />
        ))}
      </div>
    )}
  </div>
);

export default HorizontalScrollSection;