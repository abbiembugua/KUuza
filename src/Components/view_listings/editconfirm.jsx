// src/Components/Listings/EditListingModal.jsx
// Modal for editing listing details

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast'; // Replace toastService import

const EditListingModal = ({ listing, onClose, onSave, darkMode }) => {
  const [formData, setFormData] = useState({
    title: listing.title,
    category: listing.category,
    description: listing.description,
    price: listing.price,
    negotiable: listing.negotiable,
    condition: listing.condition,
    area_of_operation: listing.area_of_operation,
    contact_preference: listing.contact_preference,
    whatsapp_number: listing.whatsapp_number,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categories = [
    'Books', 'Electronics', 'Fashion', 'Furniture',
    'Services', 'Food & Beverages', 'Other'
  ];

  const conditions = ['New', 'Like New', 'Used', 'Fair'];

  const isService = formData.category === 'Services';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.negotiable && !formData.price) {
      newErrors.price = 'Enter a price or mark as negotiable';
    }
    if (formData.contact_preference === 'whatsapp' && !formData.whatsapp_number.trim()) {
      newErrors.whatsapp_number = 'WhatsApp number is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1f2937',
          border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        }
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare data for API
      const updateData = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        negotiable: formData.negotiable,
        condition: formData.condition || '',
        area_of_operation: formData.area_of_operation,
        contact_preference: formData.contact_preference,
        whatsapp_number: formData.whatsapp_number || '',
      };

      // Add price if not negotiable
      if (!formData.negotiable && formData.price) {
        updateData.price = parseFloat(formData.price);
      }

      await onSave(updateData);
      // Note: The success toast will be shown by the parent component (MyListingsPage)
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save changes', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`${
          darkMode ? 'bg-gray-800' : 'bg-white'
        } rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Edit Listing
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-gray-700 text-gray-400'
                : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Title */}
          <div>
            <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full p-3 rounded-xl border-2 transition-all ${
                errors.title
                  ? 'border-red-500'
                  : darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-300 focus:border-blue-500'
              } focus:outline-none`}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Category */}
          <div>
            <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className={`w-full p-3 rounded-xl border-2 transition-all ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-300 focus:border-blue-500'
              } focus:outline-none`}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              maxLength={500}
              rows={4}
              className={`w-full p-3 rounded-xl border-2 transition-all resize-none ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-300 focus:border-blue-500'
              } focus:outline-none`}
            />
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {formData.description.length}/500
            </p>
          </div>

          {/* Condition (if not service) */}
          {!isService && (
            <div>
              <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Condition
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-xl border-2 transition-all ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } focus:outline-none`}
              >
                <option value="">Select condition</option>
                {conditions.map(cond => (
                  <option key={cond} value={cond}>{cond}</option>
                ))}
              </select>
            </div>
          )}

          {/* Price */}
          <div>
            <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Price
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              disabled={formData.negotiable}
              className={`w-full p-3 rounded-xl border-2 transition-all ${
                errors.price
                  ? 'border-red-500'
                  : darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-300 focus:border-blue-500'
              } ${formData.negotiable ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none`}
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            
            <label className={`flex items-center gap-2 mt-2 cursor-pointer ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              <input
                type="checkbox"
                name="negotiable"
                checked={formData.negotiable}
                onChange={handleInputChange}
                className="w-4 h-4"
              />
              <span className="font-medium">Price is negotiable</span>
            </label>
          </div>

          {/* Area of Operation */}
          <div>
            <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Area of Operation / Pickup Point
            </label>
            <input
              type="text"
              name="area_of_operation"
              value={formData.area_of_operation}
              onChange={handleInputChange}
              className={`w-full p-3 rounded-xl border-2 transition-all ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-300 focus:border-blue-500'
              } focus:outline-none`}
            />
          </div>

          {/* Contact Preference */}
          <div>
            <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Contact Preference
            </label>
            <select
              name="contact_preference"
              value={formData.contact_preference}
              onChange={handleInputChange}
              className={`w-full p-3 rounded-xl border-2 transition-all ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                  : 'bg-white border-gray-300 focus:border-blue-500'
              } focus:outline-none`}
            >
              <option value="email">📧 Email</option>
              <option value="whatsapp">📱 WhatsApp</option>
            </select>
          </div>

          {/* WhatsApp Number */}
          {formData.contact_preference === 'whatsapp' && (
            <div>
              <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                WhatsApp Number *
              </label>
              <input
                type="tel"
                name="whatsapp_number"
                value={formData.whatsapp_number}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-xl border-2 transition-all ${
                  errors.whatsapp_number
                    ? 'border-red-500'
                    : darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } focus:outline-none`}
              />
              {errors.whatsapp_number && (
                <p className="text-red-500 text-sm mt-1">{errors.whatsapp_number}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
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
              type="submit"
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditListingModal;