import React, { useState } from 'react';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import { Search, Filter, Clock, MapPin, ChevronDown, ChevronUp, Users, Book, Projector, Calendar, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/Themecontext';
const NeedsPage = () => {
  const { darkMode, setDarkMode } = useTheme();
  const [expandedNeed, setExpandedNeed] = useState(null);
  const [needsFilter, setNeedsFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for needs
  const needsData = [
    {
      id: 1,
      date: '1/17/2024',
      tags: ['NBC', 'ABS'],
      title: 'Looking for Engineering Mathematics Textbook',
      description: 'I want: Engineering Mathematics textbook for MZI 201. Preferably the latest edition but older editions are fine too. Must be in great condition with minimal markings.',
      campus: 'Main Campus - Library Pricing Point',
      budget: 'KES 1,000 - 1,500',
      responses: 3,
      category: 'Books',
      urgency: 'Medium - Within a week',
      status: 'active',
      user: 'Anonymous Student'
    },
    {
      id: 2,
      date: '01/12/2025',
      tags: ['Rental'],
      title: 'Need a Portable Projector for Presentation',
      description: 'Looking to rent or buy a portable projector for my final year project presentation next week. Only need it for 2-3 days maximum.',
      campus: 'Open Campus - Main Gate',
      budget: 'KES 0 - 1,500',
      responses: 1,
      category: 'Electronics',
      urgency: 'High - Within 3 days',
      status: 'active',
      user: 'Final Year Student'
    },
    {
      id: 3,
      date: '01/10/2025',
      tags: ['Study Group'],
      title: 'Calculus Study Partner',
      description: 'Looking for a study partner for Calculus II. Prefer someone available evenings at the library.',
      campus: 'Main Campus - Library',
      budget: 'Free',
      responses: 2,
      category: 'Services',
      urgency: 'Low - Anytime this month',
      status: 'active',
      user: 'Engineering Student'
    },
    {
      id: 4,
      date: '01/08/2025',
      tags: ['Completed'],
      title: 'Physics Lab Manual - Found',
      description: 'Need Physics 101 lab manual for this semester.',
      campus: 'Science Building',
      budget: 'KES 500 - 800',
      responses: 5,
      category: 'Books',
      urgency: 'Medium - Within a week',
      status: 'completed',
      user: 'Science Major'
    }
  ];

  const [newNeed, setNewNeed] = useState({
    title: '',
    category: 'Books',
    description: '',
    campus: 'Main Campus - Library Pricing Point',
    budgetMin: '',
    budgetMax: '',
    urgency: 'medium',
    tags: []
  });

  const categories = [
    'Books',
    'Electronics',
    'Services',
    'Furniture',
    'Clothing',
    'Other'
  ];

  const campuses = [
    'Main Campus - Library Pricing Point',
    'Open Campus - Main Gate',
    'Hostels Area',
    'Student Centre',
    'Anywhere on Campus'
  ];

  const urgencyLevels = [
    { value: 'low', label: 'Low - Anytime this month' },
    { value: 'medium', label: 'Medium - Within a week' },
    { value: 'high', label: 'High - Within 3 days' },
    { value: 'urgent', label: 'Urgent - Today or tomorrow' }
  ];

  const handleNewNeedSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('New need submitted:', newNeed);
    // Reset form
    setNewNeed({
      title: '',
      category: 'Books',
      description: '',
      campus: 'Main Campus - Library Pricing Point',
      budgetMin: '',
      budgetMax: '',
      urgency: 'medium',
      tags: []
    });
  };

  const filteredNeeds = needsData.filter(need => {
    if (needsFilter === 'all') return true;
    if (needsFilter === 'active') return need.status === 'active';
    if (needsFilter === 'completed') return need.status === 'completed';
    return true;
  }).filter(need => 
    need.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    need.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    need.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeNeedsCount = needsData.filter(n => n.status === 'active').length;
  const urgentNeedsCount = needsData.filter(n => n.urgency.includes('High') || n.urgency.includes('Urgent')).length;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black' : 'bg-gray-50'}`}>
      <DashboardNavbar darkMode={darkMode} setDarkMode={setDarkMode} />

      <div className="pt-20 pb-16 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Community Needs
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Help others find what they're looking for
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Post New Need */}
          <div className="lg:col-span-2">
            {/* Search Bar */}
            <div className={`mb-6 p-4 rounded-2xl border ${
              darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <Search className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search community needs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`flex-1 bg-transparent outline-none ${
                    darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                  }`}
                />
                <button className={`p-2 rounded-lg ${
                  darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-blue-500' : 'bg-blue-600'}`}></div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Active Needs: {activeNeedsCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${darkMode ? 'bg-red-500' : 'bg-red-600'}`}></div>
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Urgent Needs: {urgentNeedsCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-6">
              {['all', 'active', 'completed'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setNeedsFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    needsFilter === filter
                      ? 'bg-blue-600 text-white'
                      : darkMode
                      ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>

            {/* Needs List */}
            <div className="space-y-4">
              {filteredNeeds.map((need) => (
                <div
                  key={need.id}
                  className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                    darkMode
                      ? 'bg-gray-900/80 border-gray-800'
                      : 'bg-white border-gray-200'
                  } ${expandedNeed === need.id ? 'shadow-lg' : ''}`}
                >
                  {/* Need Header */}
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedNeed(expandedNeed === need.id ? null : need.id)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {need.date}
                        </span>
                        {need.tags.map((tag, index) => (
                          <span
                            key={index}
                            className={`px-2 py-1 text-xs rounded-full ${
                              darkMode
                                ? 'bg-gray-800 text-gray-300'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      {expandedNeed === need.id ? (
                        <ChevronUp className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      ) : (
                        <ChevronDown className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </div>

                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {need.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 mt-4">
                      <div className="flex items-center gap-1">
                        <MapPin className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {need.campus}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${
                          need.urgency.includes('High') || need.urgency.includes('Urgent')
                            ? 'text-red-500'
                            : darkMode
                            ? 'text-gray-400'
                            : 'text-gray-500'
                        }`}>
                          {need.urgency}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {need.responses} {need.responses === 1 ? 'person has' : 'people have'} responded
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedNeed === need.id && (
                    <div className={`px-6 pb-6 border-t ${
                      darkMode ? 'border-gray-800' : 'border-gray-200'
                    }`}>
                      <div className="pt-6">
                        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {need.description}
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Details
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Book className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Category: {need.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className={`w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Posted: {need.date}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Budget & Status
                            </h4>
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                              darkMode ? 'bg-gray-800' : 'bg-gray-100'
                            }`}>
                              <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {need.budget}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Posted by: {need.user}
                          </span>
                          <button className={`px-4 py-2 rounded-xl font-medium ${
                            darkMode
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}>
                            I Can Help
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Post New Need Form */}
          <div className={`lg:col-span-1 rounded-2xl border p-6 h-fit sticky top-24 ${
            darkMode ? 'bg-gray-900/80 border-gray-800' : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              What do you need?
            </h2>

            <form onSubmit={handleNewNeedSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  What are you looking for?
                </label>
                <input
                  type="text"
                  value={newNeed.title}
                  onChange={(e) => setNewNeed({...newNeed, title: e.target.value})}
                  placeholder="e.g., Engineering Mathematics Textbook"
                  className={`w-full rounded-xl px-4 py-3 border ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300'
                  }`}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Provide details about what you need...
                </label>
                <textarea
                  value={newNeed.description}
                  onChange={(e) => setNewNeed({...newNeed, description: e.target.value})}
                  rows="4"
                  placeholder="Describe what you need, condition requirements, timing, etc."
                  className={`w-full rounded-xl px-4 py-3 resize-none border ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                      : 'bg-white border-gray-300'
                  }`}
                  required
                />
              </div>

              {/* Category & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Category
                  </label>
                  <select
                    value={newNeed.category}
                    onChange={(e) => setNewNeed({...newNeed, category: e.target.value})}
                    className={`w-full rounded-xl px-4 py-3 border ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {categories.map(cat => (
                      <option key={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Preferred Location
                  </label>
                  <select
                    value={newNeed.campus}
                    onChange={(e) => setNewNeed({...newNeed, campus: e.target.value})}
                    className={`w-full rounded-xl px-4 py-3 border ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {campuses.map(campus => (
                      <option key={campus}>{campus}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Budget Range */}
              <div>
                <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Price Range (KES)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    value={newNeed.budgetMin}
                    onChange={(e) => setNewNeed({...newNeed, budgetMin: e.target.value})}
                    placeholder="Min"
                    className={`rounded-xl px-4 py-3 border ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                  <input
                    type="number"
                    value={newNeed.budgetMax}
                    onChange={(e) => setNewNeed({...newNeed, budgetMax: e.target.value})}
                    placeholder="Max"
                    className={`rounded-xl px-4 py-3 border ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>

              {/* Urgency */}
              <div>
                <label className={`text-sm font-semibold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Urgency
                </label>
                <select
                  value={newNeed.urgency}
                  onChange={(e) => setNewNeed({...newNeed, urgency: e.target.value})}
                  className={`w-full rounded-xl px-4 py-3 border ${
                    darkMode
                      ? 'bg-gray-800 border-gray-700 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  {urgencyLevels.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                Post Need
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeedsPage;