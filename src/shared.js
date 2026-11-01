// Shared utilities for Uphill Ski Colorado
// Used by both browser (main.js) and build script (generate-static.js)

/**
 * Escape text for safe use in HTML content and attributes
 * @param {unknown} value - Value to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Extract hostname from URL, removing www. prefix
 * @param {string} url - The URL to extract hostname from
 * @returns {string} The hostname without www. prefix
 */
export function getHostname(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    if (
      typeof process === "undefined" ||
      process.env?.NODE_ENV !== "production"
    ) {
      console.warn(`Invalid URL: ${url}`);
    }
    return url;
  }
}

/**
 * Turn a resort name into a URL/id friendly slug
 * @param {string} name - Resort name
 * @returns {string} Slug, e.g. "Winter Park" -> "winter-park"
 */
export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Rank tier used for colouring: 1 = top 5, 2 = 6-10, 3 = 11-15, 4 = the rest
 * @param {number|undefined} rank - The resort rank (1-24)
 * @returns {number} Tier number
 */
export function getRankTier(rank) {
  if (!rank) return 4;
  if (rank <= 5) return 1;
  if (rank <= 10) return 2;
  if (rank <= 15) return 3;
  return 4;
}

/**
 * Generate a compact rank chip (used in autocomplete and trail map cards)
 * @param {number|undefined} rank - The resort rank (1-24)
 * @returns {string} HTML string for the rank chip
 */
export function getRankBadge(rank) {
  if (!rank) return "";
  return `<span class="rank-chip t${getRankTier(rank)}" title="Uphill policy rank #${rank}">${rank}</span>`;
}

const PASS_LABELS = {
  Epic: { short: "Epic", long: "Epic Pass" },
  Ikon: { short: "Ikon", long: "Ikon Pass" },
};

/**
 * Human label for a pass type
 * @param {string} pass - Epic, Ikon or independent
 * @param {boolean} long - Use the long form ("Epic Pass", "Independent")
 * @returns {string} Label
 */
export function getPassLabel(pass, long = false) {
  const label = PASS_LABELS[pass];
  if (label) return long ? label.long : label.short;
  return long ? "Independent" : "Indie";
}

/**
 * Generate pass tag HTML
 * @param {string} pass - The pass type (Epic, Ikon, or independent)
 * @returns {string} HTML string for the pass tag
 */
export function getPassBadge(pass) {
  const key = PASS_LABELS[pass] ? pass.toLowerCase() : "indie";
  return `<span class="pass pass-${key}" title="${getPassLabel(pass, true)}">${getPassLabel(pass)}</span>`;
}

/**
 * Generate an inline icon referencing the page's SVG sprite
 * @param {string} name - Symbol id without the "i-" prefix
 * @returns {string} HTML string for the icon
 */
export function icon(name) {
  return `<svg class="i" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

/**
 * Generate access status HTML (allowed during lift operations or not)
 * @param {boolean|undefined} hasAccess - Whether uphill access is allowed during operational hours
 * @returns {string} HTML string for the access status
 */
export function getAccessBadge(hasAccess) {
  if (hasAccess === true) {
    return `<p class="access is-yes">${icon("sun")}Open during lift ops</p>`;
  } else if (hasAccess === false) {
    return `<p class="access is-no">${icon("moon")}Closed during lift ops</p>`;
  }
  return `<p class="access is-unknown">${icon("info")}Lift-ops access unknown</p>`;
}

// The season this guide covers. A resort's `season` records which season its
// official source covers; resorts without one have an undated policy page.
export const CURRENT_SEASON = "2026-27";

/**
 * Generate the season stamp: confirmed for this season, or the last season
 * the resort's official information covered
 * @param {string|undefined} season - Season of the source, e.g. "2025-26"
 * @returns {string} HTML string for the stamp (empty for undated policies)
 */
export function getSeasonStamp(season) {
  if (!season) return "";
  const label = season.replace("-", "–");
  if (season === CURRENT_SEASON) {
    return `<p class="season is-current">${icon("check")}${label} policy</p>`;
  }
  return `<p class="season is-stale">${icon("info")}Last confirmed ${label}</p>`;
}

// Small deterministic PRNG so generated art is identical on every build
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/**
 * Generate a decorative lift-ticket barcode unique to a resort
 * @param {string} seed - Text used to derive the bar pattern
 * @returns {string} HTML string for the barcode SVG
 */
export function getBarcode(seed) {
  const rand = mulberry32(hashString(seed));
  const width = 56;
  const height = 16;
  let x = 0;
  let d = "";
  while (x < width) {
    const bar = [1, 1.5, 2.5][Math.floor(rand() * 3)];
    if (x + bar > width) break;
    d += `M${+x.toFixed(2)} 0h${bar}v${height}h-${bar}z`;
    x += bar + [1, 1.5, 2][Math.floor(rand() * 3)];
  }
  return `<svg class="barcode" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
}

