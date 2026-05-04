import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const categoryData = [
  { id: 'books',          name: 'Books'       },
  { id: 'electronics',    name: 'Electronics' },
  { id: 'fashion',        name: 'Fashion'     },
  { id: 'furniture',      name: 'Furniture'   },
  { id: 'food_beverages', name: 'Food'        },
  { id: 'beauty',         name: 'Beauty'      },
  { id: 'other',          name: 'Other'       },
];

const CategoryGrid = ({ darkMode }) => {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
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

      <div className="flex flex-wrap gap-2.5">
        {categoryData.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/browse?category=${cat.id}`)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-150 ${
              darkMode
                ? 'bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-400'
                : 'bg-transparent border-gray-300 text-gray-600 hover:border-emerald-500 hover:text-emerald-600'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;