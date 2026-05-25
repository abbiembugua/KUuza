import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { deleteListingImage, uploadListingImages } from '../../api/listingsapi';

const GOOD_CATEGORIES = [
  { value: 'books',          label: 'Academics' },
  { value: 'electronics',    label: 'Electronics' },
  { value: 'fashion',        label: 'Fashion' },
  { value: 'furniture',      label: 'Furniture' },
  { value: 'food_beverages', label: 'Food & Beverages' },
  { value: 'beauty',         label: 'Beauty & Accessories' },
  { value: 'stationery',     label: 'Stationery & Supplies' },
  { value: 'sports',         label: 'Sports & Fitness' },
  { value: 'other',          label: 'Other' },
];

const SERVICE_CATEGORIES = [
  { value: 'tutoring',       label: 'Tutoring & Academics' },
  { value: 'printing',       label: 'Printing & Photocopying' },
  { value: 'design',         label: 'Design & Creative' },
  { value: 'tech_repair',    label: 'Tech & Repairs' },
  { value: 'laundry',        label: 'Laundry & Cleaning' },
  { value: 'photography',    label: 'Photography & Video' },
  { value: 'beauty',         label: 'Beauty' },
  { value: 'food_beverages', label: 'Food & Beverages' },
  { value: 'fashion',        label: 'Fashion' },
  { value: 'other',          label: 'Other' },
];

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'used', label: 'Used' },
  { value: 'fair', label: 'Fair' },
];

