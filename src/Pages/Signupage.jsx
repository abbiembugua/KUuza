import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, UserPlus, User, Mail, Lock, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { resendVerification, signup, verifyEmailOTP } from '../api/authapi';
import { Toaster, toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/Themecontext';
import AuthCard from '../Components/shared/AuthCard';
import PolicyModal from '../Components/shared/PolicyModal';
import AuthPageShell from '../Components/shared/AuthPageShell';
import BackButton from '../Components/shared/BackButton';

const SignUpPage = () => {
  const { darkMode } = useTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [openPolicy, setOpenPolicy] = useState(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [emailSent, setEmailSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const termsRef = useRef(null);

  const fieldRefs = {
    firstName: firstNameRef,
    lastName: lastNameRef,
    email: emailRef,
    password: passwordRef,
    confirmPassword: confirmPasswordRef,
    terms: termsRef,
  };

  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });

  useEffect(() => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password)
    });
  }, [password]);

  const validateKUEmail = (email) => {
    const kuEmailPattern = /^[A-Za-z0-9]+\.20\d{2}@students\.ku\.ac\.ke$/;
    return kuEmailPattern.test(email);
  };

  const clearFieldError = (field) => {
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const focusFirstError = (errors) => {
    const order = ['firstName', 'lastName', 'email', 'password', 'confirmPassword', 'terms'];
    const first = order.find(f => errors[f]);
    if (!first) return;
    const ref = fieldRefs[first];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      ref.current.focus();
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value.trim());
    clearFieldError('email');
  };

  const handleResendVerification = async (emailAddress) => {
    await resendVerification(emailAddress);
    toast.success('Verification email resent!');
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
      setOtpSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setIsLoading(true);

    const errors = {};

    if (!firstName.trim()) errors.firstName = 'First name is required.';
    if (!lastName.trim()) errors.lastName = 'Last name is required.';
    if (!validateKUEmail(email)) errors.email = 'Please use your official KU student email (e.g., 0983.2022@students.ku.ac.ke).';
    if (!Object.values(passwordStrength).every(Boolean)) errors.password = 'Password must meet all the requirements shown below.';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!acceptedTerms) errors.terms = 'Please accept the terms and conditions to continue.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstError(errors);
      setIsLoading(false);
      return;
    }

    setSubmitted(true);
    setFieldErrors({});

    try {
      const response = await signup({
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        confirm_password: confirmPassword,
        accepted_terms: true
      });

      toast.success('Account created successfully! Redirecting to verification...', {
        duration: 4000,
        position: 'top-center',
        style: {
          background: darkMode ? '#1f2937' : '#ffffff',
          color: darkMode ? '#ffffff' : '#1f2937',
          border: darkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        }
      });

      if (response.access_token && response.user) {
        setUser(response.user);
      }

      setTimeout(() => setEmailSent(true), 2000);

    } catch (err) {
      const msg = err.message || 'Signup failed. Please try again.';
      const lower = msg.toLowerCase();

      let backendErrors = {};
      if (lower.includes('email')) {
        backendErrors = { email: msg };
      } else if (lower.includes('password')) {
        backendErrors = { confirmPassword: msg };
      } else if (lower.includes('first name')) {
        backendErrors = { firstName: msg };
      } else if (lower.includes('last name')) {
        backendErrors = { lastName: msg };
      } else {
        backendErrors = { general: msg };
      }

      setFieldErrors(backendErrors);
      focusFirstError(backendErrors);

      toast.error(msg, {
        duration: 4000,
        position: 'top-center',
        style: { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => navigate('/');

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

  const inputClass = (field, extraFocus = 'emerald') => {
    const hasError = !!fieldErrors[field];
    const base = 'w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-all duration-200';
    if (hasError) {
      return `${base} ${darkMode
        ? 'bg-gray-800/50 border-red-500 text-gray-100 placeholder-gray-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/30'
        : 'bg-white border-red-400 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'}`;
    }
    return `${base} ${darkMode
      ? `bg-gray-800/50 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-${extraFocus}-500 focus:ring-2 focus:ring-${extraFocus}-500/30`
      : `bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-${extraFocus}-500 focus:ring-2 focus:ring-${extraFocus}-500/20`}`;
  };

  const FieldError = ({ field }) => fieldErrors[field] ? (
    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
      <span className="inline-block w-1 h-1 rounded-full bg-red-500 flex-shrink-0" />
      {fieldErrors[field]}
    </p>
  ) : null;

  if (emailSent) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <div className={`p-10 rounded-3xl shadow-xl text-center max-w-md w-full ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          {otpSuccess ? (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold mb-2">Email verified!</h2>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Redirecting you to login…
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">📬</div>
              <h2 className="text-2xl font-bold mb-2">Check your KU email</h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                We sent a verification link and a 6-digit code to{' '}
                <strong>{email}</strong>. Use whichever is easier.
              </p>

              <form onSubmit={handleOtpVerify} className="mb-4">
                <label className={`block text-sm font-medium mb-2 text-left ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Enter 6-digit code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className={`w-full px-4 py-3 rounded-xl border text-center text-2xl tracking-widest font-mono focus:outline-none transition-all ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-emerald-500'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-emerald-500'
                  } ${otpError ? 'border-red-500' : ''}`}
                />
                {otpError && (
                  <p className="mt-1 text-sm text-red-500 text-left">{otpError}</p>
                )}
                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className={`mt-3 w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all ${
                    otpLoading || otp.length !== 6 ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {otpLoading ? 'Verifying…' : 'Verify Code'}
                </button>
              </form>

              <button
                onClick={() => handleResendVerification(email)}
                className="text-emerald-500 underline text-sm hover:text-emerald-600"
              >
                Didn't receive it? Resend email
              </button>
              <div className="mt-4">
                <Link to="/login" className="text-sm font-medium text-sky-500 hover:underline">
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <AuthPageShell darkMode={darkMode} background="signup">
      <Toaster
        toastOptions={{
          className: '',
          style: { borderRadius: '10px', padding: '16px', fontSize: '14px', fontWeight: '500' },
        }}
      />

      <BackButton
        darkMode={darkMode}
        label="Back to Home"
        onClick={handleBack}
        className="absolute top-6 left-6 z-10"
      />

      <div className="w-full max-w-lg z-20">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${
            darkMode
              ? 'bg-gradient-to-br from-emerald-500 to-sky-500'
              : 'bg-gradient-to-br from-emerald-400 to-sky-400'
          }`}>
            <UserPlus size={32} className="text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Join KUuza
          </h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Create your account to start trading on campus
          </p>
        </div>

        <AuthCard darkMode={darkMode}>
          {fieldErrors.general && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
              darkMode
                ? 'bg-red-500/10 border border-red-500/30 text-red-400'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
              <p className="text-sm font-medium">{fieldErrors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-2 mb-2 font-medium">
                  <User size={16} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} />
                  First Name
                </label>
                <input
                  ref={firstNameRef}
                  type="text"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value.replace(/[^a-zA-Z\s'-]/g, '')); clearFieldError('firstName'); }}
                  placeholder="John"
                  className={inputClass('firstName')}
                  required
                />
                <FieldError field="firstName" />
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2 font-medium">
                  <User size={16} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} />
                  Last Name
                </label>
                <input
                  ref={lastNameRef}
                  type="text"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value.replace(/[^a-zA-Z\s'-]/g, '')); clearFieldError('lastName'); }}
                  placeholder="Doe"
                  className={inputClass('lastName')}
                  required
                />
                <FieldError field="lastName" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 font-medium">
                <Mail size={16} className={darkMode ? 'text-emerald-400' : 'text-emerald-500'} />
                KU Student Email
              </label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="e.g., 1234.2022@students.ku.ac.ke"
                className={inputClass('email')}
                required
              />
              {!fieldErrors.email && email && !validateKUEmail(email) && (
                <p className={`mt-1 text-xs ${darkMode ? 'text-yellow-400/80' : 'text-yellow-600'}`}>
                  Enter your admission number followed by year (e.g., 1234.2022)
                </p>
              )}
              <FieldError field="email" />
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2 font-medium">
                <Lock size={16} className={darkMode ? 'text-sky-400' : 'text-sky-500'} />
                Password
              </label>
              <div className="relative mb-2">
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  placeholder="Create a strong password"
                  className={inputClass('password', 'sky')}
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
              <FieldError field="password" />

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Password strength</span>
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
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { key: 'length', label: 'At least 8 characters' },
                    { key: 'uppercase', label: 'One uppercase letter' },
                    { key: 'lowercase', label: 'One lowercase letter' },
                    { key: 'number', label: 'One number' },
                    { key: 'special', label: 'One special character' }
                  ].map((req) => {
                    const met = passwordStrength[req.key];
                    const flagged = submitted && !met;
                    return (
                      <div key={req.key} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                          met
                            ? darkMode ? 'bg-emerald-500' : 'bg-emerald-400'
                            : flagged ? 'bg-red-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                        }`}>
                          {met && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`text-xs ${
                          met
                            ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                            : flagged ? 'text-red-500 font-medium' : darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {req.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-2 font-medium">Confirm Password</label>
              <div className="relative">
                <input
                  ref={confirmPasswordRef}
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                  placeholder="Confirm your password"
                  className={inputClass('confirmPassword', 'sky')}
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
              {!fieldErrors.confirmPassword && password && confirmPassword && password === confirmPassword && (
                <p className={`mt-1 text-xs flex items-center gap-1 ${
                  darkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  <Check size={12} />
                  Passwords match
                </p>
              )}
              <FieldError field="confirmPassword" />
            </div>

            <div className="pt-2" ref={termsRef}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => { setAcceptedTerms(e.target.checked); clearFieldError('terms'); }}
                  className="mt-1 w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setOpenPolicy('terms')}
                    className={`font-medium hover:underline ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type="button"
                    onClick={() => setOpenPolicy('privacy')}
                    className={`font-medium hover:underline ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}
                  >
                    Privacy Policy
                  </button>. I verify that I am a current KU student with a valid student email.
                </span>
              </label>
              <FieldError field="terms" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-xl
                py-3.5 font-semibold text-lg transition-all duration-200
                ${isLoading || !acceptedTerms || !Object.values(passwordStrength).every(Boolean)
                  ? 'bg-gray-300 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Create KUuza Account</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center my-8">
            <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
            <span className={`px-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Already have an account?
            </span>
            <div className={`flex-1 h-px ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`} />
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className={`inline-flex items-center justify-center gap-2 rounded-xl
                px-6 py-3 font-semibold transition-all duration-200 hover:scale-105 border-2 ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-100 border-gray-600'
                  : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-500'
              }`}
            >
              Sign In to Existing Account
            </Link>
          </div>
        </AuthCard>

        <p className={`mt-8 text-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          By creating an account, you verify that you are a current student of Kenyatta University.
          <br />
          Access is restricted to valid KU student emails only.
        </p>
      </div>

      <PolicyModal type={openPolicy} onClose={() => setOpenPolicy(null)} darkMode={darkMode} />
    </AuthPageShell>
  );
};

export default SignUpPage;