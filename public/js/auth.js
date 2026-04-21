/* ===================================================
   Auth Page — Logic
   =================================================== */

const API = "";

// Redirect if already logged in
(function checkAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (token && user) {
    if (user.role === "admin" || user.role === "employee") {
      window.location.href = "/admin.html";
    } else {
      window.location.href = "/";
    }
  }
})();

// Tab Switching
function switchTab(tab) {
  const loginTab = document.getElementById("tab-login");
  const adminTab = document.getElementById("tab-admin");
  const registerTab = document.getElementById("tab-register");
  
  const loginForm = document.getElementById("form-login");
  const adminForm = document.getElementById("form-admin");
  const registerForm = document.getElementById("form-register");
  
  const indicator = document.getElementById("tab-indicator");

  loginTab.classList.remove("active");
  if (adminTab) adminTab.classList.remove("active");
  registerTab.classList.remove("active");
  
  loginForm.classList.remove("active");
  if (adminForm) adminForm.classList.remove("active");
  registerForm.classList.remove("active");

  if (tab === "login") {
    loginTab.classList.add("active");
    loginForm.classList.add("active");
    indicator.style.transform = "translateX(0)";
  } else if (tab === "admin") {
    adminTab.classList.add("active");
    adminForm.classList.add("active");
    indicator.style.transform = "translateX(100%)";
  } else {
    registerTab.classList.add("active");
    registerForm.classList.add("active");
    indicator.style.transform = "translateX(200%)";
  }

  // Clear errors
  document.getElementById("login-error").textContent = "";
  if (document.getElementById("admin-error")) document.getElementById("admin-error").textContent = "";
  document.getElementById("register-error").textContent = "";
}

// Toggle Password Visibility
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === "password") {
    input.type = "text";
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  } else {
    input.type = "password";
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }
}

// Login Handler
async function handleLogin(e, roleType = 'user') {
  e.preventDefault();
  
  const isUser = roleType === 'user';
  const prefix = isUser ? "login" : "admin";
  const btn = document.getElementById(`btn-${isUser ? 'login' : 'admin-login'}`);
  const errorEl = document.getElementById(`${prefix}-error`);
  errorEl.textContent = "";

  const email = document.getElementById(`${prefix}-email`).value.trim();
  const password = document.getElementById(`${prefix}-password`).value;

  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = `<span class="btn-spinner"></span> ${isUser ? 'Signing in...' : 'Authorizing...'}`;

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!data.success) {
      errorEl.textContent = data.message;
      return;
    }

    const role = data.data.user.role;
    // Security check: if they use the user login for an admin account, it redirects anyway (which is fine).
    // If they use admin login for a user account, reject it.
    if (!isUser && role === "user") {
      errorEl.textContent = "Unauthorized: This portal is for Staff only.";
      return;
    }

    // Store token and user
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));

    // Redirect based on role
    if (role === "admin" || role === "employee") {
      window.location.href = "/admin.html";
    } else {
      window.location.href = "/";
    }
  } catch (err) {
    errorEl.textContent = "Network error. Please try again.";
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

// Register Handler
async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById("btn-register");
  const errorEl = document.getElementById("register-error");
  errorEl.textContent = "";

  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  const confirm = document.getElementById("register-confirm").value;

  if (password !== confirm) {
    errorEl.textContent = "Passwords do not match.";
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="btn-spinner"></span> Creating account...`;

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!data.success) {
      errorEl.textContent = data.message;
      return;
    }

    // Store token and user
    localStorage.setItem("token", data.data.token);
    localStorage.setItem("user", JSON.stringify(data.data.user));

    // Redirect to home
    window.location.href = "/";
  } catch (err) {
    errorEl.textContent = "Network error. Please try again.";
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>Create Account</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
  }
}
