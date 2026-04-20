const API_URL = "http://localhost:8000/api/auth";

export const clearAuthStorage = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
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

      throw new Error(errorMessage);
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
    full_name: data.full_name,
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
