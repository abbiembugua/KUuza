// components/landing/Features.jsx
import React from 'react';
import FeatureCard from './FeatureCard';
import { Shield, Zap, Users } from 'lucide-react';

const Features = ({ darkMode }) => {
  const features = [
    { icon: Shield, title: 'KU-Verified Security', description: 'Exclusive to verified KU students using university email authentication', color: 'emerald' },
    { icon: Zap, title: 'AI-Powered Listings', description: 'Generate professional titles, descriptions & pricing with AI assistance', color: 'cyan' },
    { icon: Users, title: 'Trusted Community', description: 'Rating system and campus-specific pickup locations for safe exchanges', color: 'emerald' },
  ];

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto">
        <h2 className={`text-4xl font-bold text-center mb-12 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Why Choose <span className="text-emerald-500">KU CampusTrade</span>?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((f, idx) => <FeatureCard key={idx} feature={f} darkMode={darkMode} />)}
        </div>
      </div>
    </section>
  );
};

export default Features;
