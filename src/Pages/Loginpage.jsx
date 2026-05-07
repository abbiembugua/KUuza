import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, LogIn, Mail, Shield } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { clearAuthStorage, getCurrentUser, login, verifyEmailOTP } from '../api/authapi';
import AuthCard from '../Components/shared/AuthCard';
import AuthPageShell from '../Components/shared/AuthPageShell';
import BackButton from '../Components/shared/BackButton';
import PolicyModal from '../Components/shared/PolicyModal';
import { useTheme } from '../context/Themecontext';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { darkMode } = useTheme();
  const { setUser, setToken } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [openPolicy, setOpenPolicy] = useState(null); // 'terms' | 'privacy' | null
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem('kuEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    const token = localStorage.getItem('access');
    if (!token) return;

    getCurrentUser()
      .then((currentUser) => {
        if (currentUser?.is_email_verified === false) {
          clearAuthStorage();
          setError('Please verify your email before logging in.');
          return;
        }

        navigate('/dashboard');
      })
      .catch(() => {
        clearAuthStorage();
      });
  }, [navigate]);

  const validateKUEmail = (value) => {
    const kuEmailPattern = /^[A-Za-z0-9]+\.20\d{2}@students\.ku\.ac\.ke$/;
    return kuEmailPattern.test(value);
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError('Please enter the 6-digit code.');
      return;
    }
    setOtpError('');
    setOtpLoading(true);
    try {
      await verifyEmailOTP(email, otp);
      const result = await login({ email, password });
      setUser(result.user);
      setToken(result.tokens?.access || localStorage.getItem('access'));
      toast.success('Email verified! Logging you in…', { duration: 2500, position: 'top-center' });
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!validateKUEmail(email)) {
      setError('Please use your official KU student email (e.g., 1234.1234@students.ku.ac.ke).');
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

    if (rememberMe) {
      localStorage.setItem('kuEmail', email);
    } else {
      localStorage.removeItem('kuEmail');
    }

    try {
      const result = await login({ email, password });
      setUser(result.user);
      setToken(result.tokens?.access || localStorage.getItem('access'));

      toast.success('Login successful! Redirecting to dashboard...', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1f2937',
          border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        },
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      if (err.requiresVerification) {
        setShowOtpForm(true);
        setError('');
      } else {
        const errorMessage = err.message || 'Login failed. Please check your credentials.';
        setError(errorMessage);
        toast.error(errorMessage, {
          duration: 4000,
          position: 'top-center',
          style: { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell darkMode={darkMode} background="login">
      <Toaster
        toastOptions={{
          style: {
            borderRadius: '10px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />

      <BackButton
        darkMode={darkMode}
        label="Back to Home"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-10"
      />

      <div className="w-full max-w-md z-20">
        <div className="text-center mb-8">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
              darkMode
                ? 'bg-gradient-to-br from-emerald-500 to-sky-500'
                : 'bg-gradient-to-br from-emerald-400 to-sky-400'
            }`}
          >
            <Shield size={32} className="text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Welcome Back
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Sign in to your KUuza account
          </p>
        </div>

        <AuthCard darkMode={darkMode}>
          {error && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                darkMode
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}
            >
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex items-center gap-2 mb-2 font-medium">
                <Mail size={16} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} />
                KU Student Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-all duration-200 ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                }`}
                required
              />
            </div>

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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className={`text-sm font-medium hover:underline transition ${
                  darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-500 hover:text-emerald-600'
                }`}
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl
                py-3.5 font-semibold text-lg text-white bg-emerald-600 hover:bg-emerald-700
                shadow-md shadow-emerald-600/30 transition-all duration-200
                ${isLoading ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Login to KUuza</span>
                </>
              )}
            </button>
          </form>

          {showOtpForm && (
            <div className={`mt-6 p-5 rounded-xl border ${darkMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
              <p className={`text-sm font-medium mb-3 ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify and continue.
              </p>
              <form onSubmit={handleOtpVerify} className="space-y-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className={`w-full px-4 py-3 rounded-xl border text-center text-2xl tracking-widest font-mono focus:outline-none transition-all ${
                    darkMode
                      ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500'
                  } ${otpError ? 'border-red-500' : ''}`}
                />
                {otpError && <p className="text-sm text-red-500">{otpError}</p>}
                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className={`w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all ${
                    otpLoading || otp.length !== 6 ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {otpLoading ? 'Verifying…' : 'Verify Code'}
                </button>
              </form>
            </div>
          )}

          <div className="flex items-center my-8">
            <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
            <span className={`px-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              New to KUuza?
            </span>
            <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
          </div>

          <div className="text-center">
            <Link
              to="/signup"
              className={`inline-flex items-center justify-center gap-2 rounded-xl
                px-6 py-3 font-semibold transition-all duration-200 hover:scale-105 border-2 ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-600'
                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-500'
              }`}
            >
              Create New Account
            </Link>
          </div>
        </AuthCard>

        <p className={`mt-8 text-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
          By logging in, you agree to our{' '}
          <button
            type="button"
            onClick={() => setOpenPolicy('terms')}
            className={`hover:underline font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={() => setOpenPolicy('privacy')}
            className={`hover:underline font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
          >
            Privacy Policy
          </button>
        </p>

      <PolicyModal type={openPolicy} onClose={() => setOpenPolicy(null)} darkMode={darkMode} />
      </div>
    </AuthPageShell>
  );
};

export default LoginPage;
