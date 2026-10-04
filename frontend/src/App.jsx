import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import AppFooter from './Components/Layout/footer';
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
import SellerProfilePage from './Pages/SellerProfilePage';
import SellPage from './Pages/SellPage';
import SignUpPage from './Pages/Signupage';
import VerifyEmail from './Pages/VerifyEmaiPage';
import AdminLoginPage from './Pages/Admin/AdminLoginPage';
import AdminDashboardPage from './Pages/Admin/AdminDashboardPage';
import AdminManagePage from './Pages/Admin/AdminManagePage';
import ScrollToTop from './Components/shared/ScrollToTop';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ThemeProvider } from './context/Themecontext';

// Wraps pages that should show the footer
const WithFooter = () => (
  <>
    <Outlet />
    <AppFooter />
  </>
);

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
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            {/* Student-facing routes */}
            <Route path="/" element={<LandingPage scrolled={scrolled} />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/ForgotPassword" element={<ForgotPassword />} />
            {/* Pages with footer */}
            <Route element={<WithFooter />}>
              <Route path="/dashboard" element={<IntegratedDashboard />} />
              <Route path="/browse" element={<IntegratedBrowsePage />} />
              <Route path="/cart" element={<IntegratedCartPage />} />
              <Route path="/needs" element={<NeedsPage />} />
              <Route path="/sell" element={<SellPage />} />
              <Route path="/my-listings" element={<MyListingsPage />} />
              <Route path="/listings/:id" element={<ListingDetailPage />} />
              <Route path="/purchases" element={<PurchasesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/sellers/:sellerId" element={<SellerProfilePage />} />
            </Route>

            {/* No footer on checkout (focused flow) */}
            <Route path="/checkout/:id" element={<CheckoutPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />

            {/* Admin routes — wrapped in their own auth provider */}
            <Route
              path="/kuuza-control/*"
              element={
                <AdminAuthProvider>
                  <Routes>
                    <Route index element={<AdminLoginPage />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    <Route path="listings"  element={<AdminManagePage section="listings" />} />
                    <Route path="users"     element={<AdminManagePage section="users" />} />
                    <Route path="reports"   element={<AdminManagePage section="reports" />} />
                    <Route path="disputes"  element={<AdminManagePage section="disputes" />} />
                    <Route path="sellers"   element={<AdminManagePage section="sellers" />} />
                  </Routes>
                </AdminAuthProvider>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
