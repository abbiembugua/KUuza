import React from 'react';

const backgroundConfig = {
  login: [
    {
      position: 'absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20',
      dark: 'bg-emerald-500/30',
      light: 'bg-emerald-400/30',
    },
    {
      position: 'absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20',
      dark: 'bg-sky-500/30',
      light: 'bg-sky-400/30',
    },
  ],
  signup: [
    {
      position: 'absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20',
      dark: 'bg-emerald-500/30',
      light: 'bg-emerald-400/30',
    },
    {
      position: 'absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20',
      dark: 'bg-sky-500/30',
      light: 'bg-sky-400/30',
    },
  ],
};

const AuthPageShell = ({ darkMode, background = 'login', locked = false, children }) => {
  return (
    <div
      className={`${locked ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col items-center justify-center px-4 sm:px-6 py-6 relative ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100'
          : 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50 text-gray-900'
      }`}
    >
      <div className="absolute inset-0 overflow-hidden">
        {(backgroundConfig[background] || []).map((blob, index) => (
          <div
            key={index}
            className={`${blob.position} ${darkMode ? blob.dark : blob.light}`}
          />
        ))}
      </div>
      {children}
    </div>
  );
};

export default AuthPageShell;