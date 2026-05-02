import React, { useState } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { updateReview } from '../api/reviewsapi';

const SCORE_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

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
            className="transition-transform hover:scale-110 active:scale-95 focus:outline-none"
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
        <span className={`text-sm font-semibold ${darkMode ? 'text-amber-400' : 'text-amber-500'}`}>
          {SCORE_LABELS[hovered || score]}
        </span>
      )}
    </div>
  );
}

/**
 * Props:
 *   review    — { id, score, comment, reviewee_name, listing_title }
 *   onClose   — () => void
 *   onSaved   — (updatedReview) => void
 *   darkMode  — boolean
 */
const EditReviewModal = ({ review, onClose, onSaved, darkMode }) => {
  const [score,   setScore]   = useState(review.score || 0);
  const [comment, setComment] = useState(review.comment || '');
  const [loading, setLoading] = useState(false);

  const revieweeName =
    review.reviewee_name ||
    review.reviewee_full_name ||
    review.reviewee?.full_name ||
    'KU Student';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (score === 0) {
      toast.error('Please select a star rating.');
      return;
    }
    setLoading(true);
    try {
      const updated = await updateReview(review.id, { score, comment });
      toast.success('Review updated successfully.');
      onSaved(updated);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Could not update review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>

        {/* Header */}
        <div className={`flex items-center justify-between border-b p-5 ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Edit Review
          </h2>
          <button
            onClick={onClose}
            className={`rounded-lg p-1.5 transition-colors ${
              darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Context */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {revieweeName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Your review of
              </p>
              <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {revieweeName}
              </p>
              {review.listing_title && (
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Re: {review.listing_title}
                </p>
              )}
            </div>
          </div>

          {/* Stars */}
          <div className={`py-3 px-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <StarWidget score={score} onChange={setScore} darkMode={darkMode} />
          </div>

          {/* Comment */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
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
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500'
                  : 'bg-white border-gray-300 placeholder-gray-400 focus:border-emerald-500'
              }`}
            />
            <p className={`text-xs mt-1 text-right ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {comment.length}/300
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 rounded-xl py-3 font-semibold transition-colors disabled:opacity-50 ${
                darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || score === 0}
              className={`flex-1 rounded-xl py-3 font-semibold text-white transition-all ${
                loading || score === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Saving...' : 'Save Changes'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReviewModal;
