import { DOM } from './dom.js';
import {
  tmCardsGetAll,
  tmCardsAdd,
  tmCardsRemove,
  tmCardsSetPrimary,
  tmCardsMask,
  tmWalletHydrate,
  tmWalletPrefsGet,
  tmWalletPrefsSet,
  tmTransactionsGet,
  tmTransactionsAdd,
  getMySubscriptions,
  getMyPayments,
  tmPaymentsGet,
  tmPaymentsSetAll
} from './data.js';

// =============================================================
// Wallet / Cards
// Data #2
// - Save cards (safe fields only, no card number / no cvc)
// - Render saved cards in "Your Cards" tab
// - Works for BOTH:
//    (1) Add Card page (view-add-card)
//    (2) Add Card modal (add-card-modal)
// =============================================================

function tmNowISO() {
  try { return new Date().toISOString(); } catch { return String(Date.now()); }
}

function tmUid(prefix = 'card') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function tmDigits(raw) {
  return String(raw || '').replace(/\D+/g, '');
}

function tmReadMe() {
  try { return window.__tmMe || window.tmMeCache || null; } catch { return null; }
}

function tmSafeTrim(v) {
  return String(v || '').trim();
}

function tmFormatCardNumberValue(raw) {
  const digits = tmDigits(raw).slice(0, 19); // allow up to 19 digits
  if (!digits) return '';

  // AmEx formatting: 4-6-5
  if (digits.startsWith('34') || digits.startsWith('37')) {
    const a = digits.slice(0, 4);
    const b = digits.slice(4, 10);
    const c = digits.slice(10, 15);
    return [a, b, c].filter(Boolean).join(' ');
  }

  // Default: groups of 4
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function tmBindCardNumberAutoFormat(root) {
  if (!root) return;
  const { number } = tmGetFieldsFromCardForm(root);
  if (!number) return;

  if (number.dataset.tmCardNumBound === '1') return;
  number.dataset.tmCardNumBound = '1';

  try { number.setAttribute('inputmode', 'numeric'); } catch {}
  try { number.setAttribute('autocomplete', 'cc-number'); } catch {}

  const handler = () => {
    const prev = number.value || '';
    const prevPos = (typeof number.selectionStart === 'number') ? number.selectionStart : prev.length;
    const digitsBefore = prev.slice(0, prevPos).replace(/\D+/g, '').length;

    const formatted = tmFormatCardNumberValue(prev);
    number.value = formatted;

    if (document.activeElement === number && typeof number.setSelectionRange === 'function') {
      let pos = 0;
      let seen = 0;
      while (pos < formatted.length && seen < digitsBefore) {
        if (/\d/.test(formatted[pos])) seen += 1;
        pos += 1;
      }
      try { number.setSelectionRange(pos, pos); } catch {}
    }
  };

  number.addEventListener('input', handler, { passive: true });
}

function tmBindCvcAutoFormat(root) {
  if (!root) return;
  const { cvc, number } = tmGetFieldsFromCardForm(root);
  if (!cvc) return;

  if (cvc.dataset.tmCvcBound === '1') return;
  cvc.dataset.tmCvcBound = '1';

  try { cvc.setAttribute('inputmode', 'numeric'); } catch {}
  try { cvc.setAttribute('autocomplete', 'cc-csc'); } catch {}
  try { cvc.setAttribute('maxlength', '4'); } catch {}

  const handler = () => {
    const raw = tmDigits(cvc.value).slice(0, 4);
    cvc.value = raw;

    // If card brand is AMEX, allow 4 digits; else 3 digits feels standard.
    const nd = tmDigits(number?.value);
    const isAmex = nd.startsWith('34') || nd.startsWith('37');
    if (!isAmex) {
      cvc.value = raw.slice(0, 3);
    }
  };

  cvc.addEventListener('input', handler, { passive: true });
}

function tmPrefillCardForm(root) {
  if (!root) return;
  const me = tmReadMe();
  if (!me) return;

  const fields = tmGetFieldsFromCardForm(root);

  try {
    if (fields.email && !tmSafeTrim(fields.email.value) && me.email) {
      fields.email.value = tmSafeTrim(me.email).toLowerCase();
      try { fields.email.setAttribute('autocomplete', 'email'); } catch {}
    }
    if (fields.name && !tmSafeTrim(fields.name.value) && me.name) {
      fields.name.value = tmSafeTrim(me.name);
      try { fields.name.setAttribute('autocomplete', 'cc-name'); } catch {}
    }
  } catch {}
}

function tmBindCardFormUX(root, toast) {
  if (!root) return;

  tmPrefillCardForm(root);
  tmBindCardNumberAutoFormat(root);
  tmBindExpAutoFormat(root);
  tmBindCvcAutoFormat(root);

  // "My card number is longer" hint
  const hintLink = root.querySelector('.link-small, .ac-link');
  if (hintLink && hintLink.dataset.tmHintBound !== '1') {
    hintLink.dataset.tmHintBound = '1';
    hintLink.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        toast?.fire?.({
          icon: 'info',
          title: 'Tip',
          text: 'Enter your full card number. We only save the last 4 digits (no CVC stored).'
        });
      } catch (_) {}
    });
  }
}

