// Trail map grid shared by the trail maps index and resort map pages

import "./styles/site.css";
import "./styles/maps.css";
import { initTheme, toggleTheme, setupThemeListener } from "./utils.js";
import { escapeHtml, getRankBadge, getRankTier, icon } from "./shared.js";
import { getMapSrc, getThumbSrc } from "./trailmaps-data.js";

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
 * Render trail map cards into the grid
 * @param {HTMLElement} grid - Grid container
 * @param {object[]} maps - Trail map entries to show
 */
export function renderMapCards(grid, maps) {
  grid.innerHTML = maps
    .map(
      (map, index) => `
      <a class="map-card t${getRankTier(map.rank)}" href="${getMapSrc(map)}" data-index="${index}" style="--n:${index}" aria-label="View ${escapeHtml(map.name)} trail map">
        <span class="map-thumb">
          <img src="${getThumbSrc(map)}" alt="" width="600" height="400" loading="${index < 8 ? "eager" : "lazy"}" decoding="async">
          <span class="map-zoom">${icon("plus")}</span>
        </span>
        <span class="map-info">
          ${getRankBadge(map.rank)}
          <span class="map-name">${escapeHtml(map.name)}</span>
          ${icon("arrow-up-right")}
        </span>
      </a>`,
    )
    .join("");
}

/**
 * Open grid cards in the zoomable viewer, paging through the visible maps
 * @param {HTMLElement} grid - Grid container
 * @param {() => object[]} getMaps - Returns the maps currently in the grid
 */
export function bindMapGrid(grid, getMaps) {
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
    import("./viewer.js")
      .then(({ openViewer }) =>
        openViewer(getMaps(), Number(card.dataset.index), card),
      )
      .catch(() => window.open(card.href, "_blank", "noopener"));
  });
}
