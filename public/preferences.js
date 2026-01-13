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

  // ---- Profile (age, city, avatar) helpers ----
  let AVATAR_DATA_URL_FOR_UPLOAD = '';
  let EXISTING_AVATAR_URL = '';
  let AVATAR_HANDLERS_ATTACHED = false;

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

    const maxBytes = 3 * 1024 * 1024; // 3MB (raw file)
    if (file.size > maxBytes) {
      throw new Error('Please choose an image under 3MB.');
    }

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
      toast('Please upload a profile picture.', 'error');
      return false;
    }

    return true;
  }

  function attachAvatarHandlers() {
    if (AVATAR_HANDLERS_ATTACHED) return;
    const fileInput = qs('#avatarFile');
    if (!fileInput) return;
    AVATAR_HANDLERS_ATTACHED = true;

    // If user already has avatar, the file is not strictly required on re-visit
    if (EXISTING_AVATAR_URL) {
      try { fileInput.removeAttribute('required'); } catch {}
    }

    fileInput.addEventListener('change', async () => {
      const f = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
      if (!f) {
        AVATAR_DATA_URL_FOR_UPLOAD = '';
        setAvatarPreview(EXISTING_AVATAR_URL || '');
        setAvatarFileName('');
        return;
      }

      setAvatarFileName(f.name);

      try {
        AVATAR_DATA_URL_FOR_UPLOAD = await fileToOptimizedSquareDataUrl(f, {
          maxSize: 768,
          quality: 0.82
        });
        setAvatarPreview(AVATAR_DATA_URL_FOR_UPLOAD);
      } catch (err) {
        AVATAR_DATA_URL_FOR_UPLOAD = '';
        setAvatarPreview(EXISTING_AVATAR_URL || '');
        setAvatarFileName('');
        toast(err.message || 'Could not process image.', 'error');
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

    if (ageMin < 18 || ageMin > ageMax) {
      toast(
        'Please enter an age range starting at 18 where min is not greater than max.',
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
    if (window.TM_TOAST && typeof window.TM_TOAST.show === 'function') {
      window.TM_TOAST.show(message, type);
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
    const el = qs('#prefs-loader');
    if (el) el.classList.remove('hidden');
  }

  function hideLoader() {
    const el = qs('#prefs-loader');
    if (el) el.classList.add('hidden');
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

  async function initPreferencesPage() {
    showLoader();

    const url = new URL(window.location.href);
    const params = url.searchParams;
    const onboardingParam = (params.get('onboarding') || '')
      .toString()
      .toLowerCase();
    const onboarding = onboardingParam === '1';
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

    if (!localUser) {
      localUser = ensureDemoOrLocalUser();
    }

    try {
      const userFromSession = getLocalUserFromSessionOrStorage();
      const user = userFromSession || localUser;

      if (!user || !user.email) {
        console.warn('[prefs] No local user/email, redirecting to auth');
        window.location.replace(
          '/auth.html?mode=signin&return=/preferences.html'
        );
        hideLoader();
        return;
      }

      let serverPrefs = null;

      try {
        const me = await getApiMe(api);

        if (me && me.user) {
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
          serverPrefs = await getApiPrefs(api);

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
              `/dashboard.html${qsStr ? `?${qsStr}` : ''}`
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

    attachFormHandler({
      api,
      localUser,
      mode: 'live'
    });
  }

  function attachFormHandler(ctx) {
    const form = qs('#preferencesForm');
    if (!form) return;

    const { api, localUser, mode } = ctx || {};
    const isLiveMode =
      mode === 'live' &&
      api &&
      typeof api.savePreferences === 'function';

    form.addEventListener('submit', async (evt) => {
      evt.preventDefault();

      const prefs = getFormValues();
      if (!validateFormValues(prefs)) return;

      const profile = getProfileValues();
      const requireAll = PREFS_ONBOARDING_MODE === '1';
      if (!validateProfileValues(profile, { requireAll })) return;

      // If the user picked a file but it has not been processed yet, process now.
      if (profile.file && !AVATAR_DATA_URL_FOR_UPLOAD) {
        try {
          AVATAR_DATA_URL_FOR_UPLOAD = await fileToOptimizedSquareDataUrl(profile.file, {
            maxSize: 768,
            quality: 0.82
          });
          setAvatarPreview(AVATAR_DATA_URL_FOR_UPLOAD);
        } catch (err) {
          toast(err.message || 'Could not process image.', 'error');
          return;
        }
      }

      const user = getLocalUserFromSessionOrStorage() || localUser;

      showLoader();

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
        window.location.replace(`/dashboard.html${qsStr ? `?${qsStr}` : ''}`);
      } catch (submitErr) {
        console.error('[prefs] unexpected submit error', submitErr);
        toast('Something went wrong while saving. Please try again.', 'error');
      } finally {
        hideLoader();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initPreferencesPage();
  });
})();