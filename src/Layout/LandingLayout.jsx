// layouts/LandingLayout.jsx
import React from 'react';
import AnimatedBackground from '../UI/AnimatedBackground';
import Navbar from '../Components/Layout/navbar';
import Footer from '../Components/layout/footer';

const LandingLayout = ({ children, darkMode, setDarkMode, scrolled }) => (
  <div className={`min-h-screen transition-all duration-500 ${
    darkMode 
      ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100' 
      : 'bg-gradient-to-br from-white via-emerald-50 to-cyan-50 text-gray-900'
  }`}>
    <AnimatedBackground darkMode={darkMode} />
    <Navbar darkMode={darkMode} setDarkMode={setDarkMode} scrolled={scrolled} />
    <main>{children}</main>
    <Footer darkMode={darkMode} />
  </div>
);

export default LandingLayout;
