import React from 'react';
import { Bell, Loader2, X } from 'lucide-react';

const NotificationsDrawer = ({ darkMode, isOpen, notifications, isLoading, onClose, onDismiss, onOpenNotification }) => {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close notifications"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60"
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm transform border-l transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${darkMode ? 'border-gray-800 bg-gray-950 text-white shadow-2xl' : 'border-gray-200 bg-white text-gray-900 shadow-2xl'}`}
      >
        <div className={`flex items-center justify-between border-b px-5 py-4 ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-500">Notifications</p>
            <h2 className="text-lg font-semibold">Recent activity</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-2 transition-colors ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[calc(100%-88px)] flex-col overflow-y-auto px-4 py-4">
          {isLoading ? (
            <div className={`flex h-full flex-col items-center justify-center rounded-2xl border px-6 text-center ${
              darkMode ? 'border-gray-800 bg-gray-900 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}>
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-500" />
              <p className="font-medium">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className={`flex h-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 text-center ${
              darkMode ? 'border-gray-800 bg-gray-900 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}>
              <Bell className="mb-3 h-10 w-10 text-emerald-500" />
              <p className="font-medium">You are all caught up.</p>
              <p className="mt-1 text-sm">New purchase alerts and receipt downloads will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenNotification(notification)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      onOpenNotification(notification);
                    }
                  }}
                  className={`rounded-2xl border p-4 ${
                    darkMode ? 'border-gray-800 bg-gray-900 shadow-sm' : 'border-gray-200 bg-white shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{notification.title}</p>
                      <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {notification.body}
                      </p>
                      <p className={`mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {notification.time}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDismiss(notification.id);
                      }}
                      className={`rounded-full p-1.5 transition-colors ${
                        darkMode ? 'hover:bg-gray-800' : 'hover:bg-white'
                      }`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default NotificationsDrawer;
