const API_URL = "http://localhost:8000/api/auth";

export const clearAuthStorage = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};

// Silently get a new access token using the stored refresh token.
// Returns the new access token string, or throws if refresh fails.
export const refreshAccessToken = async () => {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) throw new Error("No refresh token");

  const res = await fetch(`${API_URL}/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    clearAuthStorage();
    throw new Error("Session expired. Please log in again.");
  }

  const newAccess = data.access;
  localStorage.setItem("access", newAccess);

  // If the server rotated the refresh token, store the new one too
  if (data.refresh) localStorage.setItem("refresh", data.refresh);

  return newAccess;
};

// Drop-in replacement for fetch() that automatically retries once with a
// refreshed access token if the first attempt returns 401.
export const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem("access");
  const authOptions = {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  };

  let res = await fetch(url, authOptions);

  if (res.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      res = await fetch(url, {
        ...authOptions,
        headers: { ...authOptions.headers, Authorization: `Bearer ${newToken}` },
      });
    } catch {
      // Refresh failed — caller will receive the 401 response
    }
  }

  return res;
};

export const login = async (data) => {
  const payload = {
    email: data.email,
    password: data.password,
  };

  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      let errorMessage = "Login failed";

      if (result.error) errorMessage = result.error;
      else if (result.detail) errorMessage = result.detail;
      else if (result.non_field_errors) errorMessage = result.non_field_errors[0];
      else if (result.email) errorMessage = result.email[0];
      else if (result.password) errorMessage = result.password[0];

      const err = new Error(errorMessage);
      if (result.requires_verification) err.requiresVerification = true;
      throw err;
    }

    const accessToken = result.access || result.tokens?.access;
    const refreshToken = result.refresh || result.tokens?.refresh;

    if (!accessToken || !refreshToken) {
      throw new Error("Login succeeded but no tokens were returned.");
    }

    localStorage.setItem("access", accessToken);
    localStorage.setItem("refresh", refreshToken);

    return result;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const signup = async (data) => {
  const payload = {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    password: data.password,
    confirm_password: data.confirm_password,
    accepted_terms: true,
  };

  try {
    const response = await fetch(`${API_URL}/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      let errorMessage = "Signup failed";

      if (result.email) errorMessage = result.email[0];
      else if (result.password) errorMessage = result.password[0];
      else if (result.confirm_password) errorMessage = result.confirm_password[0];
      else if (result.accepted_terms) errorMessage = result.accepted_terms[0];
      else if (result.non_field_errors) errorMessage = result.non_field_errors[0];
      else if (result.detail) errorMessage = result.detail;
      else if (result.error) errorMessage = result.error;

      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem("access");

  if (!token) throw new Error("No token found");

  const response = await fetch(`${API_URL}/me/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unauthorized");
  }

  return response.json();
};

export const updateCurrentUser = async (data) => {
  const token = localStorage.getItem("access");

  if (!token) throw new Error("No token found");

  const response = await fetch(`${API_URL}/me/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.full_name?.[0] || result.detail || "Unable to update profile");
  }

  return result;
};

export const deleteCurrentUser = async () => {
  const token = localStorage.getItem("access");

  if (!token) throw new Error("No token found");

  const response = await fetch(`${API_URL}/me/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.detail || "Unable to delete account");
  }
};

export const logout = async () => {
  const refresh = localStorage.getItem("refresh");

  if (refresh) {
    try {
      await fetch(`${API_URL}/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({ refresh }),
      });
    } catch (err) {
      console.warn("Logout request failed, clearing session anyway");
    }
  }

  clearAuthStorage();
};

export const verifyEmail = async (token) => {
  const response = await fetch(`${API_URL}/verify-email/?token=${token}`);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || result.detail || "Unable to verify email.");
  }

  return result;
};

export const verifyEmailOTP = async (email, otp) => {
  const response = await fetch(`${API_URL}/verify-email-otp/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || result.detail || 'Unable to verify OTP.');
  }
  return result;
};

export const resendVerification = async (email) => {
  const response = await fetch(`${API_URL}/resend-verification/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || result.detail || "Unable to resend verification email.");
  }

  return result;
};

export const requestPasswordReset = async (email) => {
  const response = await fetch(`${API_URL}/forgot-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || result.detail || "Unable to send reset link.");
  }

  return result;
};

export const submitSellerVerification = async (data) => {
  const token = localStorage.getItem("access");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${API_URL}/seller/verify/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const msg =
      result.student_id?.[0] ||
      result.national_id?.[0] ||
      result.mpesa_phone?.[0] ||
      result.seller_terms_accepted?.[0] ||
      result.detail ||
      result.error ||
      "Verification failed";
    const err = new Error(msg);
    err.fieldErrors = {
      student_id: result.student_id?.[0],
      national_id: result.national_id?.[0],
      mpesa_phone: result.mpesa_phone?.[0],
    };
    throw err;
  }

  return result;
};

export const uploadProfilePicture = async (file) => {
  const token = localStorage.getItem("access");
  if (!token) throw new Error("No token found");

  const formData = new FormData();
  formData.append("profile_picture", file);

  const response = await fetch(`${API_URL}/me/profile-picture/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || result.detail || "Unable to upload picture");
  }
  return result;
};

export const deleteProfilePicture = async () => {
  const token = localStorage.getItem("access");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${API_URL}/me/profile-picture/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || result.detail || "Unable to delete picture");
  }
};

export const optOutAsSeller = async () => {
  const token = localStorage.getItem("access");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${API_URL}/seller/opt-out/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || result.detail || "Unable to opt out");
  }
  return result;
};

export const resetPassword = async ({ uid, token, password, confirm_password }) => {
  const response = await fetch(`${API_URL}/reset-password/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, token, password, confirm_password }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || result.detail || "Unable to reset password.");
  }

  return result;
};
