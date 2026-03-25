// src/api/authApi.js

const API_URL = "http://localhost:8000/api/auth";

/* ======================
   LOGIN
====================== */
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

    const result = await response.json();

    if (!response.ok) {
      let errorMessage = "Login failed";

      if (result.detail) errorMessage = result.detail;
      else if (result.non_field_errors) errorMessage = result.non_field_errors[0];
      else if (result.email) errorMessage = result.email[0];
      else if (result.password) errorMessage = result.password[0];

      throw new Error(errorMessage);
    }

    // ✅ SAVE TOKENS
    localStorage.setItem("access", result.access);
    localStorage.setItem("refresh", result.refresh);

    return result;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

/* ======================
   SIGNUP
====================== */
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

    const result = await response.json();

    if (!response.ok) {
      let errorMessage = "Signup failed";

      if (result.email) errorMessage = result.email[0];
      else if (result.password) errorMessage = result.password[0];
      else if (result.confirm_password) errorMessage = result.confirm_password[0];
      else if (result.accepted_terms) errorMessage = result.accepted_terms[0];
      else if (result.non_field_errors) errorMessage = result.non_field_errors[0];
      else if (result.detail) errorMessage = result.detail;

      throw new Error(errorMessage);
    }

    return result;
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
};

/* ======================
   CURRENT USER (JWT)
====================== */
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

export const logout = async () => {
  const refresh = localStorage.getItem("refresh");

  if (refresh) {
    try {
      await fetch("http://localhost:8000/api/auth/logout/", {
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

  // Always clear session
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};
export const verifyEmail = async (token) => {
  const response = await fetch(`${API_URL}/verify-email/?token=${token}`);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
};

export const resendVerification = async (email) => {
  const response = await fetch(`${API_URL}/resend-verification/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
};