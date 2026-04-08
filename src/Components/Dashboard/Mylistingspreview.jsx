import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye } from 'lucide-react';

const MyListingsPreview = ({ listings, darkMode, onView }) => {
  const navigate = useNavigate();

  if (!listings || listings.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          📦 Your Active Listings
        </h2>
        <button
          onClick={() => navigate('/my-listings')}
          className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Manage all <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {listings.slice(0, 4).map((item) => (
          <div
            key={item.id}
            onClick={() => onView(item.id)}
            className={`rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
              darkMode
                ? 'bg-gray-800 border border-gray-700'
                : 'bg-white border border-gray-100 shadow-sm'
            }`}
          >
            <div className="relative h-32">
              <img
                src={item.images?.[0]?.image || '/placeholder.jpg'}
                alt={item.title}
                className="w-full h-full object-cover"
              />
              {item.is_sold && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-sm bg-red-600 px-2 py-1 rounded-full">
                    SOLD
                  </span>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className={`text-sm font-semibold line-clamp-1 mb-1 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {item.title}
              </p>
              <p className="text-emerald-600 font-bold text-sm">
                KSh {item.price?.toLocaleString()}
              </p>
              <div className={`flex items-center gap-1 mt-1 text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Eye className="w-3 h-3" />
                {item.view_count || 0} views
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyListingsPreview;