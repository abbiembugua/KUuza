import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Star, Eye, Users, Package,
  Wrench, ShoppingCart, Zap, ChevronLeft, ChevronRight,
  Shield, Tag, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import { useTheme } from '../context/Themecontext';
import { useAuth } from '../context/AuthContext';
import { toast, Toaster } from 'react-hot-toast';

const API_BASE = 'http://127.0.0.1:8000/api';

async function fetchListing(id, token) {
  const res = await fetch(`${API_BASE}/listings/${id}/`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Listing not found');
  return res.json();
}

async function incrementViews(id, token) {
  await fetch(`${API_BASE}/listings/${id}/increment_views/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  }).catch(() => {});
}

async function addToCartAPI(listingId, token) {
  const res = await fetch(`${API_BASE}/cart/add/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ listing_id: listingId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Could not add to cart');
  }
  return res.json();
}

const CATEGORY_LABELS = {
  books: 'Books', electronics: 'Electronics', fashion: 'Fashion',
  furniture: 'Furniture', food_beverages: 'Food & Beverages',
  services: 'Services', beauty: 'Beauty', other: 'Other',
};

const CONDITION_LABELS = { new: 'New', like_new: 'Like New', used: 'Used', fair: 'Fair' };

const CONDITION_STYLES = {
  new: 'bg-green-100 text-green-700',
  like_new: 'bg-teal-100 text-teal-700',
  used: 'bg-amber-100 text-amber-700',
  fair: 'bg-orange-100 text-orange-700',
};

function ImageGallery({ images, title, darkMode }) {
  const [active, setActive] = useState(0);
  const prev = () => setActive(i => (i - 1 + images.length) % images.length);
  const next = () => setActive(i => (i + 1) % images.length);

  if (!images || images.length === 0) {
    return (
      <div className={`w-full aspect-square rounded-2xl flex items-center justify-center shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border-2 border-gray-300'}`}>
        <div className="text-center space-y-3">
          <Package size={56} className={`mx-auto ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No photos uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={`relative w-full aspect-square rounded-2xl overflow-hidden shadow-lg group ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <img
            src={images[active].image}          alt={`${title} image ${active + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
              <ChevronLeft size={18} />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => setActive(i)} className={`h-1.5 rounded-full transition-all ${i === active ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />
              ))}
            </div>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)} className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === active ? 'border-emerald-500 scale-105' : darkMode ? 'border-gray-600 opacity-60 hover:opacity-100' : 'border-gray-300 opacity-60 hover:opacity-100'}`}>
              <img src={`http://127.0.0.1:8000${img.image}`} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StarRow({ score, count }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} className={i < Math.round(score || 0) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
      ))}
      <span className="text-xs text-gray-500 ml-1">({count || 0} review{count !== 1 ? 's' : ''})</span>
    </div>
  );
}

const ListingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { token, user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchListing(id, token);
      setListing(data);
      incrementViews(id, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => { load(); }, [load]);

  const isOwn = listing && user && listing.seller === user.id;
  const isService = listing?.listing_type === 'service';
  const isGood = listing?.listing_type === 'good';
  const isSold = listing?.status === 'sold';
  const isDeactivated = listing?.status === 'deactivated';
  const isUnavailable = isSold || isDeactivated;

  const successStyle = { background: darkMode ? '#1f2937' : '#ffffff', color: darkMode ? '#ffffff' : '#1f2937', border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb' };
  const errorStyle = { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };

  const handleAddToCart = async () => {
    if (!token) { toast.error('Please log in to add items to your cart.', { duration: 4000, position: 'top-center', style: errorStyle }); return; }
    try {
      setCartLoading(true);
      await addToCartAPI(listing.id, token);
      toast.success('Added to cart!', { duration: 3000, position: 'top-center', style: successStyle });
    } catch (err) {
      toast.error(err.message, { duration: 4000, position: 'top-center', style: errorStyle });
    } finally {
      setCartLoading(false);
    }
  };

  const handleBuyNow = () => navigate(`/checkout/${listing.id}`);
  const handleBookNow = () => navigate(`/checkout/${listing.id}`);
  const handleEdit = () => navigate(`/sell/edit/${listing.id}`);

  if (loading) return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar />
      <div className="pt-24 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin text-emerald-500" />
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading listing...</p>
        </div>
      </div>
    </div>
  );

  if (error || !listing) return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar />
      <div className="pt-24 flex items-center justify-center min-h-[60vh]">
        <div className={`text-center space-y-4 p-8 rounded-2xl shadow-lg max-w-sm w-full ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <AlertCircle size={48} className="mx-auto text-red-400" />
          <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Listing not found</p>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>This listing may have been removed or does not exist.</p>
          <button onClick={() => navigate('/dashboard')} className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white transition-all">
            Back to Browse
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster toastOptions={{ className: '', style: { borderRadius: '10px', padding: '16px', fontSize: '14px', fontWeight: '500' } }} />
      <DashboardNavbar />

      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4">

          {/* Back */}
          <div className="pt-6 mb-6 flex items-center gap-2">
            <button onClick={() => navigate(-1)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              <ArrowLeft size={20} /> Back
            </button>
            <span className={darkMode ? 'text-gray-600' : 'text-gray-300'}>/</span>
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{CATEGORY_LABELS[listing.category] || listing.category}</span>
            <span className={darkMode ? 'text-gray-600' : 'text-gray-300'}>/</span>
            <span className={`text-sm truncate max-w-xs ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{listing.title}</span>
          </div>

          {/* Unavailable banner */}
          {isUnavailable && (
            <div className={`mb-6 px-4 py-3 rounded-xl flex items-center gap-3 ${isSold ? 'bg-red-100 border border-red-200 text-red-700' : darkMode ? 'bg-gray-800 border border-gray-700 text-gray-400' : 'bg-gray-100 border border-gray-200 text-gray-600'}`}>
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="text-sm font-medium">{isSold ? 'This item has already been sold and is no longer available.' : 'This listing has been temporarily deactivated by the seller.'}</p>
            </div>
          )}

          {/* Grid: 1/3 gallery + 2/3 details — mirrors SellPage split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Gallery */}
            <div className="lg:col-span-1">
              <ImageGallery images={listing.images} title={listing.title} darkMode={darkMode} />
            </div>

            {/* Details */}
            <div className="lg:col-span-2 space-y-6">

              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isService ? darkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-100 text-purple-700' : darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isService ? <Wrench size={11} /> : <Package size={11} />}
                    {isService ? 'Service' : 'Good'}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    <Tag size={11} />{CATEGORY_LABELS[listing.category] || listing.category}
                  </span>
                  {isService && listing.usage_count > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      <Users size={11} />{listing.usage_count} used this
                    </span>
                  )}
                  {isSold && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Sold</span>}
                </div>

                {/* Title */}
                <h1 className={`text-2xl md:text-3xl font-bold leading-snug mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{listing.title}</h1>

                {/* Price */}
                <div className="flex items-baseline gap-3 flex-wrap mb-4">
                  <span className={`text-3xl font-bold ${listing.price ? 'text-emerald-600' : darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {listing.price ? `KSh ${parseFloat(listing.price).toLocaleString('en-KE')}` : 'Price on request'}
                  </span>
                  {listing.negotiable && listing.price && (
                    <span className="text-sm font-semibold text-amber-500 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">Negotiable</span>
                  )}
                </div>

                {/* Condition */}
                {isGood && listing.condition && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Condition:</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${CONDITION_STYLES[listing.condition] || (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}`}>
                      {CONDITION_LABELS[listing.condition] || listing.condition}
                    </span>
                  </div>
                )}

                {/* Quantity */}
                {isGood && listing.quantity > 1 && (
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{listing.quantity} available</p>
                )}

                <div className={`border-t mb-5 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                {/* Description */}
                <div className="mb-5">
                  <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Description</label>
                  {listing.description
                    ? <p className={`text-sm leading-relaxed whitespace-pre-line ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{listing.description}</p>
                    : <p className={`text-sm italic ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>No description provided.</p>
                  }
                </div>

                <div className={`border-t mb-5 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                {/* Area */}
                <div className="mb-5">
                  <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {isService ? 'Area of Operation' : 'Pickup / Meetup Location'}
                  </label>
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{listing.area_of_operation || 'Not specified'}</p>
                  </div>
                </div>

                <div className={`border-t mb-5 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />

                {/* Seller */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {listing.seller_name ? listing.seller_name.charAt(0).toUpperCase() : 'K'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{listing.seller_name || 'KU Student'}</p>
                    <StarRow score={listing.average_rating || 0} count={listing.total_reviews || 0} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <Eye size={13} />{listing.views_count || 0} views
                  </div>
                </div>

                {/* Privacy note — same style as SellPage tips */}
                <div className={`p-3 rounded-lg mb-5 flex items-center gap-2.5 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <Shield size={14} className="flex-shrink-0 text-emerald-500" />
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Seller contact details are only shared after a transaction is created.
                  </p>
                </div>

                {/* Action buttons */}
                {isOwn ? (
                  <div className="space-y-4">
                    <button onClick={handleEdit} className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                      Edit Listing
                    </button>
                    <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      This is your listing.{' '}
                      <Link to="/my-listings" className="text-emerald-500 hover:text-emerald-600 font-medium">Manage it in My Listings →</Link>
                    </p>
                  </div>

                ) : isUnavailable ? (
                  <button disabled className="w-full py-4 rounded-xl font-bold text-lg bg-gray-300 text-gray-400 cursor-not-allowed">
                    {isSold ? 'Sold Out' : 'Currently Unavailable'}
                  </button>

                ) : isGood ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={handleAddToCart} disabled={cartLoading} className={`py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                        {cartLoading ? <Loader2 className="animate-spin" size={20} /> : <ShoppingCart size={20} />}
                        {cartLoading ? 'Adding...' : 'Add to Cart'}
                      </button>
                      <button onClick={handleBuyNow} className="py-4 rounded-xl font-bold text-base bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                        <Zap size={20} />Buy Now
                      </button>
                    </div>
                    <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>💡 Seller contact details will be shared after purchase</p>
                  </div>

                ) : (
                  <div className="space-y-4">
                    <button onClick={handleBookNow} className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                      <CheckCircle size={22} />Book Now
                    </button>
                    <p className={`text-sm text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>💡 Seller contact details will be shared after booking</p>
                  </div>
                )}

                <div className="mt-4">
                  <button className={`text-xs transition-colors ${darkMode ? 'text-gray-600 hover:text-gray-400' : 'text-gray-300 hover:text-gray-500'}`}>
                    Report this listing
                  </button>
                </div>

              </div>

              {/* Tips panel — identical to SellPage tips box */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>💡 Buying tips:</p>
                <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <li>• Meet in safe, visible campus locations</li>
                  <li>• Inspect goods before completing payment</li>
                  <li>• Rate your experience after the transaction</li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage;
