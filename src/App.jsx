import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './Pages/Loginpage';
import SignUpPage from './Pages/Signupage';
import DashboardPage from './Pages/DashboardPage';
import IntegratedDashboard from './Pages/IntegratedDashboard';
import IntegratedBrowsePage from './Pages/IntegratedBrowsePage';
import IntegratedCartPage from './Pages/IntegratedCartPage';
import SellPage from './Pages/SellPage';
import ForgotPassword from './Pages/ForgotPassword';
import MyListingsPage from './Pages/mylistingspage';
import ListingDetailPage from './Pages/Listingdetailpage';
import CheckoutPage from './Pages/CheckoutPage';
import ReviewPage from './Pages/Reviewpage';
import PurchasesPage from './Pages/PurchasesPage';
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
            <Route path="/dashboard" element={<IntegratedDashboard />} />
            <Route path="/dashboard-old" element={<DashboardPage scrolled={scrolled} />} />
            <Route path="/browse" element={<IntegratedBrowsePage />} />
            <Route path="/cart" element={<IntegratedCartPage />} />
            <Route path="/needs" element={<NeedsPage />} />
            <Route path="/ForgotPassword" element={<ForgotPassword />} />
            <Route path="/sell" element={<SellPage />} />
            <Route path="/my-listings" element={<MyListingsPage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/checkout/:id" element={<CheckoutPage />} />
            <Route path="/review/:transactionId" element={<ReviewPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />






            

          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
