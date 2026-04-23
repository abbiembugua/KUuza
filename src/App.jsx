import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ForgotPassword from './Pages/ForgotPassword';
import IntegratedBrowsePage from './Pages/IntegratedBrowsePage';
import IntegratedCartPage from './Pages/IntegratedCartPage';
import IntegratedDashboard from './Pages/IntegratedDashboard';
import CheckoutPage from './Pages/CheckoutPage';
import LandingPage from './pages/LandingPage';
import ListingDetailPage from './Pages/Listingdetailpage';
import LoginPage from './Pages/Loginpage';
import MyListingsPage from './Pages/mylistingspage';
import NeedsPage from './Pages/NeedsPage';
import ProfilePage from './Pages/ProfilePage';
import PurchasesPage from './Pages/PurchasesPage';
import ReviewPage from './Pages/Reviewpage';
import SellerProfilePage from './Pages/SellerProfilePage';
import SellPage from './Pages/SellPage';
import SignUpPage from './Pages/Signupage';
import VerifyEmail from './Pages/VerifyEmaiPage';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/Themecontext';

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
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/ForgotPassword" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<IntegratedDashboard />} />
            <Route path="/browse" element={<IntegratedBrowsePage />} />
            <Route path="/cart" element={<IntegratedCartPage />} />
            <Route path="/needs" element={<NeedsPage />} />
            <Route path="/sell" element={<SellPage />} />
            <Route path="/my-listings" element={<MyListingsPage />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/checkout/:id" element={<CheckoutPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/review/:transactionId" element={<ReviewPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/sellers/:sellerId" element={<SellerProfilePage />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
