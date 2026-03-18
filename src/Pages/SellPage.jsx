import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, ArrowLeft, Zap } from 'lucide-react';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import { useTheme } from '../context/Themecontext';
import { createListing, uploadListingImages, refineListingWithAI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Toaster, toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';


// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'books',          label: 'Books' },
  { value: 'electronics',    label: 'Electronics' },
  { value: 'fashion',        label: 'Fashion' },
  { value: 'furniture',      label: 'Furniture' },
  { value: 'food_beverages', label: 'Food & Beverages' },
  { value: 'beauty',       label: 'Beauty' },
  { value: 'other',          label: 'Other' },
];

// Services category always means listing_type = service
const SERVICE_CATEGORIES = ['services'];

const CONDITIONS = [
  { value: 'new',      label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'used',     label: 'Used' },
  { value: 'fair',     label: 'Fair' },
];

const INITIAL_FORM = {
  listing_type:       'good',   // 'good' | 'service'
  title:              '',
  category:           '',
  description:        '',
  price:              '',
  negotiable:         false,
  quantity:           1,
  condition:          '',
  area_of_operation:  '',
  contact_preference: 'email',  // 'email' | 'whatsapp'
  contact_value:      '',       // email address OR whatsapp number
  is_draft:           false,
  images:             [],
};


// ── Helpers ──────────────────────────────────────────────────────────────────

const extractNumericPrice = (val) => {
  if (!val) return '';
  if (typeof val === 'number') return String(val);
  const matches = String(val).match(/\d+(?:,\d+)*/g);
  return matches ? matches[0].replace(/,/g, '') : '';
};

const buildPayload = (formData) => {
  const payload = {
    listing_type:       formData.listing_type,
    title:              formData.title,
    category:           formData.category,
    description:        formData.description,
    negotiable:         formData.negotiable,
    area_of_operation:  formData.area_of_operation,
    contact_preference: formData.contact_preference,
    contact_value:      formData.contact_value,
    is_draft:           formData.is_draft,
  };

  // Price — convert to float or omit if negotiable
  if (formData.price) {
    const numeric = extractNumericPrice(formData.price);
    payload.price = numeric ? parseFloat(numeric) : null;
  }

  // Goods-only fields
  if (formData.listing_type === 'good') {
    payload.quantity  = formData.quantity;
    payload.condition = formData.condition;
  }

  // Services never send condition or quantity
  // (backend serializer also clears these, but belt-and-suspenders)

  return payload;
};


// ── Component ────────────────────────────────────────────────────────────────