function tmBindVerifyButtons(toast) {
  // One global handler, avoids per-view duplication
  if (document.body && document.body.dataset.tmVerifyBound === '1') return;
  if (document.body) document.body.dataset.tmVerifyBound = '1';

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-verify');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      toast?.fire?.({
        icon: 'info',
        title: 'Verification',
        text: 'Verification is coming soon.'
      });
    } catch (_) {}
  });
}

function tmCardBrand(digits) {
  const d = tmDigits(digits);
  if (!d) return 'card';
  if (d.startsWith('4')) return 'visa';
  if (d.startsWith('5')) return 'mastercard';
  if (d.startsWith('34') || d.startsWith('37')) return 'amex';
  if (d.startsWith('6')) return 'discover';
  return 'card';
}

function tmParseExp(raw) {
  const v = String(raw || '').trim();
  if (!v) return { month: '', year: '' };
  const parts = v.replace(/\s+/g, '').split('/');
  if (parts.length < 2) return { month: '', year: '' };
  const m = parts[0].replace(/\D+/g, '').slice(0, 2);
  let y = parts[1].replace(/\D+/g, '');
  if (y.length === 2) y = `20${y}`;
  if (y.length > 4) y = y.slice(0, 4);
  return { month: m, year: y };
}

function tmFormatExpValue(raw) {
  const digits = String(raw || '').replace(/\D+/g, '').slice(0, 6); // MM + (YY|YYYY)
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function tmBindExpAutoFormat(root) {
  if (!root) return;
  const { exp } = tmGetFieldsFromCardForm(root);
  if (!exp) return;

  // Avoid double-binding
  if (exp.dataset.tmExpBound === '1') return;
  exp.dataset.tmExpBound = '1';

  // Helpful hints for mobile keyboards / autofill
  try { exp.setAttribute('inputmode', 'numeric'); } catch {}
  try { exp.setAttribute('autocomplete', 'cc-exp'); } catch {}
  try { exp.setAttribute('maxlength', '7'); } catch {} // MM/YYYY or MM/YY

  const handler = () => {
    const prev = exp.value || '';
    const prevPos = (typeof exp.selectionStart === 'number') ? exp.selectionStart : prev.length;
    const digitsBefore = prev.slice(0, prevPos).replace(/\D+/g, '').length;

    const formatted = tmFormatExpValue(prev);
    exp.value = formatted;

    // Keep caret near the same logical digit position
    if (document.activeElement === exp && typeof exp.setSelectionRange === 'function') {
      let pos = 0;
      let seen = 0;
      while (pos < formatted.length && seen < digitsBefore) {
        if (/\d/.test(formatted[pos])) seen += 1;
        pos += 1;
      }
      try { exp.setSelectionRange(pos, pos); } catch {}
    }
  };

  exp.addEventListener('input', handler, { passive: true });
}

function tmGetFieldsFromCardForm(root) {
  // Map by label text inside .ac-group
  const out = {
    country: null,
    state: null,
    address: null,
    city: null,
    zip: null,
    email: null,
    name: null,
    number: null,
    exp: null,
    cvc: null,
  };

  if (!root) return out;
  const groups = Array.from(root.querySelectorAll('.ac-group'));

  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const setIf = (key, el) => { if (el && !out[key]) out[key] = el; };

  for (const g of groups) {
    const lbl = g.querySelector('label');
    const inp = g.querySelector('input, textarea, select');
    if (!lbl || !inp) continue;
    const k = norm(lbl.textContent);

    if (k === 'country') setIf('country', inp);
    else if (k === 'state province' || k === 'state') setIf('state', inp);
    else if (k === 'address') setIf('address', inp);
    else if (k === 'city') setIf('city', inp);
    else if (k === 'zip postal code' || k === 'zip') setIf('zip', inp);
    else if (k === 'e mail' || k === 'email') setIf('email', inp);
    else if (k === 'name on the card' || k === 'name on card') setIf('name', inp);
    else if (k === 'card number') setIf('number', inp);
    else if (k === 'expiration' || k === 'expiry') setIf('exp', inp);
    else if (k === 'cvc' || k === 'cvv') setIf('cvc', inp);
  }

  return out;
}

function tmValidateCardPayload(payload, needsAgeConfirm) {
  const problems = [];

  const email = String(payload.email || '').trim();
  const name = String(payload.nameOnCard || '').trim();
  const last4 = String(payload.last4 || '').trim();
  const expMonth = String(payload.expMonth || '').trim();
  const expYear = String(payload.expYear || '').trim();
  const numberLen = parseInt(payload.numberLen || '0', 10) || 0;
  const cvc = String(payload.cvc || '').trim();
  const brand = String(payload.brand || '').trim().toLowerCase();

  if (!email || !email.includes('@')) problems.push('Email');
  if (!name) problems.push('Name on the card');
  if (!last4 || last4.length !== 4 || (numberLen && numberLen < 12)) problems.push('Card number');
  if (!expMonth || expMonth.length !== 2) problems.push('Expiration');
  if (!expYear || expYear.length !== 4) problems.push('Expiration');

  // CVC checks (we never store it, but we validate input)
  const cvcOk = (brand === 'amex') ? /^\d{4}$/.test(cvc) : /^\d{3,4}$/.test(cvc);
  if (!cvcOk) problems.push('CVC');

  if (needsAgeConfirm) problems.push('Age confirmation');

  // Month range check
  const m = parseInt(expMonth, 10);
  if (Number.isFinite(m) && (m < 1 || m > 12)) {
    problems.push('Expiration (month)');
  }

  // Expired check (soft)
  const y = parseInt(expYear, 10);
  if (Number.isFinite(m) && Number.isFinite(y)) {
    const now = new Date();
    const exp = new Date(y, m - 1, 1);
    // consider valid through end of month
    exp.setMonth(exp.getMonth() + 1);
    if (exp.getTime() < now.getTime()) {
      problems.push('Card is expired');
    }
  }

  return Array.from(new Set(problems));
}

function tmBrandIconHtml(brand) {
  const b = String(brand || '').toLowerCase();
  if (b === 'visa') return '<i class="fa-brands fa-cc-visa" aria-label="Visa"></i>';
  if (b === 'mastercard') return '<i class="fa-brands fa-cc-mastercard" aria-label="Mastercard"></i>';
  if (b === 'amex') return '<i class="fa-brands fa-cc-amex" aria-label="Amex"></i>';
  if (b === 'discover') return '<i class="fa-brands fa-cc-discover" aria-label="Discover"></i>';
  return '<i class="fa-regular fa-credit-card" aria-label="Card"></i>';
}

function tmEnsureCardsListContainer() {
  const host = DOM.tabContentCards;
  if (!host) return null;

  let list = document.getElementById('tm-cards-list');
  if (list) return list;

  list = document.createElement('div');
  list.id = 'tm-cards-list';
  list.style.marginTop = '18px';
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '10px';

  // Insert above the footer address (keeps existing UI blocks intact)
  const footer = host.querySelector('.of-footer-address');
  if (footer) footer.insertAdjacentElement('beforebegin', list);
  else host.appendChild(list);

  return list;
}

function tmUpdateCardsEmptyState(cards) {
  const host = DOM.tabContentCards;
  if (!host) return;

  const alert = host.querySelector('.of-alert-box');
  if (alert) {
    alert.style.display = (cards && cards.length) ? 'none' : '';
  }
}

function tmRenderCardsList() {
  const cards = tmCardsGetAll();
  tmUpdateCardsEmptyState(cards);

  const list = tmEnsureCardsListContainer();
  if (!list) return;

  if (!cards.length) {
    list.innerHTML = '';
    return;
  }

  list.innerHTML = cards.map((c) => {
    const masked = tmCardsMask(c);
    const primaryPill = c.isPrimary
      ? '<span style="margin-left:auto; font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; background: rgba(100,233,238,0.14); color: var(--primary-cyan); border: 1px solid rgba(100,233,238,0.25);">PRIMARY</span>'
      : '';

    const exp = (c.expMonth && c.expYear) ? `${c.expMonth}/${String(c.expYear).slice(-2)}` : '';

    return `
      <div class="tm-card-item" data-card-id="${c.id}" style="border: 1px solid var(--border-color); border-radius: 14px; padding: 12px 12px; background: rgba(255,255,255,0.02);">
        <div style="display:flex; align-items:center; gap:10px;">
          <div style="font-size: 22px; opacity: 0.95;">${tmBrandIconHtml(c.brand)}</div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            <div style="font-weight:800; color: var(--text); letter-spacing:0.2px;">${masked}</div>
            <div style="font-size:12px; color: var(--muted);">Exp: ${exp}${c.country ? ` · ${c.country}` : ''}</div>
          </div>
          ${primaryPill}
        </div>
        <div style="display:flex; gap:10px; margin-top: 10px; flex-wrap:wrap;">
          ${c.isPrimary ? '' : `<button type="button" data-action="tm-card-primary" data-card-id="${c.id}" style="border: 1px solid rgba(100,233,238,0.28); background: rgba(100,233,238,0.08); color: var(--primary-cyan); padding: 8px 10px; border-radius: 12px; cursor:pointer; font-weight:800; font-size:12px;">MAKE PRIMARY</button>`}
          <button type="button" data-action="tm-card-remove" data-card-id="${c.id}" style="border: 1px solid rgba(255,255,255,0.12); background: transparent; color: var(--text); padding: 8px 10px; border-radius: 12px; cursor:pointer; font-weight:800; font-size:12px;">REMOVE</button>
        </div>
      </div>
    `;
  }).join('');
}

function tmNavigateToYourCards() {
  // Robust: click the popover item associated with data-lang="pop_cards"
  const el = document.querySelector('span[data-lang="pop_cards"]')?.closest('.pop-item');
  if (el) {
    try { el.click(); return true; } catch { /* ignore */ }
  }
  return false;
}

function tmBuildCardFromForm(root) {
  const fields = tmGetFieldsFromCardForm(root);

  const numDigits = tmDigits(fields.number?.value);
  const cvcDigits = tmDigits(fields.cvc?.value).slice(0, 4);
  const { month, year } = tmParseExp(fields.exp?.value);

  const card = {
    id: tmUid('card'),
    brand: tmCardBrand(numDigits),
    last4: numDigits.slice(-4),
    numberLen: numDigits.length,
    expMonth: month,
    expYear: year,
    cvc: cvcDigits,
    nameOnCard: String(fields.name?.value || '').trim(),
    email: String(fields.email?.value || '').trim(),
    country: String(fields.country?.value || '').trim(),
    state: String(fields.state?.value || '').trim(),
    address: String(fields.address?.value || '').trim(),
    city: String(fields.city?.value || '').trim(),
    zip: String(fields.zip?.value || '').trim(),
    createdAt: tmNowISO()
  };

  return { card, fields };
}

function tmClearForm(fields) {
  if (!fields) return;
  Object.values(fields).forEach((el) => {
    if (!el) return;
    try { el.value = ''; } catch { /* ignore */ }
  });
}

function tmBindFormSubmit({
  root,
  submitBtn,
  getAgeConfirmed,
  toast,
  onSuccess
}) {
  if (!root || !submitBtn) return;

  submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const ageOk = !!(getAgeConfirmed ? getAgeConfirmed() : true);
    const { card, fields } = tmBuildCardFromForm(root);

    const problems = tmValidateCardPayload(card, !ageOk);
    if (problems.length) {
      try {
        toast.fire({
          icon: 'error',
          title: `Missing / invalid: ${problems.join(', ')}`
        });
      } catch (_) {}
      return;
    }

    try {
      try {
        await tmCardsAdd(card);
      } catch (e) {
        toast.error(e?.message || 'Failed to add card');
        return;
      }
      tmRenderCardsList();
      tmClearForm(fields);
      if (typeof onSuccess === 'function') await onSuccess(card);
      try { toast.fire({ icon: 'success', title: 'Card saved' }); } catch (_) {}
    } catch (err) {
      console.error(err);
      try { toast.fire({ icon: 'error', title: 'Unable to save card' }); } catch (_) {}
    }
  });
}


