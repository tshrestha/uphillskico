// Hero interactions for Uphill Ski Colorado:
// the data-driven mountain range, the climbing skier, snowfall and parallax.

import { createSkier3D } from "./skier3d.js";
import {
  RIDGE_WIDTH,
  RIDGE_HEIGHT,
  getPassLabel,
  getRankTier,
  icon,
} from "./shared.js";

const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

const isDark = () =>
  document.documentElement.getAttribute("data-theme") === "dark";

// Mountain springs (lift is measured in range units, positive = up)
const STIFFNESS = 210;
const DAMPING = 15;
const LIFT_ACTIVE = 18;
const LIFT_RIPPLE = 8;
const RIPPLE_SPREAD = 75;
const LIFT_SINK = -16;

/**
 * Wire up the hero section
 * @param {object} options
 * @param {(slug: string) => void} options.onJump - Called when a peak is chosen
 * @returns {{ setVisible: (slugs: Set<string>|null) => void }}
 */
export function initHero({ onJump }) {
  const hero = document.querySelector(".hero");
  const ridge = document.getElementById("ridge");
  const svg = ridge?.querySelector(".ridge-svg");
  if (!hero || !ridge || !svg) return { setVisible() {} };

  const snow = initSnow(hero);

  // Spindrift blows off a summit when it's selected
  const puffAt = (range, peak) => {
    const [x, y] = range.toPx(...range.lifted(peak, [peak.x, peak.y], true));
    snow.burst(ridge.offsetLeft + x, ridge.offsetTop + y);
  };

  const range = createRange(ridge, svg, {
    onJump,
    onActivate: (peak) => puffAt(range, peak),
  });
  initSkier(ridge, range, {
    onSummit: (peak) => puffAt(range, peak),
    onSpray: (x, y) => snow.burst(ridge.offsetLeft + x, ridge.offsetTop + y, 9),
  });
  initAtmosphere(hero);
  return range;
}

/* --------------------------------------------------------------------------
   Range: hover / drag / arrow keys to explore, click or Enter to jump.
   Each mountain sits on a spring: the hovered one rises, its neighbours
   ripple with the cursor, and filtered-out peaks settle into the haze.
   -------------------------------------------------------------------------- */
