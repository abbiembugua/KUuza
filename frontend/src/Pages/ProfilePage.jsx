import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Camera, Eye, PencilLine, Save, Trash2, X } from 'lucide-react';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import BackButton from '../Components/shared/BackButton';
import SellerVerificationSection from '../Components/Profile/SellerVerificationSection';
import { deleteCurrentUser, deleteProfilePicture, updateCurrentUser, uploadProfilePicture } from '../api/authapi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import { showToast } from '../Services/toastService';

const ProfilePage = () => {
  const { darkMode } = useTheme();
  const { user, setUser, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sellerSectionRef = useRef(null);
  const pictureInputRef  = useRef(null);

  const [firstName,              setFirstName]              = useState('');
  const [lastName,               setLastName]               = useState('');
  const [searchQuery,            setSearchQuery]            = useState('');
  const [isEditing,              setIsEditing]              = useState(false);
  const [isSaving,               setIsSaving]               = useState(false);
  const [isDeleting,             setIsDeleting]             = useState(false);
  const [deleteModalOpen,        setDeleteModalOpen]        = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isUploadingPicture,     setIsUploadingPicture]     = useState(false);
  const [isDeletingPicture,      setIsDeletingPicture]      = useState(false);

  useEffect(() => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name  || '');
  }, [user?.first_name, user?.last_name]);

  useEffect(() => {
    if (location.state?.verifyPrompt && sellerSectionRef.current) {
      sellerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      showToast('Complete seller verification to start listing items.', 'info', { duration: 5000 });
    }
  }, [location.state]);

  const handleSave = async () => {
    if (!firstName.trim()) { showToast('First name cannot be empty', 'error'); return; }
    setIsSaving(true);
    try {
      const updatedUser = await updateCurrentUser({ first_name: firstName.trim(), last_name: lastName.trim() });
      setUser(updatedUser);
      setIsEditing(false);
      showToast('Profile updated', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
    setIsUploadingPicture(true);
    try {
      const result = await uploadProfilePicture(file);
      setUser({ ...user, profile_picture: result.profile_picture });
      showToast('Profile picture updated', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to upload picture', 'error');
    } finally {
      setIsUploadingPicture(false);
      e.target.value = '';
    }
  };

  const handleDeletePicture = async () => {
    setIsDeletingPicture(true);
    try {
      await deleteProfilePicture();
      setUser({ ...user, profile_picture: null });
      showToast('Profile picture removed', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to remove picture', 'error');
    } finally {
      setIsDeletingPicture(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmationText.trim() !== 'DELETE') {
      showToast('Type DELETE to confirm account deletion.', 'error');
      return;
    }
    setIsDeleting(true);
    try {
      await deleteCurrentUser();
      await logout();
      showToast('Account deleted', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to delete account', 'error');
      setIsDeleting(false);
    }
  };

  const card = `rounded-2xl border p-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
  const label = `text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <DashboardNavbar
        onSearch={(query) => navigate(`/browse?search=${encodeURIComponent(query)}`)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <div className="h-16" />

      <div className="mx-auto max-w-3xl px-4 pt-4 pb-12">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-4">
          <BackButton darkMode={darkMode} onClick={() => navigate(-1)} />
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Profile</h1>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your account details</p>
          </div>
        </div>

        <div className="space-y-3">

          {/* ── Profile photo ── */}
          <div className={card}>
            <p className={`${label} mb-3`}>Profile photo</p>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="h-16 w-16 rounded-full object-cover ring-2 ring-emerald-500/30" />
                ) : (
                  <div className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {user?.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                {isUploadingPicture && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input ref={pictureInputRef} type="file" accept="image/*" className="hidden" onChange={handlePictureChange} />
                <button
                  type="button"
                  onClick={() => pictureInputRef.current?.click()}
                  disabled={isUploadingPicture || isDeletingPicture}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                    darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Camera className="h-3.5 w-3.5" />
                  {isUploadingPicture ? 'Uploading…' : user?.profile_picture ? 'Change photo' : 'Upload photo'}
                </button>
                {user?.profile_picture && (
                  <button
                    type="button"
                    onClick={handleDeletePicture}
                    disabled={isUploadingPicture || isDeletingPicture}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-60 ${
                      darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <X className="h-3.5 w-3.5" />
                    {isDeletingPicture ? 'Removing…' : 'Remove'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Name & email ── */}
          <div className={card}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <p className={label}>Name &amp; email</p>
              <button
                type="button"
                onClick={() => {
                  if (isEditing) { setFirstName(user?.first_name || ''); setLastName(user?.last_name || ''); }
                  setIsEditing(v => !v);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <PencilLine className="h-3.5 w-3.5" />
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={`mb-1 block text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>First name</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First"
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${
                      darkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`mb-1 block text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Last name</label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last"
                    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 ${
                      darkMode ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900'
                    }`}
                  />
                </div>
              </div>
            ) : (
              <p className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {user?.full_name || 'No name set'}
              </p>
            )}

            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email}</p>

            {isEditing && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                {isSaving ? 'Saving…' : 'Save changes'}
              </button>
            )}
          </div>

          {/* ── Ratings ── */}
          <div className={card}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`${label} mb-1`}>Ratings &amp; reviews</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Feedback other students have left on your profile.
                </p>
              </div>
              <Link
                to={`/sellers/${user?.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 flex-shrink-0"
              >
                <Eye className="h-3.5 w-3.5" />
                View ratings
              </Link>
            </div>
          </div>

          {/* ── Seller verification ── */}
          <div ref={sellerSectionRef}>
            <SellerVerificationSection
              user={user}
              darkMode={darkMode}
              onVerified={async () => {
                const updated = await refreshUser();
                setUser(updated);
              }}
            />
          </div>

          {/* ── Delete account ── */}
          <div className={`rounded-2xl border p-4 ${darkMode ? 'bg-red-950/20 border-red-900/40' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-sm font-semibold mb-1 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Delete account</p>
            <p className={`text-sm mb-4 ${darkMode ? 'text-red-300/70' : 'text-red-600/80'}`}>
              Permanently removes your profile, listings, and all marketplace history.
            </p>
            <button
              type="button"
              onClick={() => { setDeleteModalOpen(true); setDeleteConfirmationText(''); }}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 rounded-full border border-red-500 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? 'Deleting…' : 'Delete account'}
            </button>
          </div>

        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {deleteModalOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start gap-3 mb-4">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${darkMode ? 'bg-red-950/60 text-red-300' : 'bg-red-50 text-red-600'}`}>
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Delete account permanently</p>
                  <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    This cannot be undone. Type <span className="font-semibold">DELETE</span> below to confirm.
                  </p>
                </div>
              </div>

              <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${darkMode ? 'bg-red-950/30 text-red-300 border border-red-900/40' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                Your profile, marketplace history, and active access will be removed.
              </div>

              <label className={`block text-xs uppercase tracking-[0.18em] mb-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Confirmation
              </label>
              <input
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE"
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 mb-5 ${
                  darkMode ? 'border-gray-700 bg-gray-950 text-white' : 'border-gray-200 bg-white text-gray-900'
                }`}
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className={`flex-1 rounded-full px-5 py-2.5 text-sm font-medium ${darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting || deleteConfirmationText.trim() !== 'DELETE'}
                  className="flex-1 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting…' : 'Delete forever'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfilePage;
