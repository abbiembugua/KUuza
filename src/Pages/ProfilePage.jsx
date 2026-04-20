import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PencilLine, Save, Trash2 } from 'lucide-react';
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
    const confirmed = window.confirm('Delete your KUUza account permanently? This cannot be undone.');
    if (!confirmed) return;

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
              darkMode ? 'border-red-950 bg-red-950/20' : 'border-red-200 bg-red-50'
            }`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                Delete account
              </p>
              <p className={`mt-2 text-sm ${darkMode ? 'text-red-200/80' : 'text-red-700/80'}`}>
                This permanently removes your KUUza profile and signs you out.
              </p>
              <button
                type="button"
                onClick={handleDelete}
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
    </div>
  );
};

export default ProfilePage;
