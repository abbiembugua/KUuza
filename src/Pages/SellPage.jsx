import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, ArrowLeft, Zap } from 'lucide-react';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import { useTheme } from '../context/Themecontext';
import { createListing, uploadListingImages, refineListingWithAI } from '../api/api'
import { useAuth } from '../context/AuthContext';
import { Toaster, toast } from 'react-hot-toast'; 
import { useNavigate } from 'react-router-dom';


const SellPage = () => {
  const fileInputRef = useRef(null);
  const { darkMode } = useTheme();

  const [uploadingImages, setUploadingImages] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [refiningAI, setRefiningAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null); // ✅ NEW: Store AI suggestions separately
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    price: '',
    negotiable: false,
    quantity: 1,
    condition: '',
    areaOfOperation: '',
    contactPreference: 'email',
    whatsappNumber: '',
    images: []
  });

  const isService = formData.category === 'Services';

  // ✅ NEW: useEffect to handle AI suggestions display
  useEffect(() => {
    if (aiSuggestions) {
      showRefinementSummary(aiSuggestions);
      setAiSuggestions(null); // Reset after showing
    }
  }, [aiSuggestions]);

  const convertToSnakeCase = (obj) => {
    return {
      title: obj.title,
      category: obj.category,
      description: obj.description,
      price: obj.price,
      negotiable: obj.negotiable,
      quantity: obj.quantity,
      condition: obj.condition,
      area_of_operation: obj.areaOfOperation,
      contact_preference: obj.contactPreference,
      whatsapp_number: obj.whatsappNumber,
      is_draft: obj.is_draft || false
    };
  };

  const categories = [
    'Books',
    'Electronics',
    'Fashion',
    'Furniture',
    'Services',
    'Food & Beverages',
    'Other'
  ];

  const conditions = ['New', 'Like New', 'Used', 'Fair'];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Item name is required';
    if (!formData.category) newErrors.category = 'Category is required';

    if (!formData.negotiable && !formData.price) {
      newErrors.price = 'Enter a price or mark as negotiable';
    }

    if (!isService && formData.images.length === 0) {
      newErrors.images = 'Upload at least one image';
    }
    if (formData.contactPreference === 'whatsapp' && !formData.whatsappNumber.trim()) {
      newErrors.whatsappNumber = 'WhatsApp number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + previewImages.length > 5) {
      setErrors(prev => ({ ...prev, images: 'Maximum 5 images allowed' }));
      return;
    }
    setUploadingImages(true);
    const previews = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setPreviewImages(prev => [...prev, ...previews]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
    setErrors(prev => ({ ...prev, images: '' }));
    setUploadingImages(false);
  };

  const removeImage = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // ✅ UTILITY: Extract numeric price from range format
  const extractPriceFromRange = (priceString) => {
    if (!priceString) return '';
    
    // If it's already a number, return as is
    if (typeof priceString === 'number') return priceString.toString();
    
    // Convert to string if not already
    const str = String(priceString);
    
    // Try to extract the first number from "KES 500 - 3,000" format
    const matches = str.match(/\d+(?:,\d+)*/g);
    if (matches && matches.length > 0) {
      // Remove commas and return first number (lower bound of range)
      return matches[0].replace(/,/g, '');
    }
    
    return '';
  };

  // ✅ FIX: Main AI refinement handler
  const handleRefineWithAI = async () => {
    if (!formData.category || !formData.title) {
      toast.error('Please provide at least a title and category.', {
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
      setRefiningAI(true);

      console.log('📝 Sending to AI for refinement:');
      console.log('  Title:', formData.title);
      console.log('  Category:', formData.category);
      console.log('  Description:', formData.description);

      const data = await refineListingWithAI(
        formData.title,
        formData.category,
        formData.description,
        token
      );

      console.log('✅ AI Suggestions received:', data);

      // ✅ FIX: Extract numeric price from range
      const parsedPrice = extractPriceFromRange(data.suggestedPrice);
      
      console.log('💰 Suggested Price (parsed):', parsedPrice);
      console.log('💰 Suggested Price (original):', data.suggestedPrice);

      // ✅ FIX: Update form data with refined content
      setFormData(prev => ({
        ...prev,
        title: data.refinedTitle ?? prev.title,
        description: data.refinedDescription ?? prev.description,
        price: parsedPrice || prev.price
      }));

      // ✅ FIX: Store suggestions for display in useEffect
      setAiSuggestions(data);

    } catch (err) {
      console.error('❌ AI Refinement Error:', err);
      toast.error(err.message || 'Failed to refine listing. Please try again.', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fecaca',
        }
      });
    } finally {
      setRefiningAI(false);
    }
  };

  // ✅ NEW: Show refinement summary with toast
  const showRefinementSummary = (data) => {
    // Create a custom toast with confirm buttons
    const applySuggestions = () => {
      console.log('✅ User accepted AI suggestions');
      toast.success('AI suggestions applied successfully!', {
        duration: 3000,
        position: 'top-center',
      });
    };

    const rejectSuggestions = () => {
      console.log('❌ User rejected AI suggestions, reverting to previous state...');
      // Note: Form is already updated. User would need to manually revert if they click "Keep Original"
      // But since we've already updated form, we show this for confirmation
      toast('AI suggestions can be manually edited', {
        duration: 3000,
        position: 'top-center',
        icon: 'ℹ️',
        style: {
          background: darkMode ? '#374151' : '#f3f4f6',
          color: darkMode ? '#ffffff' : '#374151',
        }
      });
    };

    // Show a toast with custom content
    toast.custom((t) => (
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-4 rounded-lg border shadow-lg max-w-md`}>
        <div className="flex items-center gap-3 mb-3">
          <Zap className="text-yellow-500" size={24} />
          <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            AI Refinement Suggestions
          </h3>
        </div>
        
        <div className="space-y-2 mb-4">
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>New Title:</p>
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{data.refinedTitle}</p>
          </div>
          
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Suggested Price:</p>
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{data.suggestedPrice}</p>
          </div>
          
          <div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>New Description:</p>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} line-clamp-2`}>{data.refinedDescription}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              applySuggestions();
              toast.dismiss(t.id);
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Keep Changes
          </button>
          <button
            onClick={() => {
              rejectSuggestions();
              toast.dismiss(t.id);
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              darkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Edit Manually
          </button>
        </div>
      </div>
    ), {
      duration: Infinity, // Stay until user interacts
      position: 'top-center',
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const listingPayload = convertToSnakeCase(formData);

      // ✅ FIX: Convert price to number, handling string ranges
      if (listingPayload.price) {
        const priceValue = extractPriceFromRange(listingPayload.price);
        listingPayload.price = priceValue ? parseFloat(priceValue) : null;
        
        // If still no valid price and not negotiable, error
        if (!listingPayload.price && !listingPayload.negotiable) {
          throw new Error('Please enter a valid price');
        }
      }

      // ✅ FIX: Handle condition field
      if (!listingPayload.condition || listingPayload.condition === '') {
        delete listingPayload.condition;
      }

      // ✅ FIX: Lowercase contact preference
      listingPayload.contact_preference = String(listingPayload.contact_preference).toLowerCase();

      // ✅ FIX: Only send whatsapp if selected
      if (formData.contactPreference !== 'whatsapp') {
        delete listingPayload.whatsapp_number;
      }

      console.log('📤 Creating listing:', listingPayload);

      const listing = await createListing(listingPayload, token);

      if (formData.images.length > 0) {
        await uploadListingImages(listing.id, formData.images, token);
      }

      toast.success('✅ Listing published successfully! Redirecting...', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1f2937',
          border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        }
      });

      // Redirect after toast is shown
      setTimeout(() => {
        navigate('/my-listings');
      }, 1500);

    } catch (err) {
      console.error('❌ Error creating listing:', err);
      toast.error(err.message || 'Failed to publish listing. Please try again.', {
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

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error('Please provide at least a title for your draft.', {
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

    setLoading(true);

    try {
      const listingPayload = { ...convertToSnakeCase(formData), is_draft: true };

      // ✅ Apply all fixes
      if (listingPayload.price) {
        const priceValue = extractPriceFromRange(listingPayload.price);
        listingPayload.price = priceValue ? parseFloat(priceValue) : null;
      }
      if (!listingPayload.condition || listingPayload.condition === '') {
        delete listingPayload.condition;
      }
      listingPayload.contact_preference = String(listingPayload.contact_preference).toLowerCase();
      if (formData.contactPreference !== 'whatsapp') {
        delete listingPayload.whatsapp_number;
      }

      const listing = await createListing(listingPayload, token);

      if (formData.images.length > 0) {
        await uploadListingImages(listing.id, formData.images, token);
      }

      toast.success('✅ Draft saved successfully!', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1f2937',
          border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        }
      });
      
    } catch (err) {
      console.error('❌ Error saving draft:', err);
      toast.error(err.message || 'Failed to save draft. Please try again.', {
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

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Add Toaster container */}
      <Toaster 
        toastOptions={{
          className: '',
          style: {
            borderRadius: '10px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
      
      <DashboardNavbar />

      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBack}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-6 transition-colors ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Sell an Item
                </h1>
                <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  List your item for sale and reach potential buyers
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-8">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                {/* Images Section */}
                <div className="mb-8">
                  <label className={`font-semibold text-lg mb-3 block ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Photos (up to 5)
                  </label>
                  {errors.images && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-3 text-sm">
                      {errors.images}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {previewImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={img.url}
                          alt={`Preview ${i + 1}`}
                          className="rounded-xl object-cover h-40 w-full border-2 border-gray-300 shadow-md transition-transform group-hover:scale-105"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current.click()}
                    disabled={previewImages.length >= 5}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                      previewImages.length >= 5
                        ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                        : darkMode
                          ? 'bg-gray-700 hover:bg-gray-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    {uploadingImages ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Upload size={20} />
                    )}
                    {uploadingImages ? 'Uploading...' : 'Upload Images'}
                  </button>
                </div>

                {/* Basic Info */}
                <div className="space-y-5">
                  {/* Title */}
                  <div>
                    <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Item Title *
                    </label>
                    <input
                      name="title"
                      value={formData.title}
                      placeholder="e.g., MacBook Pro 2020 - Excellent Condition"
                      onChange={handleInputChange}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        errors.title
                          ? 'border-red-500'
                          : darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
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
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        errors.category
                          ? 'border-red-500'
                          : darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 focus:border-blue-500'
                      } focus:outline-none`}
                    >
                      <option value="">Select a category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                  </div>

                  {/* ✅ AI REFINE BUTTON SECTION */}
                  {formData.title && formData.category && (
                    <div className={`border-2 border-dashed ${darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-400 bg-blue-50'} rounded-xl p-6 text-center`}>
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <Zap size={24} className="text-yellow-500" />
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                          Get AI Suggestions
                        </h3>
                      </div>
                      <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Let our AI generate an optimized title, description, and fair price suggestion based on your item
                      </p>
                      <button
                        type="button"
                        onClick={handleRefineWithAI}
                        disabled={refiningAI}
                        className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-lg transition-all ${
                          refiningAI
                            ? 'bg-gray-400 cursor-not-allowed'
                            : darkMode
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                        }`}
                      >
                        {refiningAI ? (
                          <>
                            <Loader2 className="animate-spin" size={20} />
                            Refining...
                          </>
                        ) : (
                          <>
                            <Zap size={20} />
                            Refine with AI
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      maxLength={500}
                      rows={5}
                      placeholder="Describe your item in detail... Include condition, features, reason for selling, etc."
                      onChange={handleInputChange}
                      className={`w-full p-4 rounded-xl border-2 transition-all resize-none ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } focus:outline-none`}
                    />
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formData.description.length}/500 characters
                    </p>
                  </div>

                  {/* Condition (only for non-services) */}
                  {!isService && (
                    <div>
                      <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Condition
                      </label>
                      <select
                        name="condition"
                        value={formData.condition}
                        onChange={handleInputChange}
                        className={`w-full p-4 rounded-xl border-2 transition-all ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                            : 'bg-white border-gray-300 focus:border-blue-500'
                        } focus:outline-none`}
                      >
                        <option value="">Select condition</option>
                        {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Area of Operation */}
                  <div>
                    <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Area of Operation / Pickup Point
                    </label>
                    <input
                      name="areaOfOperation"
                      value={formData.areaOfOperation}
                      onChange={handleInputChange}
                      placeholder={
                        isService
                          ? 'e.g., Kenyatta University Main Campus'
                          : 'e.g., KU Main Gate, Student Centre'
                      }
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } focus:outline-none`}
                    />
                  </div>

                  {/* Pricing */}
                  <div className="mt-6 space-y-4">
                    <label className={`font-semibold text-lg block ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      Pricing
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      placeholder="Price in KES"
                      disabled={formData.negotiable}
                      onChange={handleInputChange}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        errors.price
                          ? 'border-red-500'
                          : darkMode
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                            : 'bg-white border-gray-300 focus:border-blue-500'
                      } ${formData.negotiable ? 'opacity-50 cursor-not-allowed' : ''} focus:outline-none`}
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}

                    <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                      <input
                        type="checkbox"
                        name="negotiable"
                        checked={formData.negotiable}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Price is negotiable
                      </span>
                    </label>
                  </div>

                  {/* Contact Preference */}
                  <div className="mt-6">
                    <label className={`font-semibold text-lg mb-3 block ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      Preferred Contact Method
                    </label>

                    <select
                      name="contactPreference"
                      value={formData.contactPreference}
                      onChange={handleInputChange}
                      className={`w-full p-4 rounded-xl border-2 transition-all ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } focus:outline-none`}
                    >
                      <option value="email">📧 Email</option>
                      <option value="whatsapp">📱 WhatsApp</option>
                    </select>

                    {formData.contactPreference === 'whatsapp' && (
                      <div className="mt-4">
                        <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          WhatsApp Number *
                        </label>
                        <input
                          type="tel"
                          name="whatsappNumber"
                          value={formData.whatsappNumber}
                          onChange={handleInputChange}
                          placeholder="e.g. 0712345678"
                          className={`w-full p-4 rounded-xl border-2 transition-all ${
                            errors.whatsappNumber
                              ? 'border-red-500'
                              : darkMode
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                                : 'bg-white border-gray-300 focus:border-blue-500'
                          } focus:outline-none`}
                        />
                        {errors.whatsappNumber && (
                          <p className="text-red-500 text-sm mt-1">{errors.whatsappNumber}</p>
                        )}
                      </div>
                    )}

                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Buyers will contact you using the selected method only.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Summary & Actions */}
            <div className="space-y-8">
              <div className={`rounded-2xl p-6 border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} sticky top-24`}>
                <h3 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Listing Summary
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Item</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formData.title || 'No title yet'}
                    </p>
                  </div>

                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Category</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formData.category || 'Not selected'}
                    </p>
                  </div>

                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Price</p>
                    <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formData.price ? `KES ${parseFloat(formData.price).toFixed(2)}` : 'Not set'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Images</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formData.images.length} / 5 uploaded
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-4">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || refiningAI}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl ${
                      loading || refiningAI
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                    } text-white`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={24} />
                        Publishing...
                      </span>
                    ) : (
                      'Publish Listing'
                    )}
                  </button>

                  <button
                    disabled={loading || refiningAI}
                    onClick={handleSaveDraft}
                    className={`w-full py-3 px-4 rounded-xl font-semibold transition-colors ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading ? 'Saving...' : 'Save as Draft'}
                  </button>
                </div>

                {/* Tips */}
                <div className={`mt-8 p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    💡 Tips for better sales:
                  </p>
                  <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <li>• Use clear, well-lit photos</li>
                    <li>• Be honest about item condition</li>
                    <li>• Use AI refinement for better listings</li>
                    <li>• Respond quickly to inquiries</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellPage;
