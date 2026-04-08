import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Laptop, Shirt, Armchair, Dumbbell, Pizza, Wrench, Box } from 'lucide-react';

const categoryData = [
  { id: 'books',          name: 'Books',       icon: '📚', lucide: BookOpen,  color: 'from-amber-400 to-orange-500' },
  { id: 'electronics',    name: 'Electronics', icon: '💻', lucide: Laptop,    color: 'from-blue-400 to-blue-600' },
  { id: 'fashion',        name: 'Fashion',     icon: '👕', lucide: Shirt,     color: 'from-pink-400 to-rose-500' },
  { id: 'furniture',      name: 'Furniture',   icon: '🪑', lucide: Armchair,  color: 'from-emerald-400 to-emerald-600' },
  { id: 'sports',         name: 'Sports',      icon: '⚽', lucide: Dumbbell,  color: 'from-violet-400 to-purple-600' },
  { id: 'food_beverages', name: 'Food',        icon: '🍕', lucide: Pizza,     color: 'from-red-400 to-red-600' },
  { id: 'services',       name: 'Services',    icon: '🔧', lucide: Wrench,    color: 'from-teal-400 to-teal-600' },
  { id: 'other',          name: 'Other',       icon: '📦', lucide: Box,       color: 'from-gray-400 to-gray-600' },
];

const CategoryGrid = ({ darkMode }) => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Browse by Category
        </h2>
        <button
          onClick={() => navigate('/browse')}
          className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          View all <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {categoryData.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/browse?category=${cat.id}`)}
            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg ${
              darkMode
                ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700'
                : 'bg-white hover:bg-gray-50 border border-gray-100 shadow-sm'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-lg shadow-md`}
            >
              {cat.icon}
            </div>
            <span
              className={`text-xs font-medium text-center leading-tight ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;