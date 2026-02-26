// preferences.js
// Handles onboarding + preference form for TrueMatch

(function () {
  'use strict';

  const TM = window.TM || {};
  const SESSION = window.TM_SESSION;
  const API = window.TM_API;

  // Base URL for API calls (supports optional window.API_BASE override)
  const API_BASE = (window.API_BASE || '').toString().trim().replace(/\/$/, '');
  const ADV_ONBOARD_LS_KEY = 'tm_advOnboardingByEmail';
  let PREFS_ONBOARDING_MODE = null;
  let PREFS_FROM_PARAM = null;

  let IS_ONBOARDING = false;

  // ---- Profile (age, city, avatar) helpers ----
  let AVATAR_DATA_URL_FOR_UPLOAD = '';
  let EXISTING_AVATAR_URL = '';
  let AVATAR_HANDLERS_ATTACHED = false;


  // ---- Button loading helpers (shared UX) ----
  function tmEscapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function tmGetSubmitButton(form, evt) {
    // Prefer the button that actually triggered submit
    const submitter = evt && evt.submitter;
    if (submitter && submitter.tagName) return submitter;

    // Fallback: active element inside the form
    const ae = document.activeElement;
    if (ae && form && form.contains(ae) && ae.matches('button, input[type="submit"], input[type="button"]')) return ae;

    // Final fallback: first submit button in the form
    return (form && form.querySelector('button[type="submit"], button:not([type]), input[type="submit"]')) || null;
  }

  function tmSetButtonLoading(btn, isLoading, loadingText) {
    if (!btn) return;

    if (isLoading) {
      if (!btn.dataset.tmOriginalHtml) btn.dataset.tmOriginalHtml = btn.innerHTML;

      const label = loadingText || btn.textContent.trim() || 'Loading…';
      btn.classList.add('tm-btn--loading');
      btn.setAttribute('aria-busy', 'true');
      btn.disabled = true;

      btn.innerHTML =
        '<span class="tm-btn__inner">' +
          '<span class="tm-btn__label">' + tmEscapeHtml(label) + '</span>' +
          '<span class="tm-btn__spinner" aria-hidden="true"></span>' +
        '</span>';
    } else {
      btn.classList.remove('tm-btn--loading');
      btn.removeAttribute('aria-busy');
      btn.disabled = false;

      if (btn.dataset.tmOriginalHtml) {
        btn.innerHTML = btn.dataset.tmOriginalHtml;
      }
    }
  }

  function setAvatarPreview(src) {
    const img = qs('#avatarPreviewImg');
    const ph = qs('#avatarPlaceholder');
    if (!img) return;

    if (src) {
      img.src = src;
      img.style.display = 'block';
      if (ph) ph.style.display = 'none';
    } else {
      img.removeAttribute('src');
      img.style.display = 'none';
      if (ph) ph.style.display = 'flex';
    }
  }

  function setAvatarFileName(name) {
    const el = qs('#avatarFileName');
    if (!el) return;
    el.textContent = name || 'No file chosen';
  }

  function isProfileComplete(user) {
    if (!user) return false;
    const ageOk = Number(user.age) >= 18;
    const cityOk = (user.city || '').toString().trim().length > 1;
    const avatarOk = !!(user.avatarUrl || user.avatar);
    return ageOk && cityOk && avatarOk;
  }

  async function fileToOptimizedSquareDataUrl(file, opts = {}) {
    const maxSize = Number(opts.maxSize || 768);
    const quality = Number(opts.quality || 0.82);

    if (!file) throw new Error('No file selected');

    // No hard file-size cap here: we downscale + compress for upload.
    // (Very large photos may still fail on low-memory devices.)

    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ''));
      r.onerror = () => reject(new Error('Failed to read file.'));
      r.readAsDataURL(file);
    });

    // Create an Image to draw onto a canvas
    const img = await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error('Invalid image file.'));
      im.src = dataUrl;
    });

    // Square crop
    const side = Math.min(img.width, img.height);
    const sx = Math.floor((img.width - side) / 2);
    const sy = Math.floor((img.height - side) / 2);

    const target = Math.min(maxSize, side);
    const canvas = document.createElement('canvas');
    canvas.width = target;
    canvas.height = target;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported.');
    ctx.drawImage(img, sx, sy, side, side, 0, 0, target, target);

    // Prefer JPEG for smaller size
    const out = canvas.toDataURL('image/jpeg', quality);
    return out;
  }

  // ---- Manual Avatar Crop (Cropper.js modal) ----
  // This lets the user choose the crop region manually before we upload.
  // Fallback: if Cropper fails to load, we keep the old auto-center-crop flow.
  let _tmAvatarCropper = null;
  let _tmAvatarCropObjectUrl = '';
  let _tmCropKeyHandler = null;

  function _tmGetCropEls() {
    const modal = document.getElementById('tmCropModal');
    if (!modal) return null;

    const img = document.getElementById('tmCropImg');
    const zoom = document.getElementById('tmCropZoom');
    const btnCancel = document.getElementById('tmCropCancel');
    const btnApply = document.getElementById('tmCropApply');

    if (!img || !zoom || !btnCancel || !btnApply) return null;

    const closeEls = Array.from(modal.querySelectorAll('[data-crop-close]')) || [];
    return { modal, img, zoom, btnCancel, btnApply, closeEls };
  }

  function _tmDestroyCropper() {
    try { if (_tmAvatarCropper) _tmAvatarCropper.destroy(); } catch {}
    _tmAvatarCropper = null;

    if (_tmAvatarCropObjectUrl) {
      try { URL.revokeObjectURL(_tmAvatarCropObjectUrl); } catch {}
      _tmAvatarCropObjectUrl = '';
    }
  }

  function _tmCloseCropModal() {
    const els = _tmGetCropEls();
    // Clear UI handlers to avoid stacking listeners
    try {
      if (els) {
        if (els.zoom) els.zoom.oninput = null;
        if (els.btnCancel) els.btnCancel.onclick = null;
        if (els.btnApply) els.btnApply.onclick = null;
        (els.closeEls || []).forEach((el) => { try { el.onclick = null; } catch {} });
      }
    } catch {}
    if (els && els.modal) {
      els.modal.classList.remove('is-open');
      els.modal.setAttribute('aria-hidden', 'true');
    }
    try { if (els && els.img) els.img.removeAttribute('src'); } catch {}
    try { document.body.style.overflow = ''; } catch {}
    _tmDestroyCropper();

    if (_tmCropKeyHandler) {
      try { window.removeEventListener('keydown', _tmCropKeyHandler); } catch {}
      _tmCropKeyHandler = null;
    }
  }

  function cropAvatarWithModal(file, opts = {}) {
    const maxSize = Number(opts.maxSize || 768);
    const quality = Number(opts.quality || 0.82);

    return new Promise((resolve, reject) => {
      try {
        const CropperCtor = window.Cropper;
        const els = _tmGetCropEls();

        if (!CropperCtor || !els) {
          return reject(new Error('cropper_unavailable'));
        }

        // reset any previous
        _tmCloseCropModal();

        els.modal.classList.add('is-open');
        els.modal.setAttribute('aria-hidden', 'false');
        try { document.body.style.overflow = 'hidden'; } catch {}

        // Load the image via object URL (faster + memory-friendly)
        _tmAvatarCropObjectUrl = URL.createObjectURL(file);
        els.img.src = _tmAvatarCropObjectUrl;

        const onImgLoad = () => {
          try { if (_tmAvatarCropper) _tmAvatarCropper.destroy(); } catch {}

          _tmAvatarCropper = new CropperCtor(els.img, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 1,
            background: false,
            responsive: true,
            guides: false,
            center: true,
            highlight: false,
            movable: true,
            zoomable: true,
            rotatable: false,
            scalable: false
          });

          // Reset zoom slider
          try { els.zoom.value = '1'; } catch {}
        };

        // Must wait for the image element to load before init Cropper
        els.img.addEventListener('load', onImgLoad, { once: true });

        const cleanupAndReject = (reason) => {
          _tmCloseCropModal();
          reject(new Error(reason || 'crop_cancelled'));
        };

        const cleanupAndResolve = (dataUrl) => {
          _tmCloseCropModal();
          resolve(String(dataUrl || ''));
        };

        // Close handlers (backdrop or X)
        const onCloseClick = (e) => {
          e.preventDefault();
          cleanupAndReject('crop_cancelled');
        };
        els.closeEls.forEach((el) => { try { el.onclick = onCloseClick; } catch {} });

        // Cancel button
        const onCancel = (e) => {
          e.preventDefault();
          cleanupAndReject('crop_cancelled');
        };
        try { els.btnCancel.onclick = onCancel; } catch {}

        // Apply button
        const onApply = (e) => {
          e.preventDefault();
          try {
            if (!_tmAvatarCropper) throw new Error('cropper_not_ready');

            const canvas = _tmAvatarCropper.getCroppedCanvas({
              width: maxSize,
              height: maxSize,
              imageSmoothingEnabled: true,
              imageSmoothingQuality: 'high'
            });

            const out = canvas.toDataURL('image/jpeg', quality);
            cleanupAndResolve(out);
          } catch (err) {
            cleanupAndReject(err && err.message ? err.message : 'crop_failed');
          }
        };
        try { els.btnApply.onclick = onApply; } catch {}

        // Zoom slider
        const onZoom = () => {
          try {
            if (!_tmAvatarCropper) return;
            const v = Number(els.zoom.value);
            if (!Number.isFinite(v)) return;
            // Clamp: Cropper zoomTo wants a scale ratio (1 = original)
            const z = Math.max(0.5, Math.min(3, v));
            _tmAvatarCropper.zoomTo(z);
          } catch {}
        };
        try { els.zoom.oninput = onZoom; } catch {}

        // ESC closes
        _tmCropKeyHandler = (ev) => {
          if (ev && ev.key === 'Escape') cleanupAndReject('crop_cancelled');
        };
        window.addEventListener('keydown', _tmCropKeyHandler);

        // If user cancels/resets before image loads, Cropper init may still run;
        // we rely on _tmCloseCropModal() to destroy safely.
      } catch (e) {
        _tmCloseCropModal();
        reject(e);
      }
    });
  }


  function getProfileValues() {
    const ageInput = qs('input[name="profileAge"]');
    const cityInput = qs('input[name="profileCity"]');
    const fileInput = qs('#avatarFile');

    const age = ageInput ? Number(ageInput.value) : NaN;
    const city = cityInput ? cityInput.value.trim() : '';

    const file = fileInput && fileInput.files ? fileInput.files[0] : null;

    return { age, city, file };
  }

  function validateProfileValues(profile, ctx = {}) {
    const requireAll = !!ctx.requireAll;

    if (!profile) return false;

    const age = Number(profile.age);
    if (!Number.isFinite(age) || age < 18 || age > 80) {
      toast('Please enter a valid age between 18 and 80.', 'error');
      return false;
    }

    if (!profile.city || profile.city.length < 2) {
      toast('Please enter your city.', 'error');
      return false;
    }

    const hasNewFile = !!profile.file;
    const hasExisting = !!EXISTING_AVATAR_URL;

    if (requireAll && !hasNewFile && !hasExisting) {
      showAvatarRequiredNotice();
      toast('Please upload a profile picture.', 'error');
      scrollToAvatarSection();
      return false;
    }

    return true;
  }


