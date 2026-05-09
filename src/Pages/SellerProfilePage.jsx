import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Flag, Loader2, MapPin, Package, Star, Store, UserRound, Wrench } from 'lucide-react';
import ReportModal from '../Components/ReportModal';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import BackButton from '../Components/shared/BackButton';
import Avatar from '../Components/shared/Avatar';
import { getAllListings } from '../api/dashboardapi';
import { getReviewsForUser } from '../api/reviewsapi';
import { useTheme } from '../context/Themecontext';
import { useAuth } from '../context/AuthContext';

const CATEGORY_LABELS = {
  books: 'Books',
  electronics: 'Electronics',
  fashion: 'Fashion',
  furniture: 'Furniture',
  food_beverages: 'Food & Beverages',
  services: 'Services',
  beauty: 'Beauty',
  other: 'Other',
};

const formatMoney = (value) => {
  const amount = parseFloat(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Price on request';
  return `KSh ${amount.toLocaleString('en-KE')}`;
};

const formatDate = (value) => {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getImageUrl = (listing) => listing?.images?.[0]?.image || listing?.image || null;
const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'object') {
    return String(value.id || value.uuid || value.pk || '');
  }
  return String(value);
};

const getListingSellerId = (listing) => normalizeId(listing?.seller || listing?.seller_id || listing?.user);
const getRevieweeId = (review) => normalizeId(review?.reviewee || review?.reviewee_id);
const getRevieweeName = (review) =>
  review?.reviewee_name ||
  review?.reviewee_full_name ||
  review?.reviewee?.full_name ||
  review?.reviewee?.name ||
  '';
const sortByNewest = (items) => [...items].sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0));

function ReviewCard({ review, darkMode }) {
  return (
    <div className={`rounded-2xl border p-4 ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-stone-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Avatar src={review.reviewer_profile_picture} name={review.reviewer_name} size="w-9 h-9" textSize="text-sm" />
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                {review.reviewer_name || 'KU Student'}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>
                {formatDate(review.created_at)}
              </p>
            </div>
          </div>
          {review.listing_title && (
            <p className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-stone-500'}`}>
              Re: {review.listing_title}
            </p>
          )}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 flex-shrink-0">
          <Star size={12} className="fill-amber-500 text-amber-500" />
          {review.score}
        </span>
      </div>
      {review.comment && (
        <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-stone-700'}`}>
          {review.comment}
        </p>
      )}
    </div>
  );
}

function ReviewGroup({ title, subtitle, reviews, emptyText, darkMode, accentColor }) {
  const [expanded, setExpanded] = React.useState(true);
  const accentClass = accentColor === 'cyan' ? 'text-cyan-500' : 'text-emerald-500';
  const badgeBg     = accentColor === 'cyan' ? 'bg-cyan-100 text-cyan-700' : 'bg-emerald-100 text-emerald-700';

  return (
    <div className={`rounded-3xl border ${darkMode ? 'border-gray-800 bg-gray-950' : 'border-stone-200 bg-stone-50'}`}>
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl flex-shrink-0 ${
            darkMode ? 'bg-gray-900' : 'bg-white border border-stone-200'
          } ${accentClass}`}>
            <Store size={20} />
          </span>
          <div>
            <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>
              {subtitle}
            </p>
            <h2 className={`mt-1 text-lg font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              {title}
            </h2>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0 ${badgeBg}`}>
          {reviews.length}
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3">
          {reviews.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-4 text-sm ${
              darkMode ? 'border-gray-800 text-gray-400' : 'border-stone-300 text-stone-500'
            }`}>
              {emptyText}
            </div>
          ) : (
            reviews.slice(0, 8).map(review => (
              <ReviewCard key={review.id} review={review} darkMode={darkMode} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Stars({ score = 0, totalReviews = 0 }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={15}
          className={index < Math.round(score) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
        />
      ))}
      <span className="text-sm text-gray-500">
        {score ? score.toFixed(1) : 'New'} - {totalReviews} review{totalReviews === 1 ? '' : 's'}
      </span>
    </div>
  );
}