function createRange(ridge, svg, { onJump, onActivate }) {
  const flag = document.getElementById("ridgeFlag");
  const card = document.getElementById("ridgeFlagLink");
  const rankEl = document.getElementById("ridgeFlagRank");
  const nameEl = document.getElementById("ridgeFlagName");
  const metaEl = document.getElementById("ridgeFlagMeta");
  const trail = ridge.querySelector(".trail");

  // West-to-east order, matching how the range is drawn
  const peaks = [...svg.querySelectorAll(".peak")]
    .map((el) => ({
      el,
      inner: el.querySelector(".peak-inner"),
      slug: el.dataset.slug,
      name: el.dataset.name,
      rank: Number(el.dataset.rank),
      pass: el.dataset.pass,
      access: el.dataset.access,
      x: Number(el.dataset.x),
      y: Number(el.dataset.y),
      h: RIDGE_HEIGHT - Number(el.dataset.y),
      lift: 0,
      velocity: 0,
      target: 0,
      followers: [],
      lastPuff: 0,
    }))
    .sort((a, b) => a.x - b.x);

  const bySlug = new Map(peaks.map((p) => [p.slug, p]));
  const byElement = new Map(peaks.map((p) => [p.el, p]));
  const trailPeak = trail && bySlug.get(trail.dataset.slug);
  trailPeak?.followers.push(trail);

  ridge.setAttribute("aria-valuemax", String(peaks.length));

  const docked = window.matchMedia(
    "(max-width: 640px), (max-aspect-ratio: 3/4)",
  );
  let size = { w: ridge.clientWidth, h: ridge.clientHeight };
  let active = null;
  let visible = null;
  let pointerX = null;
  let wasActiveOnPress = false;
  let lastPointerType = "mouse";

  const isVisible = (p) => !visible || visible.has(p.slug);
  const toPx = (x, y) => [
    (x / RIDGE_WIDTH) * size.w,
    (y / RIDGE_HEIGHT) * size.h,
  ];

  // A mountain grows from its base; scale a point on it by the current
  // (or target) lift so attached things like the flag and skier follow
  const scaleFor = (p, useTarget) => {
    const k = (useTarget ? p.target : p.lift) / p.h;
    return { sx: 1 + k * 0.3, sy: 1 + k };
  };
  const lifted = (p, [x, y], useTarget = false) => {
    const { sx, sy } = scaleFor(p, useTarget);
    return [p.x + (x - p.x) * sx, RIDGE_HEIGHT - (RIDGE_HEIGHT - y) * sy];
  };

  /* ---- Springs ---- */
  let frame = null;
  let last = 0;

  function applyTransform(p) {
    const { sx, sy } = scaleFor(p);
    const value = `translate(${p.x} ${RIDGE_HEIGHT}) scale(${sx.toFixed(4)} ${sy.toFixed(4)}) translate(${-p.x} ${-RIDGE_HEIGHT})`;
    p.inner.setAttribute("transform", value);
    p.followers.forEach((el) => el.setAttribute("transform", value));
  }

  function step(now) {
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;
    let moving = false;
    for (const p of peaks) {
      if (p.lift === p.target && p.velocity === 0) continue;
      const accel = STIFFNESS * (p.target - p.lift) - DAMPING * p.velocity;
      p.velocity += accel * dt;
      p.lift += p.velocity * dt;
      if (Math.abs(p.target - p.lift) < 0.02 && Math.abs(p.velocity) < 0.02) {
        p.lift = p.target;
        p.velocity = 0;
      } else {
        moving = true;
      }
      applyTransform(p);
    }
    frame = moving ? requestAnimationFrame(step) : null;
  }

  function updateTargets() {
    for (const p of peaks) {
      let target = 0;
      if (!isVisible(p)) {
        target = LIFT_SINK;
      } else {
        if (pointerX !== null && !reduceMotion) {
          target +=
            LIFT_RIPPLE * Math.exp(-(((p.x - pointerX) / RIPPLE_SPREAD) ** 2));
        }
        if (p === active) target += LIFT_ACTIVE;
      }
      p.target = target;
    }

    if (reduceMotion) {
      peaks.forEach((p) => {
        p.lift = p.target;
        applyTransform(p);
      });
    } else if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(step);
    }
    placeFlag();
  }

  /* ---- Summit flag ---- */
  function placeFlag() {
    if (!active) return;
    const [px, py] = toPx(...lifted(active, [active.x, active.y], true));
    flag.style.setProperty("--fx", `${px}px`);
    flag.style.setProperty("--fy", `${py}px`);

    flag.classList.toggle("is-docked", docked.matches);
    if (docked.matches) {
      // Phones: park the card at the foot of the range so it never covers the title
      card.style.setProperty("--shift", `${size.w / 2 - px}px`);
      card.style.setProperty("--lift", `${size.h - py + 18}px`);
      return;
    }

    // Keep the card inside the hero while the pole stays on the summit
    const half = card.offsetWidth / 2;
    const margin = 12;
    let shift = 0;
    if (px - half < margin) shift = margin - (px - half);
    else if (px + half > size.w - margin) shift = size.w - margin - (px + half);
    card.style.setProperty("--shift", `${shift}px`);
    card.style.setProperty("--lift", "0px");
  }

  // Icon and wording for whether uphill is allowed while the lifts run
  function accessInfo(access) {
    if (access === "true") return { icon: "sun", text: "Open during lift ops" };
    if (access === "false") {
      return { icon: "moon", text: "Closed during lift ops" };
    }
    return { icon: "info", text: "Lift-ops access unknown" };
  }

  function describe(p) {
    const access = accessInfo(p.access).text.toLowerCase();
    return `${p.name}, rank ${p.rank}, ${getPassLabel(p.pass, true)}, ${access}`;
  }

  function setActive(p, { pop = true } = {}) {
    if (!p || p === active) return;
    active?.el.classList.remove("is-active");
    active = p;
    p.el.classList.add("is-active");

    rankEl.textContent = p.rank;
    rankEl.className = `rank-chip t${getRankTier(p.rank)}`;
    nameEl.textContent = p.name;
    const access = accessInfo(p.access);
    metaEl.innerHTML = `${getPassLabel(p.pass)} · ${icon(access.icon)}${access.text}`;
    card.href = `#resort-${p.slug}`;
    card.setAttribute("aria-label", `Jump to ${p.name}`);

    // The #1 summit hosts the skier, so its flag flies a little higher
    flag.classList.toggle("is-tall", p === trailPeak);
    flag.hidden = false;
    updateTargets();
    if (pop && !reduceMotion) {
      card.classList.remove("pop");
      void card.offsetWidth;
      card.classList.add("pop");
    }

    const now = performance.now();
    if (!reduceMotion && now - p.lastPuff > 700) {
      p.lastPuff = now;
      onActivate(p);
    }

    ridge.setAttribute("aria-valuenow", String(peaks.indexOf(p) + 1));
    ridge.setAttribute("aria-valuetext", describe(p));
  }

  // The mountain drawn frontmost under the pointer, else the closest summit
  function pick(clientX, clientY) {
    const hit = byElement.get(
      document.elementFromPoint(clientX, clientY)?.closest?.(".peak"),
    );
    if (hit && isVisible(hit)) return hit;

    const rect = ridge.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best = null;
    let bestDistance = Infinity;
    for (const p of peaks) {
      if (!isVisible(p)) continue;
      const [px, py] = toPx(p.x, p.y);
      const d = Math.hypot(px - x, (py - y) * 0.35);
      if (d < bestDistance) {
        bestDistance = d;
        best = p;
      }
    }
    return best;
  }

  function trackPointer(clientX) {
    const rect = ridge.getBoundingClientRect();
    pointerX = ((clientX - rect.left) / rect.width) * RIDGE_WIDTH;
  }

  function releasePointer() {
    pointerX = null;
    updateTargets();
  }

  function stepBy(dir) {
    const list = peaks.filter(isVisible);
    if (!list.length) return;
    const i = list.indexOf(active);
    const next =
      i === -1
        ? list[0]
        : list[Math.max(0, Math.min(list.length - 1, i + dir))];
    setActive(next);
  }

  function jump() {
    if (active && isVisible(active)) onJump(active.slug);
  }

  ridge.addEventListener("pointermove", (e) => {
    if (e.target.closest(".flag-card")) return;
    if (e.pointerType === "mouse" || e.buttons) {
      trackPointer(e.clientX);
      const p = pick(e.clientX, e.clientY);
      if (p !== active) setActive(p);
      else updateTargets();
    }
  });

  ridge.addEventListener("pointerleave", releasePointer);
  ridge.addEventListener("pointercancel", releasePointer);
  ridge.addEventListener("pointerup", (e) => {
    if (e.pointerType !== "mouse") releasePointer();
  });

  ridge.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".flag-card")) return;
    lastPointerType = e.pointerType;
    const p = pick(e.clientX, e.clientY);
    wasActiveOnPress = p === active;
    setActive(p);
  });

  ridge.addEventListener("click", (e) => {
    if (e.target.closest(".flag-card")) return;
    // Mouse users jump straight away; touch users tap once to preview
    if (lastPointerType === "mouse" || wasActiveOnPress) jump();
  });

  card.addEventListener("click", (e) => {
    e.preventDefault();
    jump();
  });

  ridge.addEventListener("keydown", (e) => {
    const keys = {
      ArrowRight: () => stepBy(1),
      ArrowDown: () => stepBy(1),
      ArrowLeft: () => stepBy(-1),
      ArrowUp: () => stepBy(-1),
      Home: () => setActive(peaks.find(isVisible)),
      End: () => setActive(peaks.findLast(isVisible)),
      Enter: jump,
      " ": jump,
    };
    if (keys[e.key]) {
      e.preventDefault();
      keys[e.key]();
    }
  });

  docked.addEventListener("change", placeFlag);

  new ResizeObserver(() => {
    size = { w: ridge.clientWidth, h: ridge.clientHeight };
    placeFlag();
    ridge.dispatchEvent(new CustomEvent("ridgeresize"));
  }).observe(ridge);

  // Show the summit flag on #1 once the range has risen
  const best = () => peaks.filter(isVisible).sort((a, b) => a.rank - b.rank)[0];
  setTimeout(
    () => {
      if (!active) setActive(best());
    },
    reduceMotion ? 0 : 1500,
  );

  return {
    toPx,
    lifted,
    trailPeak,
    size: () => size,
    /**
     * Dim peaks that don't match the current filters
     * @param {Set<string>|null} slugs - Visible resort slugs, or null for all
     */
    setVisible(slugs) {
      visible = slugs;
      for (const p of peaks) p.el.classList.toggle("is-dim", !isVisible(p));
      ridge.classList.toggle("track-dim", !!trailPeak && !isVisible(trailPeak));
      if (active && !isVisible(active)) {
        const next = best();
        if (next) setActive(next);
        else {
          active.el.classList.remove("is-active");
          active = null;
          flag.hidden = true;
        }
      } else if (!active && slugs?.size) {
        setActive(best());
      }
      updateTargets();
    },
  };
}

