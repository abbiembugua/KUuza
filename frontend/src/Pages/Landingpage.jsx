import React from 'react';
import LandingLayout from '../Layout/LandingLayout';
import Hero from '../Components/landing/hero';
import Features from '../Components/landing/features';
import CTA from '../Components/landing/CTA';
import ListingsPreview from '../Components/landing/ListingsPreview';
import { useTheme } from '../context/Themecontext';

const LandingPage = ({ scrolled }) => {
  const { darkMode, setDarkMode } = useTheme();

  return (
    <LandingLayout scrolled={scrolled} darkMode={darkMode} setDarkMode={setDarkMode}>
      <Hero />
      <Features />
      <ListingsPreview />
      <CTA />
    </LandingLayout>
  );
};

export default LandingPage;