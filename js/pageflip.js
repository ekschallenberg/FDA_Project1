// Tilts each finding "page" around its top edge based on scroll position,
// so sections rotate away as you scroll past them and settle flat as they
// reach the middle of the viewport — like flipping through a book.
// Purely cosmetic: skipped entirely for prefers-reduced-motion.

(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const pages = Array.from(document.querySelectorAll("main .finding"));
  if (pages.length === 0) return;

  const MAX_ROTATE_DEG = 20;
  const MAX_LIFT_PX = 16;
  const MIN_OPACITY = 0.3;

  let ticking = false;

  function apply() {
    const vh = window.innerHeight;
    for (const el of pages) {
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      let t = (vh / 2 - mid) / (vh / 2); // -1 (below fold) .. 0 (centered) .. 1 (scrolled past)
      t = Math.max(-1, Math.min(1, t));

      const rotate = -t * MAX_ROTATE_DEG;
      const lift = t * -MAX_LIFT_PX;
      const opacity = Math.max(MIN_OPACITY, 1 - Math.abs(t) * 0.65);

      el.style.transform = `translateY(${lift.toFixed(1)}px) rotateX(${rotate.toFixed(2)}deg)`;
      el.style.opacity = opacity.toFixed(2);
    }
    ticking = false;
  }

  function onScrollOrResize() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(apply);
    }
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  apply();
})();
