import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import { useTheme } from '../context/Themecontext';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://127.0.0.1:8000/api';

const SCORE_LABELS = {
  1: 'Poor — very disappointed',
  2: 'Fair — below expectations',
  3: 'Okay — nothing special',
  4: 'Good — happy with this',
  5: 'Excellent — highly recommend',
};

// ── Star widget ───────────────────────────────────────────────────────────────

function StarWidget({ score, onChange, darkMode }) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || score;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-3">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
          >
            <Star
              size={44}
              className={`transition-all duration-150 ${
                star <= active
                  ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                  : darkMode ? 'text-gray-700' : 'text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
      <span className={`text-base font-semibold min-h-[1.5rem] transition-all ${
        active > 0
          ? darkMode ? 'text-amber-400' : 'text-amber-500'
          : darkMode ? 'text-gray-600' : 'text-gray-300'
      }`}>
        {active > 0 ? SCORE_LABELS[active] : 'Tap a star to rate'}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

/**
 * Route: /review/:transactionId
 *
 * Accepts optional query params:
 *   ?reviewee_id=uuid
 *   ?reviewee_name=string
 *   ?listing_title=string
 *
 * These are passed from the Purchases page when the user clicks "Leave a Review".
 */
const ReviewPage = () => {
  const { transactionId } = useParams();
  const navigate          = useNavigate();
  const { darkMode }      = useTheme();
  const { token, user }   = useAuth();

  const params       = new URLSearchParams(window.location.search);
  const revieweeId   = params.get('reviewee_id');
  const revieweeName = params.get('reviewee_name') || 'KU Student';
  const listingTitle = params.get('listing_title') || '';

  const [score,       setScore]       = useState(0);
  const [comment,     setComment]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [checking,    setChecking]    = useState(true);

  // Check if user already reviewed this transaction
  useEffect(() => {
    if (!token || !transactionId) { setChecking(false); return; }
    const check = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/reviews/check/?transaction_id=${transactionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setAlreadyDone(data.has_reviewed);
        }
      } catch {}
      finally { setChecking(false); }
    };
    check();
  }, [transactionId, token]);

  const handleSubmit = async () => {
    if (!token) { toast.error('Please log in first.'); return; }
    if (score === 0) { toast.error('Please select a star rating.'); return; }
    if (!revieweeId) { toast.error('Missing reviewee information.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/reviews/`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          transaction_id: transactionId,
          reviewee:       revieweeId,
          listing_title:  listingTitle,
          score,
          comment,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(
          err.non_field_errors?.[0] ||
          err.detail ||
          'Could not submit review'
        );
      }

      setSubmitted(true);

    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading check ──────────────────────────────────────────────────────────
  if (checking) return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar />
      <div className="pt-24 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    </div>
  );

  // ── Already reviewed ───────────────────────────────────────────────────────
  if (alreadyDone) return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar />
      <div className="pt-24 flex items-center justify-center px-4">
        <div className={`max-w-sm w-full text-center p-8 rounded-2xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } shadow`}>
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Already reviewed
          </h2>
          <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            You have already submitted a review for this transaction.
          </p>
          <button
            onClick={() => navigate('/purchases')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm"
          >
            Back to Purchases
          </button>
        </div>
      </div>
    </div>
  );

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitted) return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar />
      <div className="pt-24 flex items-center justify-center px-4">
        <div className={`max-w-sm w-full text-center p-8 rounded-2xl ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } shadow`}>
          {/* Star display */}
          <div className="flex justify-center gap-1 mb-5">
            {[1,2,3,4,5].map(s => (
              <Star
                key={s}
                size={28}
                className={s <= score ? 'text-amber-400 fill-amber-400' : darkMode ? 'text-gray-700' : 'text-gray-200'}
              />
            ))}
          </div>
          <CheckCircle size={52} className="mx-auto mb-4 text-green-500" />
          <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Thank you!
          </h2>
          <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Your review for{' '}
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {revieweeName}
            </span>{' '}
            has been submitted.
          </p>
          {comment && (
            <p className={`text-sm italic mt-3 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              &ldquo;{comment}&rdquo;
            </p>
          )}
          <div className="flex gap-3 mt-7">
            <button
              onClick={() => navigate('/purchases')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              My Purchases
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              Browse More
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster toastOptions={{ style: { borderRadius: '10px', padding: '14px' } }} />
      <DashboardNavbar />

      <div className="pt-20 pb-16">
        <div className="max-w-lg mx-auto px-4 pt-6">

          {/* Back */}
          <button
            onClick={() => navigate('/purchases')}
            className={`flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors ${
              darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ArrowLeft size={16} />
            Back to Purchases
          </button>

          <div className={`rounded-2xl shadow-sm overflow-hidden ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>

            {/* Header */}
            <div className={`px-6 pt-6 pb-4 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-100'
            }`}>
              <h1 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                How was your experience?
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Your honest feedback helps the KU Marketplace community.
              </p>
            </div>

            <div className="p-6 space-y-6">

              {/* Who you are reviewing */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {revieweeName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    You are reviewing
                  </p>
                  <p className={`font-bold text-lg leading-tight ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {revieweeName}
                  </p>
                  {listingTitle && (
                    <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Re: {listingTitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Star rating */}
              <div className={`py-4 px-4 rounded-xl ${
                darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <StarWidget score={score} onChange={setScore} darkMode={darkMode} />
              </div>

              {/* Comment */}
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Write a comment <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                  maxLength={300}
                  placeholder="Tell others what your experience was like — was the item as described? Was the seller responsive and easy to deal with?"
                  className={`w-full p-3 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-blue-500'
                      : 'bg-white border-gray-200 placeholder-gray-400 focus:border-blue-500'
                  }`}
                />
                <p className={`text-xs mt-1 text-right ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {comment.length}/300
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => navigate('/purchases')}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    darkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Skip for now
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || score === 0}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all ${
                    score === 0 || submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Submitting...
                    </span>
                  ) : 'Submit Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;