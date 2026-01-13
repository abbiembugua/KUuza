import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './Pages/Loginpage';
import SignUpPage from './Pages/Signupage';
import DashboardPage from './Pages/Dashboardpage';
//import SellPage from './Pages/SellPage';
import NeedsPage from './Pages/NeedsPage';
import { ThemeProvider } from './context/Themecontext';
import { AuthProvider } from './context/AuthContext';

const App = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage scrolled={scrolled} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/dashboard" element={<DashboardPage scrolled={scrolled} />} />
            <Route path="/needs" element={<NeedsPage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