const EditListingModal = ({ listing, onClose, onSave, darkMode }) => {
  const [formData, setFormData] = useState({
    title: listing.title || '',
    category: listing.category || 'other',
    listing_type: listing.listing_type || (listing.category === 'services' ? 'service' : 'good'),
    description: listing.description || '',
    price: listing.price || '',
    condition: listing.condition || '',
    quantity: listing.quantity || 1,
    area_of_operation: listing.area_of_operation || '',
    contact_preference: listing.contact_preference || 'email',
    contact_value: listing.contact_value || listing.whatsapp_number || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Image state ────────────────────────────────────────────────────────────
  const [existingImages, setExistingImages] = useState(listing.images || []);
  const [deletedImageIds, setDeletedImageIds] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => { newPreviews.forEach(url => URL.revokeObjectURL(url)); };
  }, [newPreviews]);

  const isService = formData.listing_type === 'service';

  const activeExistingCount = existingImages.filter(img => !deletedImageIds.includes(img.id)).length;
  const totalImageCount = activeExistingCount + newFiles.length;
  const remainingSlots = 5 - totalImageCount;

  const handleRemoveExisting = (imageId) => {
    setDeletedImageIds(prev => [...prev, imageId]);
  };

  const handleRemoveNew = (index) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files || []);
    const allowed = picked.slice(0, remainingSlots);
    const previews = allowed.map(f => URL.createObjectURL(f));
    setNewFiles(prev => [...prev, ...allowed]);
    setNewPreviews(prev => [...prev, ...previews]);
    e.target.value = '';
  };

  const controlClassName = (field) => `w-full p-3 rounded-xl border-2 transition-all focus:outline-none ${
    errors[field]
      ? 'border-red-500'
      : darkMode
      ? 'bg-gray-700 border-gray-600 text-white focus:border-emerald-500'
      : 'bg-white border-gray-300 focus:border-emerald-500'
  }`;

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormData((current) => {
      const nextState = {
        ...current,
        [name]: nextValue,
      };

      // Category change doesn't switch listing_type — user controls that via the type toggle

      return nextState;
    });

    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.title.trim()) nextErrors.title = 'Title is required';
    if (!formData.category) nextErrors.category = 'Category is required';

    const remainingExisting = existingImages.filter(img => !deletedImageIds.includes(img.id));
    if (remainingExisting.length === 0 && newFiles.length === 0) {
      nextErrors.images = 'A listing must have at least one image.';
    }

    if (!formData.price) {
      nextErrors.price = 'A price is required';
    } else if (parseFloat(formData.price) < 1) {
      nextErrors.price = 'Price must be at least KSh 1';
    }

    if (!isService && (!formData.quantity || Number(formData.quantity) < 1)) {
      nextErrors.quantity = 'Quantity must be at least 1';
    }

    if (!formData.contact_value.trim()) {
      nextErrors.contact_value = formData.contact_preference === 'whatsapp'
        ? 'WhatsApp number is required'
        : 'Email address is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1f2937',
          border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        },
      });
      return;
    }

    try {
      setLoading(true);

      // Delete removed images first
      for (const imageId of deletedImageIds) {
        await deleteListingImage(listing.id, imageId);
      }

      // Upload new images if any
      if (newFiles.length > 0) {
        await uploadListingImages(listing.id, newFiles);
      }

      const updateData = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description,
        condition: isService ? '' : formData.condition || '',
        area_of_operation: formData.area_of_operation,
        contact_preference: formData.contact_preference,
        contact_value: formData.contact_value || '',
      };

      if (formData.price) {
        updateData.price = parseFloat(formData.price);
      }

      if (!isService) {
        updateData.quantity = Math.max(1, parseInt(formData.quantity, 10) || 1);
      }

      await onSave(updateData);
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save changes', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl shadow-2xl`}>
        <div className={`flex items-center justify-between border-b p-6 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Edit Listing</h2>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition-colors ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className={`mb-2 block font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleInputChange} className={controlClassName('title')} />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
          </div>

          <div>
            <label className={`mb-2 block font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Category *</label>
            <select name="category" value={formData.category} onChange={handleInputChange} className={controlClassName('category')}>
              <option value="">Select a category</option>
              {(isService ? SERVICE_CATEGORIES : GOOD_CATEGORIES).map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`mb-2 block font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              maxLength={500}
              rows={4}
              className={`${controlClassName('description')} resize-none`}
            />
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formData.description.length}/500</p>
          </div>

          {!isService && (
            <div>
              <label className={`mb-2 block font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Condition</label>
              <select name="condition" value={formData.condition} onChange={handleInputChange} className={controlClassName('condition')}>
                <option value="">Select condition</option>
                {CONDITION_OPTIONS.map((condition) => (
                  <option key={condition.value} value={condition.value}>{condition.label}</option>
                ))}
              </select>
            </div>
          )}

          {!isService && (
            <div>
              <label className={`mb-2 block font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Quantity</label>
              <input type="number" min="1" name="quantity" value={formData.quantity} onChange={handleInputChange} className={controlClassName('quantity')} />
              {errors.quantity && <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>}
            </div>
          )}

          <div>
            <label className={`mb-2 block font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Price</label>
            <input
              type="number"
              name="price"
              min="1"
              value={formData.price}
              onChange={handleInputChange}
              className={controlClassName('price')}
            />
            {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
          </div>

          <div>
            <label className={`mb-2 block font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Area of Operation / Pickup Point</label>
            <input type="text" name="area_of_operation" value={formData.area_of_operation} onChange={handleInputChange} className={controlClassName('area_of_operation')} />
          </div>

          <div>
            <label className={`mb-2 block font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Contact Preference</label>
            <select name="contact_preference" value={formData.contact_preference} onChange={handleInputChange} className={controlClassName('contact_preference')}>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>

          {formData.contact_preference === 'whatsapp' && (
            <div>
              <label className={`mb-2 block font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>WhatsApp Number *</label>
              <input type="tel" name="contact_value" value={formData.contact_value} onChange={handleInputChange} className={controlClassName('contact_value')} />
              {errors.contact_value && <p className="mt-1 text-sm text-red-500">{errors.contact_value}</p>}
            </div>
          )}

          {formData.contact_preference === 'email' && (
            <div>
              <label className={`mb-2 block font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Email Address *</label>
              <input type="email" name="contact_value" value={formData.contact_value} onChange={handleInputChange} className={controlClassName('contact_value')} />
              {errors.contact_value && <p className="mt-1 text-sm text-red-500">{errors.contact_value}</p>}
            </div>
          )}

          {/* ── Images ── */}
          <div>
            <label className={`mb-2 block font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Photos <span className={`text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>({totalImageCount}/5)</span>
            </label>

            <div className="grid grid-cols-5 gap-2">
              {/* Existing images */}
              {existingImages
                .filter(img => !deletedImageIds.includes(img.id))
                .map(img => (
                  <div key={img.id} className="relative group aspect-square">
                    <img
                      src={img.image.startsWith('http') ? img.image : `http://127.0.0.1:8000${img.image}`}
                      alt="listing"
                      className="h-full w-full rounded-xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(img.id)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}

              {/* New image previews */}
              {newPreviews.map((src, i) => (
                <div key={`new-${i}`} className="relative group aspect-square">
                  <img src={src} alt="new" className="h-full w-full rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNew(i)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}

              {/* Add more slot */}
              {remainingSlots > 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-colors ${
                    darkMode
                      ? 'border-gray-600 text-gray-500 hover:border-emerald-500 hover:text-emerald-400'
                      : 'border-gray-300 text-gray-400 hover:border-emerald-500 hover:text-emerald-500'
                  }`}
                >
                  <ImagePlus size={18} />
                  <span className="text-xs">Add</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFileChange}
            />

            {errors.images && (
              <p className="mt-1.5 text-xs text-red-500">{errors.images}</p>
            )}
            <p className={`mt-1.5 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Hover an image and click × to remove it. At least 1 photo required, up to 5.
            </p>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex-1 rounded-xl py-3 font-semibold transition-colors ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} disabled:opacity-50`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-xl py-3 font-semibold text-white transition-all ${loading ? 'cursor-not-allowed bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              <span className="flex items-center justify-center gap-2">
                {loading && <Loader2 className="animate-spin" size={20} />}
                {loading ? 'Saving...' : 'Save Changes'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListingModal;
