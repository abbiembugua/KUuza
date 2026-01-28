import React, { useState } from "react";
import { Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { useTheme } from '../context/Themecontext';

const ForgotPassword = () => {
  const { darkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Call backend reset endpoint
    await fetch("http://localhost:8000/api/auth/forgot-password/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section
      className={`min-h-screen flex items-center justify-center px-6 transition-colors ${
        darkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      <div
        className={`w-full max-w-md p-8 rounded-2xl shadow-xl transition-colors ${
          darkMode
            ? "bg-gray-800 border border-gray-700"
            : "bg-white border border-gray-200"
        }`}
      >
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <h1
            className={`text-3xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Forgot your password?
          </h1>
          <p
            className={`mt-2 text-sm ${
              darkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            No worries. We’ll send you a secure reset link.
          </p>
        </div>

        {submitted ? (
          <div
            className={`text-center p-4 rounded-xl ${
              darkMode
                ? "bg-emerald-500/10 text-emerald-300"
                : "bg-emerald-500/10 text-emerald-700"
            }`}
          >
            If an account exists for <strong>{email}</strong>,  
            a password reset link has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  darkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-colors ${
                    darkMode
                      ? "bg-gray-900 border border-gray-700 text-white"
                      : "bg-white border border-gray-300 text-gray-900"
                  }`}
                  placeholder="student@students.ku.ac.ke"
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
      </div>
    </section>
  );
};

export default ForgotPassword;
