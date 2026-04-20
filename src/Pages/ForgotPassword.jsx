import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, KeyRound, Mail, ShieldCheck } from "lucide-react";
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
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
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  New password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${
                    darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${
                    darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"
                  }`}
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all flex items-center justify-center gap-2"
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
