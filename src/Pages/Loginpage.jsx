// pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, LogIn, Shield, Mail } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = ({ darkMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Check for saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('kuEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation
    if (!email.endsWith('@ku.ac.ke')) {
      setError('Please use your official KU email (@ku.ac.ke).');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError('Password is required.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsLoading(false);
      return;
    }

    // Save email if remember me is checked
    if (rememberMe) {
      localStorage.setItem('kuEmail', email);
    } else {
      localStorage.removeItem('kuEmail');
    }

    // Simulate API call with loading state
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulated delay
      console.log('Logging in:', { email });
      // In production, replace with actual API call:
      // const response = await authApi.login({ email, password });
      // handle response and navigate
      
      // Navigate to home/dashboard on success
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleForgotPassword = () => {
    // For demo purposes - would link to actual password reset
    alert('Password reset link would be sent to your KU email.');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 relative overflow-hidden ${
      darkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100'
        : 'bg-gradient-to-br from-sky-50 via-emerald-50 to-blue-50 text-gray-900'
    }`}>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-emerald-500/30' : 'bg-emerald-400/30'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-sky-500/30' : 'bg-sky-400/30'
        }`}></div>
      </div>

      {/* Back Button - Top Left */}
      <button
        onClick={handleBack}
        className={`absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 z-10 ${
          darkMode
            ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-200'
            : 'bg-white/80 hover:bg-white text-gray-700 shadow-md'
        } backdrop-blur-sm`}
      >
        <ArrowLeft size={20} />
        <span className="font-medium">Back to Home</span>
      </button>

      <div className="w-full max-w-md z-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
            darkMode
              ? 'bg-gradient-to-br from-emerald-500 to-sky-500'
              : 'bg-gradient-to-br from-emerald-400 to-sky-400'
          }`}>
            <Shield size={32} className="text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Welcome Back
          </h1>
          <p className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Sign in to your KU CampusTrade account
          </p>
        </div>

        {/* Login Card */}
        <div className={`p-8 rounded-3xl shadow-2xl backdrop-blur-sm ${
          darkMode
            ? 'bg-gray-900/80 border border-gray-800'
            : 'bg-white/90 border border-gray-200/50'
        }`}>
          {error && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              darkMode
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="flex items-center gap-2 mb-2 font-medium">
                <Mail size={16} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} />
                KU Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@ku.ac.ke"
                className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-all duration-200 ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
                required
              />
              <p className={`mt-1 text-xs ${
                darkMode ? 'text-gray-500' : 'text-gray-500'
              }`}>
                Use your official university email
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label className="block mb-2 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-all duration-200 ${
                    darkMode
                      ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                  required
                />
                <button
                  type="button"
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg transition ${
                    darkMode
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-emerald-400'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-emerald-500'
                  }`}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                />
                <span className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className={`text-sm font-medium hover:underline transition ${
                  darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-500 hover:text-emerald-600'
                }`}
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                isLoading
                  ? 'opacity-80 cursor-not-allowed'
                  : 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
              } ${
                darkMode
                  ? 'bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-600 hover:to-sky-600 text-white shadow-lg shadow-emerald-500/30'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Login to CampusTrade</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-8">
            <div className={`flex-1 h-px ${
              darkMode ? 'bg-gray-700' : 'bg-gray-300'
            }`}></div>
            <span className={`px-4 text-sm ${
              darkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
              New to CampusTrade?
            </span>
            <div className={`flex-1 h-px ${
              darkMode ? 'bg-gray-700' : 'bg-gray-300'
            }`}></div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <Link
              to="/signup"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              Create New Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className={`mt-8 text-center text-sm ${
          darkMode ? 'text-gray-500' : 'text-gray-600'
        }`}>
          By logging in, you agree to our{' '}
          <button className="hover:underline font-medium">Terms of Service</button>{' '}
          and{' '}
          <button className="hover:underline font-medium">Privacy Policy</button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;