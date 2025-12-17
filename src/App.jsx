// App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './Pages/Loginpage';
import SignUpPage from './Pages/Signupage';

const App = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage darkMode={darkMode} setDarkMode={setDarkMode} scrolled={scrolled} />} />
        <Route path="/login" element={<LoginPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/signup" element={<SignUpPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
      </Routes>
    </Router>
  );
};

export default App;
