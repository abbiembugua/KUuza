import React from 'react';
import { SlidersHorizontal, DollarSign, Package, ArrowUpDown } from 'lucide-react';
import { useTheme } from '../../context/Themecontext';

const FilterSidebar = ({  priceRange, setPriceRange, condition, setCondition, sortBy, setSortBy }) => {
   const { darkMode } = useTheme(); // Get darkMode from context instead of props

  const conditions = ['all', 'new', 'used'];
  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' }
  ];

  const handleMinChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    if (value <= priceRange[1]) setPriceRange([value, priceRange[1]]);
  };

  const handleMaxChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= priceRange[0]) setPriceRange([priceRange[0], value]);
  };

  const handleSliderChange = (e) => {
    setPriceRange([0, parseInt(e.target.value)]);
  };

  return (
    <div className="sticky top-20 space-y-6">
      <div className={`${darkMode ? 'bg-gray-900/80' : 'bg-white'} backdrop-blur-sm border ${darkMode ? 'border-gray-800' : 'border-gray-200'} rounded-2xl p-6 shadow-lg`}>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <SlidersHorizontal className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Filters</h3>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <label className={`flex items-center gap-2 text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <DollarSign className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            Price Range
          </label>
          <div className="space-y-2">
            {/* Slider */}
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={priceRange[1]}
              onChange={handleSliderChange}
              aria-label="Price Range Slider"
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} accent-emerald-500`}
            />
            {/* Min/Max Inputs */}
            <div className="flex items-center justify-between gap-2 text-sm">
              <input
                type="number"
                min="0"
                max={priceRange[1]}
                value={priceRange[0]}
                onChange={handleMinChange}
                className={`w-1/2 px-2 py-1 border rounded-lg text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                aria-label="Minimum Price"
              />
              <input
                type="number"
                min={priceRange[0]}
                max="100000"
                value={priceRange[1]}
                onChange={handleMaxChange}
                className={`w-1/2 px-2 py-1 border rounded-lg text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                aria-label="Maximum Price"
              />
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>KES {priceRange[0].toLocaleString()}</span>
              <span className="text-emerald-500 font-semibold">KES {priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Condition */}
        <div className="mb-6">
          <label className={`flex items-center gap-2 text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <Package className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            Condition
          </label>
          <div className="space-y-2">
            {conditions.map((cond) => (
              <button
                key={cond}
                onClick={() => setCondition(cond)}
                className={`w-full px-4 py-2 rounded-lg text-left font-medium transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  condition === cond
                    ? darkMode
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : darkMode
                      ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
                aria-pressed={condition === cond}
              >
                {cond.charAt(0).toUpperCase() + cond.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div className="mb-6">
          <label className={`flex items-center gap-2 text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <ArrowUpDown className={`w-4 h-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
              darkMode
                ? 'bg-gray-800 border-gray-700 text-white focus:border-emerald-500'
                : 'bg-white border-gray-300 text-gray-900 focus:border-emerald-500'
            }`}
            aria-label="Sort By"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Clear All Filters */}
        <button
          onClick={() => {
            setCondition('all');
            setPriceRange([0, 100000]);
            setSortBy('recent');
          }}
          className={`w-full px-4 py-2 border-2 rounded-lg font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
            darkMode
              ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black'
              : 'border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white'
          }`}
        >
          Clear All Filters
        </button>

      </div>
    </div>
  );
};

export default FilterSidebar;
