import React from 'react';
import { ShoppingBag, TrendingUp, CheckCircle } from 'lucide-react';

const QuickStats = ({ darkMode }) => {
  const stats = [
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: 'Active Listings',
      value: '5',
      iconColor: 'text-emerald-500',
      bgColor: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50',
      borderColor: darkMode ? 'border-emerald-500/30' : 'border-emerald-200'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Trending Items',
      value: '3',
      iconColor: 'text-cyan-500',
      bgColor: darkMode ? 'bg-cyan-500/10' : 'bg-cyan-50',
      borderColor: darkMode ? 'border-cyan-500/30' : 'border-cyan-200'
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'AI Verified',
      value: '5',
      iconColor: 'text-green-500',
      bgColor: darkMode ? 'bg-green-500/10' : 'bg-green-50',
      borderColor: darkMode ? 'border-green-500/30' : 'border-green-200'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{ animationDelay: `${index * 0.1}s` }}
            className={`opacity-0 animate-slideUp ${
              darkMode ? 'bg-gray-900/80' : 'bg-white'
            } backdrop-blur-sm border ${stat.borderColor} rounded-2xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium mb-1 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>{stat.title}</p>
                <p className={`text-3xl font-black ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} ${stat.iconColor} p-4 rounded-xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickStats;