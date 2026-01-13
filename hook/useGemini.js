// src/hooks/useGemini.js - SIMPLE FALLBACK VERSION
import { useState, useCallback } from 'react';

export const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateDescription = useCallback(async (title, category) => {
    setLoading(true);
    setError(null);
    
    // Always use mock for now
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const descriptions = [
      `Excellent condition ${title} for ${category}. Perfect for university students looking for affordable quality items. Barely used and well maintained.`,
      `Great ${title} in ${category} category. Selling because I no longer need it. Works perfectly and comes with all original accessories.`,
      `Premium ${title} for ${category} students. Lightly used, like new condition. Reasonably priced for campus marketplace.`,
      `Quality ${title} for ${category}. Excellent value for money. Selling to make space for new items.`,
      `Well-maintained ${title} perfect for ${category} needs. Great condition, ready to use immediately.`,
      `Fantastic ${title} for ${category}. Perfect for students on a budget. Selling due to relocation.`,
      `Top-quality ${title} in ${category} category. Barely used, excellent condition. Great deal for students.`
    ];
    
    setLoading(false);
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }, []);

  const suggestPrice = useCallback(async (title, category, condition = "Good") => {
    setLoading(true);
    setError(null);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Price based on category
    const priceRanges = {
      'Books': [300, 500, 800, 1200, 1500],
      'Electronics': [1500, 2500, 4000, 6000, 8000],
      'Fashion': [400, 600, 900, 1200, 1800],
      'Furniture': [2000, 3500, 5000, 7500, 10000],
      'Services': [500, 1000, 1500, 2000],
      'Food & Beverages': [200, 350, 500, 750],
      'Other': [500, 1000, 2000, 3000]
    };
    
    const prices = priceRanges[category] || priceRanges['Other'];
    const price = prices[Math.floor(Math.random() * prices.length)];
    
    setLoading(false);
    return price;
  }, []);

  return {
    loading,
    error,
    generateDescription,
    suggestPrice,
    isAvailable: true
  };
};

export default useGemini;