/* --------------------------------------------------------------------------
   Skier: a low-poly 3D figure skins up the switchbacks to the #1 summit,
   celebrates, carves back down, then does it all again. The track is
   laid down on the first ascent.
   -------------------------------------------------------------------------- */
const CLIMB_MS = 13000;
const KICK_TURN_MS = 650;
const SUMMIT_MS = 1900;
const DESCENT_MS = 3400;
const REST_MS = 1500;
const START_DELAY_MS = 1700;
const FIGURE_RATIO = 3; // canvas size relative to the figure's height
const FIGURE_METRES = 1.75;

// Headings in degrees: 0 faces east, 90 faces into the scene, 270 faces you
const HEADING_EAST = 20;
const HEADING_WEST = 160;
const HEADING_VIEWER = 270;

function parsePoints(d) {
  const nums = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number);
  const points = [];
  for (let i = 0; i + 1 < nums.length; i += 2)
    points.push([nums[i], nums[i + 1]]);
  return points;
}

// Carving S-turns down the shaded east face, fading out into the valley mist
function buildDescent(cx, top, w, h) {
  const points = [];
  const steps = 70;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push([
      cx + t * w * 0.3 + Math.sin(t * Math.PI * 5) * (3 + 15 * t),
      top + 3 + t * h * 0.68,
    ]);
  }
  return points;
}

