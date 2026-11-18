// Trail map viewer: a zoomable, pannable lightbox for trail maps.
// Loaded on demand the first time someone opens a map.

import viewerCssUrl from "./styles/viewer.css?url";
import { getRankBadge, icon } from "./shared.js";

// A map entry is { name, rank, src, thumb }: src is the full-size image and
// thumb a small preview, both resolved at build time and read from the page
// (data-maps on ticket links, the cards on trail map pages).

// Load the viewer's stylesheet with the viewer itself, not with the page:
// the module only finishes importing once its styles are ready, so the
// dialog never opens unstyled. (A plain CSS import would make Astro add a
// render-blocking <link> to every page that can open the viewer.)
await new Promise((resolve) => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = viewerCssUrl;
  link.onload = link.onerror = resolve;
  document.head.append(link);
});

const MIN_SCALE = 1;
const MAX_SCALE = 6;

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

let viewer = null;

function createViewer() {
  const dialog = document.createElement("dialog");
  dialog.className = "viewer";
  dialog.setAttribute("aria-labelledby", "viewerTitle");
  dialog.innerHTML = `
    <div class="viewer-bar">
      <div class="viewer-heading">
        <span class="viewer-rank"></span>
        <h2 id="viewerTitle"></h2>
        <span class="viewer-index"></span>
      </div>
      <div class="viewer-tools">
        <button type="button" class="viewer-btn" data-act="out" aria-label="Zoom out">${icon("minus")}</button>
        <button type="button" class="viewer-btn" data-act="in" aria-label="Zoom in">${icon("plus")}</button>
        <button type="button" class="viewer-btn" data-act="fit" aria-label="Fit map to screen">${icon("fit")}</button>
        <a class="viewer-btn viewer-full" target="_blank" rel="noopener noreferrer">${icon("arrow-up-right")}<span>Full size</span></a>
        <button type="button" class="viewer-btn viewer-close" data-act="close" aria-label="Close map viewer">${icon("close")}</button>
      </div>
    </div>
    <div class="viewer-stage">
      <img class="viewer-img" alt="" draggable="false" />
      <p class="viewer-loading" role="status"></p>
      <button type="button" class="viewer-nav prev" data-act="prev" aria-label="Previous map">${icon("chevron-left")}</button>
      <button type="button" class="viewer-nav next" data-act="next" aria-label="Next map">${icon("chevron-right")}</button>
    </div>
    <p class="viewer-hint">Scroll or pinch to zoom · drag to pan · double-click to zoom in</p>
  `;
  document.body.append(dialog);

  const $ = (sel) => dialog.querySelector(sel);
  const stage = $(".viewer-stage");
  const img = $(".viewer-img");
  const loading = $(".viewer-loading");

  const state = {
    maps: [],
    index: 0,
    scale: 1,
    x: 0,
    y: 0,
    opener: null,
    token: 0,
  };

  // ---- Transform helpers ----
  function clampPan() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    state.x = Math.min(0, Math.max(w - w * state.scale, state.x));
    state.y = Math.min(0, Math.max(h - h * state.scale, state.y));
  }

  function apply(animate = false) {
    clampPan();
    img.classList.toggle("is-animating", animate && !reduceMotion);
    img.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) scale(${state.scale})`;
    stage.classList.toggle("is-zoomed", state.scale > 1.01);
  }

  function zoomAt(nextScale, px, py, animate = false) {
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    const ratio = scale / state.scale;
    state.x = px - (px - state.x) * ratio;
    state.y = py - (py - state.y) * ratio;
    state.scale = scale;
    apply(animate);
  }

  const center = () => [stage.clientWidth / 2, stage.clientHeight / 2];

  function reset(animate = false) {
    state.scale = 1;
    state.x = 0;
    state.y = 0;
    apply(animate);
  }

  // ---- Loading a map ----
  function show(index) {
    const count = state.maps.length;
    state.index = (index + count) % count;
    const map = state.maps[state.index];
    const token = ++state.token;

    $("#viewerTitle").textContent = map.name;
    $(".viewer-rank").innerHTML = getRankBadge(map.rank);
    $(".viewer-index").textContent =
      count > 1 ? `${state.index + 1} / ${count}` : "";
    $(".viewer-full").href = map.src;
    $(".viewer-full").setAttribute(
      "aria-label",
      `Open full size ${map.name} trail map in a new tab`,
    );
    dialog.classList.toggle("is-gallery", count > 1);

    img.alt = `${map.name} trail map`;
    img.src = map.thumb;
    reset();

    loading.textContent = "Loading full-resolution map…";
    loading.hidden = false;
    const full = new Image();
    full.decoding = "async";
    full.onload = () => {
      if (token !== state.token) return;
      img.src = full.src;
      loading.hidden = true;
    };
    full.onerror = () => {
      if (token === state.token) loading.hidden = true;
    };
    full.src = map.src;

    // Warm up neighbouring thumbnails for quick paging
    if (count > 1) {
      [state.index + 1, state.index - 1].forEach((i) => {
        new Image().src = state.maps[(i + count) % count].thumb;
      });
    }
  }

  // ---- Controls ----
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) return dialog.close();
    const act = e.target.closest("[data-act]")?.dataset.act;
    const [cx, cy] = center();
    if (act === "close") dialog.close();
    if (act === "in") zoomAt(state.scale * 1.6, cx, cy, true);
    if (act === "out") zoomAt(state.scale / 1.6, cx, cy, true);
    if (act === "fit") reset(true);
    if (act === "prev") show(state.index - 1);
    if (act === "next") show(state.index + 1);
  });

  dialog.addEventListener("keydown", (e) => {
    const [cx, cy] = center();
    const keys = {
      "+": () => zoomAt(state.scale * 1.6, cx, cy, true),
      "=": () => zoomAt(state.scale * 1.6, cx, cy, true),
      "-": () => zoomAt(state.scale / 1.6, cx, cy, true),
      0: () => reset(true),
      ArrowLeft: () => state.maps.length > 1 && show(state.index - 1),
      ArrowRight: () => state.maps.length > 1 && show(state.index + 1),
    };
    if (keys[e.key] && !e.target.closest("input")) {
      e.preventDefault();
      keys[e.key]();
    }
  });

  stage.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
      zoomAt(state.scale * factor, e.clientX - rect.left, e.clientY - rect.top);
    },
    { passive: false },
  );

  stage.addEventListener("dblclick", (e) => {
    if (e.target.closest("button")) return;
    const rect = stage.getBoundingClientRect();
    if (state.scale > 1.01) reset(true);
    else zoomAt(2.6, e.clientX - rect.left, e.clientY - rect.top, true);
  });

  // Drag to pan, two fingers to pinch
  const pointers = new Map();
  let pinch = null;

  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale: state.scale,
      };
    }
    stage.classList.add("is-grabbing");
  });

  stage.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, next);

    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()];
      const rect = stage.getBoundingClientRect();
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(
        (pinch.scale * distance) / pinch.distance,
        (a.x + b.x) / 2 - rect.left,
        (a.y + b.y) / 2 - rect.top,
      );
    } else if (pointers.size === 1 && state.scale > 1) {
      state.x += next.x - prev.x;
      state.y += next.y - prev.y;
      apply();
    }
  });

  const release = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (!pointers.size) stage.classList.remove("is-grabbing");
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);

  window.addEventListener("resize", () => dialog.open && apply());

  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("viewer-open");
    state.token++;
    img.removeAttribute("src");
    state.opener?.focus?.({ preventScroll: true });
  });

  return {
    open(maps, index, opener) {
      state.maps = maps;
      state.opener = opener;
      document.documentElement.classList.add("viewer-open");
      dialog.showModal();
      show(index);
      $(".viewer-close").focus();
    },
  };
}

/**
 * Open the viewer with a list of maps
 * @param {{ name: string, rank?: number, src: string, thumb: string }[]} maps
 * @param {number} index - Map to show first
 * @param {HTMLElement} [opener] - Element to return focus to on close
 */
export function openViewer(maps, index = 0, opener = null) {
  if (!maps.length) return;
  viewer ??= createViewer();
  viewer.open(maps, index, opener);
}

/**
 * Open the viewer for a resort's trail map link. The link lists the resort's
 * maps in data-maps (JSON) and the one it points at in data-map-index.
 * @param {HTMLAnchorElement} link - A ticket's a[data-trailmap]
 */
export function openTrailMap(link) {
  let maps;
  try {
    maps = JSON.parse(link.dataset.maps ?? "[]");
  } catch {
    maps = [];
  }
  if (maps.length) {
    openViewer(maps, Number(link.dataset.mapIndex) || 0, link);
  } else {
    window.open(link.href, "_blank", "noopener");
  }
}
