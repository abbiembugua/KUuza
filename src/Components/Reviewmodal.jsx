import React, { useState } from 'react';
import { X, Star, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://127.0.0.1:8000/api';

const SCORE_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

// ── Star rating widget ────────────────────────────────────────────────────────

function StarWidget({ score, onChange, darkMode }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={36}
              className={`transition-colors ${
                star <= (hovered || score)
                  ? 'text-amber-400 fill-amber-400'
                  : darkMode ? 'text-gray-600' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      {(hovered || score) > 0 && (
        <span className={`text-sm font-semibold transition-all ${
          darkMode ? 'text-amber-400' : 'text-amber-500'
        }`}>
          {SCORE_LABELS[hovered || score]}
        </span>
      )}
    </div>
  );
}

// ── ReviewModal ───────────────────────────────────────────────────────────────

/**
 * Props:
 *   isOpen         — boolean
 *   onClose        — () => void
 *   onSubmitted    — () => void  (called after successful submission)
 *   transactionId  — uuid string
 *   reviewee       — { id, full_name }
 *   listingTitle   — string
 *   token          — JWT token string
 *   darkMode       — boolean
 */
const ReviewModal = ({
  isOpen,
  onClose,
  onSubmitted,
  transactionId,
  reviewee,
  listingTitle,
  token,
  darkMode,
}) => {
  const [score,     setScore]     = useState(0);
  const [comment,   setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (score === 0) {
      toast.error('Please select a star rating before submitting.');
      return;
    }
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
          reviewee:       reviewee.id,
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
      toast.success('Review submitted — thank you!');
      setTimeout(() => {
        onSubmitted?.();
        onClose();
        // Reset for reuse
        setScore(0);
        setComment('');
        setSubmitted(false);
      }, 1800);

    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
    setScore(0);
    setComment('');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
        w-full max-w-md mx-4 rounded-2xl shadow-2xl transition-all
        ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
      >
        {submitted ? (
          // Success state
          <div className="p-8 flex flex-col items-center text-center">
            <CheckCircle size={56} className="text-green-500 mb-4" />
            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Review submitted!
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Thank you for your feedback.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className={`flex items-center justify-between p-5 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-100'
            }`}>
              <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Leave a Review
              </h3>
              <button
                onClick={handleSkip}
                className={`p-1.5 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">

              {/* Who you are rating */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                  {reviewee?.full_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Rating your experience with
                  </p>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {reviewee?.full_name || 'KU Student'}
                  </p>
                </div>
              </div>

              {/* Listing context */}
              {listingTitle && (
                <p className={`text-xs px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-500'
                }`}>
                  Re: <span className="font-medium">{listingTitle}</span>
                </p>
              )}

              {/* Star widget */}
              <div className="py-2">
                <StarWidget score={score} onChange={setScore} darkMode={darkMode} />
              </div>

              {/* Comment */}
              <div>
                <label className={`text-xs font-semibold uppercase tracking-wider block mb-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Comment <span className="font-normal normal-case">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  maxLength={300}
                  placeholder="Tell others about your experience..."
                  className={`w-full p-3 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-600'
                      : 'bg-white border-gray-200 placeholder-gray-400 focus:border-emerald-600'
                  }`}
                />
                <p className={`text-xs mt-1 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {comment.length}/300
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className={`flex gap-3 p-5 border-t ${
              darkMode ? 'border-gray-700' : 'border-gray-100'
            }`}>
              <button
                onClick={handleSkip}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Skip for now
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || score === 0}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${
                  score === 0 || submitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={15} className="animate-spin" />
                    Submitting...
                  </span>
                ) : 'Submit Review'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ReviewModal;