// admin-login.js

// Call to backend using dedicated admin username + password
async function loginAdmin(username, password) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password })
  });

  let data = null;
  try {
    data = await res.json();
  } catch (err) {
    data = null;
  }

  return {
    ok: res.ok && data?.ok,
    message: data?.message || (res.ok ? '' : 'Login failed'),
    adminKey: data?.adminKey || ''
  };
}

const form = document.getElementById('form-admin-login');
const statusEl = document.getElementById('login-status');
// Allow both #admin-username (preferred) or fallback to #admin-email
const usernameEl =
  document.getElementById('admin-username') ||
  document.getElementById('admin-email');
const passEl = document.getElementById('admin-pass');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = (usernameEl?.value || '').trim();
  const pass = (passEl?.value || '').trim();

  // UI feedback
  statusEl.textContent = 'Signing in…';
  statusEl.style.color = '';

  if (!username || !pass) {
    statusEl.textContent = 'Please enter username and password.';
    statusEl.style.color = '#ff7b8a';
    return;
  }

  const out = await loginAdmin(username, pass);

  if (!out.ok) {
    statusEl.textContent = out.message || 'Invalid admin credentials.';
    statusEl.style.color = '#ff7b8a';
    return;
  }

  // Go to admin space (or a specified next url)
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');
  location.replace(next ? next : '/admin.html');
});
