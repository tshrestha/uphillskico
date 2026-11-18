// Trail map grid behaviour shared by the trail maps index and resort map pages.
// The cards are prerendered (src/components/MapCard.astro); this only adds
// theme handling, the cursor-lit hero and the zoomable viewer.

import { initTheme, toggleTheme, setupThemeListener } from "./utils.js";

/**
 * Theme setup and the cursor-lit topo hero common to every map page
 */
export function initMapPage() {
  initTheme();
  setupThemeListener();
  document.getElementById("themeToggle").addEventListener("click", toggleTheme);

  const hero = document.querySelector(".maps-hero");
  if (hero && window.matchMedia("(pointer: fine)").matches) {
    let frame = null;
    hero.addEventListener("pointermove", (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        hero.style.setProperty("--my", `${e.clientY - rect.top}px`);
      });
    });
    hero.addEventListener("pointerleave", () => {
      hero.style.removeProperty("--mx");
      hero.style.removeProperty("--my");
    });
  }
}

/**
 * Viewer entry for a prerendered map card
 * @param {HTMLAnchorElement} card - A .map-card
 * @returns {{ name: string, rank?: number, src: string, thumb: string }}
 */
export function cardToMap(card) {
  return {
    name: card.querySelector(".map-name").textContent,
    rank: Number(card.dataset.rank) || undefined,
    src: card.getAttribute("href"),
    thumb: card.querySelector("img").getAttribute("src"),
  };
}

/**
 * Open grid cards in the zoomable viewer, paging through the visible cards
 * @param {HTMLElement} grid - Grid container
 */
export function bindMapGrid(grid) {
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".map-card");
    if (
      !card ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }
    e.preventDefault();
    const cards = [...grid.querySelectorAll(".map-card:not([hidden])")];
    import("./viewer.js")
      .then(({ openViewer }) =>
        openViewer(cards.map(cardToMap), cards.indexOf(card), card),
      )
      .catch(() => window.open(card.href, "_blank", "noopener"));
  });
}