const SellPage = () => {
  const fileInputRef   = useRef(null);
  const { darkMode }   = useTheme();
  const { token }      = useAuth();
  const navigate       = useNavigate();

  const [formData,       setFormData]       = useState(INITIAL_FORM);
  const [previewImages,  setPreviewImages]  = useState([]);
  const [errors,         setErrors]         = useState({});
  const [loading,        setLoading]        = useState(false);
  const [refiningAI,     setRefiningAI]     = useState(false);

  const isService = formData.listing_type === 'service';


  // ── Derived state ──────────────────────────────────────────────────────────

  // When category changes, auto-set listing_type
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    const autoType = SERVICE_CATEGORIES.includes(value) ? 'service' : 'good';
    setFormData(prev => ({
      ...prev,
      category:     value,
      listing_type: autoType,
      // Clear goods-only fields if switching to service
      ...(autoType === 'service' && { condition: '', quantity: 1 }),
    }));
    clearError('category');
  };

  const handleListingTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      listing_type: type,
      // Clear goods-only fields when switching to service
      ...(type === 'service' && { condition: '', quantity: 1 }),
    }));
  };


  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const e = {};

    if (!formData.title.trim())
      e.title = 'Title is required';

    if (!formData.category)
      e.category = 'Category is required';

    if (!formData.negotiable && !formData.price)
      e.price = 'Enter a price or mark as negotiable';

    if (formData.listing_type === 'good' && formData.images.length === 0)
      e.images = 'Upload at least one image for a physical item';

    if (!formData.area_of_operation.trim())
      e.area_of_operation = 'Area of operation is required';

    if (!formData.contact_value.trim())
      e.contact_value = formData.contact_preference === 'whatsapp'
        ? 'WhatsApp number is required'
        : 'Email address is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clearError = (field) =>
    setErrors(prev => ({ ...prev, [field]: '' }));


  // ── Input handlers ─────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    clearError(name);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + previewImages.length > 5) {
      setErrors(prev => ({ ...prev, images: 'Maximum 5 images allowed' }));
      return;
    }
    const previews = files.map(f => ({ url: URL.createObjectURL(f), name: f.name }));
    setPreviewImages(prev => [...prev, ...previews]);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...files] }));
    clearError('images');
  };

  const removeImage = (i) => {
    setPreviewImages(prev => prev.filter((_, idx) => idx !== i));
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }));
  };


  // ── AI refinement ──────────────────────────────────────────────────────────

  const handleRefineWithAI = async () => {
    if (!formData.title || !formData.category) {
      toast.error('Provide at least a title and category first.');
      return;
    }
    try {
      setRefiningAI(true);
      const data = await refineListingWithAI(
        formData.title, formData.category, formData.description, token
      );
      const parsedPrice = extractNumericPrice(data.suggestedPrice);
      setFormData(prev => ({
        ...prev,
        title:       data.refinedTitle       ?? prev.title,
        description: data.refinedDescription ?? prev.description,
        price:       parsedPrice             || prev.price,
        ai_assisted: true,
      }));
      toast.success('AI suggestions applied — feel free to edit them.');
    } catch (err) {
      toast.error(err.message || 'AI refinement failed. Please try again.');
    } finally {
      setRefiningAI(false);
    }
  };


  // ── Submit ─────────────────────────────────────────────────────────────────

  const submit = async (asDraft = false) => {
    if (!asDraft && !validate()) return;
    if (asDraft && !formData.title.trim()) {
      toast.error('Add a title before saving as draft.');
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload({ ...formData, is_draft: asDraft });
      const listing = await createListing(payload, token);

      if (formData.images.length > 0) {
        await uploadListingImages(listing.id, formData.images, token);
      }

      toast.success(asDraft
        ? 'Draft saved. Find it in the Drafts tab on My Listings.'
        : 'Listing published successfully!'
      );

      setTimeout(() => navigate('/my-listings'), 1500);

    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  // ── Reusable input class ───────────────────────────────────────────────────

  const inputClass = (field) =>
    `w-full p-4 rounded-xl border-2 transition-all focus:outline-none ${
      errors[field]
        ? 'border-red-500'
        : darkMode
          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
          : 'bg-white border-gray-300 focus:border-blue-500'
    }`;


  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Toaster toastOptions={{ style: { borderRadius: '10px', padding: '16px' } }} />
      <DashboardNavbar />

      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4">

          {/* ── Header ── */}
          <div className="mb-8">
            <button
              onClick={() => window.history.back()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-6 transition-colors ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <ArrowLeft size={20} /> Back
            </button>
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Create a Listing
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Fill in the details below. The more information you provide, the faster you sell.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Left column — form ── */}
            <div className="lg:col-span-2 space-y-6">
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 space-y-6`}>

                {/* ── Listing type toggle ── */}
                <div>
                  <label className={`font-semibold mb-3 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    What are you listing? *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'good',    label: '📦 Physical Good',  sub: 'Item you can hand over' },
                      { value: 'service', label: '🛠️ Service',        sub: 'Skill or task you offer' },
                    ].map(({ value, label, sub }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleListingTypeToggle(value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.listing_type === value
                            ? 'border-blue-500 bg-blue-500/10'
                            : darkMode
                              ? 'border-gray-600 hover:border-gray-500'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {label}
                        </p>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {sub}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Title ── */}
                <div>
                  <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {isService ? 'Service Name *' : 'Item Title *'}
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={
                      isService
                        ? 'e.g. Professional Graphic Design Services'
                        : 'e.g. MacBook Pro 2020 — Excellent Condition'
                    }
                    className={inputClass('title')}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                {/* ── Category ── */}
                <div>
                  <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    className={inputClass('category')}
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                  {/* Inform user that selecting Services auto-switches type */}
                  {formData.category === 'services' && (
                    <p className={`text-sm mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      Services category automatically set listing type to Service.
                    </p>
                  )}
                </div>

                {/* ── AI panel — appears after title + category filled ── */}
                {formData.title && formData.category && (
                  <div className={`border-2 border-dashed rounded-xl p-5 ${
                    darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-400 bg-blue-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={20} className="text-yellow-500" />
                      <h3 className={`font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                        Refine with AI
                      </h3>
                    </div>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      AI will improve your title, description, and suggest a fair price based on what you have entered so far.
                    </p>
                    <button
                      type="button"
                      onClick={handleRefineWithAI}
                      disabled={refiningAI}
                      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
                        refiningAI
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {refiningAI
                        ? <><Loader2 className="animate-spin" size={18} /> Refining...</>
                        : <><Zap size={18} /> Refine with AI</>
                      }
                    </button>
                  </div>
                )}

                {/* ── Description ── */}
                <div>
                  <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    maxLength={500}
                    rows={5}
                    onChange={handleChange}
                    placeholder={
                      isService
                        ? 'Describe your service — what you offer, turnaround time, pricing details, portfolio...'
                        : 'Describe the item — condition details, reason for selling, any defects...'
                    }
                    className={`${inputClass('description')} resize-none`}
                  />
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formData.description.length}/500
                  </p>
                </div>

                {/* ── Condition — goods only ── */}
                {!isService && (
                  <div>
                    <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Condition
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {CONDITIONS.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, condition: value }));
                            clearError('condition');
                          }}
                          className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            formData.condition === value
                              ? 'border-blue-500 bg-blue-500/10 text-blue-600'
                              : darkMode
                                ? 'border-gray-600 text-gray-300 hover:border-gray-500'
                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition}</p>}
                  </div>
                )}

                {/* ── Quantity — goods only ── */}
                {!isService && (
                  <div>
                    <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Quantity Available
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}
                        className={`w-10 h-10 rounded-lg border-2 font-bold text-lg ${
                          darkMode ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-700'
                        }`}
                      >−</button>
                      <span className={`text-lg font-semibold w-8 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formData.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, quantity: p.quantity + 1 }))}
                        className={`w-10 h-10 rounded-lg border-2 font-bold text-lg ${
                          darkMode ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-700'
                        }`}
                      >+</button>
                    </div>
                  </div>
                )}

                {/* ── Images — goods only (optional for services) ── */}
                <div>
                  <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Photos {isService ? '(optional)' : '(required, up to 5)'}
                  </label>
                  {errors.images && <p className="text-red-500 text-sm mb-2">{errors.images}</p>}
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-3">
                    {previewImages.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={img.url}
                          alt={`Preview ${i + 1}`}
                          className="rounded-lg object-cover h-24 w-full border-2 border-gray-300"
                        />
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">
                            Cover
                          </span>
                        )}
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {previewImages.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
                          darkMode
                            ? 'border-gray-600 hover:border-gray-500 text-gray-400'
                            : 'border-gray-300 hover:border-gray-400 text-gray-500'
                        }`}
                      >
                        <Upload size={18} />
                        <span className="text-xs">Add photo</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* ── Pricing ── */}
                <div>
                  <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {isService ? 'Service Price (KSh)' : 'Price (KSh)'}
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    disabled={formData.negotiable}
                    placeholder={isService ? 'e.g. 500 per session' : 'e.g. 1500'}
                    className={`${inputClass('price')} ${formData.negotiable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  <label className={`flex items-center gap-3 cursor-pointer mt-3 p-2 rounded-lg ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}>
                    <input
                      type="checkbox"
                      name="negotiable"
                      checked={formData.negotiable}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Price is negotiable
                    </span>
                  </label>
                </div>

                {/* ── Area of operation ── */}
                <div>
                  <label className={`font-semibold mb-2 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    {isService ? 'Where do you operate? *' : 'Pickup / Meetup Location *'}
                  </label>
                  <input
                    name="area_of_operation"
                    value={formData.area_of_operation}
                    onChange={handleChange}
                    placeholder={
                      isService
                        ? 'e.g. KU Main Campus, available on weekdays'
                        : 'e.g. KSIT Building, available evenings'
                    }
                    className={inputClass('area_of_operation')}
                  />
                  {errors.area_of_operation && (
                    <p className="text-red-500 text-sm mt-1">{errors.area_of_operation}</p>
                  )}
                </div>

                {/* ── Contact preference ── */}
                <div>
                  <label className={`font-semibold mb-3 block ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Preferred Contact Method *
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { value: 'email',    label: '📧 Email' },
                      { value: 'whatsapp', label: '📱 WhatsApp' },
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            contact_preference: value,
                            contact_value: '',
                          }));
                          clearError('contact_value');
                        }}
                        className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                          formData.contact_preference === value
                            ? 'border-blue-500 bg-blue-500/10'
                            : darkMode
                              ? 'border-gray-600 text-gray-300 hover:border-gray-500'
                              : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <input
                    name="contact_value"
                    value={formData.contact_value}
                    onChange={handleChange}
                    placeholder={
                      formData.contact_preference === 'whatsapp'
                        ? '+254 7XX XXX XXX'
                        : 'yourname@email.com'
                    }
                    className={inputClass('contact_value')}
                  />
                  {errors.contact_value && (
                    <p className="text-red-500 text-sm mt-1">{errors.contact_value}</p>
                  )}
                  <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    This will only be shared with buyers after they complete a transaction.
                  </p>
                </div>

              </div>
            </div>

            {/* ── Right column — summary + actions ── */}
            <div>
              <div className={`rounded-2xl p-6 border sticky top-24 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Listing Summary
                </h3>
                <div className={`space-y-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium capitalize">{formData.listing_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Title</span>
                    <span className="font-medium truncate max-w-[160px]">
                      {formData.title || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium capitalize">
                      {formData.category.replace('_', ' ') || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price</span>
                    <span className="font-bold">
                      {formData.negotiable
                        ? 'Negotiable'
                        : formData.price
                          ? `KSh ${parseFloat(formData.price).toLocaleString()}`
                          : '—'
                      }
                    </span>
                  </div>
                  {!isService && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Condition</span>
                      <span className="font-medium capitalize">
                        {formData.condition.replace('_', ' ') || '—'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Photos</span>
                    <span className="font-medium">{formData.images.length} / 5</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => submit(false)}
                    disabled={loading || refiningAI}
                    className={`w-full py-3 rounded-xl font-bold transition-all ${
                      loading || refiningAI
                        ? 'bg-gray-400 cursor-not-allowed text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loading
                      ? <span className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin" size={18} /> Publishing...
                        </span>
                      : 'Publish Listing'
                    }
                  </button>
                  <button
                    onClick={() => submit(true)}
                    disabled={loading || refiningAI}
                    className={`w-full py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 ${
                      darkMode
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Save as Draft
                  </button>
                </div>

                <div className={`mt-6 p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <p className="font-medium mb-1">💡 Tips</p>
                  <ul className="space-y-1">
                    <li>• Clear photos sell faster</li>
                    <li>• Be honest about condition</li>
                    <li>• Use AI to improve your description</li>
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