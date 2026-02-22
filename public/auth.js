// auth.js
(() => {
  if (!/\/auth\.html(?:$|[?#])/.test(location.pathname)) return;

  const API_BASE = (() => {
    const v = String(window.API_BASE || "").trim().replace(/\/$/, "");
    if (v) return v;
    if (location.protocol === "file:") return "http://localhost:3000";
    const host = location.hostname;
    const port = location.port || "";
    if (port && port !== "3000") {
      return `${location.protocol}//${host}:3000`;
    }
    return `${location.origin}`;
  })();

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // --- Inline button loading (spinner inside button) ---
  function tmGetSubmitButton(form, ev) {
    // Modern browsers: submitter is the button that triggered submit (click or Enter)
    const s = ev && ev.submitter;
    if (s && (s.tagName === 'BUTTON' || s.tagName === 'INPUT')) return s;
    if (!form) return null;
    return form.querySelector('button[type="submit"], input[type="submit"]');
  }

  function tmPrepareButtonSpinner(btn) {
    if (!btn || btn.dataset.tmSpinnerReady === '1') return;
    btn.dataset.tmSpinnerReady = '1';

    // Preserve original label
    const origLabel = (btn.textContent || '').trim();
    btn.dataset.tmOrigLabel = origLabel;

    // Replace content with label + spinner (keeps button semantics intact)
    btn.innerHTML = `
      <span class="tm-btn-label"></span>
      <span class="tm-btn-spinner" aria-hidden="true"></span>
    `.trim();
    const labelEl = btn.querySelector('.tm-btn-label');
    if (labelEl) labelEl.textContent = origLabel;
  }

  function tmSetButtonLoading(btn, isLoading, loadingLabel) {
    if (!btn) return;
    tmPrepareButtonSpinner(btn);

    const labelEl = btn.querySelector('.tm-btn-label');
    const spinnerEl = btn.querySelector('.tm-btn-spinner');

    if (isLoading) {
      btn.classList.add('is-loading');
      btn.disabled = true;
      btn.setAttribute('aria-busy', 'true');
      if (labelEl) labelEl.textContent = loadingLabel || (btn.dataset.tmOrigLabel || 'Loading…');
      if (spinnerEl) spinnerEl.style.display = 'inline-block';
    } else {
      btn.classList.remove('is-loading');
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      if (labelEl) labelEl.textContent = btn.dataset.tmOrigLabel || (labelEl.textContent || '');
      if (spinnerEl) spinnerEl.style.display = 'none';
    }
  }


  function getParam(k) {
    try { return new URLSearchParams(location.search).get(k); } catch { return null; }
  }
  function setParam(k, v) {
    const u = new URL(location.href);
    if (v === null || v === undefined || v === "") u.searchParams.delete(k);
    else u.searchParams.set(k, String(v));
    history.replaceState({}, "", u.toString());
  }
  function getSafeNextUrl() {
    const raw = getParam('next') || getParam('return');
    if (!raw) return null;

    let next;
    try { next = decodeURIComponent(raw); } catch (e) { next = raw; }

    const lowered = (next || '').trim().toLowerCase();
    if (!next) return null;
    if (lowered.startsWith('http://') || lowered.startsWith('https://') || lowered.startsWith('javascript:')) return null;
    if (next.startsWith('//')) return null;

    if (next.startsWith('/')) return next;
    return '/' + next.replace(/^(\.\/)+/, '').replace(/^\/+/, '');
  }
  const whenReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  whenReady(() => {
    // --- Visual Parallax ---
    const visualSide = $(".auth-visual-side");
    const visualContent = $(".visual-content"); 
    const parallaxContent = $("#parallaxContent");

    if (visualSide && (parallaxContent || visualContent)) {
      const target = parallaxContent || visualContent;
      visualSide.addEventListener('mousemove', (e) => {
        const { offsetWidth: width, offsetHeight: height } = visualSide;
        const { offsetX: x, offsetY: y } = e;
        const moveX = ((x / width) * 20) - 10; 
        const moveY = ((y / height) * 20) - 10;
        target.style.transform = `rotateY(${moveX}deg) rotateX(${-moveY}deg)`;
      });
      visualSide.addEventListener('mouseleave', () => {
        target.style.transform = `rotateY(0deg) rotateX(0deg)`;
      });
    }

    // --- Flip Card Logic ---
    const flipCard = $("#authFlipCard");
    if (flipCard) {
      flipCard.addEventListener('click', (e) => {
        const target = e.target;
        if (target.closest('input') || target.closest('button') || target.closest('a') || target.closest('label') || target.closest('.forgot-link')) {
          return;
        }
        const isFlipped = flipCard.classList.contains('flipped');
        setActiveTab(isFlipped ? 'login' : 'signup');
        setParam('mode', isFlipped ? 'login' : 'signup');
      });

      document.body.addEventListener('click', (e) => {
        if (e.target.closest('#toSignup')) { e.preventDefault(); setActiveTab('signup'); setParam('mode', 'signup'); }
        if (e.target.closest('#toLogin')) { e.preventDefault(); setActiveTab('login'); setParam('mode', 'login'); }
      });
    }

    // --- Chat Sim ---
    const chatContainer = $("#chatContainer");
    const reactionLayer = $("#reactionLayer");

    if (chatContainer) {
      const scenarios = [
        { a: "Nice pics! 🔥", b: "Thanks, you too. 😉" },
        { a: "Are you real? 🤔", b: "Come find out... 🤫" },
        { a: "VIP Lounge tonight? 🥂", b: "On my way. 🚀" }
      ];
      const wait = (ms) => new Promise(r => setTimeout(r, ms));
      async function typeMessage(text, isReceived) {
        const typingId = "typing-" + Date.now();
        const typingHTML = `
          <div class="chat-bubble ${isReceived ? 'received' : 'sent'} typing-bubble" id="${typingId}">
            <div class="dot"></div><div class="dot"></div><div class="dot"></div>
          </div>
        `;
        chatContainer.insertAdjacentHTML('beforeend', typingHTML);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        await wait(1200);
        const typingEl = document.getElementById(typingId);
        if(typingEl) typingEl.remove();
        const msgHTML = `<div class="chat-bubble ${isReceived ? 'received' : 'sent'}">${text}</div>`;
        chatContainer.insertAdjacentHTML('beforeend', msgHTML);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
      function showReaction() {
        const hearts = ['❤️', '🔥', '😍', '💋'];
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        heart.innerText = hearts[Math.floor(Math.random() * hearts.length)];
        heart.style.right = Math.random() * 20 + 'px';
        reactionLayer && reactionLayer.appendChild(heart);
        setTimeout(() => heart.remove(), 2000);
      }
      async function runChatSimulation() {
        while(true) { 
          for (const scene of scenarios) {
            chatContainer.innerHTML = ''; 
            await wait(500);
            await typeMessage(scene.a, true);
            await wait(1500);
            await typeMessage(scene.b, false);
            if(reactionLayer) { showReaction(); await wait(200); showReaction(); await wait(200); showReaction(); }
            await wait(3000); 
          }
        }
      }
      runChatSimulation(); 
    }
  });

  function getEmailCandidate() {
    const fromModal = $("#verifyEmailTxt")?.textContent?.trim();
    if (fromModal) return fromModal.toLowerCase();
    const loginEmail = $("#loginEmail")?.value?.trim();
    const signupEmail = $("#signupEmail")?.value?.trim();
    if (loginEmail) return loginEmail.toLowerCase();
    if (signupEmail) return signupEmail.toLowerCase();
    try {
      const raw = localStorage.getItem("tm_user");
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.email) return String(u.email).trim().toLowerCase();
      }
    } catch {}
    const any = $('input[name="email"]')?.value?.trim();
    return (any || "").toLowerCase();
  }

  async function callAPI(path, payload = {}) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(API_BASE + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(id);
      const ok = res.ok;
      const status = res.status;
      let data = null;
      try { data = await res.json(); } catch {}
      return { ok, status, ...(data || {}) };
    } catch (err) {
      const msg = (err && err.name === 'AbortError')
        ? 'Request timed out. Please try again.'
        : (err && err.message ? err.message : 'Network error. Please try again.');
      return { ok: false, status: 0, message: msg };
    }
  }

  async function apiGet(path) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(API_BASE + path, { 
        credentials: "include",
        signal: controller.signal 
      });
      clearTimeout(id);
      let data = null;
      try { data = await res.json(); } catch {}
      return data;
    } catch {
      return null;
    }
  }

  function tmShowLoader(title, sub, small) {
    try {
      if (window.TMLoader && typeof window.TMLoader.show === "function") {
        window.TMLoader.show(title, sub, small);
      } else {
        const ov = $("#tm_loader_overlay");
        if(ov) {
            ov.innerHTML = `<div class="loader-spinner"></div><div style="color:white;margin-top:20px;text-align:center"><h3>${title}</h3><p>${sub}</p></div>`;
            ov.style.display = 'flex';
        }
      }
    } catch (e) {}
  }

  function tmHideLoader() {
    try {
      if (window.TMLoader && typeof window.TMLoader.hide === "function") {
        window.TMLoader.hide();
      } else {
        const ov = $("#tm_loader_overlay");
        if(ov) ov.style.display = 'none';
      }
    } catch (e) {}
  }
  // --- Lightweight toast popup (used for success / info) ---
  let __tmToastEl = null;
  let __tmToastHideTimer = null;

  function tmToast(message, opts = {}) {
    const msg = String(message || '').trim();
    if (!msg) return 0;

    const duration = Math.max(700, Number(opts.durationMs || opts.duration || 1200));
    const z = Number(opts.zIndex || 2147483647);

    try {
      if (!__tmToastEl) {
        __tmToastEl = document.createElement('div');
        __tmToastEl.id = 'tm_toast';
        __tmToastEl.setAttribute('role', 'status');
        __tmToastEl.setAttribute('aria-live', 'polite');
        __tmToastEl.style.cssText = [
          'position:fixed',
          'left:50%',
          'bottom:26px',
          'transform:translateX(-50%) translateY(16px)',
          'max-width:min(92vw, 520px)',
          'padding:12px 14px',
          'border-radius:14px',
          'background:rgba(15, 20, 34, 0.94)',
          'border:1px solid rgba(255,255,255,0.14)',
          'backdrop-filter: blur(10px)',
          'color:#fff',
          'font-weight:700',
          'font-size:0.95rem',
          'line-height:1.25',
          'letter-spacing:0.2px',
          'text-align:center',
          'box-shadow: 0 14px 40px rgba(0,0,0,0.48)',
          'z-index:' + z,
          'opacity:0',
          'pointer-events:none',
          'transition:opacity 260ms ease, transform 260ms ease'
        ].join(';');
        document.body.appendChild(__tmToastEl);
      } else if (__tmToastEl.parentElement !== document.body) {
        document.body.appendChild(__tmToastEl);
      }

      // Reset animation
      __tmToastEl.textContent = msg;
      __tmToastEl.style.zIndex = String(z);
      __tmToastEl.style.opacity = '0';
      __tmToastEl.style.transform = 'translateX(-50%) translateY(16px)';
      // force reflow
      void __tmToastEl.offsetHeight;
      __tmToastEl.style.opacity = '1';
      __tmToastEl.style.transform = 'translateX(-50%) translateY(0)';

      clearTimeout(__tmToastHideTimer);
      __tmToastHideTimer = setTimeout(() => {
        try {
          __tmToastEl.style.opacity = '0';
          __tmToastEl.style.transform = 'translateX(-50%) translateY(16px)';
        } catch {}
      }, duration);

      return duration + 320; // duration + transition buffer
    } catch {
      return 0;
    }
  }



  function saveLocalUser(u) {
    const minimal = {
      id: u?.id || "local-demo",
      email: u?.email || "user@itruematch.app",
      name: u?.name || "User",
      plan: u?.plan || u?.tier || u?.subscription || "",
    };
    try { localStorage.setItem("tm_user", JSON.stringify(minimal)); } catch {}
  }

  function mergeExtraParams(base, extraQuery) {
    const q = new URLSearchParams(base || "");
    if (extraQuery) {
      for (const [k, v] of new URLSearchParams(extraQuery)) {
        if (k === "mode" || k === "return") continue;
        q.set(k, v);
      }
    }
    return q;
  }

    function gotoPreferences(extraQuery) {
    const nextUrl = getSafeNextUrl();
    if (nextUrl) {
      if (extraQuery && !nextUrl.includes('?')) {
        window.location.replace(nextUrl + (extraQuery.startsWith('?') ? extraQuery : ('?' + extraQuery)));
      } else {
        window.location.replace(nextUrl);
      }
      return;
    }
    // URLSearchParams.toString() returns "a=1&b=2" (no leading "?").
    // If we append it directly, we accidentally produce "/preferences.htmla=1..." and get a 404.
    let q = (extraQuery || '').trim();
    if (q) {
      if (q.startsWith('&')) q = '?' + q.slice(1);
      else if (!q.startsWith('?')) q = '?' + q;
    }
    window.location.replace('/preferences.html' + q);
  }

  function setActiveTab(mode) {
    const wantLogin = String(mode).toLowerCase() !== "signup";
    const flipCard = $("#authFlipCard");
    if (flipCard) {
      if (wantLogin) {
        flipCard.classList.remove("flipped");
      } else {
        flipCard.classList.add("flipped");
      }
    }
    const tabBtns = $$("[data-tab-btn]");
    tabBtns.forEach((b) => {
      const isLogin = b.dataset.tabBtn === "login";
      b.setAttribute("aria-selected", String(isLogin === wantLogin));
      b.classList.toggle("active", isLogin === wantLogin);
    });
    setTimeout(() => {
        const focusEl = wantLogin ? $("#loginEmail") : $("#signupName");
        if(focusEl) focusEl.focus();
    }, 400); 
  }

  whenReady(() => {
    setActiveTab((getParam("mode") || "login").toLowerCase());
  });

  const DEMO = {
    "tier1.demo@itruematch.app": { password: "111111", name: "Demo Tier 1", plan: "tier1" },
    "tier2.demo@itruematch.app": { password: "222222", name: "Demo Tier 2", plan: "tier2" },
    "tier3.demo@itruematch.app": { password: "333333", name: "Demo Tier 3", plan: "tier3" },
  };

  async function tryDemoLogin(email, pass) {
    const key = String(email || "").trim().toLowerCase();
    const d = DEMO[key];
    if (!d) return false;
    if (String(pass || "") !== d.password) {
      if(window.Swal) Swal.fire({ icon: 'error', title: 'Oops...', text: 'Mali ang Demo password.' });
      return true;
    }
    saveLocalUser({ email, name: d.name, plan: d.plan });
    try { await callAPI("/api/auth/login", { email, password: pass, remember: true }); } catch {}
    const extra = new URLSearchParams({ demo: "1", prePlan: d.plan });
    await finishLogin((r && r.user && r.user.email) ? r.user.email : "google@demo.local");
    return true;
  }

  async function apiSendVerificationCode(email) {
    const out = await callAPI("/api/auth/send-verification-code", { email }, { timeoutMs: 15000 });
    if (out && typeof out === "object") return out;
    return { ok: false, code: "NETWORK_ERROR", message: "Email not deliverable. Please double-check the address and try again." };
  }
  async function apiVerifyEmailCode(email, code) {
    const out = await callAPI("/api/auth/verify-email-code", { email, code }, { timeoutMs: 15000 });
    if (out && typeof out === "object") return out;
    return { ok: false, code: "NETWORK_ERROR", message: "Verification failed. Please try again." };
  }

  function safeDialogClose(dlg) {
    try { if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); } catch {}
  }

  function openVerifyDialog(email, opts = {}) {
    const dlg = $("#dlgVerify");
    if (!dlg) return false;
    const emailTxt = $("#verifyEmailTxt");
    const statusLine = $("#verifyStatusLine");
    const codeInput = $("#verifyCode");
    const msg = $("#verifyMsg");
    const btnResend = $("#btnResendCode");
    const btnClose = $("#btnCloseVerify");
    const btnCloseX = $("#btnCloseVerifyX");

    const targetEmail = (email || getEmailCandidate() || "").trim();
    if (emailTxt) emailTxt.textContent = targetEmail || "";
    if (msg) msg.textContent = "";

    function setVerifyStatusMsg(type, text) {
      if (!msg) return;
      msg.classList.remove("is-ok", "is-error");
      if (type === "ok") msg.classList.add("is-ok");
      if (type === "error") msg.classList.add("is-error");
      msg.textContent = text || "";
    }

    if (opts && typeof opts === "object") {
      const sentOk = !!opts.sentOk;
      const initialMessage = opts.initialMessage || (sentOk ? "Code sent. Check your inbox (and spam)." : "Email not deliverable. Please double-check the address and resend.");
      setVerifyStatusMsg(sentOk ? "ok" : "error", initialMessage);
      if (statusLine && emailTxt) {
        statusLine.childNodes[0].textContent = "We’ll send a 6-digit code to ";
      }
    }
    if (codeInput) { codeInput.value = ""; setTimeout(() => codeInput.focus(), 0); }

    if (btnResend) {
      btnResend.onclick = async () => {
        if (msg) msg.textContent = "Sending…";
        try {
          const e = (emailTxt?.textContent || targetEmail || getEmailCandidate()).trim();
          if (!e) throw new Error("No email");
          await apiSendVerificationCode(e);
          if (msg) msg.textContent = "Sent.";
        } catch { if (msg) msg.textContent = "Failed to send."; }
      };
    }
    if (btnClose) btnClose.onclick = () => safeDialogClose(dlg);
    if (btnCloseX) btnCloseX.onclick = () => safeDialogClose(dlg);

    const form = $("#frmVerify") || dlg.querySelector("form");
    if (form && !form.dataset.bound) {
      form.dataset.bound = "1";
      form.addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const code = String(codeInput?.value || "").trim();
        const e = String(emailTxt?.textContent || targetEmail || getEmailCandidate()).trim().toLowerCase();
        if (!e || !code) return;
        if (msg) msg.textContent = "Verifying…";
        try { tmShowLoader('Verifying code…','Finalizing'); } catch {}
        try {
          const out = await apiVerifyEmailCode(e, code);
          const ok = !!(out?.ok || out?.verified);
          if (!ok) { if (msg) msg.textContent = out?.message || "Invalid code."; return; }
          try {
            const raw = localStorage.getItem("tm_user");
            if (raw) {
              const u = JSON.parse(raw);
              u.emailVerified = true;
              localStorage.setItem("tm_user", JSON.stringify(u));
            }
          } catch {}
          if (msg) msg.textContent = "Verified ✅";
          safeDialogClose(dlg);
          const extra = new URLSearchParams(location.search);
          extra.delete("verify");
          gotoPreferences(extra.toString());
        } catch { if (msg) msg.textContent = "Verification failed."; }
        try { tmHideLoader(); } catch {}
      });
    }
    try { if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", ""); } catch {}
    return true;
  }

  async function ensureVerifiedBeforeContinue(email, preSendResult = null) {
    try {
      const me = await apiGet("/api/me");
      const verified = !!(me?.user?.emailVerified);
      if (verified) return true;
      const e = (email || me?.user?.email || getEmailCandidate() || "").trim().toLowerCase();
      if (!e) {
        openVerifyDialog("", { sentOk: false, initialMessage: "Please enter your email first." });
        return false;
      }
      const out = preSendResult || await apiSendVerificationCode(e);
      openVerifyDialog(e, { sentOk: !!(out && out.ok) });
      return false;
    } catch (err) {
      openVerifyDialog(email || "", {
        sentOk: false,
        initialMessage: "Email not deliverable. Please double-check the address and resend.",
      });
      return false;
    }
  }

  async function finishLogin(email){
    const me = await apiGet("/api/me");
    if (!me?.user) throw new Error(me?.message || "No session");
    if (!me.user.emailVerified){
      let sendOut = null;
      try {
        sendOut = await apiSendVerificationCode(email);
      } catch (err) {
        sendOut = { ok: false };
      }
      await ensureVerifiedBeforeContinue(email, sendOut);
      return;
    }

    // One-time onboarding: only send users to preferences if they have not saved prefs yet.
    // After onboarding, future logins should go straight to dashboard (or an allowed return URL).
    const nextUrl = getSafeNextUrl();
    const prefsSaved = !!(
      me.user.prefsSaved ||
      me.prefs ||
      me.user.preferences ||
      me.user.prefs
    );

    if (!prefsSaved) {
      const usp = new URLSearchParams();
      usp.set('onboarding', '1');
      usp.set('return', nextUrl || 'dashboard.html');

      // Preserve any helpful context for onboarding.
      try {
        const src = new URLSearchParams(location.search);
        for (const k of ['plan','within','from']) {
          const v = src.get(k);
          if (v) usp.set(k, v);
        }
      } catch {}

      window.location.href = `preferences.html?${usp.toString()}`;
      return;
    }

    if (nextUrl) {
      window.location.href = nextUrl;
    } else {
      window.location.href = 'dashboard.html';
    }
  }

  whenReady(() => {
    try {
      const usp = new URLSearchParams(location.search);
      if (usp.get("verify") === "1") {
        const emailGuess = getEmailCandidate();
        setTimeout(() => { ensureVerifiedBeforeContinue(emailGuess); }, 60);
      }
    } catch {}
  });

  whenReady(() => {
    const signupForm = $("#signupForm");
    if (!signupForm || signupForm.dataset.tmBound === "1") return;
    signupForm.dataset.tmBound = "1";
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = tmGetSubmitButton(signupForm, e);

      // Button-level feedback (click + Enter)
      tmSetButtonLoading(submitBtn, true, "Creating…");

      const fd = new FormData(signupForm);
      try {
        const payload = Object.fromEntries(fd.entries());
        payload.name = payload.name || payload.fullName || '';
        try { delete payload.fullName; } catch (e) {}
        const out = await callAPI("/api/auth/register", payload);
        const ok = !!(out?.ok || out?.created || out?.status === 200 || out?.status === 201 || out?.demo);
        if (!ok) {
          if(window.Swal) Swal.fire({ icon: 'error', title: 'Signup Failed', text: out?.message || "Signup failed." });
          return;
        }
        setActiveTab("login");
        setParam("mode", "login");
        const email = String(payload.email || "").trim();
        if (email && $("#loginEmail")) $("#loginEmail").value = email;
      } catch (err) {
        console.error("[auth] signup submit error:", err);
        if(window.Swal) Swal.fire({ icon: 'error', title: 'Error', text: 'Hindi makakonekta sa backend server.' });
      } finally {
        // No navigation here; always restore the button state
        tmSetButtonLoading(submitBtn, false);
      }
    });
  });

  whenReady(() => {
    const loginForm = $("#loginForm");
    if (!loginForm || loginForm.dataset.tmBound === "1") return;
    loginForm.dataset.tmBound = "1";
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = tmGetSubmitButton(loginForm, e);

      // Button-level feedback (click + Enter)
      tmSetButtonLoading(submitBtn, true, "Signing in…");

      let didNavigate = false;
      const hrefBefore = window.location.href;

      try {
        const email = String($("#loginEmail")?.value || "").trim();
        const password = String($("#loginPass")?.value || "").trim();

        
        const remember = !!document.getElementById("rememberMe")?.checked;
if (await tryDemoLogin(email, password)) {
          // Demo login may redirect; keep spinner if so
          didNavigate = (window.location.href !== hrefBefore);
          return;
        }

        const res = await callAPI("/api/auth/login", { email, password, remember });
        const offline = !!(res && res.demo);
        const ok = !!(res && (res.ok || offline));
        if (!ok) {
          if(window.Swal) Swal.fire({ icon: 'error', title: 'Login Failed', text: res?.message || "Invalid credentials." });
          return;
        }
        saveLocalUser(res.user || { email, name: email.split("@")[0] || "User" });

        const extra = new URLSearchParams();
        if (offline) extra.set("demo", "1");

        // finishLogin may either redirect OR open a verification dialog.
        await finishLogin((res && res.user && res.user.email) ? res.user.email : email);
        didNavigate = (window.location.href !== hrefBefore);
      } catch (err) {
        console.error("[auth] login submit error:", err);
        if(window.Swal) Swal.fire({ icon: 'error', title: 'Connection Refused', text: 'Siguraduhing naka-run ang backend server mo sa port 3000!' });
      } finally {
        // If we’re navigating, keep the spinner visible until the next page loads.
        if (!didNavigate) {
          tmSetButtonLoading(submitBtn, false);
        }
      }
    });
  });

  whenReady(() => {
    const googleBtn = $("#btnGoogleLogin");
    if (!googleBtn || googleBtn.dataset.tmBound === "1") return;
    googleBtn.dataset.tmBound = "1";
    googleBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      try { tmShowLoader('Signing in…','Opening Google'); } catch {}
      try {
        const r = await callAPI("/api/auth/oauth/mock", { provider: "google" });
        saveLocalUser(r?.user || { email: "google@demo.local", name: "Google User" });
        const extra = new URLSearchParams();
        if (r?.demo) extra.set("demo", "1");
        await finishLogin((r && r.user && r.user.email) ? r.user.email : "google@demo.local");
      } finally { try { tmHideLoader(); } catch {} }
    });
  });

  whenReady(() => {
  const btnOpenForgot   = document.getElementById('btnOpenForgot');
  const dlgForgot       = document.getElementById('dlgForgot');
  const step1           = document.getElementById('forgotStep1');
  const step2           = document.getElementById('forgotStep2');
  const btnCancel       = document.getElementById('btnForgotCancel');
  const btnCloseForgotX = document.getElementById('btnCloseForgotX');
  const btnVerify       = document.getElementById('btnForgotVerify');
  const btnBack         = document.getElementById('btnForgotBack');
  const btnChange       = document.getElementById('btnForgotChange');
  const btnResend       = document.getElementById('btnForgotResend');

  const inEmail   = document.getElementById('forgotEmailInput');
  const inOtp     = document.getElementById('forgotOtpInput');
  const inPass1   = document.getElementById('forgotNewPass');
  const inPass2   = document.getElementById('forgotConfirmPass');
  const pInfo     = document.getElementById('forgotInfo');
  const pError    = document.getElementById('forgotError');

  if (!dlgForgot || !step1 || !step2) return;
  if (dlgForgot.dataset.tmBound === "1") return;
  dlgForgot.dataset.tmBound = "1";

  let otpEmail = null;

  const setText = (el, txt) => { if (el) el.textContent = txt; };

  function hideMsgs() {
    if (pInfo)  { pInfo.style.display  = 'none'; setText(pInfo, ''); }
    if (pError) { pError.style.display = 'none'; setText(pError, ''); }
  }

  // Reuse the same <p> nodes for step1 + step2 by moving them.
  function ensureMsgsIn(stepEl) {
    if (!stepEl) return;
    const actions = stepEl.querySelector('.modal-actions');
    if (pInfo && pInfo.parentElement !== stepEl)  stepEl.insertBefore(pInfo, actions || null);
    if (pError && pError.parentElement !== stepEl) stepEl.insertBefore(pError, actions || null);
  }

  function showError(msg, stepEl = null) {
    hideMsgs();
    if (stepEl) ensureMsgsIn(stepEl);
    if (pError) {
      setText(pError, msg || 'Something went wrong.');
      pError.style.display = 'block';
    } else {
      if(window.Swal) Swal.fire({ icon: 'error', title: 'Oops...', text: msg || 'Something went wrong.' });
    }
  }

  function showInfo(msg, stepEl = null) {
    hideMsgs();
    if (stepEl) ensureMsgsIn(stepEl);
    if (pInfo) {
      setText(pInfo, msg || '');
      pInfo.style.display = 'block';
    }
  }

  function gotoStep(which) {
    if (which === 1) {
      ensureMsgsIn(step1);
      step1.style.display = 'block';
      step2.style.display = 'none';
      if (inOtp) inOtp.value = '';
    } else {
      ensureMsgsIn(step2);
      step1.style.display = 'none';
      step2.style.display = 'block';
      setTimeout(() => { try { inOtp && inOtp.focus(); } catch {} }, 50);
    }
  }

  function resetForgotUI() {
    otpEmail = null;
    hideMsgs();
    if (inEmail) inEmail.value = '';
    if (inOtp)   inOtp.value = '';
    if (inPass1) inPass1.value = '';
    if (inPass2) inPass2.value = '';
    gotoStep(1);
  }

  // Robust JSON POST (no "demo ok" fallback; longer timeout for email + hashing)
  async function postJson(path, body, timeoutMs = 15000) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body || {}),
        signal: controller.signal
      });

      const status = res.status;
      let data = null;
      try { data = await res.json(); } catch {}

      return { ok: res.ok, status, ...(data || {}) };
    } catch (e) {
      return { ok: false, status: 0, message: e?.name === 'AbortError' ? 'request_timeout' : (e?.message || 'network_error') };
    } finally {
      clearTimeout(t);
    }
  }

  function friendlyMsg(code) {
    const m = String(code || '').trim();
    if (!m) return 'Something went wrong.';
    if (m === 'weak_password') return 'Password must be 8–72 chars and include uppercase, lowercase, and a number.';
    if (m === 'invalid_or_expired_code') return 'Invalid or expired code. Tap “Resend code” and try again.';
    if (m === 'too_many_requests') return 'Too many attempts. Please wait a bit and try again.';
    if (m === 'resend_wait') return 'Please wait a bit before resending the code.';
    if (m === 'request_timeout') return 'Request timed out. Please try again.';
    if (m === 'network_error') return 'Network error. Please check your connection and try again.';
    return m.replace(/_/g, ' ');
  }

  // Open modal
  if (btnOpenForgot) {
    btnOpenForgot.addEventListener('click', (e) => {
      e.preventDefault();
      resetForgotUI();
      try { dlgForgot.showModal(); } catch { dlgForgot.setAttribute('open', ''); }
      setTimeout(() => { try { inEmail && inEmail.focus(); } catch {} }, 50);
    });
  }

  // Click outside closes dialog
  dlgForgot.addEventListener('click', (e) => {
    const rect = dlgForgot.getBoundingClientRect();
    const inDialog =
      rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width;
    if (!inDialog) { try { dlgForgot.close(); } catch {} }
  });

  if (btnCancel) btnCancel.addEventListener('click', () => { try { dlgForgot.close(); } catch {} });
  if (btnCloseForgotX) btnCloseForgotX.addEventListener('click', () => { try { dlgForgot.close(); } catch {} });

  // Step 1: send OTP
  if (btnVerify) {
    btnVerify.addEventListener('click', async () => {
      const email = String(inEmail?.value || '').trim().toLowerCase();
      if (!email) return showError('Please enter your email.', step1);

      btnVerify.disabled = true;
      const originalText = btnVerify.textContent;
      btnVerify.textContent = 'SENDING…';

      try {
        // Always move to step2 on OK to avoid email enumeration.
        const out = await postJson('/api/auth/forgot/send-otp', { email });
        if (!out.ok) {
          showError(friendlyMsg(out.message || out.error), step1);
          return;
        }

        otpEmail = email;
        gotoStep(2);

        // Show a generic message (even if account doesn't exist).
        showInfo('If an account exists for this email, we sent a 6-digit code. It expires in about 10 minutes (only the latest code works).', step2);
      } finally {
        btnVerify.textContent = originalText;
        btnVerify.disabled = false;
      }
    });
  }

  // Back to step1
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      hideMsgs();
      gotoStep(1);
      setTimeout(() => { try { inEmail && inEmail.focus(); } catch {} }, 50);
    });
  }

  // Step2: resend
  if (btnResend) {
    btnResend.addEventListener('click', async () => {
      const email = String(otpEmail || '').trim().toLowerCase();
      if (!email) {
        showError('Please enter your email again.', step2);
        return;
      }

      btnResend.disabled = true;
      const originalText = btnResend.textContent;
      btnResend.textContent = 'RESENDING…';

      try {
        const out = await postJson('/api/auth/forgot/send-otp', { email });
        if (!out.ok) {
          showError(friendlyMsg(out.message || out.error), step2);
          return;
        }

        const msg = (out.message === 'resend_wait')
          ? 'A code was sent recently. Please check your inbox/spam. (Wait ~60s before resending.)'
          : 'If an account exists, we resent the code. Check your inbox/spam. (Only the latest code works.)';
        showInfo(msg, step2);
      } finally {
        btnResend.textContent = originalText;
        btnResend.disabled = false;
      }
    });
  }

  // Step2: reset password using OTP
  if (btnChange) {
    btnChange.addEventListener('click', async () => {
      const email = String(otpEmail || '').trim().toLowerCase();
      const code = String(inOtp?.value || '').replace(/\D/g, '');
      const pass1 = String(inPass1?.value || '').trim();
      const pass2 = String(inPass2?.value || '').trim();

      if (!email) return showError('Please go back and enter your email again.', step2);
      if (!code || code.length !== 6) return showError('Enter the 6-digit code.', step2);
      if (!pass1 || !pass2) return showError('Please enter your new password.', step2);
      if (pass1 !== pass2) return showError('Passwords do not match.', step2);

      btnChange.disabled = true;
      const originalText = btnChange.textContent;
      btnChange.textContent = 'UPDATING…';

      try {
        const out = await postJson('/api/auth/forgot/reset-otp', { email, code, newPassword: pass1 }, 20000);
        if (!out.ok) {
          showError(friendlyMsg(out.message || out.error), step2);
          return;
        }

        // Close the modal first so the toast isn't stuck behind <dialog>'s top layer
        try { safeDialogClose(dlgForgot); } catch {}

        // Give the dialog a tick to exit the top-layer, then show the toast
        setTimeout(() => {
          const waitMs = tmToast('Password updated ✅', { durationMs: 1200 });

          setTimeout(() => {
            try { setActiveTab('login'); setParam('mode', 'login'); } catch {}
            try { if ($("#loginEmail")) $("#loginEmail").value = email; } catch {}
            try { $("#loginPass") && ($("#loginPass").value = ""); } catch {}
            try { $("#loginEmail") && $("#loginEmail").focus(); } catch {}
          }, Math.max(200, waitMs || 1200));
        }, 80);
      } finally {
        btnChange.textContent = originalText;
        btnChange.disabled = false;
      }
    });
  }

  // Nice-to-have: Enter key inside OTP/password triggers change
  [inOtp, inPass1, inPass2].forEach((el) => {
    if (!el) return;
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        try { btnChange && btnChange.click(); } catch {}
      }
    });
  });
});


  // --- Terms / Privacy modal (in-page) ---
  whenReady(() => {
    const dlg = document.getElementById('dlgLegal');
    const titleEl = document.getElementById('legalTitle');
    const contentEl = document.getElementById('legalContent');
    const tplTerms = document.getElementById('tplLegalTerms');
    const tplPriv = document.getElementById('tplLegalPrivacy');
    const btnCloseX = document.getElementById('btnCloseLegalX');
    const btnCloseBottom = document.getElementById('btnCloseLegalBottom');

    if (!dlg || !titleEl || !contentEl || (!tplTerms && !tplPriv)) return;
    if (dlg.dataset.tmBound === '1') return;
    dlg.dataset.tmBound = '1';

    const setLegal = (type) => {
      const kind = (type || '').toLowerCase() === 'privacy' ? 'privacy' : 'terms';
      titleEl.textContent = kind === 'privacy' ? 'Privacy Policy' : 'Terms of Service';

      contentEl.innerHTML = '';
      const tpl = kind === 'privacy' ? tplPriv : tplTerms;
      if (tpl && tpl.content) {
        contentEl.appendChild(tpl.content.cloneNode(true));
      } else {
        contentEl.textContent = kind === 'privacy' ? 'Privacy content unavailable.' : 'Terms content unavailable.';
      }
    };

    const openLegal = (type) => {
      setLegal(type);
      try { dlg.showModal(); } catch { dlg.setAttribute('open', ''); }
    };

    const closeLegal = () => safeDialogClose(dlg);

    // Open by clicking links with data-legal="terms|privacy"
    document.body.addEventListener('click', (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a[data-legal]') : null;
      if (!a) return;
      e.preventDefault();
      const type = a.getAttribute('data-legal') || 'terms';
      openLegal(type);
    });

    // Close buttons + backdrop click
    if (btnCloseX) btnCloseX.addEventListener('click', () => closeLegal());
    if (btnCloseBottom) btnCloseBottom.addEventListener('click', () => closeLegal());

    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) closeLegal();
    });

    dlg.addEventListener('cancel', (e) => {
      try { e.preventDefault(); } catch {}
      closeLegal();
    });
  });

  // --- Password Visibility Toggle Logic ---
  whenReady(() => {
    $$('.password-toggle').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const input = this.parentElement.querySelector('input');
        if(!input) return;

        if (input.type === 'password') {
          // GAGAWING VISIBLE (TEXT)
          input.type = 'text';
          input.classList.add('is-password'); 
          // Palitan ng OPEN EYE (Visible na)
          this.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        } else {
          // IHIHIDE ULIT (PASSWORD)
          input.type = 'password';
          // Ibalik sa SLASHED EYE (Nakatago)
          this.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
        }
      });
    });
  });
})();