const SellerProfilePage = () => {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const { user } = useAuth();

  const [listings,      setListings]      = useState([]);
  const [sellerReviews, setSellerReviews] = useState([]);
  const [buyerReviews,  setBuyerReviews]  = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ average_rating: 0, total_reviews: 0 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [reportOpen,  setReportOpen]  = useState(false);

  useEffect(() => {
    let active = true;

    const loadSeller = async () => {
      if (!sellerId) {
        setError('Seller not found.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [listingData, asSellerData, asBuyerData] = await Promise.all([
          getAllListings({ status: 'active', page_size: 100 }),
          getReviewsForUser(sellerId, { asSeller: true }),
          getReviewsForUser(sellerId, { asBuyer: true }),
        ]);

        if (!active) return;

        const allListings = Array.isArray(listingData)
          ? listingData
          : listingData?.results || [];
        const sellerListings   = allListings.filter((listing) => getListingSellerId(listing) === String(sellerId));
        const asSeller         = sortByNewest(Array.isArray(asSellerData) ? asSellerData : []);
        const asBuyer          = sortByNewest(Array.isArray(asBuyerData)  ? asBuyerData  : []);
        const totalReviews     = asSeller.length;
        const totalScore       = asSeller.reduce((sum, r) => sum + (Number(r.score) || 0), 0);

        setListings(sellerListings);
        setSellerReviews(asSeller);
        setBuyerReviews(asBuyer);
        setReviewSummary({
          average_rating: totalReviews > 0 ? totalScore / totalReviews : 0,
          total_reviews:  totalReviews,
        });
      } catch (loadError) {
        if (!active) return;
        setError(loadError.message || 'Could not load seller profile.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSeller();

    return () => {
      active = false;
    };
  }, [sellerId]);

  const sellerName = useMemo(() => {
    const firstReview = sellerReviews[0] || buyerReviews[0];
    return (
      listings[0]?.seller_name ||
      getRevieweeName(firstReview) ||
      (user?.id === sellerId ? user?.full_name : '') ||
      'KU Student'
    );
  }, [listings, sellerReviews, buyerReviews, sellerId, user?.full_name, user?.id]);

  const isOwnProfile = normalizeId(user?.id) === String(sellerId);

  const sellerProfilePicture = useMemo(() =>
    listings[0]?.seller_profile_picture ||
    (isOwnProfile ? user?.profile_picture : null),
  [listings, isOwnProfile, user?.profile_picture]);

  if (loading) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-stone-50'}`}>
        <DashboardNavbar />
        <div className="flex min-h-[60vh] items-center justify-center pt-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            <p className={darkMode ? 'text-gray-400' : 'text-stone-500'}>Loading seller profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-stone-50'}`}>
        <DashboardNavbar />
        <div className="mx-auto max-w-3xl px-4 py-28">
          <div className={`rounded-[28px] border p-8 text-center ${
            darkMode ? 'border-gray-800 bg-gray-900 text-gray-300' : 'border-stone-200 bg-white text-stone-700'
          }`}>
            <p className="text-lg font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mt-5 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-stone-50'}`}>
      <DashboardNavbar />
      <div className="h-16" />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <BackButton darkMode={darkMode} onClick={() => navigate(-1)} />

        <div className={`mt-6 overflow-hidden rounded-[32px] border ${
          darkMode ? 'border-gray-800 bg-gray-900' : 'border-stone-200 bg-white'
        }`}>
          <div className={`border-b px-6 py-7 ${darkMode ? 'border-gray-800' : 'border-stone-200'}`}>
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar src={sellerProfilePicture} name={sellerName} size="w-16 h-16" textSize="text-2xl" />
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-emerald-500">
                    {isOwnProfile ? 'Your seller profile' : 'Seller profile'}
                  </p>
                  <h1 className={`mt-2 text-3xl font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                    {sellerName}
                  </h1>
                  <div className="mt-2">
                    <Stars
                      score={reviewSummary.average_rating}
                      totalReviews={reviewSummary.total_reviews}
                    />
                  </div>
                  {!isOwnProfile && (
                    <button
                      onClick={() => setReportOpen(true)}
                      className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Flag size={11} />
                      Report this seller
                    </button>
                  )}
                </div>
              </div>

              {!isOwnProfile && (
                <ReportModal
                  sellerId={sellerId}
                  sellerName={sellerName}
                  isOpen={reportOpen}
                  onClose={() => setReportOpen(false)}
                />
              )}

              <div className="grid grid-cols-2 gap-3 sm:w-auto">
                <div className={`rounded-3xl border px-4 py-3 ${
                  darkMode ? 'border-gray-800 bg-gray-950' : 'border-stone-200 bg-stone-50'
                }`}>
                  <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>
                    Active listings
                  </p>
                  <p className={`mt-2 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                    {listings.length}
                  </p>
                </div>
                <div className={`rounded-3xl border px-4 py-3 ${
                  darkMode ? 'border-gray-800 bg-gray-950' : 'border-stone-200 bg-stone-50'
                }`}>
                  <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>
                    Rating
                  </p>
                  <p className={`mt-2 text-2xl font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                    {reviewSummary.total_reviews ? reviewSummary.average_rating.toFixed(1) : 'New'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className={`text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>
                    Listings
                  </p>
                  <h2 className={`mt-1 text-xl font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                    What {isOwnProfile ? 'you have' : 'this seller has'} available
                  </h2>
                </div>
                {isOwnProfile && (
                  <Link
                    to="/my-listings"
                    className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Manage listings
                  </Link>
                )}
              </div>

              {listings.length === 0 ? (
                <div className={`rounded-3xl border p-6 ${
                  darkMode ? 'border-gray-800 bg-gray-950 text-gray-400' : 'border-stone-200 bg-stone-50 text-stone-500'
                }`}>
                  No active listings right now.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {listings.map((listing) => {
                    const imageUrl = getImageUrl(listing);
                    const isService = listing.listing_type === 'service';

                    return (
                      <Link
                        key={listing.id}
                        to={`/listings/${listing.id}`}
                        className={`overflow-hidden rounded-3xl border transition-all hover:-translate-y-0.5 ${
                          darkMode
                            ? 'border-gray-800 bg-gray-950 hover:border-emerald-800'
                            : 'border-stone-200 bg-stone-50 hover:border-emerald-300'
                        }`}
                      >
                        <div className={`aspect-[4/3] w-full ${darkMode ? 'bg-gray-800' : 'bg-stone-100'}`}>
                          {imageUrl ? (
                            <img src={imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              {isService ? (
                                <Wrench className="h-8 w-8 text-emerald-500" />
                              ) : (
                                <Package className="h-8 w-8 text-emerald-500" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="space-y-3 p-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isService
                                ? 'bg-purple-100 text-purple-700'
                                : darkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {isService ? <Wrench size={12} /> : <Package size={12} />}
                              {isService ? 'Service' : 'Good'}
                            </span>
                            <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-stone-500'}`}>
                              {CATEGORY_LABELS[listing.category] || listing.category || 'Other'}
                            </span>
                          </div>
                          <div>
                            <p className={`line-clamp-2 text-base font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                              {listing.title}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-emerald-600">
                              {formatMoney(listing.price)}
                            </p>
                          </div>
                          {listing.area_of_operation && (
                            <div className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-stone-500'}`}>
                              <MapPin size={14} className="text-emerald-500" />
                              <span className="truncate">{listing.area_of_operation}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-4">

              {/* ── Reviews as a Seller ── */}
              <ReviewGroup
                title="Reviews as a Seller"
                subtitle={`${sellerReviews.length} review${sellerReviews.length === 1 ? '' : 's'} from buyers`}
                reviews={sellerReviews}
                emptyText="No seller reviews yet. Reviews from buyers will appear here after completed sales."
                darkMode={darkMode}
                accentColor="emerald"
              />

              {/* ── Reviews as a Buyer ── */}
              <ReviewGroup
                title="Reviews as a Buyer"
                subtitle={`${buyerReviews.length} review${buyerReviews.length === 1 ? '' : 's'} from sellers`}
                reviews={buyerReviews}
                emptyText="No buyer reviews yet. Reviews from sellers will appear here after completed purchases."
                darkMode={darkMode}
                accentColor="cyan"
              />

              <div className={`rounded-3xl border p-5 ${
                darkMode ? 'border-gray-800 bg-gray-950' : 'border-stone-200 bg-stone-50'
              }`}>
                <div className="flex items-center gap-3">
                  <UserRound className="h-5 w-5 text-emerald-500" />
                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-stone-700'}`}>
                    Contact details stay private until a transaction is created.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfilePage;