function initSkier(ridge, range, { onSummit, onSpray }) {
  const trail = ridge.querySelector(".trail");
  const canvas = document.getElementById("skier");
  const peak = range.trailPeak;
  const figure = canvas && createSkier3D(canvas);
  if (!trail || !figure || !peak) return;

  const groove = trail.querySelector(".trail-groove");
  const line = trail.querySelector(".trail-line");
  const descentPath = trail.querySelector(".trail-descent");
  const fullTrail = line.getAttribute("d");
  const climb = parsePoints(fullTrail);
  const { cx, top, w, h } = Object.fromEntries(
    ["cx", "top", "w", "h"].map((k) => [k, Number(trail.dataset[k])]),
  );
  const descent = buildDescent(cx, top, w, h);
  if (climb.length < 2) return;

  const figurePx = () => canvas.clientWidth / FIGURE_RATIO;

  // Distances measured in screen pixels so the pace feels right on any screen
  let climbLengths = [];
  let descentLengths = [];
  const measure = (points) => {
    const { w: pw, h: ph } = range.size();
    const kx = pw / RIDGE_WIDTH;
    const ky = ph / RIDGE_HEIGHT;
    const lengths = [0];
    for (let i = 1; i < points.length; i++) {
      const dx = (points[i][0] - points[i - 1][0]) * kx;
      const dy = (points[i][1] - points[i - 1][1]) * ky;
      lengths.push(lengths[i - 1] + Math.hypot(dx, dy));
    }
    return lengths;
  };
  const remeasure = () => {
    climbLengths = measure(climb);
    descentLengths = measure(descent);
  };
  remeasure();

  function sample(points, lengths, dist) {
    const d = Math.max(0, Math.min(lengths.at(-1), dist));
    let i = 1;
    while (i < lengths.length - 1 && lengths[i] < d) i++;
    const span = lengths[i] - lengths[i - 1] || 1;
    const t = (d - lengths[i - 1]) / span;
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    return { point: [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t], index: i };
  }

  function partialPath(points, lengths, dist) {
    const { point, index } = sample(points, lengths, dist);
    const drawn = [...points.slice(0, index), point];
    return `M${drawn.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L")}`;
  }

  // Put the figure on the path and read off the local direction of travel
  let face = 1;
  function place(points, lengths, dist) {
    const here = sample(points, lengths, dist).point;
    const [px, py] = range.toPx(...range.lifted(peak, here));
    canvas.style.setProperty("--sx", `${px}px`);
    canvas.style.setProperty("--sy", `${py}px`);

    const at = (d) => range.toPx(...sample(points, lengths, d).point);
    const [ax, ay] = at(dist - 9);
    const [bx, by] = at(dist + 9);
    const [mx] = at(dist);
    const dx = bx - ax;
    const dy = by - ay;
    let turned = false;
    if (Math.abs(dx) > 1.2) {
      const next = Math.sign(dx);
      turned = next !== face;
      face = next;
    }
    return {
      dx,
      dy,
      px,
      py,
      turned,
      bend: ax + bx - 2 * mx,
      slope: Math.max(
        -24,
        Math.min(24, (Math.atan2(-dy, Math.abs(dx)) * 180) / Math.PI),
      ),
    };
  }

  const heading = () => (face > 0 ? HEADING_EAST : HEADING_WEST);
  const metres = (px) => (px / figurePx()) * FIGURE_METRES;

  function render(dt, input) {
    figure.update(dt, input);
    figure.draw(figurePx());
  }

  const settle = (input) => {
    for (let i = 0; i < 90; i++) figure.update(16, input);
    figure.draw(figurePx(), { snap: true });
  };

  if (reduceMotion) {
    place(climb, climbLengths, climbLengths.at(-1));
    canvas.classList.add("is-on");
    const still = { mode: "summit", yaw: HEADING_VIEWER, slope: 0, travel: 0 };
    settle(still);
    ridge.addEventListener("ridgeresize", () => {
      figure.resize();
      figure.draw(figurePx(), { snap: true });
    });
    document.addEventListener("themechange", () => {
      figure.readColors();
      figure.draw(figurePx(), { snap: true });
    });
    return;
  }

  // Hide the track until the skier lays it down
  let firstAscent = true;
  groove.setAttribute("d", "M0 0");
  line.setAttribute("d", "M0 0");

  let phase = "wait";
  let elapsed = 0;
  let dist = 0;
  let hold = 0;
  let turnTo = HEADING_EAST;
  let lastDx = 0;

  function enter(next) {
    phase = next;
    elapsed = 0;
    if (next === "climb") {
      dist = 0;
      hold = 0;
      face = 1;
      descentPath.setAttribute("d", "");
      descentPath.classList.remove("is-fading");
      place(climb, climbLengths, 0);
      figure.reset(HEADING_EAST);
      canvas.classList.add("is-on");
    } else if (next === "summit") {
      if (firstAscent) {
        firstAscent = false;
        groove.setAttribute("d", fullTrail);
        line.setAttribute("d", fullTrail);
      }
      onSummit(peak);
    } else if (next === "rest") {
      canvas.classList.remove("is-on");
      descentPath.classList.add("is-fading");
    }
  }

  function update(dt) {
    elapsed += dt;
    if (phase === "wait") {
      if (elapsed > START_DELAY_MS) enter("climb");
    } else if (phase === "climb") {
      const total = climbLengths.at(-1);
      let travelled = 0;
      if (hold > 0) {
        hold -= dt;
      } else {
        travelled = (total / CLIMB_MS) * dt;
        dist += travelled;
      }
      if (firstAscent) {
        const d = partialPath(climb, climbLengths, dist);
        groove.setAttribute("d", d);
        line.setAttribute("d", d);
      }
      const spot = place(climb, climbLengths, dist);
      // Pause for a kick turn whenever the track switches back
      if (spot.turned && dist > 8) {
        hold = KICK_TURN_MS;
        turnTo = heading();
      }
      render(
        dt,
        hold > 0
          ? {
              mode: "turn",
              yaw: turnTo,
              slope: 0,
              travel: 0,
              turn: 1 - hold / KICK_TURN_MS,
            }
          : {
              mode: "climb",
              yaw: heading(),
              slope: spot.slope,
              travel: metres(travelled),
            },
      );
      if (dist >= total) enter("summit");
    } else if (phase === "summit") {
      place(climb, climbLengths, climbLengths.at(-1));
      render(dt, { mode: "summit", yaw: HEADING_VIEWER, slope: 0, travel: 0 });
      if (elapsed > SUMMIT_MS) enter("descend");
    } else if (phase === "descend") {
      const t = Math.min(1, elapsed / DESCENT_MS);
      const d = Math.pow(t, 1.6) * descentLengths.at(-1);
      descentPath.setAttribute("d", partialPath(descent, descentLengths, d));
      const spot = place(descent, descentLengths, d);
      const across = spot.dx / (Math.hypot(spot.dx, spot.dy) || 1);
      // Kick up a little spray each time the skis change direction
      if (Math.sign(spot.dx) !== Math.sign(lastDx) && Math.abs(spot.dx) > 1) {
        onSpray(spot.px, spot.py);
      }
      lastDx = spot.dx;
      render(dt, {
        mode: "descend",
        yaw: HEADING_VIEWER + 55 * across,
        slope: 0,
        travel: 0,
        lean: Math.max(-28, Math.min(28, -spot.bend * 7)),
      });
      if (t >= 1) enter("rest");
    } else if (phase === "rest") {
      if (elapsed > REST_MS) enter("climb");
    }
  }

  // Only animate while the hero is on screen and the tab is visible
  let running = false;
  let inView = true;
  let lastTime = 0;
  const loop = (now) => {
    if (!running) return;
    update(Math.min(50, now - lastTime));
    lastTime = now;
    requestAnimationFrame(loop);
  };
  const sync = () => {
    const next = inView && !document.hidden;
    if (next === running) return;
    running = next;
    if (running) {
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  };

  ridge.addEventListener("ridgeresize", () => {
    remeasure();
    figure.resize();
  });
  document.addEventListener("themechange", () => figure.readColors());
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }).observe(ridge);
  document.addEventListener("visibilitychange", sync);
  sync();
}