function tmIsPaymentsTabActive() {
  const wrap = DOM.tabContentPayments;
  if (!wrap) return false;
  return !wrap.classList.contains('hidden');
}

function tmInstallAutoRefresh() {
  const view = DOM.viewYourCards;
  if (!view) return;

  const refreshIfVisible = () => {
    try {
      const cs = window.getComputedStyle(view);
      if (cs && cs.display === 'none') return;
    } catch {
      // ignore
    }

    // If Payments tab is active, refresh Payments history; otherwise refresh cards list.
    if (tmIsPaymentsTabActive()) {
      tmEnterPaymentsTab(false);
    } else {
      tmRenderCardsList();
    }
  };

  // Initial (in case page loads on that view)
  refreshIfVisible();

  const obs = new MutationObserver(() => refreshIfVisible());
  obs.observe(view, { attributes: true, attributeFilter: ['style', 'class'] });

  // Also refresh when tabs toggle inside view-your-cards
  if (DOM.btnTabCards) {
    DOM.btnTabCards.addEventListener('click', () => {
      setTimeout(() => tmRenderCardsList(), 0);
    });
  }

  if (DOM.btnTabPayments) {
    DOM.btnTabPayments.addEventListener('click', () => {
      setTimeout(() => tmEnterPaymentsTab(false), 0);
    });
  }
}



// =============================================================
// Payments History (Data #8)
// - Lives inside view-your-cards > PAYMENTS tab
// - Uses /api/me/payments (server) and falls back to Subscriptions + local cache
// =============================================================
const tmPayState = {
  uiReady: false,
  loading: false,
  data: null,
  fetchedAt: 0
};

let tmPayUI = {
  wrap: null,
  list: null,
  emptyWrap: null,
  emptyText: null
};

function tmPayTsToMs(t) {
  if (!t) return 0;
  if (typeof t === 'number') return t;
  if (typeof t === 'string') {
    const n = Date.parse(t);
    if (!Number.isNaN(n)) return n;
    const p = parseInt(t, 10);
    return Number.isNaN(p) ? 0 : p;
  }
  if (typeof t === 'object') {
    try { if (typeof t.toMillis === 'function') return t.toMillis(); } catch (_) {}
    if (typeof t.seconds === 'number') return t.seconds * 1000;
    if (typeof t._seconds === 'number') return t._seconds * 1000;
  }
  return 0;
}

function tmPayFmtDate(ms) {
  if (!ms) return '';
  try {
    return new Date(ms).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function tmPayFmtMoney(amount, currency = 'USD') {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '';
  const n = Number(amount);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: String(currency || 'USD') }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency || ''}`.trim();
  }
}

function tmEnsurePaymentsUI() {
  const wrap = DOM.tabContentPayments;
  if (!wrap) return false;

  const emptyWrap = wrap.querySelector('.rs-col-empty-state');
  const emptyText = emptyWrap ? emptyWrap.querySelector('p') : null;

  let list = wrap.querySelector('#tm-payments-list');
  if (!list) {
    list = document.createElement('div');
    list.id = 'tm-payments-list';
    list.style.display = 'none';
    list.style.padding = '6px 0 0';
    // Insert before empty state so empty remains at bottom
    if (emptyWrap) wrap.insertBefore(list, emptyWrap);
    else wrap.appendChild(list);
  }

  tmPayUI = { wrap, list, emptyWrap, emptyText };
  tmPayState.uiReady = true;
  return true;
}

function tmSetPaymentsEmpty(text) {
  if (tmPayUI.emptyText) tmPayUI.emptyText.textContent = text || 'No payments yet.';
  if (tmPayUI.emptyWrap) tmPayUI.emptyWrap.style.display = '';
  if (tmPayUI.list) tmPayUI.list.style.display = 'none';
}

function tmSetPaymentsLoading() {
  if (!tmPayUI.list) return;
  if (tmPayUI.emptyWrap) tmPayUI.emptyWrap.style.display = 'none';
  tmPayUI.list.style.display = 'block';
  tmPayUI.list.innerHTML = `
    <div style="color:var(--muted); text-align:center; padding:22px 0; font-weight:700;">
      Loading payments...
    </div>
  `;
}

function tmBuildPaymentRow(p) {
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.alignItems = 'center';
  row.style.justifyContent = 'space-between';
  row.style.gap = '10px';
  row.style.padding = '12px 12px';
  row.style.border = '1px solid var(--border-color)';
  row.style.borderRadius = '14px';
  row.style.background = 'rgba(255,255,255,0.02)';
  row.style.marginBottom = '10px';

  const left = document.createElement('div');
  left.style.minWidth = '0';

  const title = document.createElement('div');
  title.style.fontWeight = '800';
  title.style.fontSize = '0.95rem';
  title.style.display = 'flex';
  title.style.alignItems = 'center';
  title.style.gap = '8px';

  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-receipt';
  icon.style.color = 'var(--primary-cyan)';

  const titleTxt = document.createElement('span');
  titleTxt.textContent = p.title || 'Payment';

  title.appendChild(icon);
  title.appendChild(titleTxt);

  const meta = document.createElement('div');
  meta.style.color = 'var(--muted)';
  meta.style.fontSize = '0.8rem';
  meta.style.marginTop = '4px';

  const dt = tmPayFmtDate(tmPayTsToMs(p.createdAt));
  const status = (p.status || '').toUpperCase();
  meta.textContent = [dt, status].filter(Boolean).join(' • ');

  if (p.description) {
    const desc = document.createElement('div');
    desc.style.color = 'var(--muted)';
    desc.style.fontSize = '0.8rem';
    desc.style.marginTop = '2px';
    desc.style.whiteSpace = 'nowrap';
    desc.style.overflow = 'hidden';
    desc.style.textOverflow = 'ellipsis';
    desc.textContent = p.description;
    left.appendChild(title);
    left.appendChild(meta);
    left.appendChild(desc);
  } else {
    left.appendChild(title);
    left.appendChild(meta);
  }

  const right = document.createElement('div');
  right.style.textAlign = 'right';
  right.style.whiteSpace = 'nowrap';

  const amt = document.createElement('div');
  amt.style.fontWeight = '900';
  amt.style.fontSize = '0.95rem';
  const money = tmPayFmtMoney(p.amount, p.currency);
  amt.textContent = money || '—';

  right.appendChild(amt);

  row.appendChild(left);
  row.appendChild(right);

  return row;
}

function tmRenderPaymentsList(items) {
  if (!tmPayUI.list) return;

  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) {
    tmSetPaymentsEmpty('No payments yet.');
    return;
  }

  if (tmPayUI.emptyWrap) tmPayUI.emptyWrap.style.display = 'none';
  tmPayUI.list.style.display = 'block';
  tmPayUI.list.innerHTML = '';

  arr.forEach(p => tmPayUI.list.appendChild(tmBuildPaymentRow(p)));
}

function tmBuildPaymentsFromSubs(subItems) {
  const list = Array.isArray(subItems) ? subItems : [];
  const mapped = list.map((it) => {
    const other = it?.otherUser || {};
    const handleRaw = (other.handle || '').trim().replace(/^@/, '');
    const who = handleRaw ? `@${handleRaw}` : (other.name || it.otherEmail || 'creator');
    const startAt = it.startAt || it.createdAt || it.updatedAt || null;
    return {
      id: String(it.id || `${it.subscriberEmail || 'me'}_${it.creatorEmail || 'creator'}_${String(startAt || '')}`),
      type: 'subscription',
      title: 'Subscription',
      description: `Subscribed to ${who}`,
      status: it.isActive ? 'active' : 'expired',
      currency: 'USD',
      amount: null,
      createdAt: startAt || new Date().toISOString()
    };
  });

  mapped.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return mapped;
}

async function tmLoadPayments(force = false) {
  if (!tmPayState.uiReady) return;
  if (tmPayState.loading) return;

  const now = Date.now();
  const fresh = tmPayState.data && (now - (tmPayState.fetchedAt || 0) < 15000);
  if (!force && fresh) {
    tmRenderPaymentsList(tmPayState.data);
    return;
  }

  tmPayState.loading = true;
  tmSetPaymentsLoading();

  try {
    // Try Payments API
    let items = null;
    try {
      const payload = await getMyPayments();
      if (payload && payload.ok === true && Array.isArray(payload.items)) {
        items = payload.items;
      }
    } catch (err) {
      // expected if endpoint not deployed yet
      items = null;
    }

    // Fallback: build from Subscriptions
    if (!items) {
      try {
        const subs = await getMySubscriptions({ dir: 'subscribed' });
        const subItems = subs?.subscribed?.items || subs?.items || [];
        if (Array.isArray(subItems) && subItems.length) {
          items = tmBuildPaymentsFromSubs(subItems);
        }
      } catch (_) {
        // ignore
      }
    }

    // Final fallback: local cache
    if (!items) {
      items = tmPaymentsGet();
    }

    // Cache
    if (Array.isArray(items)) {
      tmPayState.data = items;
      tmPayState.fetchedAt = Date.now();
      try { tmPaymentsSetAll(items); } catch (_) {}
      tmRenderPaymentsList(items);
    } else {
      tmPayState.data = [];
      tmPayState.fetchedAt = Date.now();
      tmSetPaymentsEmpty('No payments yet.');
    }

  } catch (err) {
    console.error('Payments load error:', err);
    tmSetPaymentsEmpty('Unable to load payments.');
    try { TopToast.fire({ icon: 'error', title: 'Unable to load payments' }); } catch (_) {}
  } finally {
    tmPayState.loading = false;
  }
}

function tmEnterPaymentsTab(force = false) {
  if (!tmEnsurePaymentsUI()) return;
  tmLoadPayments(!!force);
}

// -----------------------------
// Wallet preference + transactions (Data #7)
// -----------------------------
function tmFormatNiceDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso || '');
    return d.toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(iso || '');
  }
}

function tmEnsureWalletTxList() {
  const root = document.getElementById('rs-wallet-view');
  if (!root) return null;

  // The empty state lives inside the second wallet-widget-card > .ww-body
  const body = root.querySelectorAll('.wallet-widget-card .ww-body')[1] || root.querySelector('.wallet-widget-card .ww-body');
  if (!body) return null;

  let list = body.querySelector('#tm-wallet-tx-list');
  if (list) return list;

  list = document.createElement('div');
  list.id = 'tm-wallet-tx-list';
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '10px';
  list.style.marginTop = '6px';

  // Insert after the "LATEST TRANSACTIONS" label (the <small>)
  const small = body.querySelector('small');
  if (small) small.insertAdjacentElement('afterend', list);
  else body.appendChild(list);

  return list;
}

function tmRenderWalletTransactions() {
  const root = document.getElementById('rs-wallet-view');
  if (!root) return;

  const body = root.querySelectorAll('.wallet-widget-card .ww-body')[1] || root.querySelector('.wallet-widget-card .ww-body');
  if (!body) return;

  const empty = body.querySelector('.ww-empty');
  const list = tmEnsureWalletTxList();
  if (!list) return;

  const tx = tmTransactionsGet();
  if (!tx.length) {
    list.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }

  if (empty) empty.style.display = 'none';

  list.innerHTML = tx.slice(0, 8).map((t) => {
    const icon = (t.type === 'payment')
      ? '<i class="fa-solid fa-bag-shopping" style="opacity:0.9;"></i>'
      : '<i class="fa-regular fa-clock" style="opacity:0.85;"></i>';

    const amount = (typeof t.amount === 'number' && t.amount !== 0)
      ? `<span style="margin-left:auto; font-weight:900; color: var(--text);">$${Math.abs(t.amount).toFixed(2)}</span>`
      : '<span style="margin-left:auto; font-weight:900; color: var(--muted);">—</span>';

    return `
      <div class="tm-wallet-tx" style="display:flex; align-items:center; gap:10px; padding: 10px 10px; border: 1px solid var(--border-color); border-radius: 14px; background: rgba(255,255,255,0.02);">
        <div style="font-size:16px;">${icon}</div>
        <div style="display:flex; flex-direction:column; gap:3px; min-width:0;">
          <div style="font-weight:850; color: var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${String(t.title || 'Activity')}</div>
          <div style="font-size:12px; color: var(--muted);">${tmFormatNiceDate(t.createdAt)}</div>
        </div>
        ${amount}
      </div>
    `;
  }).join('');
}

function tmBindWalletRebillToggle(toast) {
  const root = document.getElementById('rs-wallet-view');
  if (!root) return;

  const toggle = root.querySelector('.ww-toggle-row input[type="checkbox"]');
  if (!toggle) return;

  // Set initial
  const prefs = tmWalletPrefsGet();
  toggle.checked = !!prefs.rebillPrimary;

  toggle.addEventListener('change', async () => {
    const desired = !!toggle.checked;
    try {
      const next = await tmWalletPrefsSet({ rebillPrimary: desired });
      try {
        toast.fire({ icon: 'success', title: next.rebillPrimary ? 'Wallet set as primary for rebills' : 'Wallet rebills disabled' });
      } catch (_) {}
    } catch (e) {
      // revert if backend fails
      toggle.checked = !desired;
      try { toast.fire({ icon: 'error', title: 'Failed to save wallet setting' }); } catch(_) {}
    }
  });
}


export function initWallet(TopToast) {
  const toast = TopToast;

  // -----------------------------
  // Add Card MODAL (Right sidebar)
  // -----------------------------
  const modal = document.getElementById('add-card-modal');
  const btnCancel = document.querySelector('.btn-cancel-modal');
  const btnSubmitModal = document.querySelector('.btn-submit-card-modal');

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    setTimeout(() => modal.classList.add('hidden'), 200);
  };

  // Open modal (event delegation for dynamic content)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-add-payment-card');
    if (!btn) return;
    e.preventDefault();
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('open'), 10);
  });

  if (btnCancel) btnCancel.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Save from modal
  tmBindCardFormUX(modal, toast);
  if (modal && btnSubmitModal) {
    tmBindFormSubmit({
      root: modal,
      submitBtn: btnSubmitModal,
      getAgeConfirmed: () => !!document.getElementById('ageCheckModal')?.checked,
      toast,
      onSuccess: async (card) => {
        try { await tmTransactionsAdd({ type: 'activity', title: `Card added • ${tmCardsMask(card)}`, amount: 0 }); } catch(_) {}
        tmRenderWalletTransactions();
        closeModal();
        // Optional: take user to Your Cards view
        setTimeout(() => tmNavigateToYourCards(), 50);
      }
    });
  }

  // -----------------------------
  // Add Card PAGE (view-add-card)
  // -----------------------------
  const viewAddCard = DOM.viewAddCard;
  if (viewAddCard) {
    tmBindCardFormUX(viewAddCard, toast);
    const btnSubmitPage = viewAddCard.querySelector('.btn-submit-card');
    tmBindFormSubmit({
      root: viewAddCard,
      submitBtn: btnSubmitPage,
      getAgeConfirmed: () => !!document.getElementById('ageCheck')?.checked,
      toast,
      onSuccess: async (card) => {
        try { await tmTransactionsAdd({ type: 'activity', title: `Card added • ${tmCardsMask(card)}`, amount: 0 }); } catch(_) {}
        tmRenderWalletTransactions();
        // Navigate to Your Cards so they immediately see saved card(s)
        setTimeout(() => tmNavigateToYourCards(), 50);
      }
    });
  }

  // -----------------------------
  // Actions: Remove / Primary
  // -----------------------------
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="tm-card-remove"], [data-action="tm-card-primary"]');
    if (!btn) return;
    e.preventDefault();

    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-card-id');
    if (!id) return;

    try {
      if (action === 'tm-card-remove') {
        const before = tmCardsGetAll().find(x => x.id === id);
        await tmCardsRemove(id);
        tmRenderCardsList();
        try { await tmTransactionsAdd({ type: 'activity', title: `Card removed • ${before ? tmCardsMask(before) : '****'}`, amount: 0 }); } catch(_) {}
        tmRenderWalletTransactions();
        try { toast.fire({ icon: 'success', title: 'Card removed' }); } catch (_) {}
      }
      if (action === 'tm-card-primary') {
        const before = tmCardsGetAll().find(x => x.id === id);
        await tmCardsSetPrimary(id);
        tmRenderCardsList();
        try { await tmTransactionsAdd({ type: 'activity', title: `Primary card set • ${before ? tmCardsMask(before) : '****'}`, amount: 0 }); } catch(_) {}
        tmRenderWalletTransactions();
        try { toast.fire({ icon: 'success', title: 'Primary card updated' }); } catch (_) {}
      }
    } catch (err) {
      console.error(err);
      try { toast.fire({ icon: 'error', title: 'Action failed' }); } catch (_) {}
    }
  });

  // Wallet header: Verify button (no-op placeholder)
  tmBindVerifyButtons(toast);

  // Auto-refresh list when Your Cards view opens
  tmInstallAutoRefresh();

  // Wallet (Data #7)
  tmBindWalletRebillToggle(toast);
  tmRenderWalletTransactions();
}
