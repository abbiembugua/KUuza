import React from 'react';
import ProductCard from '../Listings/ProductCard';

const ListingGrid = ({ darkMode, category, searchQuery, priceRange, condition, sortBy }) => {
  const mockListings = [
    {
      id: 1,
      title: 'Milk and Honey - Poetry Book',
      price: 1500,
      condition: 'used',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400',
      seller: 'Jane Doe',
      verified: true,
      category: 'books'
    },
    {
      id: 2,
      title: 'MacBook Pro 2020 - 256GB',
      price: 35000,
      condition: 'used',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      seller: 'John Smith',
      verified: true,
      category: 'electronics'
    },
    {
      id: 3,
      title: 'Vintage Denim Jacket',
      price: 2500,
      condition: 'used',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      seller: 'Sarah Johnson',
      verified: false,
      category: 'fashion'
    },
    {
      id: 4,
      title: 'Calculus Textbook 2023',
      price: 1200,
      condition: 'new',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
      seller: 'Mike Wilson',
      verified: true,
      category: 'books'
    },
    {
      id: 5,
      title: 'iPhone 12 - 128GB Black',
      price: 28000,
      condition: 'used',
      image: 'https://images.unsplash.com/photo-1592286927505-b04e53f1f51e?w=400',
      seller: 'Emma Davis',
      verified: true,
      category: 'electronics'
    },
    {
      id: 6,
      title: 'Study Desk with Chair',
      price: 4500,
      condition: 'used',
      image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400',
      seller: 'David Brown',
      verified: false,
      category: 'furniture'
    }
  ];

  const filteredListings = mockListings.filter(listing => {
    const matchesCategory = category === 'all' || listing.category === category;
    const matchesSearch = searchQuery === '' || 
      listing.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = listing.price <= priceRange[1];
    const matchesCondition = condition === 'all' || listing.condition === condition;
    
    return matchesCategory && matchesSearch && matchesPrice && matchesCondition;
  });

  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'popular') return b.id - a.id;
    return b.id - a.id;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {category === 'all' ? 'All Items' : category.charAt(0).toUpperCase() + category.slice(1)}
          <span className={`text-lg ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            ({sortedListings.length} items)
          </span>
        </h2>
      </div>

      {sortedListings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedListings.map((listing, index) => (
            <div
              key={listing.id}
              style={{ animationDelay: `${index * 0.05}s` }}
              className="opacity-0 animate-slideUp"
            >
              <ProductCard listing={listing} darkMode={darkMode} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className={`text-6xl mb-4 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`}>📦</div>
          <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            No items found
          </h3>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Try adjusting your filters or search query
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg">
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default ListingGrid;