/* --------------------------------------------------------------------------
   Snowfall: drifts with the cursor; flakes glint in the headlamp after dark.
   burst() throws a puff of spindrift off a summit.
   -------------------------------------------------------------------------- */
function initSnow(hero) {
  const canvas = document.getElementById("snow");
  const ctx = !reduceMotion && canvas?.getContext("2d");
  if (!ctx) return { burst() {} };

  let w = 0;
  let h = 0;
  let flakes = [];
  const puffs = [];
  let running = false;
  let inView = true;
  let wind = 0;
  let gust = 0;
  let lamp = null;
  let lastX = null;

  const spawn = (anywhere) => {
    const r = 0.6 + Math.random() ** 2 * 2.3;
    return {
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -6,
      r,
      vy: 0.22 + r * 0.3,
      phase: Math.random() * Math.PI * 2,
      sway: 0.25 + Math.random() * 0.5,
      a: 0.3 + Math.random() * 0.5,
    };
  };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(120, Math.max(36, (w * h) / 13000)));
    flakes = Array.from({ length: count }, () => spawn(true));
  }

  function frame() {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);
    gust *= 0.96;
    wind += (gust - wind) * 0.04;
    const dark = isDark();
    ctx.fillStyle = dark ? "#e6ecff" : "#ffffff";

    for (const f of flakes) {
      f.phase += 0.012;
      f.y += f.vy;
      f.x += Math.sin(f.phase) * f.sway * 0.4 + wind * (0.35 + f.r * 0.35);
      if (f.y > h + 6) Object.assign(f, spawn(false));
      if (f.x > w + 6) f.x = -6;
      else if (f.x < -6) f.x = w + 6;

      let alpha = f.a * (dark ? 0.85 : 1);
      let r = f.r;
      if (dark && lamp) {
        const d = Math.hypot(f.x - lamp.x, f.y - lamp.y);
        if (d < 230) {
          const k = 1 - d / 230;
          alpha = Math.min(1, alpha + k * 0.75);
          r += k * 0.6;
        }
      }
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Spindrift: blown east off the summit, slowed by the air, then settling
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.life += 1;
      p.vx *= 0.975;
      p.vy = p.vy * 0.97 + 0.025;
      p.x += p.vx + wind * 0.4;
      p.y += p.vy;
      const k = p.life / p.max;
      if (k >= 1) {
        puffs.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (1 + k * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  function setRunning(next) {
    if (next === running) return;
    running = next;
    if (running) requestAnimationFrame(frame);
  }

  const sync = () => setRunning(inView && !document.hidden);

  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    lamp = { x, y: e.clientY - rect.top };
    if (lastX !== null) {
      gust = Math.max(-3, Math.min(3, gust + (x - lastX) * 0.02));
    }
    lastX = x;
  });
  hero.addEventListener("pointerleave", () => {
    lamp = null;
    lastX = null;
  });

  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    sync();
  }).observe(hero);
  document.addEventListener("visibilitychange", sync);
  resize();
  sync();

  return {
    burst(x, y, count = 18) {
      for (let i = 0; i < count; i++) {
        puffs.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + Math.random() * 4,
          vx: 0.3 + Math.random() * 2.2,
          vy: -0.3 - Math.random() * 1.5,
          r: 0.7 + Math.random() * 1.6,
          life: 0,
          max: 45 + Math.random() * 45,
        });
      }
    },
  };
}

