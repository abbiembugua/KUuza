// pages/LandingPage.jsx
import React from 'react';
import LandingLayout from '../Layout/LandingLayout';
import Hero from '../Components/landing/hero';
import Features from '../Components/landing/features';
import CTA from '../Components/landing/CTA';
import { useTheme } from '../context/Themecontext'; // Add this import

const LandingPage = ({ scrolled }) => {
  const { darkMode } = useTheme(); // Get darkMode from context instead of props
  
  return (
    <LandingLayout scrolled={scrolled}>
      <Hero />
      <Features />
      <CTA />
    </LandingLayout>
  );
};

export default LandingPage;