// pages/SignUpPage.jsx
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, UserPlus, User, Mail, Lock, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const SignUpPage = ({ darkMode }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const navigate = useNavigate();

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  // Validate password strength in real-time
  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    });
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (!fullName.trim()) {
      setError('Full name is required.');
      setIsLoading(false);
      return;
    }

    if (!email.endsWith('@ku.ac.ke')) {
      setError('Please use your official KU email (@ku.ac.ke).');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the terms and conditions.');
      setIsLoading(false);
      return;
    }

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Signing up:', { fullName, email });
      
      // In production: await authApi.signup({ fullName, email, password });
      
      // Show success and redirect
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please check your email to verify your account.' 
        } 
      });
    } catch (err) {
      setError('Signup failed. The email might already be registered.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const getPasswordStrengthScore = () => {
    const score = Object.values(passwordStrength).filter(Boolean).length;
    return (score / 5) * 100;
  };

  const getStrengthColor = () => {
    const score = getPasswordStrengthScore();
    if (score <= 20) return 'bg-red-500';
    if (score <= 40) return 'bg-orange-500';
    if (score <= 60) return 'bg-yellow-500';
    if (score <= 80) return 'bg-emerald-400';
    return 'bg-emerald-500';
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 relative overflow-hidden ${
      darkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100'
        : 'bg-gradient-to-br from-sky-50 via-emerald-50 to-blue-50 text-gray-900'
    }`}>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/4 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-purple-500/30' : 'bg-purple-400/30'
        }`}></div>
        <div className={`absolute bottom-1/4 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${
          darkMode ? 'bg-sky-500/30' : 'bg-sky-400/30'
        }`}></div>
        <div className={`absolute top-3/4 left-1/4 w-48 h-48 rounded-full blur-3xl opacity-15 ${
          darkMode ? 'bg-emerald-500/30' : 'bg-emerald-400/30'
        }`}></div>
      </div>

      {/* Back Button */}
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

      <div className="w-full max-w-lg z-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
            darkMode
              ? 'bg-gradient-to-br from-purple-500 to-sky-500'
              : 'bg-gradient-to-br from-purple-400 to-sky-400'
          }`}>
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Join KU CampusTrade
          </h1>
          <p className={`text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Create your account to start trading on campus
          </p>
        </div>

        {/* Signup Card */}
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
            {/* Full Name Field */}
            <div>
              <label className="flex items-center gap-2 mb-2 font-medium">
                <User size={16} className={darkMode ? 'text-purple-400' : 'text-purple-500'} />
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-all duration-200 ${
                  darkMode
                    ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                }`}
                required
              />
            </div>

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
                darkMode ? 'text-emerald-400/80' : 'text-emerald-600'
              }`}>
                Only @ku.ac.ke emails are accepted
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label className="flex items-center gap-2 mb-2 font-medium">
                <Lock size={16} className={darkMode ? 'text-sky-400' : 'text-sky-500'} />
                Password
              </label>
              <div className="relative mb-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-all duration-200 ${
                    darkMode
                      ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                  }`}
                  required
                />
                <button
                  type="button"
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg transition ${
                    darkMode
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-sky-400'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-sky-500'
                  }`}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                    Password strength
                  </span>
                  <span className="font-medium">
                    {getPasswordStrengthScore() >= 80 ? 'Strong' : 
                     getPasswordStrengthScore() >= 60 ? 'Good' : 
                     getPasswordStrengthScore() >= 40 ? 'Fair' : 'Weak'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getStrengthColor()}`}
                    style={{ width: `${getPasswordStrengthScore()}%` }}
                  ></div>
                </div>

                {/* Password Requirements */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { key: 'length', label: 'At least 8 characters' },
                    { key: 'uppercase', label: 'One uppercase letter' },
                    { key: 'lowercase', label: 'One lowercase letter' },
                    { key: 'number', label: 'One number' },
                    { key: 'special', label: 'One special character' }
                  ].map((req) => (
                    <div key={req.key} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        passwordStrength[req.key]
                          ? darkMode ? 'bg-emerald-500' : 'bg-emerald-400'
                          : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                      }`}>
                        {passwordStrength[req.key] && (
                          <Check size={10} className="text-white" />
                        )}
                      </div>
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block mb-2 font-medium">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-all duration-200 ${
                    darkMode
                      ? 'bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20'
                  }`}
                  required
                />
                <button
                  type="button"
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg transition ${
                    darkMode
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-sky-400'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-sky-500'
                  }`}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {password && confirmPassword && password === confirmPassword && (
                <p className={`mt-1 text-xs flex items-center gap-1 ${
                  darkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  <Check size={12} />
                  Passwords match
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  I agree to the{' '}
                  <button type="button" className="font-medium hover:underline">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button type="button" className="font-medium hover:underline">
                    Privacy Policy
                  </button>. I understand that this platform is exclusively for KU students.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !acceptedTerms}
              className={`w-full py-3.5 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                isLoading || !acceptedTerms
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
              } ${
                darkMode
                  ? 'bg-gradient-to-r from-purple-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-gradient-to-r from-purple-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 text-white shadow-lg shadow-purple-500/30'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Create CampusTrade Account</span>
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
              Already have an account?
            </span>
            <div className={`flex-1 h-px ${
              darkMode ? 'bg-gray-700' : 'bg-gray-300'
            }`}></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link
              to="/login"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              Sign In to Existing Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className={`mt-8 text-center text-xs ${
          darkMode ? 'text-gray-500' : 'text-gray-500'
        }`}>
          By creating an account, you verify that you are a current student of Kenyatta University.
          <br />
          Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;