/**
 * Generate lift-ticket HTML for a resort
 * @param {object} resort - Resort object from resorts.json
 * @returns {string} HTML string for the resort ticket
 */
export function generateTicket(resort) {
  const policy = resort.uphillPolicy ?? {};
  const slug = slugify(resort.name);
  const name = escapeHtml(resort.name);
  const rank = policy.rank;

  const actions = [
    policy.link
      ? `<a class="btn btn-solid" href="${escapeHtml(policy.link)}" target="_blank" rel="noopener noreferrer" aria-label="${name} uphill policy (opens in a new tab)">Uphill policy${icon("arrow-up-right")}</a>`
      : "",
    policy.trailMap
      ? `<a class="btn btn-line" href="${escapeHtml(policy.trailMap)}" target="_blank" rel="noopener noreferrer" data-trailmap aria-label="${name} trail map">${icon("map")}Trail map</a>`
      : "",
  ].join("");

  return `
      <li class="ticket t${getRankTier(rank)}" id="resort-${slug}" data-name="${escapeHtml(resort.name.toLowerCase())}" data-pass="${escapeHtml(resort.pass)}" data-access="${policy.operationalHoursAccess}" data-rank="${rank ?? ""}" style="view-transition-name:t-${slug}">
        <div class="ticket-card">
          <div class="ticket-stub" aria-hidden="true">
            <span class="stub-label">Rank</span>
            <span class="stub-rank">${rank ?? "–"}</span>
            ${getBarcode(resort.name)}
          </div>
          <article class="ticket-body" aria-labelledby="name-${slug}">
            <header class="ticket-head">
              <h3 class="ticket-name" id="name-${slug}">${rank ? `<span class="visually-hidden">#${rank} </span>` : ""}${name}</h3>
              <a class="ticket-site" href="${escapeHtml(resort.website)}" target="_blank" rel="noopener noreferrer">${escapeHtml(getHostname(resort.website))}</a>
              ${getPassBadge(resort.pass)}
            </header>
            <div class="ticket-status">
              ${getAccessBadge(policy.operationalHoursAccess)}${getSeasonStamp(policy.season)}
            </div>
            <dl class="facts">
              <div class="fact"><dt>${icon("clock")}Schedule</dt><dd>${escapeHtml(policy.schedule || "–")}</dd></div>
              <div class="fact"><dt>${icon("tag")}Cost</dt><dd>${escapeHtml(policy.cost || "–")}</dd></div>
            </dl>${policy.note ? `\n            <p class="ticket-note">${icon("info")}${escapeHtml(policy.note)}</p>` : ""}
            <div class="ticket-actions">${actions}</div>
          </article>
        </div>
      </li>`;
}

/* --------------------------------------------------------------------------
   The Range: every resort drawn as a mountain, taller = better uphill access
   -------------------------------------------------------------------------- */

export const RIDGE_WIDTH = 1000;
export const RIDGE_HEIGHT = 420;

// Resorts ordered west to east (approximate longitude) so the range reads like
// the real Colorado Rockies. Resorts missing from this list are appended.
const WEST_TO_EAST = [
  "Powderhorn",
  "Telluride",
  "Purgatory",
  "Silverton Mountain",
  "Kendall Mountain",
  "Sunlight Mountain Resort",
  "Crested Butte",
  "Aspen Snowmass",
  "Howelsen Hill",
  "Steamboat",
  "Wolf Creek",
  "Beaver Creek",
  "Vail",
  "Monarch Mountain",
  "Ski Cooper",
  "Copper Mountain",
  "Breckenridge",
  "Keystone",
  "Granby Ranch",
  "Loveland",
  "Arapahoe Basin",
  "Winter Park",
  "Eldora Mountain Resort",
  "Echo Mountain",
];

const round = (n) => Math.round(n * 10) / 10;
// Closed path using relative steps, which keeps the inline SVG compact.
// Steps are taken between rounded points so the shape never drifts.
const toPath = (points) => {
  let d = "";
  let prev = null;
  for (const [x, y] of points) {
    const p = [round(x), round(y)];
    if (!prev) {
      d = `M${p[0]} ${p[1]}l`;
    } else {
      for (const n of [round(p[0] - prev[0]), round(p[1] - prev[1])]) {
        const text = String(n);
        d += d.endsWith("l") || text.startsWith("-") ? text : ` ${text}`;
      }
    }
    prev = p;
  }
  return `${d}z`;
};

// Find where a top-to-bottom polyline crosses a given y
function crossAt(polyline, y) {
  for (let i = 1; i < polyline.length; i++) {
    const [x1, y1] = polyline[i - 1];
    const [x2, y2] = polyline[i];
    if (y >= y1 && y <= y2) {
      const t = y2 === y1 ? 0 : (y - y1) / (y2 - y1);
      return { index: i, point: [x1 + (x2 - x1) * t, y] };
    }
  }
  return { index: polyline.length - 1, point: polyline.at(-1) };
}

// Add small jags between ridgeline points so silhouettes read as rock, not paper
function roughen(line, rand, amount) {
  const out = [line[0]];
  for (let i = 1; i < line.length; i++) {
    const [x1, y1] = line[i - 1];
    const [x2, y2] = line[i];
    const len = Math.hypot(x2 - x1, y2 - y1);
    for (const t of [0.34, 0.68]) {
      out.push([
        x1 + (x2 - x1) * t + (rand() - 0.5) * len * amount,
        y1 + (y2 - y1) * t + (rand() - 0.5) * len * amount * 0.4,
      ]);
    }
    out.push(line[i]);
  }
  return out;
}

function buildMountain(cx, top, rand, detail) {
  const base = RIDGE_HEIGHT;
  const h = base - top;
  const w = h * 0.7 + 22;

  // Ridgelines from summit down to base, slightly concave for an alpine profile
  const slope = (dir) => {
    const pts = [[cx, top]];
    for (const f of [0.82, 0.6, 0.36]) {
      const spread = w * Math.pow(1 - f, 0.82);
      pts.push([
        cx + dir * spread + (rand() - 0.5) * w * 0.1,
        base - h * f + (rand() - 0.5) * h * 0.07,
      ]);
    }
    pts.push([cx + dir * w, base]);
    return pts;
  };
  const left = roughen(slope(-1), detail, 0.14);
  const right = roughen(slope(1), detail, 0.14);
  const ridgeX = (line, y) => crossAt(line, y).point[0];

  // Fall line dividing the sunlit face from the shaded face
  const fall = [
    [cx, top],
    [cx + w * 0.05 + (rand() - 0.5) * 6, top + h * 0.3],
    [cx + w * 0.14 + (rand() - 0.5) * 10, top + h * 0.62],
    [cx + w * 0.2, base],
  ];

  // Spurs radiating from the summit split each side into two facets,
  // giving the low-poly, lit-from-the-west 3D look
  const spur = (outer, mix, baseX) => {
    const pts = [[cx, top]];
    for (const f of [0.32, 0.64]) {
      const y = top + h * f + (rand() - 0.5) * h * 0.05;
      const xi = ridgeX(fall, y);
      pts.push([xi + (ridgeX(outer, y) - xi) * mix, y]);
    }
    pts.push([baseX, base]);
    return pts;
  };
  const spurLeft = spur(left, 0.48, cx - w * 0.5);
  const spurRight = spur(right, 0.52, cx + w * 0.62);

  const outline = [...left.slice(1).reverse(), ...right];
  const facets = [
    [...spurLeft, ...fall.slice(1).reverse()],
    [...fall, ...spurRight.slice(1).reverse()],
    [...spurRight, ...right.slice(1).reverse()],
  ];

  // Snowcap with a ragged lower edge
  const depth = h * (0.3 + rand() * 0.1);
  const l = crossAt(left, top + depth);
  const r = crossAt(right, top + depth * (0.82 + rand() * 0.1));
  const teethPoints = [];
  const teeth = 5;
  for (let i = 1; i < teeth; i++) {
    const t = i / teeth;
    const x = l.point[0] + (r.point[0] - l.point[0]) * t;
    const y = l.point[1] + (r.point[1] - l.point[1]) * t;
    const drop = (i % 2 ? 1 : -0.55) * depth * (0.14 + rand() * 0.2);
    teethPoints.push([x, y + drop]);
  }
  // Smaller nicks between the big teeth
  const edge = [];
  [l.point, ...teethPoints, r.point].forEach((p, i, all) => {
    if (i > 0) {
      const [x1, y1] = all[i - 1];
      const [x2, y2] = p;
      edge.push([
        (x1 + x2) / 2 + (detail() - 0.5) * 3,
        (y1 + y2) / 2 + (detail() - 0.3) * depth * 0.16,
      ]);
    }
    if (i > 0 && i < all.length - 1) edge.push(p);
  });
  const cap = [
    ...left.slice(0, l.index),
    l.point,
    ...edge,
    r.point,
    ...right.slice(1, r.index).reverse(),
  ];

  // Snow-filled gullies running down from the cap
  const gully = ([x, y], len, lean, width) =>
    `M${round(x - width)} ${round(y - 3)}L${round(x + width * 0.85)} ${round(y - 3)}L${round(x + lean)} ${round(y + len)}Z`;
  const streaks = [teethPoints[0], teethPoints[2]]
    .map((p) => gully(p, h * (0.1 + rand() * 0.08), (rand() - 0.3) * 6, 2.6))
    .concat(
      [teethPoints[1], teethPoints[3]].map((p) =>
        gully(p, h * (0.05 + detail() * 0.07), (detail() - 0.5) * 5, 1.6),
      ),
    )
    .join("");

  // Rock ribs: tapered strips of exposed rock running down the middle of
  // each face, starting inside the snowcap and fading out mid-slope
  const faces = [
    [left, spurLeft],
    [spurLeft, fall],
    [fall, spurRight],
    [spurRight, right],
  ];
  const rocks = [];
  for (const [lineA, lineB] of faces) {
    if (detail() < 0.3) continue;
    const mix = 0.35 + detail() * 0.3;
    const y0 = top + depth * (0.55 + detail() * 0.35);
    const y1 = Math.min(base - 30, top + h * (0.48 + detail() * 0.22));
    const thickness = 1.6 + h * (0.012 + detail() * 0.014);
    const centerAt = (y) => {
      const xa = ridgeX(lineA, y);
      return xa + (ridgeX(lineB, y) - xa) * mix;
    };
    // A rib, sometimes broken into two outcrops by a snow band
    const split = detail() < 0.4 ? 0.35 + detail() * 0.3 : null;
    const pieces = split
      ? [
          [0, split - 0.06],
          [split + 0.06, 1],
        ]
      : [[0, 1]];
    for (const [t0, t1] of pieces) {
      const sideA = [];
      const sideB = [];
      const steps = 6;
      for (let k = 0; k <= steps; k++) {
        const t = t0 + ((t1 - t0) * k) / steps;
        const y = y0 + (y1 - y0) * t;
        const x = centerAt(y) + (detail() - 0.5) * thickness * 0.5;
        const half = thickness * (1 - t * 0.85) * (0.55 + detail() * 0.75);
        sideA.push([x - half, y]);
        sideB.push([
          x + half * (0.6 + detail() * 0.7),
          y + (detail() - 0.5) * 3,
        ]);
      }
      const yTop = y0 + (y1 - y0) * t0;
      rocks.push(
        toPath([
          [
            centerAt(yTop) + thickness * 0.2,
            yTop - thickness * (t0 ? 0.6 : 1.6),
          ],
          ...sideB,
          ...sideA.reverse(),
        ]),
      );
    }
  }

  // A sparse band of spruce on the lower flanks
  // (tall peaks sit at the back, where their lower slopes are hidden anyway)
  const trees = [];
  const groves = h > 250 ? 0 : 2 + Math.floor(detail() * 3);
  for (let g = 0; g < groves; g++) {
    const y0 = top + h * (0.6 + detail() * 0.3);
    if (y0 > base - 46) continue;
    const xl = ridgeX(left, y0);
    const xr = ridgeX(right, y0);
    const x0 = xl + (xr - xl) * (0.12 + detail() * 0.76);
    const count = 4 + Math.floor(detail() * 8);
    for (let t = 0; t < count; t++) {
      const x = x0 + (detail() - 0.5) * w * 0.24;
      const y = y0 + (detail() - 0.5) * h * 0.09;
      const s = 1.8 + detail() * 1.6;
      trees.push(
        `M${round(x)} ${round(y - s * 3)}l${round(s * 0.8)} ${round(s * 1.5)}h${round(-s * 0.35)}l${round(s * 0.75)} ${round(s * 1.5)}h${round(-s * 2.4)}l${round(s * 0.75)} ${round(-s * 1.5)}h${round(-s * 0.35)}Z`,
      );
    }
  }

  // Highlight where the sun catches the western ridgeline
  const rim = left.filter(([, y]) => y <= top + h * 0.5);

  return {
    outline,
    facets,
    cap,
    streaks,
    rocks: rocks.join(""),
    trees: trees.join(""),
    rim,
    halfWidth: w,
    height: h,
  };
}

/**
 * Switchbacking skin track up a mountain's sunlit face: gently climbing
 * traverses joined by tight kick turns, narrowing towards the summit.
 * Returned as a dense polyline so the browser can draw it progressively.
 */
function buildSkinTrack(cx, top, h, w) {
  const bottom = Math.min(top + h * 0.66, RIDGE_HEIGHT - 104);
  const legs = 7;
  const pitch = (bottom - top - 18) / legs;
  const span = (y) => Math.min(50, w * 0.36 * Math.pow((y - top) / h, 0.85));
  const center = (y) => cx - span(y) * 0.2;
  const points = [];

  let dir = 1;
  let y = bottom;
  let x = center(y) - span(y);
  points.push([x, y]);

  for (let i = 0; i < legs; i++) {
    // Traverse across the face, sagging slightly with the terrain
    const yEnd = y - pitch * 0.74;
    const xEnd = center(yEnd) + span(yEnd) * dir;
    const steps = 12;
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      points.push([
        x + (xEnd - x) * t,
        y + (yEnd - y) * t + Math.sin(t * Math.PI) * 1.4,
      ]);
    }
    // Kick turn: a tight hairpin bulging out past the end of the traverse
    const radius = (pitch * 0.26) / 2;
    for (let k = 1; k <= 7; k++) {
      const a = (k / 7) * Math.PI;
      points.push([
        xEnd + dir * Math.sin(a) * (radius + 2.2),
        yEnd - (1 - Math.cos(a)) * radius,
      ]);
    }
    x = xEnd;
    y = yEnd - radius * 2;
    dir = -dir;
  }

  // Final pitch up to the summit
  for (let k = 1; k <= 6; k++) {
    const t = k / 6;
    points.push([x + (cx - x) * t, y + (top + 1 - y) * t]);
  }

  return `M${points.map(([px, py]) => `${round(px)} ${round(py)}`).join("L")}`;
}

/**
 * Generate the interactive mountain range SVG: one peak per resort
 * @param {object[]} resorts - Resorts from resorts.json
 * @returns {string} HTML string for the range SVG
 */
export function generateRidge(resorts) {
  const order = (r) => {
    const i = WEST_TO_EAST.indexOf(r.name);
    return i === -1 ? WEST_TO_EAST.length : i;
  };
  const ordered = [...resorts].sort((a, b) => order(a) - order(b));
  const count = ordered.length;
  const padX = 34;
  const step = (RIDGE_WIDTH - padX * 2) / Math.max(count - 1, 1);
  const rand = mulberry32(20252026);

  const peaks = ordered.map((resort, i) => {
    const rank = resort.uphillPolicy?.rank ?? count;
    const strength = count > 1 ? (count - rank) / (count - 1) : 1;
    const top = RIDGE_HEIGHT - (96 + strength * 262);
    const cx = padX + i * step + (rand() - 0.5) * step * 0.3;
    const detail = mulberry32(hashString(resort.name) ^ 0x5eed);
    return {
      resort,
      rank,
      cx,
      top,
      shape: buildMountain(cx, top, rand, detail),
    };
  });

  // Painter's order: tallest at the back so every summit stays visible
  const drawOrder = [...peaks].sort((a, b) => a.top - b.top);
  const tallest = drawOrder[0];

  const groups = drawOrder
    .map((p, i) => {
      const r = p.resort;
      const { outline, facets, cap, streaks, rocks, trees, rim } = p.shape;
      const depth = (i / Math.max(count - 1, 1)).toFixed(2);
      const body = toPath(outline);
      const clip = `pc${i}`;
      const box = `x="${round(p.cx - p.shape.halfWidth)}" y="${round(p.top)}" width="${round(p.shape.halfWidth * 2)}" height="${round(p.shape.height)}"`;
      return `<g class="peak t${getRankTier(p.rank)}" data-slug="${slugify(r.name)}" data-name="${escapeHtml(r.name)}" data-rank="${p.rank}" data-pass="${escapeHtml(r.pass)}" data-access="${r.uphillPolicy?.operationalHoursAccess}" data-x="${round(p.cx)}" data-y="${round(p.top)}" style="--d:${depth}"><g class="peak-inner"><path class="peak-body" id="${clip}b" d="${body}"/><clipPath id="${clip}"><use href="#${clip}b"/></clipPath><g clip-path="url(#${clip})"><path class="peak-trees" d="${trees}"/><path class="peak-cap" d="${toPath(cap)}"/><path class="peak-rocks" d="${rocks}"/><path class="peak-streaks" d="${streaks}"/>${facets.map((facet, n) => `<path class="peak-facet f${n + 1}" d="${toPath(facet)}"/>`).join("")}<rect class="peak-texture" ${box}/><rect class="peak-volume" ${box}/></g><path class="peak-rim" d="M${rim.map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}"/></g></g>`;
    })
    .join("");

  const track = buildSkinTrack(
    tallest.cx,
    tallest.top,
    tallest.shape.height,
    tallest.shape.halfWidth,
  );

  return `<svg class="ridge-svg" viewBox="0 0 ${RIDGE_WIDTH} ${RIDGE_HEIGHT}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><linearGradient id="ridgeFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="fade-from"/><stop offset="1" class="fade-to"/></linearGradient><linearGradient id="peakVolume" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" class="volume-from"/><stop offset="1" class="volume-to"/></linearGradient><pattern id="peakTexture" patternUnits="userSpaceOnUse" width="220" height="220"><image href="/images/peak-texture.png" width="220" height="220" preserveAspectRatio="none"/></pattern><filter id="peakGlow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow class="glow-flood" dx="0" dy="-2" stdDeviation="9"/></filter></defs><g class="peaks">${groups}</g><rect class="ridge-fade" x="0" y="${RIDGE_HEIGHT - 120}" width="${RIDGE_WIDTH}" height="121" fill="url(#ridgeFade)"/></svg><svg class="trail-svg" viewBox="0 0 ${RIDGE_WIDTH} ${RIDGE_HEIGHT}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g class="trail" data-slug="${slugify(tallest.resort.name)}" data-cx="${round(tallest.cx)}" data-top="${round(tallest.top)}" data-w="${round(tallest.shape.halfWidth)}" data-h="${round(tallest.shape.height)}"><path class="trail-groove" d="${track}"/><path class="trail-line" d="${track}"/><path class="trail-descent" d=""/></g></svg>`;
}
