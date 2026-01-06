import React, { useState } from 'react';
import { Heart, CheckCircle, MapPin, User } from 'lucide-react';

const ProductCard = ({ listing, darkMode }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className={`group ${
      darkMode ? 'bg-gray-900/80' : 'bg-white'
    } backdrop-blur-sm border ${
      darkMode ? 'border-gray-800 hover:border-emerald-500/50' : 'border-gray-200 hover:border-emerald-400'
    } rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
      darkMode ? 'hover:shadow-emerald-500/20' : 'hover:shadow-emerald-300/30'
    } cursor-pointer`}>
      
      <div className="relative h-56 overflow-hidden bg-gray-800">
        <img
          src={listing.image}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {listing.verified && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1.5 bg-green-500 rounded-full text-xs font-bold text-white shadow-lg">
            <CheckCircle className="w-3 h-3" />
            AI Verified
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-all duration-300"
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-white'
            } transition-colors duration-300`}
          />
        </button>

        <div className="absolute bottom-3 left-3 px-4 py-2 bg-black/80 backdrop-blur-sm rounded-xl">
          <span className="text-emerald-400 font-black text-lg">
            KES {listing.price.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="p-5">
        
        <h3 className={`text-lg font-bold mb-2 line-clamp-2 ${
          darkMode ? 'text-white group-hover:text-emerald-400' : 'text-gray-900 group-hover:text-emerald-600'
        } transition-colors duration-300`}>
          {listing.title}
        </h3>

        <div className="mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            listing.condition === 'new'
              ? darkMode
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : darkMode
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'bg-cyan-50 text-cyan-700 border border-cyan-200'
          }`}>
            {listing.condition === 'new' ? 'New' : 'Used'}
          </span>
        </div>

        <div className={`flex items-center justify-between pt-3 border-t ${
          darkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {listing.seller}
            </span>
          </div>
          
          <button className={`flex items-center gap-1 text-xs transition-colors ${
            darkMode ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-600 hover:text-emerald-600'
          }`}>
            <MapPin className="w-3 h-3" />
            KU Campus
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;