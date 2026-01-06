import React from 'react';
import { Book, Laptop, Shirt, Coffee, Sparkles, Wrench, Grid } from 'lucide-react';

const CategoryFilter = ({ darkMode, selectedCategory, setSelectedCategory }) => {
  const categories = [
    { id: 'all', name: 'All Items', icon: <Grid className="w-5 h-5" /> },
    { id: 'books', name: 'Books', icon: <Book className="w-5 h-5" /> },
    { id: 'electronics', name: 'Electronics', icon: <Laptop className="w-5 h-5" /> },
    { id: 'fashion', name: 'Fashion', icon: <Shirt className="w-5 h-5" /> },
    { id: 'food', name: 'Food', icon: <Coffee className="w-5 h-5" /> },
    { id: 'beauty', name: 'Beauty', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'services', name: 'Services', icon: <Wrench className="w-5 h-5" /> }
  ];

  return (
    <div className={`${
      darkMode ? 'bg-gray-900/50' : 'bg-white'
    } backdrop-blur-sm border ${
      darkMode ? 'border-gray-800' : 'border-gray-200'
    } rounded-2xl p-2 shadow-lg`}>
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg scale-105'
                : darkMode
                ? 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-800'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200'
            }`}
          >
            {category.icon}
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;