/* --------------------------------------------------------------------------
   Atmosphere: headlamp follows the cursor, layers drift with it
   -------------------------------------------------------------------------- */
function initAtmosphere(hero) {
  if (!finePointer) return;
  const far = hero.querySelector(".range-far");
  const copy = hero.querySelector(".hero-copy");
  const sky = hero.querySelector(".sky");
  let frame = null;
  let pending = null;

  hero.addEventListener("pointerenter", () => hero.classList.add("lamp-on"));
  hero.addEventListener("pointerleave", () => {
    hero.classList.remove("lamp-on");
    pending = { x: 0, y: 0, reset: true };
    schedule();
  });

  hero.addEventListener("pointermove", (e) => {
    const rect = hero.getBoundingClientRect();
    pending = {
      mx: e.clientX - rect.left,
      my: e.clientY - rect.top,
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    };
    schedule();
  });

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      if (!pending) return;
      const { x, y, mx, my } = pending;
      if (mx !== undefined) {
        hero.style.setProperty("--mx", `${mx}px`);
        hero.style.setProperty("--my", `${my}px`);
      }
      if (!reduceMotion) {
        far.style.transform = `translate3d(${x * -18}px, ${y * -6}px, 0)`;
        copy.style.transform = `translate3d(${x * 10}px, ${y * 4}px, 0)`;
        sky.style.transform = `translate3d(${x * -8}px, ${y * -4}px, 0)`;
      }
    });
  }
}
