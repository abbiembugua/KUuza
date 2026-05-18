import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../context/Themecontext';

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
            darkMode ? 'bg-emerald-400/10' : 'bg-emerald-400/15'
          }`}
          style={{ left: b.left, top: b.top, width: b.size, height: b.size, animationDelay: b.delay }}
        />
      ))}
    </div>
  );
};

const API_BASE   = 'http://127.0.0.1:8000/api';
const MEDIA_BASE = 'http://127.0.0.1:8000';

const categoryStyle = {
  books:          { bg: 'linear-gradient(135deg,#d1fae5,#6ee7b7)' },
  electronics:    { bg: 'linear-gradient(135deg,#dbeafe,#93c5fd)' },
  fashion:        { bg: 'linear-gradient(135deg,#fce7f3,#f9a8d4)' },
  food_beverages: { bg: 'linear-gradient(135deg,#ffedd5,#fdba74)' },
  furniture:      { bg: 'linear-gradient(135deg,#fef3c7,#fcd34d)' },
  beauty:         { bg: 'linear-gradient(135deg,#ede9fe,#c4b5fd)' },
  other:          { bg: 'linear-gradient(135deg,#f3f4f6,#e5e7eb)' },
};

const mockFallback = [
  { id: 'm1', title: 'Calculus Textbook',   price: '350',  category: 'books',          images: [] },
  { id: 'm2', title: 'KU Hoodie (L)',        price: '1200', category: 'fashion',        images: [] },
  { id: 'm3', title: 'USB-C Charger',        price: '150',  category: 'electronics',    images: [] },
  { id: 'm4', title: 'Chapati (12 pcs)',     price: '80',   category: 'food_beverages', images: [] },
  { id: 'm5', title: 'Engineering Notes',    price: '200',  category: 'books',          images: [] },
  { id: 'm6', title: 'Desk Lamp',            price: '450',  category: 'furniture',      images: [] },
  { id: 'm7', title: 'Wireless Earbuds',     price: '900',  category: 'electronics',    images: [] },
  { id: 'm8', title: 'Face Moisturiser',     price: '320',  category: 'beauty',         images: [] },
];

const resolveImage = (images) => {
  if (!images?.length) return null;
  const url = images[0].image;
  if (!url) return null;
  return url.startsWith('http') ? url : `${MEDIA_BASE}${url}`;
};

const SkeletonCard = ({ darkMode }) => (
  <div
    className={`flex-shrink-0 w-52 rounded-2xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
  >
    <div className={`h-40 animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    <div className="p-4 space-y-2.5">
      <div className={`h-4 w-3/4 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 w-1/2 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
      <div className={`h-3 w-1/3 rounded animate-pulse ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />
    </div>
  </div>
);

const ListingCard = ({ listing, darkMode, onClick }) => {
  const imageUrl = resolveImage(listing.images);
  const style    = categoryStyle[listing.category] || categoryStyle.other;

  return (
    <div
      onClick={onClick}
      className={`flex-shrink-0 w-52 rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent
        hover:border-emerald-400 hover:scale-[1.03] hover:shadow-xl
        transition-all duration-300 group
        ${darkMode ? 'bg-gray-800 hover:shadow-emerald-900/30' : 'bg-white hover:shadow-emerald-100/80'}`}
    >
      <div className="h-40 overflow-hidden relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{ background: style.bg }}
          />
        )}
      </div>

      <div className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h4 className={`font-bold text-sm mb-1 leading-tight line-clamp-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {listing.title}
        </h4>
        <p className="font-mono font-bold text-emerald-500 text-sm mb-1">
          KES {Number(listing.price).toLocaleString()}
        </p>
        <p className={`text-xs capitalize ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          {listing.category?.replace(/_/g, ' ')}
        </p>
      </div>
    </div>
  );
};

const SCROLL_AMOUNT = 240;

const ListingsPreview = () => {
  const { darkMode } = useTheme();
  const navigate     = useNavigate();
  const sectionRef   = useRef(null);
  const scrollRef    = useRef(null);
  const [inView,   setInView]   = useState(false);
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 5000);

    fetch(`${API_BASE}/listings/?page_size=8`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        const raw      = Array.isArray(data) ? data : data?.results ?? [];
        const combined = raw.slice(0, 8);
        if (combined.length < 8) {
          combined.push(...mockFallback.slice(0, 8 - combined.length));
        }
        setListings(combined);
      })
      .catch(() => setListings(mockFallback))
      .finally(() => { clearTimeout(timeout); setLoading(false); });

    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * SCROLL_AMOUNT, behavior: 'smooth' });
  };

  const arrowBase = `absolute top-1/2 -translate-y-1/2 z-20 p-2 rounded-full shadow-lg
    transition-all duration-200 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none`;

  return (
    <section
      id="listings"
      ref={sectionRef}
      className={`relative py-24 px-6 overflow-hidden transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-white'
      }`}
    >
      <Bubbles darkMode={darkMode} />
      <div className="container mx-auto max-w-6xl relative z-10">

        <div className={`flex items-center justify-between mb-10 transition-all duration-700 ease-out ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <h2 className={`text-3xl md:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            What's moving on campus right now
          </h2>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-emerald-500 hover:text-emerald-400 transition-colors whitespace-nowrap ml-4"
          >
            View all →
          </button>
        </div>

        {/* Scroll container with arrow buttons */}
        <div className={`relative transition-all duration-700 ease-out ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '150ms' }}>

          <button
            onClick={() => scroll(-1)}
            disabled={!canLeft}
            className={`${arrowBase} -left-4 ${
              darkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={scrollRef}
            onScroll={updateArrows}
            className="flex gap-4 overflow-x-auto pb-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonCard key={i} darkMode={darkMode} />
                ))
              : listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    darkMode={darkMode}
                    onClick={() => navigate('/login')}
                  />
                ))}
          </div>

          <button
            onClick={() => scroll(1)}
            disabled={!canRight}
            className={`${arrowBase} -right-4 ${
              darkMode
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ListingsPreview;
