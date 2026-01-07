// premium-society.js
import { apiGet, apiPost } from './tm-api.js';

const DOM = {
  btnBack: document.getElementById('btnBack'),

  pillStatus: document.getElementById('pillStatus'),
  pillPlan: document.getElementById('pillPlan'),

  stateLoading: document.getElementById('stateLoading'),
  stateLocked: document.getElementById('stateLocked'),
  statePending: document.getElementById('statePending'),
  stateApproved: document.getElementById('stateApproved'),

  btnApply: document.getElementById('btnApply'),
  btnRefresh: document.getElementById('btnRefresh'),

  dlg: document.getElementById('dlgPremiumApply'),
  frm: document.getElementById('frmPremiumApply'),
  btnDlgClose: document.getElementById('btnDlgClose'),
  btnCancelApply: document.getElementById('btnCancelApply'),
  btnSubmitApply: document.getElementById('btnSubmitApply'),
  applyError: document.getElementById('applyError'),

  fullName: document.getElementById('fullName'),
  age: document.getElementById('age'),
  occupation: document.getElementById('occupation'),
  finance: document.getElementById('finance'),

  pendingStatus: document.getElementById('pendingStatus'),
  pendingWhen: document.getElementById('pendingWhen'),

  txtConcierge: document.getElementById('txtConcierge'),
  btnSendConcierge: document.getElementById('btnSendConcierge'),
};

function showOnly(state) {
  if (DOM.stateLoading) DOM.stateLoading.hidden = state !== 'loading';
  if (DOM.stateLocked) DOM.stateLocked.hidden = state !== 'locked';
  if (DOM.statePending) DOM.statePending.hidden = state !== 'pending';
  if (DOM.stateApproved) DOM.stateApproved.hidden = state !== 'approved';
}

function setPills({ statusText, planText }) {
  if (DOM.pillStatus) DOM.pillStatus.textContent = statusText ?? '—';
  if (DOM.pillPlan) DOM.pillPlan.textContent = planText ?? 'Plan: —';
}

function normalizeStatus(val) {
  return String(val || '').trim().toLowerCase();
}

function formatDateMaybe(val) {
  try {
    if (!val) return '—';
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString();
  } catch {
    return '—';
  }
}

function openDialog() {
  if (!DOM.dlg) return;
  if (typeof DOM.dlg.showModal === 'function') DOM.dlg.showModal();
  else DOM.dlg.setAttribute('open', 'open');
  hideApplyError();
}

function closeDialog() {
  if (!DOM.dlg) return;
  if (typeof DOM.dlg.close === 'function') DOM.dlg.close();
  else DOM.dlg.removeAttribute('open');
  hideApplyError();
}

function showApplyError(msg) {
  if (!DOM.applyError) return;
  DOM.applyError.hidden = false;
  DOM.applyError.textContent = msg || 'Something went wrong.';
}

function hideApplyError() {
  if (!DOM.applyError) return;
  DOM.applyError.hidden = true;
  DOM.applyError.textContent = '';
}

function computePremiumState(user) {
  const plan = normalizeStatus(user?.plan);
  const planActive = !!user?.planActive;

  const premiumStatus = normalizeStatus(user?.premiumStatus);

  const approvedByPlan = plan === 'tier3' && planActive;
  const approvedByStatus = premiumStatus === 'approved';
  const pending = premiumStatus === 'pending';

  return {
    plan,
    planActive,
    premiumStatus,
    approved: approvedByPlan || approvedByStatus,
    pending
  };
}

async function refreshStatus() {
  showOnly('loading');
  setPills({ statusText: 'Checking status…', planText: 'Plan: —' });

  const res = await apiGet('/api/me');

  if (!res?.ok) {
    setPills({ statusText: 'Not signed in', planText: 'Plan: —' });
    showOnly('locked');
    return;
  }

  const user = res.user || {};
  const s = computePremiumState(user);

  setPills({
    statusText: s.approved ? 'Status: Approved' : s.pending ? 'Status: Pending' : 'Status: Not approved',
    planText: `Plan: ${user.plan || 'free'}${user.planActive ? '' : ' (inactive)'}`
  });

  if (s.approved) {
    showOnly('approved');
  } else if (s.pending) {
    if (DOM.pendingStatus) DOM.pendingStatus.textContent = 'Pending';
    if (DOM.pendingWhen) DOM.pendingWhen.textContent = formatDateMaybe(user?.premiumApplication?.appliedAt);
    showOnly('pending');
  } else {
    showOnly('locked');
  }
}

async function submitApplication(e) {
  e.preventDefault();
  hideApplyError();

  const payload = {
    fullName: DOM.fullName?.value?.trim(),
    age: DOM.age?.value ? Number(DOM.age.value) : null,
    occupation: DOM.occupation?.value?.trim(),
    finance: DOM.finance?.value?.trim()
  };

  if (!payload.fullName || !payload.age || !payload.occupation || !payload.finance) {
    showApplyError('Please fill in all fields.');
    return;
  }
  if (payload.age < 18 || payload.age > 99) {
    showApplyError('Please enter a valid age (18–99).');
    return;
  }

  if (DOM.btnSubmitApply) {
    DOM.btnSubmitApply.disabled = true;
    DOM.btnSubmitApply.textContent = 'Submitting…';
  }

  try {
    const res = await apiPost('/api/me/premium/apply', payload);

    if (!res?.ok) {
      showApplyError(res?.message || 'Failed to submit application. Please try again.');
      return;
    }

    closeDialog();
    await refreshStatus();

  } catch (err) {
    console.error(err);
    showApplyError('Network error. Please try again.');
  } finally {
    if (DOM.btnSubmitApply) {
      DOM.btnSubmitApply.disabled = false;
      DOM.btnSubmitApply.textContent = 'Submit application';
    }
  }
}

function setupConciergeDraft() {
  const key = 'tm_premium_concierge_draft';
  if (!DOM.txtConcierge || !DOM.btnSendConcierge) return;

  try {
    const saved = localStorage.getItem(key);
    if (saved) DOM.txtConcierge.value = saved;
  } catch {}

  DOM.btnSendConcierge.onclick = () => {
    const text = (DOM.txtConcierge.value || '').trim();
    if (!text) {
      alert('Write a request first.');
      return;
    }
    try { localStorage.setItem(key, text); } catch {}
    alert('Saved. Next step: wire this to your messaging/concierge endpoint.');
  };
}

function bindEvents() {
  if (DOM.btnBack) DOM.btnBack.onclick = () => (window.location.href = 'dashboard.html');

  if (DOM.btnApply) DOM.btnApply.onclick = openDialog;
  if (DOM.btnRefresh) DOM.btnRefresh.onclick = refreshStatus;

  if (DOM.btnDlgClose) DOM.btnDlgClose.onclick = closeDialog;
  if (DOM.btnCancelApply) DOM.btnCancelApply.onclick = closeDialog;

  if (DOM.frm) DOM.frm.addEventListener('submit', submitApplication);

  if (DOM.dlg) {
    DOM.dlg.addEventListener('cancel', (ev) => {
      ev.preventDefault();
      closeDialog();
    });
  }
}

async function init() {
  bindEvents();
  setupConciergeDraft();
  await refreshStatus();
}

document.addEventListener('DOMContentLoaded', init);
