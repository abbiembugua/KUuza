import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, TrendingUp, Package, ShoppingBag, ChevronRight } from 'lucide-react';

const StatsStrip = ({ darkMode, cartCount, myListingsCount, soldCount, purchasesCount }) => {
  const navigate = useNavigate();

  const stats = [
    {
      label: 'Cart Items',
      value: cartCount,
      icon: ShoppingCart,
      bg: darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50',
      text: 'text-emerald-600',
      link: '/cart',
    },
    {
      label: 'My Listings',
      value: myListingsCount,
      icon: Package,
      bg: darkMode ? 'bg-blue-900/30' : 'bg-blue-50',
      text: 'text-blue-600',
      link: '/my-listings',
    },
    {
      label: 'Items Sold',
      value: soldCount,
      icon: TrendingUp,
      bg: darkMode ? 'bg-violet-900/30' : 'bg-violet-50',
      text: 'text-violet-600',
      link: '/purchases?tab=seller',
    },
    {
      label: 'Purchases',
      value: purchasesCount,
      icon: ShoppingBag,
      bg: darkMode ? 'bg-orange-900/30' : 'bg-orange-50',
      text: 'text-orange-600',
      link: '/purchases?tab=buyer',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            onClick={() => navigate(stat.link)}
            className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}
              border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <Icon className={`w-4 h-4 ${stat.text}`} />
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-600' : 'text-gray-500'}`} />
            </div>
            <p className={`text-2xl font-bold mb-0.5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {stat.value}
            </p>
            <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
};

export default StatsStrip;