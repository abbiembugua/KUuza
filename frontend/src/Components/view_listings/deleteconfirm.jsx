// src/Components/Listings/DeleteConfirmModal.jsx

import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

const DeleteConfirmModal = ({ listing, onClose, onConfirm, darkMode }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-2xl shadow-2xl max-w-md w-full`}
      >
        {/* Icon */}
        <div className="pt-8 flex justify-center">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4">
            <AlertTriangle size={40} className="text-red-600" />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center space-y-4">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Delete Listing?
          </h2>

          <div className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            <p>Are you sure you want to delete this listing?</p>
            <p className={`font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              "{listing.title}"
            </p>
            <p className="text-sm text-red-600">
              This action cannot be undone.
            </p>
          </div>

          {/* Listing Preview */}
          <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <div className="flex gap-3">
              {listing.images && listing.images.length > 0 && (
                <img
                  src={listing.images[0].image}
                  alt={listing.title}
                  className="w-16 h-16 rounded object-cover"
                />
              )}
              <div className="flex-1 text-left">
                <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {listing.title}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {listing.category} • KES {listing.price || 'Negotiable'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex gap-3 p-8 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            disabled={loading}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            } disabled:opacity-50`}
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {loading ? 'Deleting...' : 'Delete Listing'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
