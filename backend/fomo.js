// public/fomo.js — REALTIME MODE (Connected to Backend)
(function startFomo() {
  const fomo = document.getElementById('tm-fomo');
  if (!fomo) return;

  const textEl = fomo.querySelector('.fomo-text');
  const timeEl = fomo.querySelector('.fomo-time');
  
  let lastId = null;

  // IMPORTANT: Ituro natin sa Backend Port (3000)
  // Ito ang magco-connect sa Frontend (5500) at Backend (3000)
  const API_URL = 'http://localhost:3000/api/fomo';

  async function checkServer() {
    try {
      const res = await fetch(API_URL);
      
      // Kung offline ang backend, wag mag-error, tahimik lang
      if (!res.ok) return;

      const data = await res.json();

      // Kung walang data o parehas lang sa huling pinakita, ignore.
      if (!data || !data.id) return;
      if (data.id === lastId) return;

      // Check kung luma na (sobra 1 oras ang nakalipas)
      // Para hindi lumabas yung mga sign up kahapon pa.
      const diff = (Date.now() - data.timestamp) / 1000;
      if (diff > 3600) return;

      // Update Local State
      lastId = data.id;

      // Update UI (Real User Data)
      textEl.innerHTML = `<strong>${data.name}</strong> from <strong>${data.location}</strong> just joined TrueMatch`;
      timeEl.textContent = "Just now";

      // Show Popup
      fomo.classList.add('is-active');
      
      // Hide after 5 seconds
      setTimeout(() => { 
        fomo.classList.remove('is-active'); 
      }, 5000);

    } catch (e) {
      // Backend might be offline, ignore.
    }
  }

  // Check every 5 seconds (Realtime Polling)
  setInterval(checkServer, 5000);
})();