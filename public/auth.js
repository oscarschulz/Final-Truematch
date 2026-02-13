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

  const IS_LOCAL_DEV = (location.protocol === "file:") || (location.hostname === "localhost") || (location.hostname === "127.0.0.1");

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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

  async function callAPI(path, payload = {}, opts = {}) {
    const timeoutMs = Number(opts.timeoutMs || 12000);
    const allowOfflineDemo = !!opts.allowOfflineDemo && IS_LOCAL_DEV;

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(API_BASE + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload || {}),
        signal: controller.signal
      });

      clearTimeout(id);

      const ok = res.ok;
      const status = res.status;
      let data = null;

      try { data = await res.json(); } catch {}

      return { ok, status, ...(data || {}) };
    } catch (err) {
      // Never auto-success in production. Offline demo is only allowed on localhost/file.
      if (allowOfflineDemo) return { ok: true, demo: true, status: 0 };
      return { ok: false, status: 0, message: "network_error" };
    }
  }

  async function apiGet(path, opts = {}) {
    const timeoutMs = Number(opts.timeoutMs || 12000);
    const allowOfflineDemo = !!opts.allowOfflineDemo && IS_LOCAL_DEV;

    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(API_BASE + path, {
        credentials: "include",
        signal: controller.signal
      });

      clearTimeout(id);

      let data = null;
      try { data = await res.json(); } catch {}

      return data;
    } catch (err) {
      if (allowOfflineDemo) return { ok: true, demo: true, status: 0 };
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
      alert("Demo password mali.");
      return true;
    }
    saveLocalUser({ email, name: d.name, plan: d.plan });
    try { await callAPI("/api/auth/login", { email, password: pass }, { allowOfflineDemo: true }); } catch {}
    const extra = new URLSearchParams({ demo: "1", prePlan: d.plan });
    finishLogin(extra.toString());
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
      const fd = new FormData(signupForm);
      try { tmShowLoader('Creating account…','Securing session'); } catch {}
      try {
        const payload = Object.fromEntries(fd.entries());
        payload.name = payload.name || payload.fullName || '';
        try { delete payload.fullName; } catch (e) {}
        const out = await callAPI("/api/auth/register", payload, { allowOfflineDemo: true });
        const ok = !!(out?.ok || out?.created || out?.status === 200 || out?.status === 201 || out?.demo);
        if (!ok) {
          alert(out?.message || "Signup failed.");
          return;
        }
        setActiveTab("login");
        setParam("mode", "login");
        const email = String(payload.email || "").trim();
        if (email && $("#loginEmail")) $("#loginEmail").value = email;
      } finally { try { tmHideLoader(); } catch {} }
    });
  });

  whenReady(() => {
    const loginForm = $("#loginForm");
    if (!loginForm || loginForm.dataset.tmBound === "1") return;
    loginForm.dataset.tmBound = "1";
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try { tmShowLoader('Signing in…','Checking credentials'); } catch {}
      try {
        const email = String($("#loginEmail")?.value || "").trim();
        const password = String($("#loginPass")?.value || "").trim();
        if (await tryDemoLogin(email, password)) return;
        const res = await callAPI("/api/auth/login", { email, password }, { allowOfflineDemo: true });
        const offline = !!(res && (res.demo || res.status === 0));
        const ok = !!(res && (res.ok || offline));
        if (!ok) {
          alert(res?.message || "Login failed.");
          return;
        }
        saveLocalUser(res.user || { email, name: email.split("@")[0] || "User" });
        const extra = new URLSearchParams();
        if (offline) extra.set("demo", "1");
        finishLogin(extra.toString());
      } finally { try { tmHideLoader(); } catch {} }
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
        const r = await callAPI("/api/auth/oauth/mock", { provider: "google" }, { allowOfflineDemo: true });
        saveLocalUser(r?.user || { email: "google@demo.local", name: "Google User" });
        const extra = new URLSearchParams();
        if (r?.demo || r?.status === 0) extra.set("demo", "1");
        finishLogin(extra.toString());
      } finally { try { tmHideLoader(); } catch {} }
    });
  });

  whenReady(() => {
    const btnOpenForgot = document.getElementById('btnOpenForgot');
    const dlgForgot = document.getElementById('dlgForgot');
    const step1 = document.getElementById('forgotStep1');
    const step2 = document.getElementById('forgotStep2');
    const btnCancel = document.getElementById('btnForgotCancel');
    const btnCloseForgot = document.getElementById('btnCloseForgot') || document.getElementById('btnCloseForgotX');
    const btnCloseForgotX = document.getElementById('btnCloseForgotX');
    const btnVerify = document.getElementById('btnForgotVerify');
    const btnBack = document.getElementById('btnForgotBack');
    const btnChange = document.getElementById('btnForgotChange');
    const btnResend = document.getElementById('btnForgotResend');
    const err = document.getElementById('forgotError');
    const info = document.getElementById('forgotInfo');
    const inEmail = document.getElementById('forgotEmail') || document.getElementById('forgotEmailInput');
    const inOtp = document.getElementById('forgotOtpInput');
    const otpWrap = document.getElementById('forgotOtpWrap');
    const inPass1 = document.getElementById('forgotNewPass');
    const inPass2 = document.getElementById('forgotNewPass2') || document.getElementById('forgotConfirmPass');

    let resetToken = null;
    let otpEmail = null;

    function setErr(msg = "") {
      if (!err) return;
      err.textContent = msg || "";
      err.style.display = msg ? "block" : "none";
    }

    function setInfo(msg = "") {
      if (!info) return;
      info.textContent = msg || "";
      info.style.display = msg ? "block" : "none";
    }

    function clearParams(keys = []) {
      const url = new URL(window.location.href);
      keys.forEach(k => url.searchParams.delete(k));
      history.replaceState(null, "", url.toString());
    }

    function showStep1(message = "") {
      resetToken = null;
      otpEmail = null;
      step1.style.display = "";
      step2.style.display = "none";
      setErr("");
      setInfo(message || "");
      if (inEmail) inEmail.value = "";
      if (inOtp) inOtp.value = "";
      if (inPass1) inPass1.value = "";
      if (inPass2) inPass2.value = "";
    }

    function showStep2Link(token) {
      resetToken = String(token || "").trim();
      otpEmail = null;
      step1.style.display = "none";
      step2.style.display = "";
      setErr("");
      setInfo("");

      // Link reset does not need OTP input
      if (otpWrap) otpWrap.style.display = "none";
      if (btnResend) btnResend.style.display = "none";

      if (inOtp) inOtp.value = "";
      if (inPass1) inPass1.value = "";
      if (inPass2) inPass2.value = "";
    }

    function showStep2Otp(email) {
      resetToken = null;
      otpEmail = String(email || "").trim().toLowerCase();
      step1.style.display = "none";
      step2.style.display = "";
      setErr("");
      setInfo("We sent a 6-digit code to your email (if an account exists).\nEnter it below to reset your password.");

      if (otpWrap) otpWrap.style.display = "";
      if (btnResend) btnResend.style.display = "";

      if (inOtp) {
        inOtp.value = "";
        setTimeout(() => { try { inOtp.focus(); } catch {} }, 50);
      }
      if (inPass1) inPass1.value = "";
      if (inPass2) inPass2.value = "";
    }

    function closeDialog() {
      try {
        if (dlgForgot && typeof dlgForgot.close === 'function') dlgForgot.close();
        else dlgForgot?.removeAttribute?.('open');
      } catch {}
    }

    btnOpenForgot?.addEventListener('click', (e) => {
      e.preventDefault();
      showStep1("");
      try {
        if (dlgForgot && typeof dlgForgot.showModal === 'function') dlgForgot.showModal();
        else dlgForgot?.setAttribute?.('open', '');
      } catch {}
    });

    btnCancel?.addEventListener('click', () => {
      closeDialog();
      clearParams(['mode', 'token']);
      setActiveTab('login');
      setParam('mode', 'login');
    });

    btnCloseForgot?.addEventListener('click', () => {
      closeDialog();
      clearParams(['mode', 'token']);
      setActiveTab('login');
      setParam('mode', 'login');
    });

    btnVerify?.addEventListener('click', async () => {
      const email = (inEmail?.value || "").trim();
      if (!email) { setErr("Enter your email."); return; }

      btnVerify.disabled = true;
      setErr("");
      setInfo("Sending code...");

      const out = await callAPI("/api/auth/forgot/send-otp", { email }, { timeoutMs: 15000 });

      btnVerify.disabled = false;

      if (!out?.ok) {
        setInfo("");
        setErr("Could not send code. Try again.");
        return;
      }

      // Move to OTP + new password step.
      showStep2Otp(email);
    });

    btnResend?.addEventListener('click', async () => {
      const email = (otpEmail || (inEmail?.value || "")).trim();
      if (!email) { setErr("Enter your email."); return; }
      btnResend.disabled = true;
      setErr("");
      setInfo("Resending code...");
      try {
        const out = await callAPI("/api/auth/forgot/send-otp", { email }, { timeoutMs: 15000 });
        if (!out?.ok) {
          setInfo("");
          setErr("Could not resend code. Try again.");
        } else {
          setErr("");
          setInfo("If an account exists, we sent a new code.\nPlease check your inbox/spam.");
        }
      } finally {
        btnResend.disabled = false;
      }
    });

    btnBack?.addEventListener('click', () => {
      if (resetToken) {
        // Reset-link mode: go back to login and remove token from URL
        closeDialog();
        clearParams(['mode', 'token']);
        setActiveTab('login');
        setParam('mode', 'login');
        showStep1("");
        return;
      }
      showStep1("");
    });

    btnChange?.addEventListener('click', async () => {
      const p1 = (inPass1?.value || "").trim();
      const p2 = (inPass2?.value || "").trim();

      if (!p1 || p1.length < 8) { setErr("Password must be at least 8 characters."); return; }
      if (p1 !== p2) { setErr("Passwords do not match."); return; }

      btnChange.disabled = true;
      setErr("");
      setInfo("Updating password...");

      const out = resetToken
        ? await callAPI("/api/auth/forgot/reset", { token: resetToken, newPassword: p1 }, { timeoutMs: 15000 })
        : await callAPI("/api/auth/forgot/reset-otp", { email: otpEmail, code: String(inOtp?.value || '').trim(), newPassword: p1 }, { timeoutMs: 15000 });

      btnChange.disabled = false;

      if (!out?.ok) {
        setInfo("");
        if (out?.message === 'weak_password') {
          setErr("Password is too weak.");
        } else if (!resetToken && out?.message === 'invalid_or_expired_code') {
          setErr("Invalid or expired code. Please request a new one.");
        } else {
          setErr(resetToken ? "Could not reset password. Request a new reset link." : "Could not reset password. Try again.");
        }
        return;
      }

      setErr("");
      setInfo("Password updated. You can log in now.");
      setTimeout(() => {
        closeDialog();
        clearParams(['mode', 'token']);
        setActiveTab('login');
        setParam('mode', 'login');
      }, 1200);
    });

    // Auto-open reset dialog if user came from the email link
    const mode = getParam('mode');
    const token = getParam('token');
    if (mode === 'reset' && token) {
      showStep2Link(token);
      try {
        if (dlgForgot && typeof dlgForgot.showModal === 'function') dlgForgot.showModal();
        else dlgForgot?.setAttribute?.('open', '');
      } catch {}
    } else {
      // default view
      showStep1("");
    }
  });

})();