// ---- Avatar required notice (prevents hidden required-file native validation issues) ----
const AVATAR_NOTICE_ID = 'tmAvatarRequiredNotice';

function ensureAvatarNoticeEl() {
  let el = document.getElementById(AVATAR_NOTICE_ID);
  if (el) return el;

  const fileInput = qs('#avatarFile');
  if (!fileInput) return null;

  // Try to attach the notice near the avatar upload UI
  const host =
    fileInput.closest('.avatar-upload') ||
    fileInput.closest('.form-group') ||
    fileInput.parentElement ||
    fileInput;

  el = document.createElement('div');
  el.id = AVATAR_NOTICE_ID;
  el.setAttribute('role', 'alert');

  // Inline styles so we don't need CSS changes
  el.style.marginTop = '10px';
  el.style.padding = '10px 12px';
  el.style.borderRadius = '12px';
  el.style.border = '1px solid rgba(255, 77, 79, 0.55)';
  el.style.background = 'rgba(255, 77, 79, 0.08)';
  el.style.color = 'rgba(255, 255, 255, 0.92)';
  el.style.fontSize = '12px';
  el.style.lineHeight = '1.35';
  el.style.display = 'none';

  el.innerHTML =
    '<strong style="color:#ff4d4f">Required:</strong> Upload a profile picture to continue. ' +
    '<span style="opacity:.9">JPG/PNG recommended.</span>';

  try { host.appendChild(el); } catch { return null; }
  return el;
}

