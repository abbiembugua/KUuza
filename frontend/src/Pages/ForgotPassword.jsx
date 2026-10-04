import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Check, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import AuthCard from "../Components/shared/AuthCard";
import AuthPageShell from "../Components/shared/AuthPageShell";
import BackButton from "../Components/shared/BackButton";
import { requestPasswordReset, resetPassword } from "../api/authapi";
import { useTheme } from "../context/Themecontext";

const ForgotPassword = () => {
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[!@#$%^&*]/.test(password),
  };
  const strengthScore = Object.values(strength).filter(Boolean).length;
  const strengthColor =
    strengthScore <= 1 ? 'bg-red-500'     :
    strengthScore <= 2 ? 'bg-orange-500'  :
    strengthScore <= 3 ? 'bg-yellow-500'  :
    strengthScore <= 4 ? 'bg-emerald-400' : 'bg-emerald-500';
  const strengthLabel =
    strengthScore <= 1 ? 'Very weak' :
    strengthScore <= 2 ? 'Weak'      :
    strengthScore <= 3 ? 'Fair'      :
    strengthScore <= 4 ? 'Good'      : 'Strong';

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");
  const isResetMode = useMemo(() => Boolean(uid && token), [token, uid]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message || "If the account exists, a reset link has been sent.");
    } catch (err) {
      setError(err.message || "Unable to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!Object.values(strength).every(Boolean)) {
      setError("Password must be at least 8 characters and include an uppercase letter, lowercase letter, number, and special character (!@#$%^&*).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword({
        uid,
        token,
        password,
        confirm_password: confirmPassword,
      });

      setMessage(result.message || "Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell darkMode={darkMode} background="login">
      <BackButton
        darkMode={darkMode}
        label="Back to Login"
        onClick={() => navigate("/login")}
        className="absolute top-6 left-6 z-10"
      />

      <div className="w-full max-w-md z-20">
        <AuthCard darkMode={darkMode}>
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {isResetMode ? (
                <KeyRound className="w-10 h-10 text-emerald-500" />
              ) : (
                <ShieldCheck className="w-10 h-10 text-emerald-500" />
              )}
            </div>
            <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
              {isResetMode ? "Set new password" : "Forgot password"}
            </h1>
            <p className={`mt-2 text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
              {isResetMode
                ? "Enter a new password, then you will be sent back to login."
                : "Enter your KU email and we will send you a reset link."}
            </p>
          </div>

          {error && (
            <div className={`mb-4 rounded-xl p-3 text-sm ${darkMode ? "bg-red-500/10 text-red-300" : "bg-red-50 text-red-600"}`}>
              {error}
            </div>
          )}

          {message && (
            <div className={`mb-4 rounded-xl p-3 text-sm ${darkMode ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
              {message}
            </div>
          )}

          {isResetMode ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* New password */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 pr-11 rounded-xl border outline-none ${
                      darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Strength bar */}
                {password && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className={darkMode ? "text-gray-400" : "text-gray-500"}>Strength</span>
                      <span className="font-medium">{strengthLabel}</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${(strengthScore / 5) * 100}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { key: "length",    label: "8+ characters"       },
                        { key: "uppercase", label: "Uppercase letter"     },
                        { key: "lowercase", label: "Lowercase letter"     },
                        { key: "number",    label: "Number"               },
                        { key: "special",   label: "Special character"    },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                            strength[key]
                              ? darkMode ? "bg-emerald-500" : "bg-emerald-400"
                              : darkMode ? "bg-gray-700"    : "bg-gray-300"
                          }`}>
                            {strength[key] && <Check size={8} className="text-white" />}
                          </div>
                          <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 pr-11 rounded-xl border outline-none ${
                      darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {password && confirmPassword && password === confirmPassword && (
                  <p className={`mt-1 text-xs flex items-center gap-1 ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                    <Check size={11} /> Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !Object.values(strength).every(Boolean)}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Change password"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none ${
                      darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
                    }`}
                    placeholder="1234.2024@students.ku.ac.ke"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Sending..." : "Send reset link"}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className={`text-sm font-medium hover:underline ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}
            >
              Back to login
            </Link>
          </div>
        </AuthCard>
      </div>
    </AuthPageShell>
  );
};

export default ForgotPassword;
