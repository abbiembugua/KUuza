import React, { useState } from 'react';
import { Plus, ShoppingBag, MessageCircle, Settings, X } from 'lucide-react';

const QuickActions = ({ darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: <ShoppingBag className="w-5 h-5" />,
      label: 'Create Listing',
      link: '/create-listing'
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: 'Messages',
      link: '/messages'
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: 'Settings',
      link: '/settings'
    }
  ];

  return (
    <div className="fixed bottom-8 right-8 z-40">
      
      {isOpen && (
        <div className="mb-4 space-y-3">
          {actions.map((action, index) => (
            <button
              key={index}
              style={{ animationDelay: `${index * 0.05}s` }}
              className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 font-semibold opacity-0 animate-slideUp ${
                darkMode
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center ${
          isOpen ? 'rotate-45' : ''
        }`}
      >
        {isOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
      </button>
    </div>
  );
};

export default QuickActions;