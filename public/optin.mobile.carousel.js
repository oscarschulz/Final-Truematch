/* =========================================================
   TrueMatch optin — mobile-only carousel buttons
   - Works only on optin.html (html.tm-home) and <= 768px
   - Expects markup:
       <div class="tm-carousel">
         <button class="tm-carousel__btn prev" ...></button>
         <div class="steps-wrapper|bento-grid"> ... slides ... </div>
         <button class="tm-carousel__btn next" ...></button>
       </div>
   ========================================================= */

(function () {
  try {
    var root = document.documentElement;
    if (!root || !root.classList.contains('tm-home')) return;

    var mq = window.matchMedia('(max-width: 768px)');
    if (!mq.matches) return;

    function setupCarousel(carouselEl) {
      var track = carouselEl.querySelector('.steps-wrapper, .bento-grid');
      if (!track) return;

      var prev = carouselEl.querySelector('.tm-carousel__btn.prev');
      var next = carouselEl.querySelector('.tm-carousel__btn.next');

      function slideWidth() {
        return track.clientWidth;
      }

      function clampButtons() {
        if (!prev || !next) return;
        var maxScroll = track.scrollWidth - track.clientWidth;
        var x = Math.round(track.scrollLeft);

        prev.disabled = x <= 1;
        next.disabled = x >= Math.round(maxScroll) - 1;
      }

      function scrollByDir(dir) {
        var w = slideWidth();
        track.scrollBy({ left: dir * w, top: 0, behavior: 'smooth' });
      }

      if (prev) prev.addEventListener('click', function () { scrollByDir(-1); });
      if (next) next.addEventListener('click', function () { scrollByDir( 1); });

      track.addEventListener('scroll', function () {
        window.requestAnimationFrame(clampButtons);
      }, { passive: true });

      window.addEventListener('resize', function () {
        window.requestAnimationFrame(clampButtons);
      });

      // initial
      clampButtons();
    }

    document.querySelectorAll('.tm-carousel').forEach(setupCarousel);
  } catch (e) {
    // no-op
  }
})();
