import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/Themecontext';

// Bubble positions stable per mount — same approach as Hero
const Bubbles = ({ darkMode }) => {
  const items = useMemo(
    () =>
      Array.from({ length: 14 }, () => ({
        left:  `${Math.random() * 100}%`,
        top:   `${Math.random() * 100}%`,
        size:  `${Math.random() * 110 + 50}px`,
        delay: `${(Math.random() * 4).toFixed(1)}s`,
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {items.map((b, i) => (
        <div
          key={i}
          className={`absolute rounded-full animate-pulse ${
            darkMode ? 'bg-emerald-400/10' : 'bg-cyan-400/20'
          }`}
          style={{ left: b.left, top: b.top, width: b.size, height: b.size, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
};

const API_BASE   = 'http://127.0.0.1:8000/api';
const MEDIA_BASE = 'http://127.0.0.1:8000';

// Per-category fallback style when a listing has no uploaded image
const categoryStyle = {
  books:          { bg: 'linear-gradient(135deg,#d1fae5,#6ee7b7)', emoji: '📗' },
  electronics:    { bg: 'linear-gradient(135deg,#dbeafe,#93c5fd)', emoji: '💻' },
  fashion:        { bg: 'linear-gradient(135deg,#fce7f3,#f9a8d4)', emoji: '👕' },
  food_beverages: { bg: 'linear-gradient(135deg,#ffedd5,#fdba74)', emoji: '🍱' },
  furniture:      { bg: 'linear-gradient(135deg,#fef3c7,#fcd34d)', emoji: '🪑' },
  beauty:         { bg: 'linear-gradient(135deg,#ede9fe,#c4b5fd)', emoji: '💄' },
  other:          { bg: 'linear-gradient(135deg,#f3f4f6,#e5e7eb)', emoji: '📦' },
};

const mockFallback = [
  { id: 'm1', title: 'Calculus Textbook', price: '350',   category: 'books',          images: [], seller_name: 'KU Student' },
  { id: 'm2', title: 'KU Hoodie (L)',     price: '1200',  category: 'fashion',        images: [], seller_name: 'KU Student' },
  { id: 'm3', title: 'USB-C Charger',     price: '150',   category: 'electronics',    images: [], seller_name: 'KU Student' },
  { id: 'm4', title: 'Chapati (12 pcs)',  price: '80',    category: 'food_beverages', images: [], seller_name: 'KU Student' },
];

const resolveImage = (images) => {
  if (!images?.length) return null;
  const url = images[0].image;
  if (!url) return null;
  return url.startsWith('http') ? url : `${MEDIA_BASE}${url}`;
};

// ── Skeleton card shown while loading ────────────────────────────────────────
const SkeletonCard = ({ darkMode }) => (
  <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
    <div className={`h-44 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    <div className="p-4 space-y-2.5">
      <div className={`h-4 w-3/4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 w-1/2 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 w-1/3 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
  </div>
);

// ── Individual listing card ───────────────────────────────────────────────────
const ListingCard = ({ listing, visible, delay, darkMode, onClick }) => {
  const imageUrl = resolveImage(listing.images);
  const style    = categoryStyle[listing.category] || categoryStyle.other;

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        onClick={onClick}
        className={`rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent
          hover:border-emerald-400 hover:scale-[1.03] hover:shadow-xl
          transition-all duration-300 group
          ${darkMode ? 'bg-gray-800 hover:shadow-emerald-900/30' : 'bg-white hover:shadow-emerald-100/80'}`}
      >
        {/* Photo area */}
        <div className="h-44 overflow-hidden relative">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: style.bg }}
            >
              <span className="text-5xl select-none group-hover:scale-110 transition-transform duration-300">
                {style.emoji}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h4
            className={`font-bold text-base mb-1 leading-tight line-clamp-1 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            {listing.title}
          </h4>
          <p className="font-mono font-bold text-emerald-500 text-sm mb-1.5">
            KES {Number(listing.price).toLocaleString()}
          </p>
          <p className={`text-xs capitalize ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {listing.category?.replace(/_/g, ' ')}
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Main section ─────────────────────────────────────────────────────────────
const ListingsPreview = () => {
  const { darkMode } = useTheme();
  const navigate     = useNavigate();
  const ref          = useRef(null);
  const [inView,    setInView]    = useState(false);
  const [listings,  setListings]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Intersection Observer — triggers slide-in animation
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch real active listings; fall back to mock data if API is unreachable
  useEffect(() => {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 5000);

    fetch(`${API_BASE}/listings/?page_size=4`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const raw = Array.isArray(data) ? data : data?.results ?? [];
        // Always show 4 cards — pad with mock data if the backend returned fewer
        const combined = raw.slice(0, 4);
        if (combined.length < 4) {
          combined.push(...mockFallback.slice(0, 4 - combined.length));
        }
        setListings(combined);
      })
      .catch(() => setListings(mockFallback))
      .finally(() => { clearTimeout(timeout); setLoading(false); });

    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  return (
    <section
      ref={ref}
      className={`relative py-24 px-6 overflow-hidden transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}
    >
      <Bubbles darkMode={darkMode} />
      <div className="container mx-auto max-w-6xl relative z-10">
        <h2
          className={`text-3xl md:text-4xl font-bold mb-12 transition-all duration-700 ease-out ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          } ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          What's moving on campus right now
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} darkMode={darkMode} />
              ))
            : listings.map((listing, idx) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  visible={inView}
                  delay={idx * 100}
                  darkMode={darkMode}
                  onClick={() => navigate('/login')}
                />
              ))}
        </div>
      </div>
    </section>
  );
};

export default ListingsPreview;