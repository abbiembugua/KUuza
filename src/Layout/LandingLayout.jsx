// layouts/LandingLayout.jsx
import React from 'react';
import Navbar from '../Components/Layout/navbar';
import Footer from '../Components/Layout/footer';

// AnimatedBackground removed — each landing section manages its own background
// and bubble animation so the page can alternate between bubbles and plain colour.

const LandingLayout = ({ children, darkMode, setDarkMode, scrolled }) => (
  <div className={`min-h-screen transition-colors duration-300 ${
    darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
  }`}>
    <Navbar darkMode={darkMode} setDarkMode={setDarkMode} scrolled={scrolled} />
    <main>{children}</main>
    <Footer darkMode={darkMode} />
  </div>
);

export default LandingLayout;
