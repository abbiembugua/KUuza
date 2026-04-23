import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, PencilLine, Save, Trash2 } from 'lucide-react';
import DashboardNavbar from '../Components/Layout/DashboardNavbar';
import BackButton from '../Components/shared/BackButton';
import { deleteCurrentUser, updateCurrentUser } from '../api/authapi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import { showToast } from '../Services/toastService';

const ProfilePage = () => {
  const { darkMode } = useTheme();
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  useEffect(() => {
    setFullName(user?.full_name || '');
  }, [user?.full_name]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await updateCurrentUser({ full_name: fullName.trim() });
      setUser(updatedUser);
      setIsEditing(false);
      showToast('Profile updated', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to update profile', 'error');
    } finally {
      setIsSaving(false);
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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-950' : 'bg-stone-50'}`}>
      <DashboardNavbar
        onSearch={(query) => navigate(`/browse?search=${encodeURIComponent(query)}`)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <div className="h-16" />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <BackButton darkMode={darkMode} label="Back" onClick={() => navigate(-1)} />
        </div>

        <div className={`overflow-hidden rounded-[28px] border ${
          darkMode ? 'border-gray-800 bg-gray-900' : 'border-stone-200 bg-white'
        }`}>
          <div className={`border-b px-6 py-6 ${darkMode ? 'border-gray-800' : 'border-stone-200'}`}>
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-500">Profile</p>
            <h1 className={`mt-2 text-3xl font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
              Your KUUza account
            </h1>
            <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-stone-600'}`}>
              Keep it simple. Update your name here whenever you need to.
            </p>
          </div>

          <div className="space-y-6 px-6 py-6">
            <section className={`rounded-3xl border p-5 ${
              darkMode ? 'border-gray-800 bg-gray-950' : 'border-stone-200 bg-stone-50'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-stone-500'}`}>Full name</p>
                  {isEditing ? (
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`mt-2 w-full rounded-2xl border px-4 py-3 text-lg outline-none ${
                        darkMode
                          ? 'border-gray-700 bg-gray-900 text-white focus:border-emerald-500'
                          : 'border-stone-300 bg-white text-stone-900 focus:border-emerald-500'
                      }`}
                    />
                  ) : (
                    <p className={`mt-2 text-2xl font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                      {user?.full_name || 'No name yet'}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isEditing) {
                      setFullName(user?.full_name || '');
                    }
                    setIsEditing((current) => !current);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <PencilLine className="h-4 w-4" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="mt-5">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-stone-500'}`}>Email</p>
                <p className={`mt-1 text-base ${darkMode ? 'text-gray-200' : 'text-stone-800'}`}>
                  {user?.email}
                </p>
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              )}
            </section>

            <section className={`rounded-3xl border p-5 ${
              darkMode ? 'border-gray-800 bg-gray-950' : 'border-stone-200 bg-stone-50'
            }`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                    Ratings & reviews
                  </p>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-stone-500'}`}>
                    See the feedback other students have left on your seller profile.
                  </p>
                </div>

                <Link
                  to={`/sellers/${user?.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <Eye className="h-4 w-4" />
                  View my ratings
                </Link>
              </div>
            </section>

            <section className={`rounded-3xl border p-5 ${
              darkMode ? 'border-red-950 bg-red-950/20' : 'border-red-200 bg-red-50'
            }`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                Delete account
              </p>
              <p className={`mt-2 text-sm ${darkMode ? 'text-red-200/80' : 'text-red-700/80'}`}>
                This permanently removes your KUUza profile, listings, and access to past marketplace activity.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(true);
                  setDeleteConfirmationText('');
                }}
                disabled={isDeleting}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-red-500 px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete account'}
              </button>
            </section>
          </div>
        </div>
      </div>

      {deleteModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeleteModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className={`w-full max-w-md rounded-[28px] border p-6 shadow-2xl ${
              darkMode ? 'border-gray-800 bg-gray-900' : 'border-stone-200 bg-white'
            }`}>
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  darkMode ? 'bg-red-950/60 text-red-300' : 'bg-red-50 text-red-600'
                }`}>
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <p className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                    Delete account permanently
                  </p>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-stone-600'}`}>
                    This cannot be undone. Type <span className="font-semibold">DELETE</span> below to continue.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Your profile, marketplace history, and active access will be removed.
              </div>

              <div className="mt-5">
                <label className={`block text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-gray-500' : 'text-stone-400'}`}>
                  Confirmation text
                </label>
                <input
                  value={deleteConfirmationText}
                  onChange={(event) => setDeleteConfirmationText(event.target.value)}
                  placeholder="Type DELETE"
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-base outline-none ${
                    darkMode
                      ? 'border-gray-700 bg-gray-950 text-white focus:border-red-500'
                      : 'border-stone-300 bg-white text-stone-900 focus:border-red-500'
                  }`}
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                  className={`flex-1 rounded-full px-5 py-2.5 text-sm font-medium ${
                    darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting || deleteConfirmationText.trim() !== 'DELETE'}
                  className="flex-1 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete forever'}
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