function showAvatarRequiredNotice() {
  const el = ensureAvatarNoticeEl();
  if (!el) return;
  el.style.display = 'block';
}

function clearAvatarRequiredNotice() {
  const el = document.getElementById(AVATAR_NOTICE_ID);
  if (!el) return;
  el.style.display = 'none';
}

function scrollToAvatarSection() {
  const fileInput = qs('#avatarFile');
  const host =
    fileInput?.closest('.avatar-upload') ||
    fileInput?.closest('.form-group') ||
    fileInput?.parentElement ||
    fileInput;

  if (host && typeof host.scrollIntoView === 'function') {
    try { host.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
  }

  // Add a temporary highlight pulse
  try {
    if (host && host.style) {
      const prev = host.style.boxShadow;
      host.style.boxShadow = '0 0 0 2px rgba(255,77,79,.55), 0 0 20px rgba(255,77,79,.25)';
      setTimeout(() => {
        try { host.style.boxShadow = prev || ''; } catch {}
      }, 1400);
    }
  } catch {}
}

function updateAvatarRequiredNotice() {
  const hasNew = !!AVATAR_DATA_URL_FOR_UPLOAD;
  const hasExisting = !!EXISTING_AVATAR_URL;
  const missing = !(hasNew || hasExisting);

  if (missing) showAvatarRequiredNotice();
  else clearAvatarRequiredNotice();
}
  function attachAvatarHandlers() {
    if (AVATAR_HANDLERS_ATTACHED) return;
    const fileInput = qs('#avatarFile');
    if (!fileInput) return;
    AVATAR_HANDLERS_ATTACHED = true;
    // Don't rely on native HTML 'required' on hidden file inputs (causes 'not focusable' errors).
    // We'll enforce required photo in JS instead.
    try { fileInput.removeAttribute('required'); } catch {}
    try { fileInput.setAttribute('aria-required', 'true'); } catch {}


    fileInput.addEventListener('change', async () => {
      const f = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      if (!f) {
        AVATAR_DATA_URL_FOR_UPLOAD = '';
        setAvatarPreview(EXISTING_AVATAR_URL || '');
        setAvatarFileName('');
        updateAvatarRequiredNotice();
        return;
      }
      setAvatarFileName(f.name);

      // Prefer manual crop UI (Cropper.js). If Cropper is unavailable or fails, fallback to auto-center-crop.
      try {
        const cropped = await cropAvatarWithModal(f, { maxSize: 768, quality: 0.82 });

        AVATAR_DATA_URL_FOR_UPLOAD = cropped;
        setAvatarPreview(AVATAR_DATA_URL_FOR_UPLOAD);
        updateAvatarRequiredNotice();

        // Clear the native file input so the user can re-pick the same file if needed.
        try { fileInput.value = ''; } catch {}
        setAvatarFileName('Cropped photo');
        return;
      } catch (err) {
        const msg = String(err && err.message ? err.message : err || '');
        if (msg.includes('crop_cancelled')) {
          // User cancelled crop -> revert UI + clear file selection
          AVATAR_DATA_URL_FOR_UPLOAD = '';
          setAvatarPreview(EXISTING_AVATAR_URL || '');
          setAvatarFileName('');
          updateAvatarRequiredNotice();
          try { fileInput.value = ''; } catch {}
          return;
        }
        // cropper_unavailable -> continue to fallback below
      }

      try {
        AVATAR_DATA_URL_FOR_UPLOAD = await fileToOptimizedSquareDataUrl(f, {
          maxSize: 768,
          quality: 0.82
        });
        setAvatarPreview(AVATAR_DATA_URL_FOR_UPLOAD);
        updateAvatarRequiredNotice();
      } catch (err) {
        AVATAR_DATA_URL_FOR_UPLOAD = '';
        setAvatarPreview(EXISTING_AVATAR_URL || '');
        setAvatarFileName('');
        toast(err.message || 'Could not process image.', 'error');
        updateAvatarRequiredNotice();
        // Reset input to force re-pick
        try { fileInput.value = ''; } catch {}
      }
});
  }


  function readAdvancedOnboardingMap() {
    try {
      const raw = localStorage.getItem(ADV_ONBOARD_LS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (err) {
      console.warn('[prefs] failed to read advanced onboarding map', err);
      return {};
    }
  }

  function writeAdvancedOnboardingMap(map) {
    try {
      localStorage.setItem(ADV_ONBOARD_LS_KEY, JSON.stringify(map || {}));
    } catch (err) {
      console.warn('[prefs] failed to write advanced onboarding map', err);
    }
  }

  function markAdvancedOnboardingDone(email) {
    if (!email) return;
    const key = String(email || '').toLowerCase();
    const map = readAdvancedOnboardingMap();
    if (!map[key]) return;
    map[key].done = true;
    map[key].completedAt = Date.now();
    writeAdvancedOnboardingMap(map);
  }

  // ---- Plan helpers for advanced filters ----
  function normalizePlanKey(plan) {
    const raw = (plan || '').toString().toLowerCase();
    if (!raw) return 'free';
    if (raw === 'plus' || raw === 'tier1' || raw === 'tier-1') return 'tier1';
    if (raw === 'elite' || raw === 'tier2' || raw === 'tier-2') return 'tier2';
    if (raw === 'concierge' || raw === 'tier3' || raw === 'tier-3') return 'tier3';
    return raw;
  }

  function planHasAdvancedFilters(plan) {
    const key = normalizePlanKey(plan);
    // All paid tiers get advanced filters
    return key === 'tier1' || key === 'tier2' || key === 'tier3';
  }

  function toggleAdvancedSection(plan) {
    const section = document.getElementById('advancedPrefsSection');
    if (!section) return;

    const show = planHasAdvancedFilters(plan);
    if (show) {
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  }

  function buildLiveApiClient() {
    const buildUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path);

    async function getMe() {
      const res = await fetch(buildUrl('/api/me'), {
        method: 'GET',
        credentials: 'include'
      });

      if (!res.ok) {
        return { ok: false, status: res.status };
      }

      const json = await res.json().catch(() => null);
      if (!json || typeof json !== 'object') {
        return { ok: false, status: res.status || 500 };
      }

      return json;
    }

    async function getPreferences() {
      const res = await fetch(buildUrl('/api/me/preferences'), {
        method: 'GET',
        credentials: 'include'
      });

      if (!res.ok) {
        return { ok: false, status: res.status };
      }

      const json = await res.json().catch(() => null);
      if (!json || typeof json !== 'object') {
        return { ok: false, status: res.status || 500 };
      }

      return json;
    }

    async function savePreferences(prefs) {
      const res = await fetch(buildUrl('/api/me/preferences'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(prefs)
      });

      const json = await res.json().catch(() => null);
      if (!json || typeof json !== 'object') {
        return {
          ok: res.ok,
          status: res.status
        };
      }

      return json;
    }

    
    async function saveProfile(profile) {
      const url = API_BASE ? `${API_BASE}/api/me/profile` : '/api/me/profile';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profile || {})
      });

      const json = await res.json().catch(() => null);
      if (!json || typeof json !== 'object') {
        return { ok: res.ok, status: res.status };
      }
      return json;
    }

return {
      getMe,
      getPreferences,
      savePreferences,
      saveProfile
    };
  }

  function ensureApiClient() {
    if (API && typeof API.buildApiClient === 'function') {
      return API.buildApiClient();
    }
    return buildLiveApiClient();
  }

  // ---- Local storage helpers ----
  const PREFS_KEY = 'tm_prefs';
  const PREFS_PER_USER_KEY = 'tm_prefs_by_email';

  function log(...args) {
    console.log('[prefs]', ...args);
  }

  function getLocalPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (!raw) return null;
      const prefs = JSON.parse(raw);
      if (!prefs || typeof prefs !== 'object') return null;
      return prefs;
    } catch (err) {
      console.warn('[prefs] failed to parse local prefs', err);
      return null;
    }
  }

  function saveLocalPrefs(prefs) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs || {}));
    } catch (err) {
      console.warn('[prefs] failed to save local prefs', err);
    }
  }

  function getStoredPrefsForUser(email) {
    if (!email) return null;
    try {
      const raw = localStorage.getItem(PREFS_PER_USER_KEY);
      if (!raw) return null;
      const map = JSON.parse(raw);
      if (!map || typeof map !== 'object') return null;
      const key = email.toLowerCase();
      return map[key] || null;
    } catch (err) {
      console.warn('[prefs] failed to parse PREFS_PER_USER_KEY', err);
      return null;
    }
  }

  function saveStoredPrefsForUser(email, prefs) {
    if (!email) return;
    try {
      const raw = localStorage.getItem(PREFS_PER_USER_KEY);
      const map = raw ? JSON.parse(raw) : {};
      const key = email.toLowerCase();
      map[key] = prefs || {};
      localStorage.setItem(PREFS_PER_USER_KEY, JSON.stringify(map));
    } catch (err) {
      console.warn('[prefs] failed to save PREFS_PER_USER_KEY', err);
    }
  }

  function getStoredPrefs() {
    const user = getLocalUserFromSessionOrStorage();
    if (!user || !user.email) return getLocalPrefs();
    return getStoredPrefsForUser(user.email) || getLocalPrefs();
  }

  // ---- Form helpers ----
  function getFormValues() {
    const cityInput = qs('input[name="city"]');
    const ageMinInput = qs('input[name="ageMin"]');
    const ageMaxInput = qs('input[name="ageMax"]');
    const ethnicitySelect = qs('select[name="ethnicity"]');

    // preferences.html uses radio cards for "lookingFor" (men/women)
    const lookingForRadio = qs('input[name="lookingFor"]:checked');
    const lookingFor = lookingForRadio ? String(lookingForRadio.value || '').toLowerCase() : '';

    const intent = qs('select[name="intent"]')?.value || '';
    const dealbreakers =
      qs('textarea[name="dealbreakers"]')?.value?.trim() || '';
    const sharedValues = qsa('input[name="sharedValues"]:checked').map(
      (cb) => cb.value
    );

    const city = cityInput ? cityInput.value.trim() : '';
    const ageMin = ageMinInput ? Number(ageMinInput.value) : NaN;
    const ageMax = ageMaxInput ? Number(ageMaxInput.value) : NaN;
    const ethnicity = ethnicitySelect ? ethnicitySelect.value : '';

    return {
      city,
      ageMin,
      ageMax,
      ethnicity,
      lookingFor,
      intent,
      dealbreakers,
      sharedValues
    };
  }

  function validateFormValues(prefs) {
    if (!prefs) return false;

    const { city, ageMin, ageMax, lookingFor } = prefs;

    if (!city || typeof city !== 'string') {
      toast('Please enter your city.', 'error');
      return false;
    }

    if (!Number.isFinite(ageMin) || !Number.isFinite(ageMax)) {
      toast('Please enter a valid age range.', 'error');
      return false;
    }

    if (ageMin < 18 || ageMin > ageMax || ageMax > 80) {
      toast(
        'Please enter an age range between 18 and 80 where min is not greater than max.',
        'error'
      );
      return false;
    }

    if (!lookingFor) {
      toast('Please select who you are looking for.', 'error');
      return false;
    }

    return true;
  }

  function fillFormFromPrefs(prefs) {
    if (!prefs || typeof prefs !== 'object') return;

    if (prefs.city && qs('input[name="city"]')) {
      qs('input[name="city"]').value = prefs.city;
    }

    if (typeof prefs.ageMin === 'number' && qs('input[name="ageMin"]')) {
      qs('input[name="ageMin"]').value = String(prefs.ageMin);
    }

    if (typeof prefs.ageMax === 'number' && qs('input[name="ageMax"]')) {
      qs('input[name="ageMax"]').value = String(prefs.ageMax);
    }

    if (prefs.ethnicity && qs('select[name="ethnicity"]')) {
      qs('select[name="ethnicity"]').value = prefs.ethnicity;
    }
    if (prefs.lookingFor) {
      let lf = prefs.lookingFor;
      if (Array.isArray(lf)) lf = lf[0];
      const val = String(lf || '').toLowerCase();
      qsa('input[name="lookingFor"]').forEach((r) => {
        r.checked = String(r.value || '').toLowerCase() === val;
      });
    }
if (prefs.intent && qs('select[name="intent"]')) {
      qs('select[name="intent"]').value = prefs.intent;
    }

    if ('dealbreakers' in prefs && qs('textarea[name="dealbreakers"]')) {
      qs('textarea[name="dealbreakers"]').value = prefs.dealbreakers || '';
    }

    if (Array.isArray(prefs.sharedValues)) {
      qsa('input[name="sharedValues"]').forEach((cb) => {
        cb.checked = prefs.sharedValues.includes(cb.value);
      });
    }
  }

  // ---- Demo / local user helpers ----
  function ensureDemoOrLocalUser() {
    const existing =
      getLocalUserFromSessionOrStorage() ||
      (TM && TM.currentUser) ||
      null;

    if (existing && existing.email) {
      return existing;
    }

    // demo user as fallback
    const demoUser = {
      email: 'demo@truematch.test',
      name: 'Demo User',
      planKey: 'free',
      plan: 'free',
      prefsSaved: false
    };

    try {
      localStorage.setItem('tm_user', JSON.stringify(demoUser));
    } catch (err) {
      console.warn('[prefs] failed to persist demo user', err);
    }

    return demoUser;
  }

  function mergeUserWithPrefs(user, prefs) {
    const merged = Object.assign({}, user || {}, {
      preferences: Object.assign(
        {},
        (user && (user.preferences || user.prefs)) || {},
        prefs || {}
      ),
      prefsSaved: true
    });

    return merged;
  }

  function toast(message, type) {
    if (window.Swal) {
      Swal.fire({
        icon: type === 'error' ? 'error' : 'success',
        title: type === 'error' ? 'Oops...' : 'Success',
        text: message,
        timer: type === 'error' ? undefined : 3000,
        showConfirmButton: type === 'error'
      });
      return;
    }
    // fallback
    alert(message);
  }
  function qs(selector) {
    return document.querySelector(selector);
  }

  function qsa(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function showLoader() {
    try {
      let loader = document.getElementById('app-loader');
      if (loader) {
        loader.style.display = 'flex';
        void loader.offsetWidth; 
        loader.style.opacity = '1';
        setTimeout(() => { hideLoader(); }, 1500); // Failsafe auto-hide
      }
    } catch (e) {}
  }

  function hideLoader() {
    try {
      const loader = document.getElementById('app-loader');
      if(loader) {
        loader.style.opacity = '0';
        setTimeout(() => { loader.style.display = 'none'; }, 400);
      }
    } catch (e) {}
  }

  function buildTierQS(opts) {
    const url = new URL(window.location.href);
    const params = url.searchParams;

    const within = params.get('within') || '';
    const plan = params.get('plan') || params.get('prePlan') || '';
    const from = params.get('from') || '';
    const ret = params.get('return') || '';

    const next = new URLSearchParams();
    if (within) next.set('within', within);
    if (plan) next.set('plan', plan);
    if (from) next.set('from', from);
    if (ret) next.set('return', ret);

    if (opts && opts.step) {
      next.set('step', opts.step);
    }
    if (opts && opts.dest) {
      next.set('dest', opts.dest);
    }

    const str = next.toString();
    return str || '';
  }

  async function getApiMe(api) {
    try {
      const me = await api.getMe();
      return me || null;
    } catch (err) {
      console.warn('[prefs] getApiMe failed', err);
      return null;
    }
  }

  async function getApiPrefs(api) {
    try {
      const res = await api.getPreferences();
      if (res && res.ok && (res.preferences || res.prefs)) {
        return res.preferences || res.prefs;
      }
      return null;
    } catch (err) {
      console.warn('[prefs] getApiPrefs failed', err);
      return null;
    }
  }

  function getLocalUserFromSessionOrStorage() {
    try {
      if (SESSION && typeof SESSION.getCurrentUser === 'function') {
        const user = SESSION.getCurrentUser();
        if (user && user.email) return user;
      }
    } catch (err) {
      console.warn('[prefs] SESSION.getCurrentUser threw', err);
    }

    try {
      const raw = localStorage.getItem('tm_user');
      if (!raw) return null;
      const user = JSON.parse(raw);
      if (!user || typeof user !== 'object') return null;
      return user;
    } catch (err) {
      console.warn(
        '[prefs] failed to parse tm_user in getLocalUserFromSessionOrStorage',
        err
      );
      return null;
    }
  }

  // ---- Top nav (Logout only on Preferences) ----
  function sanitizeReturnUrl(raw) {
    const val = (raw || '').toString().trim();
    if (!val) return '';
    // Block absolute URLs / protocol-relative / javascript:
    if (/^https?:\/\//i.test(val) || val.startsWith('//') || /^javascript:/i.test(val)) return '';

    let out = val;
    try { out = decodeURIComponent(out); } catch {}

    // Allow same-origin relative paths only
    out = out.replace(/^\/+/, '');

    // Only allow html pages (with optional query/hash)
    if (!/\.html($|[?#])/i.test(out)) return '';

    return out;
  }

  function getReturnDestination(params) {
    if (!params) return 'dashboard.html';
    const cand =
      params.get('return') ||
      params.get('ret') ||
      params.get('redirect') ||
      params.get('next') ||
      '';

    return sanitizeReturnUrl(cand) || 'dashboard.html';
  }

  async function performLogout() {
    // Attempt to clear cookie-based session on backend (non-fatal if it fails)
    try {
      const url = API_BASE ? `${API_BASE}/api/auth/logout` : '/api/auth/logout';
      await fetch(url, { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.warn('[prefs] logout request failed', err);
    }

    try { SESSION?.clearAuth?.(); } catch {}
    try { SESSION?.clearSession?.(); } catch {}

    try { localStorage.removeItem('tm_user'); } catch {}
    try { sessionStorage.clear(); } catch {}

    // Always send user back to home/landing
    window.location.href = 'index.html';
  }

  function syncTopNav(user, params) {
    const logoutLink =
      document.querySelector('.nav-logout-link') ||
      document.querySelector('.nav-login-link');

    if (!logoutLink) return;

    const isAuthed = !!(user && user.email);

    if (isAuthed) {
      logoutLink.textContent = 'LOG OUT';
      logoutLink.setAttribute('href', '#');
      logoutLink.onclick = (e) => {
        e.preventDefault();
        performLogout();
      };
    } else {
      // Preferences page should normally be protected by backend auth,
      // but keep a safe fallback just in case.
      logoutLink.textContent = 'LOG IN';
      logoutLink.setAttribute('href', 'auth.html?mode=signin&return=preferences.html');
      logoutLink.onclick = null;
    }
  }


  async function initPreferencesPage() {
    showLoader();

    const url = new URL(window.location.href);
    const params = url.searchParams;
    const onboardingParam = (params.get('onboarding') || '')
      .toString()
      .toLowerCase();
    const onboarding = onboardingParam === '1';
    IS_ONBOARDING = onboarding;
    PREFS_ONBOARDING_MODE = onboardingParam;
    PREFS_FROM_PARAM = (params.get('from') || '').toString().toLowerCase();

    // Keep initial plan from URL only as a fallback,
    // but do NOT toggle advanced section here anymore.
    const initialPlan =
      params.get('plan') ||
      params.get('prePlan') ||
      '';

    const api = ensureApiClient();
    let localUser = getLocalUserFromSessionOrStorage();

    // Sync top nav immediately (LOG OUT for authed users)
    try { syncTopNav(localUser, params); } catch {}

    // Do NOT auto-create demo users here.
    // If there is no valid session/user, the redirect-to-auth logic below will handle it.

    try {
      // IMPORTANT:
      // Do NOT rely on localStorage for auth detection.
      // On first login, cookie session may exist but local 'tm_user' isn't written yet.
      // So we must try /api/me first to avoid the "login once → error → login again works" issue.
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      let me = await getApiMe(api);
      if (me && me.ok === false) {
        // small retry to handle session propagation on first redirect
        await sleep(250);
        me = await getApiMe(api);
      }

      const hasServerSession = !!(me && me.user && me.ok !== false);

      // If server session is not ready/valid, fall back to local storage.
      // If neither exists, force sign-in.
      if (!hasServerSession) {
        const userFromSession = getLocalUserFromSessionOrStorage();
        const user = userFromSession || localUser;

        if (!user || !user.email) {
          console.warn('[prefs] No server session and no local user/email, redirecting to auth');
          try { syncTopNav(null, params); } catch {}
          window.location.replace('auth.html?mode=signin&return=preferences.html');
          hideLoader();
          return;
        }

        // Local prefill only
        try {
          const pAge = qs('#profileAge');
          const pCity = qs('#profileCity');
          if (pAge && user.age) pAge.value = String(user.age);
          if (pCity && user.city) pCity.value = String(user.city);

          EXISTING_AVATAR_URL = String(user.avatarUrl || user.avatar || '');
          setAvatarPreview(EXISTING_AVATAR_URL);
          setAvatarFileName('');
          attachAvatarHandlers();
      updateAvatarRequiredNotice();
        } catch (e) {
          console.warn('[prefs] local prefill failed', e);
        }

        toggleAdvancedSection((user.plan || user.planKey || initialPlan || 'free'));

        const localPrefs = getStoredPrefs();
        if (localPrefs) fillFormFromPrefs(localPrefs);
      }

      let serverPrefs = null;

      try {
        // If server session exists, hydrate from backend
        if (hasServerSession) {
          const userFromApi = me.user;
          const prefsFromUser =
            userFromApi.preferences ||
            userFromApi.prefs ||
            null;
          const prefsFromRoot =
            me.preferences || me.prefs || null;

          if (prefsFromUser || prefsFromRoot) {
            serverPrefs = prefsFromUser || prefsFromRoot;
          }

          const mergedUser = Object.assign({}, localUser, userFromApi, {
            prefsSaved: !!serverPrefs
          });

          // Keep top nav in sync with authenticated state
          try { syncTopNav(mergedUser, params); } catch {}

          SESSION?.setCurrentUser?.(mergedUser);
          localStorage.setItem('tm_user', JSON.stringify(mergedUser));

          // Prefill profile fields (age/city/avatar)
          try {
            const pAge = qs('#profileAge');
            const pCity = qs('#profileCity');
            if (pAge && userFromApi && userFromApi.age) pAge.value = String(userFromApi.age);
            if (pCity && userFromApi && userFromApi.city) pCity.value = String(userFromApi.city);

            EXISTING_AVATAR_URL = String(userFromApi.avatarUrl || userFromApi.avatar || '');
            setAvatarPreview(EXISTING_AVATAR_URL);
            setAvatarFileName('');
            attachAvatarHandlers();
          } catch (e) {
            console.warn('[prefs] profile prefill failed', e);
          }

          // Update advanced section based on the latest plan from backend
          const userPlan =
            userFromApi.plan ||
            userFromApi.planKey ||
            initialPlan ||
            '';
          toggleAdvancedSection(userPlan || 'free');

          if (serverPrefs) {
            saveStoredPrefsForUser(mergedUser.email, serverPrefs);
          }

          // Optionally re-read prefs via api.getPreferences
          // NOTE: keep existing serverPrefs if endpoint is missing (404) or returns null.
          const fetchedPrefs = await getApiPrefs(api);
          if (fetchedPrefs) serverPrefs = fetchedPrefs;

          if (onboarding && serverPrefs) {
            const profileOk = isProfileComplete(userFromApi);
            if (profileOk) {
              console.log(
                '[prefs] onboarding + server prefs + profile complete → go dashboard'
              );
            } else {
              console.log('[prefs] onboarding but profile incomplete → stay on prefs');
            }

            if (profileOk) {
            const qsStr = buildTierQS({
              step: 'prefs-existing',
              dest: 'dashboard'
            });
            window.location.replace(
              `dashboard.html${qsStr ? `?${qsStr}` : ''}`
            );
            hideLoader();
            return;
            }
          }

          if (serverPrefs) {
            fillFormFromPrefs(serverPrefs);
          } else {
            const localPrefs = getStoredPrefs();
            if (localPrefs) fillFormFromPrefs(localPrefs);
          }
        } else {
          // No server session: already handled above (local prefill), but keep safe fallback
          const localPrefs = getStoredPrefs();
          if (localPrefs) fillFormFromPrefs(localPrefs);
        }
      } catch (loadErr) {
        console.warn(
          '[prefs] non-fatal init load error, falling back to local prefs',
          loadErr
        );
        const localPrefs = getStoredPrefs();
        if (localPrefs) fillFormFromPrefs(localPrefs);

        // Prefill profile from local user store
        try {
          const u = getLocalUserFromSessionOrStorage();
          try { syncTopNav(u, params); } catch {}
          const pAge = qs('#profileAge');
          const pCity = qs('#profileCity');
          if (pAge && u && u.age) pAge.value = String(u.age);
          if (pCity && u && u.city) pCity.value = String(u.city);
          EXISTING_AVATAR_URL = String((u && u.avatarUrl) || '');
          setAvatarPreview(EXISTING_AVATAR_URL);
          setAvatarFileName('');
          attachAvatarHandlers();
        } catch {}

      }
    } finally {
      hideLoader();
    }

    try {
      // Ensure avatar UI is wired even if profile prefill did not run
      if (!EXISTING_AVATAR_URL) {
        const u = getLocalUserFromSessionOrStorage();
        EXISTING_AVATAR_URL = String((u && u.avatarUrl) || '');
        setAvatarPreview(EXISTING_AVATAR_URL);
        setAvatarFileName('');
      }
      attachAvatarHandlers();
    } catch {}

    try { updateAvatarRequiredNotice(); } catch {}

    attachFormHandler({
      api,
      localUser,
      mode: 'live'
    });
  }

  function attachFormHandler(ctx) {
    const form = qs('#preferencesForm');
    if (!form) return;

    // Disable native HTML validation to avoid hidden required-file errors.
    try { form.setAttribute('novalidate', 'novalidate'); } catch {}

    const { api, localUser, mode } = ctx || {};
    const isLiveMode =
      mode === 'live' &&
      api &&
      typeof api.savePreferences === 'function';

    form.addEventListener('submit', async (evt) => {
      evt.preventDefault();

      const submitBtn = tmGetSubmitButton(form, evt);
      tmSetButtonLoading(submitBtn, true, 'Saving…');
      let didNavigate = false;
      clearAvatarRequiredNotice();

      const prefs = getFormValues();
      if (!validateFormValues(prefs)) { tmSetButtonLoading(submitBtn, false); return; }

      const profile = getProfileValues();
      const requireAll = true; // Profile photo (existing or new) is required when saving preferences
      if (!validateProfileValues(profile, { requireAll })) { tmSetButtonLoading(submitBtn, false); return; }

      // If the user picked a file but it has not been processed yet, process now.
      if (profile.file && !AVATAR_DATA_URL_FOR_UPLOAD) {
        try {
          AVATAR_DATA_URL_FOR_UPLOAD = await fileToOptimizedSquareDataUrl(profile.file, {
            maxSize: 768,
            quality: 0.82
          });
          setAvatarPreview(AVATAR_DATA_URL_FOR_UPLOAD);
        updateAvatarRequiredNotice();
        } catch (err) {
          toast(err.message || 'Could not process image.', 'error');
          tmSetButtonLoading(submitBtn, false);
          return;
        }
      }

      const user = getLocalUserFromSessionOrStorage() || localUser;

      try {
        if (isLiveMode) {
          // 1) Save required profile fields first (age, city, avatar)
          const profilePayload = {
            age: profile.age,
            city: profile.city,
            requireProfileCompletion: requireAll
          };
          if (AVATAR_DATA_URL_FOR_UPLOAD) {
            profilePayload.avatarDataUrl = AVATAR_DATA_URL_FOR_UPLOAD;
          }

          const profRes = await api.saveProfile(profilePayload);

          if (!profRes || !profRes.ok) {
            console.warn('[prefs] saveProfile returned non-ok', profRes);
            toast(
              profRes && profRes.message
                ? profRes.message
                : 'Could not save your profile. Please try again.',
              'error'
            );
            return;
          }

          const baseUser = (profRes && profRes.user) || user || {};
          EXISTING_AVATAR_URL = String(
            (baseUser && (baseUser.avatarUrl || baseUser.avatar)) || EXISTING_AVATAR_URL || ''
          );
          setAvatarPreview(EXISTING_AVATAR_URL);
          setAvatarFileName('');
          AVATAR_DATA_URL_FOR_UPLOAD = '';

          // 2) Save preferences
          const res = await api.savePreferences(prefs);

          if (!res || !res.ok) {
            console.warn('[prefs] savePreferences returned non-ok', res);
            toast(
              res && res.message
                ? res.message
                : 'Could not save preferences. Please try again.',
              'error'
            );
            return;
          }

          if (baseUser && baseUser.email) {
            saveStoredPrefsForUser(baseUser.email, prefs);
          }

          const mergedUser = mergeUserWithPrefs(baseUser, prefs);
          SESSION?.setCurrentUser?.(mergedUser);
          localStorage.setItem('tm_user', JSON.stringify(mergedUser));
        } else {
          // Demo/local mode: store to localStorage only
          saveLocalPrefs(prefs);

          const updatedUser = { ...(user || {}) };
          if (Number.isFinite(Number(profile.age))) updatedUser.age = Number(profile.age);
          if (profile.city) updatedUser.city = profile.city;

          if (AVATAR_DATA_URL_FOR_UPLOAD) {
            updatedUser.avatarUrl = AVATAR_DATA_URL_FOR_UPLOAD;
            EXISTING_AVATAR_URL = AVATAR_DATA_URL_FOR_UPLOAD;
            AVATAR_DATA_URL_FOR_UPLOAD = '';
          }

          if (updatedUser && updatedUser.email) {
            saveStoredPrefsForUser(updatedUser.email, prefs);
          }

          const mergedUser = mergeUserWithPrefs(updatedUser, prefs);
          SESSION?.setCurrentUser?.(mergedUser);
          localStorage.setItem('tm_user', JSON.stringify(mergedUser));
        }

        if (PREFS_ONBOARDING_MODE === 'advanced' || PREFS_FROM_PARAM === 'upgrade') {
          const u = getLocalUserFromSessionOrStorage() || user;
          if (u && u.email) {
            markAdvancedOnboardingDone(u.email);
          }
        }

        const qsStr = buildTierQS({
          step: 'prefs-saved',
          dest: 'dashboard'
        });
        didNavigate = true;
        window.location.replace(`dashboard.html${qsStr ? `?${qsStr}` : ''}`);
      } catch (submitErr) {
        console.error('[prefs] unexpected submit error', submitErr);
        toast('Something went wrong while saving. Please try again.', 'error');
      } finally {
        if (!didNavigate) tmSetButtonLoading(submitBtn, false);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPreferencesPage();
  });
})();