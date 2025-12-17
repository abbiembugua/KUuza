// pages/LandingPage.jsx
import React from 'react';
import LandingLayout from '../Layout/LandingLayout';
import Hero from '../Components/landing/hero';
import Features from '../Components/landing/features';
import CTA from '../Components/landing/CTA';

const LandingPage = ({ darkMode, setDarkMode, scrolled }) => (
  <LandingLayout darkMode={darkMode} setDarkMode={setDarkMode} scrolled={scrolled}>
    <Hero darkMode={darkMode} />
    <Features darkMode={darkMode} />
    <CTA darkMode={darkMode} />
  </LandingLayout>
);

export default LandingPage;
