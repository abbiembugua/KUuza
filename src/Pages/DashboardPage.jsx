import React, { useState } from 'react';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import DashboardHero from '../Components/dashboard/DashboardHero';
import QuickStats from '../Components/dashboard/QuickStats';
import CategoryFilter from '../Components/dashboard/CategoryFilter';
import ListingGrid from '../Components/dashboard/ListingGrid';
import FilterSidebar from '../Components/dashboard/FilterSidebar';
import QuickActions from '../Components/dashboard/QuickActions';
import { useTheme } from '../context/Themecontext';

const DashboardPage = () => {
  const { darkMode, setDarkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [condition, setCondition] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <DashboardNavbar />
      
      <DashboardHero 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <QuickStats  />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <CategoryFilter 
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
          
          <div className="lg:col-span-1">
            <FilterSidebar 
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              condition={condition}
              setCondition={setCondition}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </div>

          <div className="lg:col-span-3">
            <ListingGrid 
              category={selectedCategory}
              searchQuery={searchQuery}
              priceRange={priceRange}
              condition={condition}
              sortBy={sortBy}
            />
          </div>
        </div>
      </div>

      <QuickActions  />
    </div>
  );
};

export default DashboardPage;
