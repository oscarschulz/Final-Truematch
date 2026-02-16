// loader.js
// Robust HTML view loader used by Creators app.
// Backwards-compatible signature: loadView(elementId, filePath)
// Optional 3rd arg: { cacheBust?: boolean, credentials?: RequestCredentials }

function tmSafeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function tmWithCacheBust(urlStr, cacheBust) {
  try {
    const u = new URL(urlStr, window.location.href);
    if (cacheBust) u.searchParams.set('v', String(Date.now()));
    return u.toString();
  } catch {
    if (!cacheBust) return urlStr;
    const glue = urlStr.includes('?') ? '&' : '?';
    return `${urlStr}${glue}v=${Date.now()}`;
  }
}

function tmRenderLoadError(container, elementId, filePath, err, opts) {
  if (!container) return;

  const msg = tmSafeHtml(err?.message || err || 'Failed to load');
  const path = tmSafeHtml(filePath);

  container.dataset.viewLoaded = '0';
  container.dataset.viewError = msg;
  container.innerHTML = `
    <div class="tm-view-load-error" style="
      margin: 18px 15px;
      padding: 14px 14px;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 14px;
      background: rgba(255,255,255,0.03);
      color: rgba(255,255,255,0.86);
      font-family: Montserrat, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    ">
      <div style="font-weight: 800; font-size: 14px; margin-bottom: 6px;">Unable to load this section</div>
      <div style="opacity: 0.85; font-size: 12px; line-height: 1.4;">
        <div style="margin-bottom: 6px;"><span style="opacity:0.7;">Path:</span> <code style="opacity:0.9;">${path}</code></div>
        <div><span style="opacity:0.7;">Error:</span> <code style="opacity:0.9;">${msg}</code></div>
      </div>
      <div style="margin-top: 12px; display:flex; gap:10px; align-items:center;">
        <button type="button" data-tm-retry="1" style="
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(100,233,238,0.12);
          color: rgba(255,255,255,0.95);
          font-weight: 800;
          cursor: pointer;
        ">Retry</button>
        <button type="button" data-tm-reload="1" style="
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.9);
          font-weight: 800;
          cursor: pointer;
        ">Reload page</button>
      </div>
    </div>
  `;

  const retryBtn = container.querySelector('[data-tm-retry="1"]');
  if (retryBtn) {
    retryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      loadView(elementId, filePath, opts);
    }, { once: true });
  }

  const reloadBtn = container.querySelector('[data-tm-reload="1"]');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try { window.location.reload(); } catch {}
    }, { once: true });
  }
}

export async function loadView(elementId, filePath, opts = {}) {
  const container = document.getElementById(elementId);
  if (!container) return { ok: false, error: 'container_missing' };

  const cacheBust = !!opts.cacheBust;
  const credentials = opts.credentials || 'include';

  const url = tmWithCacheBust(filePath, cacheBust);

  try {
    const response = await fetch(url, { credentials });
    if (!response.ok) throw new Error(`Failed to load (${response.status}) ${filePath}`);

    const html = await response.text();
    container.innerHTML = html;
    container.dataset.viewLoaded = '1';
    container.dataset.viewError = '';
    container.dataset.viewUrl = url;
    return { ok: true, html };
  } catch (error) {
    console.error(`❌ Error loading component from ${filePath}:`, error);
    tmRenderLoadError(container, elementId, filePath, error, opts);
    return { ok: false, error: error?.message || String(error) };
  }
}