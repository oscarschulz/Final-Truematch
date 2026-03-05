// public/fomo.js
(function startFomo() {
  const fomo = document.getElementById('tm-fomo');
  if (!fomo) return;

  const textEl = fomo.querySelector('.fomo-text');
  const timeEl = fomo.querySelector('.fomo-time');

  let lastId = null;
  let usingFallback = false;

  // Western-market mock data (fallback if /api/fomo is not reachable in local static previews)
  const FOMO_NAMES = [
    'Emily','Sophia','Olivia','Ava','Mia','Isabella','Charlotte','Amelia',
    'Noah','Liam','Ethan','Lucas','Mason','James','Benjamin','Henry',
    'Chloe','Grace','Hannah','Zoe','Ella','Victoria','Samantha','Natalie'
  ];

  const FOMO_LOCATIONS = [
    'New York, USA','Los Angeles, USA','San Francisco, USA','Chicago, USA','Austin, USA','Miami, USA',
    'Toronto, Canada','Vancouver, Canada','Montreal, Canada',
    'London, UK','Manchester, UK','Edinburgh, UK',
    'Paris, France','Berlin, Germany','Amsterdam, Netherlands','Stockholm, Sweden',
    'Sydney, Australia','Melbourne, Australia','Auckland, New Zealand'
  ];

  const FOMO_ACTIONS = [
    'just signed up',
    'just joined',
    'just completed onboarding',
    'just upgraded to Plus',
    'just upgraded to Elite',
    'just unlocked Concierge',
    'just purchased a plan',
    'just got matched',
    'just booked a curated date'
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function timeAgoLabel() {
    const mins = [1, 2, 3, 4, 6, 8, 10, 12];
    const m = pick(mins);
    return m === 1 ? '1 min ago' : `${m} mins ago`;
  }

  function showEvent(data) {
    if (!data) return;

    const id = data.id || `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    if (id === lastId) return;

    lastId = id;

    const name = data.name || pick(FOMO_NAMES);
    const location = data.location || pick(FOMO_LOCATIONS);
    const action = data.action || pick(FOMO_ACTIONS);

    textEl.innerHTML = `<strong>${name}</strong> from <strong>${location}</strong> ${action}`;
    timeEl.textContent = data.timeLabel || 'Just now';

    fomo.classList.add('is-active');

    setTimeout(() => {
      fomo.classList.remove('is-active');
    }, 5200);
  }

  async function checkServerOnce() {
    try {
      const res = await fetch('/api/fomo', { cache: 'no-store' });
      if (!res.ok) throw new Error('bad_status');
      const data = await res.json();

      if (!data || !data.id) throw new Error('no_payload');

      // Ignore events older than 1 hour
      const diff = (Date.now() - Number(data.timestamp || 0)) / 1000;
      if (diff > 3600) throw new Error('stale');

      usingFallback = false;

      showEvent({
        id: data.id,
        name: data.name,
        location: data.location,
        action: data.action,
        timeLabel: 'Just now'
      });

      return true;
    } catch (_) {
      // In local previews like Live Server (127.0.0.1:5500), /api/fomo doesn't exist.
      // We'll gracefully switch to fallback mock activity.
      usingFallback = true;
      return false;
    }
  }

  function scheduleFallback() {
    if (!usingFallback) return;

    // "Occasional": every ~12–20s show a new mock event (looks alive but not spammy)
    const delay = 12000 + Math.floor(Math.random() * 8000);

    setTimeout(() => {
      if (!usingFallback) return;
      showEvent({ timeLabel: timeAgoLabel() });
      scheduleFallback();
    }, delay);
  }

  // Start: try server immediately, then poll every 5s.
  (async () => {
    const ok = await checkServerOnce();
    if (!ok) scheduleFallback();
    setInterval(checkServerOnce, 5000);
  })();
})();
