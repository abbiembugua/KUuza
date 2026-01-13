import React from 'react';
import { Clock, Sparkles } from 'lucide-react';
import ProductCard from '../Listings/ProductCard';

const RecentlyAdded = ({ darkMode }) => {
  const recentProducts = [
    {
      id: 6,
      title: 'Vintage Denim Jacket - Medium',
      price: 2500,
      condition: 'used',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      seller: 'Sarah Johnson',
      verified: false,
      addedAt: '2 hours ago',
      category: 'fashion'
    },
    {
      id: 7,
      title: 'HP Laptop - Core i5, 8GB RAM',
      price: 22000,
      condition: 'used',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
      seller: 'David Kim',
      verified: true,
      addedAt: '5 hours ago',
      category: 'electronics'
    },
    {
      id: 8,
      title: 'Engineering Mathematics Notes',
      price: 500,
      condition: 'new',
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
      seller: 'Lisa Chen',
      verified: true,
      addedAt: '8 hours ago',
      category: 'books'
    },
    {
      id: 9,
      title: 'Portable Bluetooth Speaker',
      price: 1800,
      condition: 'new',
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400',
      seller: 'Tom Anderson',
      verified: false,
      addedAt: '12 hours ago',
      category: 'electronics'
    }
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              ⏰ Just In
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Added in the last 24 hours
            </p>
          </div>
        </div>
        <button className="text-emerald-500 hover:text-emerald-600 font-semibold text-sm flex items-center gap-1 transition-colors">
          View All
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recentProducts.map((product, index) => (
          <div
            key={product.id}
            style={{ animationDelay: `${index * 0.1}s` }}
            className="opacity-0 animate-slideUp"
          >
            <ProductCard listing={product} darkMode={darkMode} showTimeAdded />
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecentlyAdded;