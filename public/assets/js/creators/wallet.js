import { DOM } from './dom.js';
import {
  tmCardsGetAll,
  tmCardsAdd,
  tmCardsRemove,
  tmCardsSetPrimary,
  tmCardsMask
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

  if (!email || !email.includes('@')) problems.push('Email');
  if (!name) problems.push('Name on the card');
  if (!last4 || last4.length !== 4) problems.push('Card number');
  if (!expMonth || expMonth.length !== 2) problems.push('Expiration');
  if (!expYear || expYear.length !== 4) problems.push('Expiration');
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

  const digits = tmDigits(fields.number?.value);
  const { month, year } = tmParseExp(fields.exp?.value);

  const card = {
    id: tmUid('card'),
    brand: tmCardBrand(digits),
    last4: digits.slice(-4),
    expMonth: month,
    expYear: year,
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

  submitBtn.addEventListener('click', (e) => {
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
      tmCardsAdd(card);
      tmRenderCardsList();
      tmClearForm(fields);
      if (typeof onSuccess === 'function') onSuccess(card);
      try { toast.fire({ icon: 'success', title: 'Card saved' }); } catch (_) {}
    } catch (err) {
      console.error(err);
      try { toast.fire({ icon: 'error', title: 'Unable to save card' }); } catch (_) {}
    }
  });
}

function tmInstallAutoRefresh() {
  const view = DOM.viewYourCards;
  if (!view) return;

  const refreshIfVisible = () => {
    try {
      const cs = window.getComputedStyle(view);
      if (cs && cs.display !== 'none' && cs.visibility !== 'hidden') {
        tmRenderCardsList();
      }
    } catch {
      // fallback
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
      // allow DOM to settle
      setTimeout(() => tmRenderCardsList(), 0);
    });
  }
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
  if (modal && btnSubmitModal) {
    tmBindFormSubmit({
      root: modal,
      submitBtn: btnSubmitModal,
      getAgeConfirmed: () => !!document.getElementById('ageCheckModal')?.checked,
      toast,
      onSuccess: () => {
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
    const btnSubmitPage = viewAddCard.querySelector('.btn-submit-card');
    tmBindFormSubmit({
      root: viewAddCard,
      submitBtn: btnSubmitPage,
      getAgeConfirmed: () => !!document.getElementById('ageCheck')?.checked,
      toast,
      onSuccess: () => {
        // Navigate to Your Cards so they immediately see saved card(s)
        setTimeout(() => tmNavigateToYourCards(), 50);
      }
    });
  }

  // -----------------------------
  // Actions: Remove / Primary
  // -----------------------------
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="tm-card-remove"], [data-action="tm-card-primary"]');
    if (!btn) return;
    e.preventDefault();

    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-card-id');
    if (!id) return;

    try {
      if (action === 'tm-card-remove') {
        tmCardsRemove(id);
        tmRenderCardsList();
        try { toast.fire({ icon: 'success', title: 'Card removed' }); } catch (_) {}
      }
      if (action === 'tm-card-primary') {
        tmCardsSetPrimary(id);
        tmRenderCardsList();
        try { toast.fire({ icon: 'success', title: 'Primary card updated' }); } catch (_) {}
      }
    } catch (err) {
      console.error(err);
      try { toast.fire({ icon: 'error', title: 'Action failed' }); } catch (_) {}
    }
  });

  // Auto-refresh list when Your Cards view opens
  tmInstallAutoRefresh();
}
