// components/landing/Footer.jsx
import React from 'react';

const Footer = ({ darkMode }) => (
  <footer className={`py-12 px-6 border-t ${darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white/50'}`}>
    <div className="container mx-auto grid md:grid-cols-4 gap-8">
      {/* About */}
      <div>
        <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>About KU CampusTrade</h3>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          KU CampusTrade is a student-focused marketplace for Kenyatta University. Buy, sell, and exchange goods and services safely within campus.
        </p>
      </div>

      {/* Quick Links */}
      <div>
        <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Links</h3>
        <ul className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          <li><a href="#" className="hover:text-emerald-500 transition-colors">Home</a></li>
          <li><a href="#" className="hover:text-emerald-500 transition-colors">Marketplace</a></li>
          <li><a href="#" className="hover:text-emerald-500 transition-colors">Features</a></li>
          <li><a href="#" className="hover:text-emerald-500 transition-colors">Sign Up</a></li>
        </ul>
      </div>

      {/* Support */}
      <div>
        <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Support</h3>
        <ul className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          <li><a href="#" className="hover:text-emerald-500 transition-colors">Help Center</a></li>
          <li><a href="#" className="hover:text-emerald-500 transition-colors">Contact Support</a></li>
          <li><a href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</a></li>
          <li><a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a></li>
        </ul>
      </div>

      {/* Contact */}
      <div>
        <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contact</h3>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Email: support@kucampustrade.ac.ke</p>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Phone: +254 700 000 000</p>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Location: Kenyatta University, Nairobi</p>
      </div>
    </div>

    <div className={`text-center mt-8 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
      © 2025 KU CampusTrade • All rights reserved
    </div>
  </footer>
);

export default Footer;
