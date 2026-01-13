import React from 'react';
import { TrendingUp, Eye, Heart } from 'lucide-react';
import ProductCard from '../Listings/ProductCard';

const TrendingItems = ({ darkMode }) => {
  const trendingProducts = [
    {
      id: 1,
      title: 'MacBook Pro 2020 M1 - 256GB',
      price: 35000,
      condition: 'used',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      seller: 'John Smith',
      verified: true,
      views: 245,
      category: 'electronics'
    },
    {
      id: 2,
      title: 'iPhone 12 - 128GB Black',
      price: 28000,
      condition: 'used',
      image: 'https://images.unsplash.com/photo-1592286927505-b04e53f1f51e?w=400',
      seller: 'Emma Davis',
      verified: true,
      views: 189,
      category: 'electronics'
    },
    {
      id: 3,
      title: 'Calculus Textbook Bundle',
      price: 1200,
      condition: 'new',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
      seller: 'Mike Wilson',
      verified: true,
      views: 156,
      category: 'books'
    },
    {
      id: 4,
      title: 'Study Desk with Chair',
      price: 4500,
      condition: 'used',
      image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400',
      seller: 'Sarah Lee',
      verified: false,
      views: 134,
      category: 'furniture'
    },
    {
      id: 5,
      title: 'Nike Air Force 1 - Size 42',
      price: 3500,
      condition: 'used',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
      seller: 'Alex Brown',
      verified: true,
      views: 98,
      category: 'fashion'
    }
  ];

  return (
    <section>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              🔥 Trending on Campus
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Most viewed items today
            </p>
          </div>
        </div>
        <button className="text-emerald-500 hover:text-emerald-600 font-semibold text-sm flex items-center gap-1 transition-colors">
          View All
          <Eye className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scroll (Mobile) / Grid (Desktop) */}
      <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-6 overflow-x-auto md:overflow-visible pb-4 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {trendingProducts.map((product, index) => (
          <div
            key={product.id}
            style={{ animationDelay: `${index * 0.1}s` }}
            className="min-w-[280px] md:min-w-0 opacity-0 animate-slideUp"
          >
            <ProductCard listing={product} darkMode={darkMode} showViews />
          </div>
        ))}
      </div>

      {/* Add custom scrollbar hiding */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default TrendingItems;