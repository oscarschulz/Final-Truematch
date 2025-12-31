// public/fomo.js
(function startFomo() {
  const fomo = document.getElementById('tm-fomo');
  if (!fomo) return;

  const textEl = fomo.querySelector('.fomo-text');
  const timeEl = fomo.querySelector('.fomo-time');
  
  let lastId = null;

  async function checkServer() {
    try {
      // Tatawag sa server every 5 seconds
      const res = await fetch('/api/fomo');
      const data = await res.json();

      if (!data || !data.id) return;
      if (data.id === lastId) return; // Kung parehas lang sa dati, wag ipakita

      // Kung luma na (sobra 1 oras), wag ipakita
      const diff = (Date.now() - data.timestamp) / 1000;
      if (diff > 3600) return;

      lastId = data.id;
      textEl.innerHTML = `<strong>${data.name}</strong> from <strong>${data.location}</strong> ${data.action}`;
      timeEl.textContent = "Just now";

      fomo.classList.add('is-active');
      
      setTimeout(() => { 
        fomo.classList.remove('is-active'); 
      }, 5000);

    } catch (e) {
      // ignore errors
    }
  }

  // Polling: Every 5 seconds
  setInterval(checkServer, 5000);
})();