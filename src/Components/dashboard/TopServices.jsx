import React from 'react';
import { Wrench, Star, User, MapPin } from 'lucide-react';

const TopServices = ({ darkMode }) => {
  const services = [
    {
      id: 1,
      title: 'Professional Photography',
      provider: 'Alex Photography',
      price: 1500,
      priceUnit: 'per session',
      rating: 4.8,
      reviews: 24,
      image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=400',
      verified: true
    },
    {
      id: 2,
      title: 'Hair Braiding & Styling',
      provider: 'Grace Beauty',
      price: 800,
      priceUnit: 'starting from',
      rating: 4.9,
      reviews: 56,
      image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
      verified: true
    },
    {
      id: 3,
      title: 'Math & Physics Tutoring',
      provider: 'Dr. Johnson',
      price: 500,
      priceUnit: 'per hour',
      rating: 5.0,
      reviews: 18,
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
      verified: true
    },
    {
      id: 4,
      title: 'Document Printing & Binding',
      provider: 'KU Print Hub',
      price: 50,
      priceUnit: 'per page',
      rating: 4.7,
      reviews: 89,
      image: 'https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=400',
      verified: false
    }
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              🛠️ Top Services
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Highly rated by students
            </p>
          </div>
        </div>
        <button className="text-emerald-500 hover:text-emerald-600 font-semibold text-sm transition-colors">
          View All Services
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((service, index) => (
          <div
            key={service.id}
            style={{ animationDelay: `${index * 0.1}s` }}
            className={`group opacity-0 animate-slideUp ${
              darkMode ? 'bg-gray-900/80' : 'bg-white'
            } backdrop-blur-sm border ${
              darkMode ? 'border-gray-800 hover:border-purple-500/50' : 'border-gray-200 hover:border-purple-400'
            } rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer`}
          >
            {/* Service Image */}
            <div className="relative h-40 overflow-hidden bg-gray-800">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              {service.verified && (
                <div className="absolute top-3 left-3 px-2 py-1 bg-green-500 rounded-full text-xs font-bold text-white">
                  ✓ Verified
                </div>
              )}
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-full">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-bold text-white">{service.rating}</span>
              </div>
            </div>

            {/* Service Info */}
            <div className="p-4">
              <h3 className={`text-lg font-bold mb-2 line-clamp-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {service.title}
              </h3>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {service.provider}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                <div>
                  <span className="text-emerald-500 font-black text-lg">
                    KES {service.price}
                  </span>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {service.priceUnit}
                  </p>
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {service.reviews} reviews
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TopServices;