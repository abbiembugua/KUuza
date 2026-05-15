import React from 'react';
import { Edit2, Trash2, Eye, EyeOff, Archive, ArchiveRestore } from 'lucide-react';

const ListingCard = ({ listing, onEdit, onDelete, onTogglePublish, onArchive, darkMode }) => {
  const imageUrl = listing.images?.length > 0 ? listing.images[0].image : null;
  const isDeactivated = listing.status === 'deactivated';

  const statusBadge = isDeactivated
    ? { text: '📦 Archived', color: darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800' }
    : listing.is_draft
      ? { text: '📝 Draft', color: darkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800' }
      : { text: '✅ Published', color: darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800' };

  return (
    <div className={`${
      darkMode ? 'bg-gray-800' : 'bg-white'
    } rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${isDeactivated ? 'opacity-70' : ''}`}>

      {/* Image */}
      <div className="relative h-48 bg-gray-300 overflow-hidden group">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-400">
            <span className="text-4xl">📦</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusBadge.color}`}>
            {statusBadge.text}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className={`font-semibold text-lg mb-2 line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {listing.title}
        </h3>

        <div className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="font-medium">{listing.category}</p>
          <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {listing.price ? `KES ${parseFloat(listing.price).toLocaleString()}` : 'Price Negotiable'}
          </p>
        </div>

        <p className={`text-sm mb-4 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {listing.description || 'No description'}
        </p>

        <div className={`text-xs mb-4 space-y-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          <p>📍 {listing.area_of_operation || 'Location not specified'}</p>
          <p>📅 {new Date(listing.created_at).toLocaleDateString()}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            <Edit2 size={16} />
            Edit
          </button>

          <button
            onClick={onArchive}
            title={isDeactivated ? 'Reactivate listing' : 'Archive listing'}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
              isDeactivated
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                : darkMode
                  ? 'bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-300'
                  : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
            }`}
          >
            {isDeactivated ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          </button>

          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={onTogglePublish}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
              listing.is_draft
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
            title={listing.is_draft ? 'Publish' : 'Move to Draft'}
          >
            {listing.is_draft ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingCard;