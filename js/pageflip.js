// Side-view page-turn effect for the report page. Each finding section
// stays flat and fully readable near the center of the viewport. As it
// scrolls toward the top edge (or in from the bottom), it's replaced by a
// stack of thin "paper" strips that bend progressively from the top (hinge)
// edge downward — like a page curling over as you flip through a book,
// viewed from its long side. Bend amount is driven directly by scroll
// position (not by an independent timer), so flip speed always matches
// scroll speed. Disabled entirely under prefers-reduced-motion.

(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const sections = Array.from(document.querySelectorAll("main .finding"));
  if (sections.length === 0) return;

  const STRIP_COUNT = 24;
  const STAGGER = 0.45; // how much the far (bottom) edge lags the hinge (top) edge
  const MAX_ROTATE_DEG = 85; // stops short of edge-on so strips never collapse to slivers
  const PLATEAU = 0.4; // |t| within which a section stays flat/live and fully readable
  const CROSSFADE_SPAN = 0.12; // fraction of remaining turn-progress over which paper fades in

  const pages = sections.map(buildPage);

  function buildPage(section) {
    const content = document.createElement("div");
    content.className = "page-content";
    while (section.firstChild) content.appendChild(section.firstChild);

    const overlay = document.createElement("div");
    overlay.className = "flip-overlay";
    const strips = [];
    for (let i = 0; i < STRIP_COUNT; i++) {
      const strip = document.createElement("div");
      strip.className = "flip-strip";
      const shade = document.createElement("div");
      shade.className = "shade";
      const rim = document.createElement("div");
      rim.className = "rim";
      strip.appendChild(shade);
      strip.appendChild(rim);
      overlay.appendChild(strip);
      strips.push({ el: strip, shade, rim });
    }

    section.appendChild(content);
    section.appendChild(overlay);
    return { section, content, overlay, strips };
  }

  function smoothstep(edge0, edge1, x) {
    const v = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return v * v * (3 - 2 * v);
  }

  function apply() {
    const vh = window.innerHeight;
    for (const page of pages) {
      const rect = page.section.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      let t = (vh / 2 - mid) / (vh / 2);
      t = Math.max(-1, Math.min(1, t));
      const at = Math.abs(t);
      const sign = Math.sign(t) || 1;

      // p: 0 right at the dead zone edge, 1 at the peak of the scroll range —
      // both the crossfade and every strip's rotation are driven off this
      // same value, so "paper" never appears before the pages are actually
      // turning.
      const p = Math.max(0, Math.min(1, (at - PLATEAU) / (1 - PLATEAU)));

      const paperAmount = smoothstep(0, CROSSFADE_SPAN, p);
      page.content.style.opacity = (1 - paperAmount).toFixed(2);
      page.overlay.style.opacity = paperAmount.toFixed(2);

      if (paperAmount <= 0) continue;

      const stripH = rect.height / STRIP_COUNT;
      let cumulativeY = 0;

      for (let i = 0; i < STRIP_COUNT; i++) {
        const sFrac = i / (STRIP_COUNT - 1);
        const stagger = sFrac * STAGGER;
        const local = Math.max(0, Math.min(1, (p - stagger) / (1 - stagger)));
        const angleDeg = local * MAX_ROTATE_DEG * sign;
        const angleRad = (angleDeg * Math.PI) / 180;
        const lift = Math.abs(Math.sin(angleRad)) * 22;

        const { el, shade, rim } = page.strips[i];
        el.style.height = `${stripH.toFixed(2)}px`;
        el.style.top = `${cumulativeY.toFixed(2)}px`;
        el.style.transform = `rotateX(${angleDeg.toFixed(2)}deg) translateZ(${lift.toFixed(1)}px)`;
        shade.style.opacity = (local * local * 0.5).toFixed(2);
        const crest = Math.max(0, 1 - Math.abs(Math.abs(angleDeg) - 75) / 35);
        rim.style.opacity = (crest * 0.7).toFixed(2);

        cumulativeY += stripH * Math.abs(Math.cos(angleRad));
      }
    }
  }

  let ticking = false;
  function onScrollOrResize() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        apply();
        ticking = false;
      });
    }
  }

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  apply();
})();
