import "./src/styles/site.css";
import "./src/styles/home.css";
import resorts from "./resorts.json";
import {
  initTheme,
  toggleTheme,
  setupThemeListener,
  debounce,
  createAutocomplete,
} from "./src/utils.js";
import { escapeHtml, getPassLabel, getRankBadge } from "./src/shared.js";
import { initHero } from "./src/hero.js";
import { initSegmented, bindTrailMapViewer } from "./src/ui.js";

// Initialize theme
initTheme();
setupThemeListener();

// Theme toggle button
document.getElementById("themeToggle").addEventListener("click", toggleTheme);

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// DOM elements
const list = document.getElementById("resortList");
const tickets = [...list.querySelectorAll(".ticket")];
const countEl = document.getElementById("resortCount");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const segments = [...document.querySelectorAll(".seg")].map(initSegmented);

const slugOf = (ticket) => ticket.id.replace("resort-", "");

// Jump from the mountain range to a resort's ticket
function jumpToResort(slug) {
  const ticket = document.getElementById(`resort-${slug}`);
  if (!ticket || ticket.hidden) return;
  ticket.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "center",
  });
  const article = ticket.querySelector(".ticket-body");
  article.setAttribute("tabindex", "-1");
  article.focus({ preventScroll: true });
  ticket.classList.remove("is-flash");
  void ticket.offsetWidth;
  ticket.classList.add("is-flash");
}

const hero = initHero({ onJump: jumpToResort });

// Value of a radio group, with "all" meaning no filter
function radioValue(name) {
  const value = document.querySelector(`input[name="${name}"]:checked`)?.value;
  return !value || value === "all" ? "" : value;
}

// Read the current filter state
function getFilters() {
  return {
    search: searchInput.value.trim().toLowerCase(),
    pass: radioValue("pass"),
    access: radioValue("access"),
  };
}

function matches(ticket, { search, pass, access }) {
  return (
    ticket.dataset.name.includes(search) &&
    (!pass || ticket.dataset.pass === pass) &&
    (!access || ticket.dataset.access === access)
  );
}

// Show how many resorts each option would leave, given the other filters
function updateOptionCounts(filters) {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const [key, value] = el.dataset.count.split(":");
    const count = tickets.filter((t) =>
      matches(t, { ...filters, [key]: value }),
    ).length;
    el.textContent = count;
    el.closest("label")?.classList.toggle("is-empty", count === 0);
  });
  segments.forEach((seg) => seg.place(true));
}

// Handle filtering
function handleFilter({ animate = false } = {}) {
  const filters = getFilters();
  const visible = tickets.filter((t) => matches(t, filters));
  const active = filters.search || filters.pass || filters.access;

  const update = () => {
    tickets.forEach((t) => {
      t.hidden = !visible.includes(t);
    });
    emptyState.hidden = visible.length > 0;
  };

  if (animate && document.startViewTransition && !reduceMotion) {
    document.startViewTransition(update);
  } else {
    update();
  }

  countEl.textContent = `${visible.length} of ${tickets.length} resorts`;
  updateOptionCounts(filters);
  hero.setVisible(active ? new Set(visible.map(slugOf)) : null);
}

// Debounced filter for search input
const debouncedFilter = debounce(() => handleFilter(), 150);

// Autocomplete setup
const autocompleteList = document.getElementById("autocomplete-list");

const autocomplete = createAutocomplete(searchInput, autocompleteList, {
  getData: (query) =>
    resorts.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())),
  renderItem: (resort, idx) => `
    <li class="ac-item" role="option" id="autocomplete-option-${idx}" data-index="${idx}" data-name="${escapeHtml(resort.name)}">
      ${getRankBadge(resort.uphillPolicy?.rank)}
      <span class="ac-name">${escapeHtml(resort.name)}</span>
      <span class="ac-meta">${getPassLabel(resort.pass)}</span>
    </li>
  `,
  onSelect: () => handleFilter({ animate: true }),
  emptyMessage: "No resorts found",
});

// Event listeners
searchInput.addEventListener("input", (e) => {
  autocomplete.show(e.target.value);
  debouncedFilter();
});

document
  .querySelectorAll('input[name="pass"], input[name="access"]')
  .forEach((input) =>
    input.addEventListener("change", () => handleFilter({ animate: true })),
  );

document.getElementById("resetFilters").addEventListener("click", () => {
  searchInput.value = "";
  document.getElementById("pass-all").checked = true;
  document.getElementById("access-all").checked = true;
  handleFilter({ animate: true });
  segments.forEach((seg) => seg.place());
  searchInput.focus();
});

// Headlamp glow that follows the cursor across a ticket
if (window.matchMedia("(hover: hover)").matches) {
  let frame = null;
  list.addEventListener("pointermove", (e) => {
    const card = e.target.closest(".ticket-card");
    if (!card || frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--gx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--gy", `${e.clientY - rect.top}px`);
    });
  });
  list.addEventListener("pointerout", (e) => {
    const card = e.target.closest(".ticket-card");
    if (card && !card.contains(e.relatedTarget)) {
      card.style.removeProperty("--gx");
      card.style.removeProperty("--gy");
    }
  });
}

// Open trail maps in the in-page viewer
bindTrailMapViewer();

// Log performance timing in development
if (import.meta.env?.DEV) {
  console.log(`Hydrated ${resorts.length} resorts (static HTML)`);
}
