// components/landing/Footer.jsx
import React from 'react';
import { useTheme } from '../../context/Themecontext';

const Footer = () => {
  const { darkMode } = useTheme();

  return (
    <footer className={`py-12 px-6 border-t transition-colors duration-200 ${
      darkMode 
        ? 'border-gray-800 bg-gray-900/50' 
        : 'border-gray-200 bg-white/50'
    }`}>
      <div className="container mx-auto grid md:grid-cols-4 gap-8">
        {/* About */}
        <div>
          <h3 className={`text-lg font-bold mb-4 transition-colors duration-200 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            About KU CampusTrade
          </h3>
          <p className={`transition-colors duration-200 leading-relaxed ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            KU CampusTrade is a student-focused marketplace for Kenyatta University. 
            Buy, sell, and exchange goods and services safely within campus.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className={`text-lg font-bold mb-4 transition-colors duration-200 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Quick Links
          </h3>
          <ul className="space-y-3">
            {['Home', 'Marketplace', 'Features', 'Sign Up'].map((item) => (
              <li key={item}>
                <a 
                  href="#" 
                  className={`transition-colors duration-200 hover:text-emerald-500 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className={`text-lg font-bold mb-4 transition-colors duration-200 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Support
          </h3>
          <ul className="space-y-3">
            {['Help Center', 'Contact Support', 'Privacy Policy', 'Terms of Service'].map((item) => (
              <li key={item}>
                <a 
                  href="#" 
                  className={`transition-colors duration-200 hover:text-emerald-500 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className={`text-lg font-bold mb-4 transition-colors duration-200 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Contact
          </h3>
          <div className="space-y-3">
            <p className={`transition-colors duration-200 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span className="font-medium">Email:</span> support@kucampustrade.ac.ke
            </p>
            <p className={`transition-colors duration-200 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span className="font-medium">Phone:</span> +254 700 000 000
            </p>
            <p className={`transition-colors duration-200 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <span className="font-medium">Location:</span> Kenyatta University, Nairobi
            </p>
          </div>
        </div>
      </div>

      <div className={`text-center mt-12 pt-8 border-t text-sm transition-colors duration-200 ${
        darkMode 
          ? 'text-gray-500 border-gray-800' 
          : 'text-gray-600 border-gray-200'
      }`}>
        © 2025 KU CampusTrade • All rights reserved
      </div>
    </footer>
  );
};

export default Footer;