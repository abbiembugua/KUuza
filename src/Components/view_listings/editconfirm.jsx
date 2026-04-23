import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CATEGORY_OPTIONS = [
  { value: 'books', label: 'Books' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'food_beverages', label: 'Food & Beverages' },
  { value: 'services', label: 'Services' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'other', label: 'Other' },
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
    negotiable: Boolean(listing.negotiable),
    condition: listing.condition || '',
    quantity: listing.quantity || 1,
    area_of_operation: listing.area_of_operation || '',
    contact_preference: listing.contact_preference || 'email',
    contact_value: listing.contact_value || listing.whatsapp_number || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const isService = formData.listing_type === 'service';

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

      if (name === 'category') {
        const nextIsService = value === 'services';
        nextState.listing_type = nextIsService ? 'service' : 'good';

        if (nextIsService) {
          nextState.condition = '';
          nextState.quantity = 1;
        }
      }

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

    if (!formData.negotiable && !formData.price) {
      nextErrors.price = 'Enter a price or mark as negotiable';
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

      const updateData = {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description,
        negotiable: formData.negotiable,
        condition: isService ? '' : formData.condition || '',
        area_of_operation: formData.area_of_operation,
        contact_preference: formData.contact_preference,
        contact_value: formData.contact_value || '',
      };

      if (!formData.negotiable && formData.price) {
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
              {CATEGORY_OPTIONS.map((category) => (
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
              value={formData.price}
              onChange={handleInputChange}
              disabled={formData.negotiable}
              className={`${controlClassName('price')} ${formData.negotiable ? 'cursor-not-allowed opacity-50' : ''}`}
            />
            {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}

            <label className={`mt-2 flex cursor-pointer items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              <input type="checkbox" name="negotiable" checked={formData.negotiable} onChange={handleInputChange} className="h-4 w-4" />
              <span className="font-medium">Price is negotiable</span>
            </label>
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
              className={`flex-1 rounded-xl py-3 font-semibold text-white transition-all ${loading ? 'cursor-not-allowed bg-gray-400' : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700'}`}
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
