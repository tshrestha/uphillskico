// A low-poly 3D skier drawn with Canvas 2D: flat-shaded triangles sorted back
// to front, lit from the west like the faceted mountains around it.
// The figure is posed procedurally every frame (skinning gait, kick turns,
// summit celebration, carving descent) rather than from canned animation.

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- 3×4 affine matrices ---------- */
const mul = (a, b) => [
  a[0] * b[0] + a[1] * b[4] + a[2] * b[8],
  a[0] * b[1] + a[1] * b[5] + a[2] * b[9],
  a[0] * b[2] + a[1] * b[6] + a[2] * b[10],
  a[0] * b[3] + a[1] * b[7] + a[2] * b[11] + a[3],
  a[4] * b[0] + a[5] * b[4] + a[6] * b[8],
  a[4] * b[1] + a[5] * b[5] + a[6] * b[9],
  a[4] * b[2] + a[5] * b[6] + a[6] * b[10],
  a[4] * b[3] + a[5] * b[7] + a[6] * b[11] + a[7],
  a[8] * b[0] + a[9] * b[4] + a[10] * b[8],
  a[8] * b[1] + a[9] * b[5] + a[10] * b[9],
  a[8] * b[2] + a[9] * b[6] + a[10] * b[10],
  a[8] * b[3] + a[9] * b[7] + a[10] * b[11] + a[11],
];
const chain = (...ms) => ms.reduce(mul);
const T = (x, y, z) => [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z];
const RX = (a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0];
};
const RY = (a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0];
};
const RZ = (a) => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0];
};
const apply = (m, [x, y, z]) => [
  m[0] * x + m[1] * y + m[2] * z + m[3],
  m[4] * x + m[5] * y + m[6] * z + m[7],
  m[8] * x + m[9] * y + m[10] * z + m[11],
];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (v) => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

// Matrix taking the unit segment y∈[0,1] onto the segment a→b
function alignY(a, b) {
  const v = sub(b, a);
  const y = norm(v);
  const helper = Math.abs(y[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const x = norm(cross(y, helper));
  const z = cross(x, y);
  return [
    x[0],
    v[0],
    z[0],
    a[0],
    x[1],
    v[1],
    z[1],
    a[1],
    x[2],
    v[2],
    z[2],
    a[2],
  ];
}

/* ---------- Low-poly primitives (lists of triangles) ---------- */
function prism(sides, rx0, rz0, rx1 = rx0, rz1 = rz0) {
  const ring = (rx, rz, y) =>
    Array.from({ length: sides }, (_, i) => {
      const a = (i / sides) * TAU + Math.PI / sides;
      return [Math.cos(a) * rx, y, Math.sin(a) * rz];
    });
  const b = ring(rx0, rz0, 0);
  const t = ring(rx1, rz1, 1);
  const tris = [];
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    tris.push([b[i], b[j], t[j]], [b[i], t[j], t[i]]);
  }
  for (let i = 1; i < sides - 1; i++) {
    tris.push([b[0], b[i + 1], b[i]], [t[0], t[i], t[i + 1]]);
  }
  return tris;
}

function box(x0, x1, y0, y1, z0, z1) {
  const p = (x, y, z) => [x ? x1 : x0, y ? y1 : y0, z ? z1 : z0];
  const quad = (a, b, c, d) => [
    [a, b, c],
    [a, c, d],
  ];
  return [
    ...quad(p(0, 0, 0), p(1, 0, 0), p(1, 1, 0), p(0, 1, 0)),
    ...quad(p(0, 0, 1), p(0, 1, 1), p(1, 1, 1), p(1, 0, 1)),
    ...quad(p(0, 0, 0), p(0, 1, 0), p(0, 1, 1), p(0, 0, 1)),
    ...quad(p(1, 0, 0), p(1, 0, 1), p(1, 1, 1), p(1, 1, 0)),
    ...quad(p(0, 1, 0), p(1, 1, 0), p(1, 1, 1), p(0, 1, 1)),
    ...quad(p(0, 0, 0), p(0, 0, 1), p(1, 0, 1), p(1, 0, 0)),
  ];
}

function sphere(r, segments, rings, maxPolar = Math.PI) {
  const pt = (i, j) => {
    const theta = (i / segments) * TAU;
    const phi = (j / rings) * maxPolar;
    return [
      Math.cos(theta) * Math.sin(phi) * r,
      Math.cos(phi) * r,
      Math.sin(theta) * Math.sin(phi) * r,
    ];
  };
  const tris = [];
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segments; i++) {
      const a = pt(i, j);
      const b = pt(i + 1, j);
      const c = pt(i + 1, j + 1);
      const d = pt(i, j + 1);
      if (j > 0) tris.push([a, b, c]);
      tris.push([a, c, d]);
    }
  }
  return tris;
}

const MESH = {
  limb: prism(6, 1, 1),
  limbTaper: prism(6, 1, 1, 0.82, 0.82),
  pole: prism(4, 1, 1),
  basket: prism(6, 1, 1),
  head: sphere(1, 8, 6),
  helmet: sphere(1, 9, 3, Math.PI / 2),
  torso: prism(6, 0.13, 0.17, 0.15, 0.21),
  pelvis: box(-0.11, 0.11, -0.09, 0.09, -0.16, 0.16),
  pack: box(-0.13, 0, 0, 0.42, -0.15, 0.15),
  packLid: box(-0.14, 0.005, 0.36, 0.45, -0.155, 0.155),
  goggles: box(-0.02, 0.025, -0.032, 0.032, -0.095, 0.095),
  lens: box(0.02, 0.032, -0.024, 0.024, -0.08, 0.08),
  boot: box(-0.11, 0.17, 0, 0.16, -0.055, 0.055),
  binding: box(-0.13, 0.19, 0.02, 0.045, -0.04, 0.04),
  ski: box(-0.78, 0.74, 0, 0.022, -0.045, 0.045),
  skiTip: box(0, 0.16, 0, 0.022, -0.045, 0.045),
  glove: box(-0.045, 0.045, -0.06, 0.03, -0.04, 0.04),
};

/* ---------- Colours ---------- */
function parseColor(value, fallback) {
  const hex = (value || "").trim().replace("#", "");
  if (/^[0-9a-f]{6}$/i.test(hex)) {
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  }
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    return [...hex].map((c) => parseInt(c + c, 16));
  }
  return fallback;
}

const FIXED = {
  skin: [242, 194, 155],
  goggles: [20, 26, 51],
  lens: [255, 176, 59],
  glove: [27, 33, 71],
  boot: [32, 38, 77],
  binding: [154, 163, 199],
  grip: [20, 26, 51],
  lid: [255, 194, 46],
};

/**
 * Create the 3D skier renderer
 * @param {HTMLCanvasElement} canvas - Canvas that sits over the skier's position
 * @returns {{ update: Function, draw: Function, resize: Function, readColors: Function }}
 */
export function createSkier3D(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  let width = 0;
  let height = 0;
  let colors = {};
  let dark = false;

  function readColors() {
    const css = window.getComputedStyle(document.documentElement);
    const read = (name, fallback) =>
      parseColor(css.getPropertyValue(name), fallback);
    dark = document.documentElement.getAttribute("data-theme") === "dark";
    colors = {
      ...FIXED,
      jacket: read("--sk-jacket", [255, 59, 48]),
      sleeve: read("--sk-jacket-2", [217, 43, 34]),
      pants: read("--sk-pants", [34, 48, 110]),
      pack: read("--sk-pack", [42, 58, 128]),
      ski: read("--sk-ski", [15, 26, 74]),
      pole: read("--sk-pole", [15, 26, 74]),
      helmet: read("--sk-beanie", [255, 194, 46]),
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  readColors();
  resize();

  /* ---------- Pose state (blended towards targets every frame) ---------- */
  const pose = {
    yaw: 20 * DEG,
    roll: 0,
    pelvisY: 0.93,
    lean: 12 * DEG,
    twist: 0,
    arm: [
      { swing: 0, abduct: 8 * DEG, elbow: 0.4, pole: [-0.5, -0.85, 0.06] },
      { swing: 0, abduct: 8 * DEG, elbow: 0.4, pole: [-0.5, -0.85, 0.06] },
    ],
    leg: [
      { x: 0, lift: 0, heel: 0, z: 0.11, yaw: 0 },
      { x: 0, lift: 0, heel: 0, z: -0.11, yaw: 0 },
    ],
    slope: 0,
  };
  let gait = 0;
  let modeTime = 0;
  let mode = "climb";
  let turnFrom = 0;
  let turnTo = 0;

  /**
   * Advance the pose
   * @param {number} dt - Milliseconds since the last frame
   * @param {object} input
   * @param {"climb"|"turn"|"summit"|"descend"} input.mode
   * @param {number} input.yaw - Heading in degrees (0 = right, 90 = into the scene)
   * @param {number} input.slope - Ground pitch in degrees, positive = uphill ahead
   * @param {number} input.travel - Metres covered this frame (drives the gait)
   * @param {number} input.lean - Carving lean in degrees during the descent
   * @param {number} [input.turn] - Kick-turn progress 0..1
   */
  function update(dt, input) {
    const s = dt / 1000;
    if (input.mode !== mode) {
      if (input.mode === "turn") {
        turnFrom = pose.yaw;
        turnTo = input.yaw * DEG;
      }
      mode = input.mode;
      modeTime = 0;
    }
    modeTime += s;
    gait += (input.travel / 1.5) * TAU;

    const k = 1 - Math.exp(-s * 14);
    const kYaw = 1 - Math.exp(-s * 7);
    const blend = (obj, key, target, rate = k) => {
      obj[key] = lerp(obj[key], target, rate);
    };

    blend(pose, "slope", (input.slope || 0) * DEG);

    if (mode === "climb") {
      const sw = Math.sin(gait);
      blend(pose, "yaw", input.yaw * DEG, kYaw);
      blend(pose, "roll", 0);
      blend(pose, "pelvisY", 0.9 + 0.018 * Math.cos(gait * 2));
      blend(pose, "lean", 13 * DEG);
      blend(pose, "twist", 5 * DEG * sw);
      pose.leg.forEach((leg, i) => {
        const x = 0.3 * (i ? -sw : sw);
        blend(leg, "x", x);
        blend(leg, "lift", 0);
        blend(leg, "heel", clamp(-x / 0.3, 0, 1) * 22 * DEG);
        blend(leg, "z", i ? -0.11 : 0.11);
        blend(leg, "yaw", 0);
      });
      pose.arm.forEach((arm, i) => {
        // Diagonal stride: each arm swings with the opposite leg
        const swing = 0.55 * (i ? sw : -sw);
        blend(arm, "swing", swing);
        blend(arm, "abduct", 9 * DEG);
        blend(arm, "elbow", 0.35 + 0.3 * Math.max(0, swing));
        arm.planted = swing > 0.05;
      });
    } else if (mode === "turn") {
      const p = clamp(input.turn ?? 0, 0, 1);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      pose.yaw = lerp(turnFrom, turnTo, e);
      blend(pose, "pelvisY", 0.9);
      blend(pose, "lean", 6 * DEG);
      blend(pose, "twist", 0);
      pose.leg.forEach((leg, i) => {
        // Lift and swing one ski round, then the other
        const local = clamp(i ? (p - 0.45) / 0.55 : p / 0.55, 0, 1);
        blend(leg, "x", 0);
        blend(leg, "lift", Math.sin(local * Math.PI) * 0.22, 0.5);
        leg.yaw = (turnTo - pose.yaw) * Math.min(1, local * 1.4);
        blend(leg, "heel", 0);
        blend(leg, "z", i ? -0.16 : 0.16);
      });
      pose.arm.forEach((arm) => {
        blend(arm, "swing", -0.15);
        blend(arm, "abduct", 30 * DEG);
        blend(arm, "elbow", 0.3);
        arm.planted = true;
      });
    } else if (mode === "summit") {
      const hop =
        Math.abs(Math.sin(modeTime * 6.2)) * (modeTime < 1 ? 0.07 : 0);
      blend(pose, "yaw", input.yaw * DEG, kYaw);
      blend(pose, "pelvisY", 0.93 + hop, 0.5);
      blend(pose, "lean", 0);
      blend(pose, "twist", 0);
      blend(pose, "roll", 0);
      pose.leg.forEach((leg, i) => {
        blend(leg, "x", 0);
        blend(leg, "lift", 0);
        blend(leg, "heel", 0);
        blend(leg, "yaw", 0);
        blend(leg, "z", i ? -0.13 : 0.13);
      });
      pose.arm.forEach((arm) => {
        blend(arm, "swing", 2.75);
        blend(arm, "abduct", 38 * DEG);
        blend(arm, "elbow", 0.05);
        arm.planted = false;
        arm.raise = true;
      });
    } else if (mode === "descend") {
      blend(pose, "yaw", input.yaw * DEG, 1 - Math.exp(-s * 10));
      blend(pose, "roll", (input.lean || 0) * DEG, 1 - Math.exp(-s * 10));
      blend(pose, "pelvisY", 0.76);
      blend(pose, "lean", 24 * DEG);
      blend(pose, "twist", 0);
      pose.leg.forEach((leg, i) => {
        blend(leg, "x", i ? -0.05 : 0.05);
        blend(leg, "lift", 0);
        blend(leg, "heel", 0);
        blend(leg, "yaw", 0);
        blend(leg, "z", i ? -0.09 : 0.09);
      });
      pose.arm.forEach((arm) => {
        blend(arm, "swing", 0.55);
        blend(arm, "abduct", 18 * DEG);
        blend(arm, "elbow", 0.55);
        arm.planted = false;
        arm.raise = false;
        arm.tuck = true;
      });
    }
    if (mode !== "summit") pose.arm.forEach((arm) => (arm.raise = false));
    if (mode !== "descend") pose.arm.forEach((arm) => (arm.tuck = false));
  }

  /* ---------- Build the posed model ---------- */
  function build(snap) {
    const parts = [];
    const add = (mesh, m, color) => parts.push({ mesh, m, color });

    const body = chain(RY(pose.yaw), RX(pose.roll));
    const ground = (x) => Math.tan(pose.slope) * x;

    // Legs: two-bone IK from hip to a boot that stays on its ski
    const pelvisM = chain(body, T(0, pose.pelvisY, 0), RY(-pose.twist * 0.6));
    add(MESH.pelvis, pelvisM, "pants");

    pose.leg.forEach((leg) => {
      const hip = apply(
        chain(T(0, pose.pelvisY - 0.04, 0), RY(-pose.twist * 0.6)),
        [0, 0, leg.z],
      );
      const footX = leg.x;
      const footY = ground(footX) + leg.lift;
      const heelRise = Math.sin(leg.heel) * 0.17;
      const ankle = [footX + 0.02, footY + 0.1 + heelRise, leg.z];

      const thigh = 0.46;
      const shin = 0.45;
      const dx = ankle[0] - hip[0];
      const dy = ankle[1] - hip[1];
      const reach = Math.hypot(dx, dy);
      const d = Math.min(reach, thigh + shin - 0.002);
      const a = Math.acos(
        clamp((thigh * thigh + d * d - shin * shin) / (2 * thigh * d), -1, 1),
      );
      const ux = dx / reach;
      const uy = dy / reach;
      const knee = [
        hip[0] + thigh * (ux * Math.cos(a) - uy * Math.sin(a)),
        hip[1] + thigh * (ux * Math.sin(a) + uy * Math.cos(a)),
        (hip[2] + ankle[2]) / 2,
      ];

      add(
        MESH.limbTaper,
        chain(
          body,
          alignY(hip, knee),
          [0.086, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.086, 0],
        ),
        "pants",
      );
      add(
        MESH.limbTaper,
        chain(
          body,
          alignY(knee, ankle),
          [0.07, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.07, 0],
        ),
        "pants",
      );

      // Ski flat on the snow (free heel: only the boot tips up)
      const skiM = chain(
        body,
        T(footX + 0.04, footY, leg.z),
        RZ(pose.slope),
        RY(leg.yaw),
      );
      add(MESH.ski, skiM, "ski");
      add(MESH.skiTip, chain(skiM, T(0.74, 0, 0), RZ(24 * DEG)), "ski");
      add(MESH.binding, skiM, "binding");
      const bootM = chain(
        skiM,
        T(0.17, 0.02, 0),
        RZ(-leg.heel),
        T(-0.17, 0, 0),
      );
      add(MESH.boot, bootM, "boot");
    });

    // Torso, pack and head (torsoLocal is in body space, torsoM in world space)
    const torsoLocal = chain(
      T(0, pose.pelvisY + 0.04, 0),
      RZ(-pose.lean),
      RY(pose.twist),
    );
    const torsoM = chain(body, torsoLocal);
    add(
      MESH.torso,
      chain(torsoM, [1, 0, 0, 0, 0, 0.56, 0, 0, 0, 0, 1, 0]),
      "jacket",
    );
    add(MESH.pack, chain(torsoM, T(-0.12, 0.08, 0)), "pack");
    add(MESH.packLid, chain(torsoM, T(-0.12, 0.08, 0)), "lid");
    add(
      MESH.limb,
      chain(
        torsoM,
        T(0.01, 0.53, 0),
        [0.07, 0, 0, 0, 0, 0.08, 0, 0, 0, 0, 0.08, 0],
      ),
      "sleeve",
    );

    const headM = chain(torsoM, T(0.03, 0.7, 0), RZ(pose.lean * 0.6));
    add(
      MESH.head,
      chain(headM, [0.1, 0, 0, 0, 0, 0.115, 0, 0, 0, 0, 0.1, 0]),
      "skin",
    );
    add(
      MESH.helmet,
      chain(
        headM,
        T(-0.008, 0.012, 0),
        [0.122, 0, 0, 0, 0, 0.12, 0, 0, 0, 0, 0.118, 0],
      ),
      "helmet",
    );
    add(MESH.goggles, chain(headM, T(0.085, 0.02, 0)), "goggles");
    add(MESH.lens, chain(headM, T(0.085, 0.02, 0)), "lens");

    // Arms and poles
    const lampLocal = [0.12, 0.09, 0];
    const shoulders = [0.2, -0.2];
    pose.arm.forEach((arm, i) => {
      const side = i ? -1 : 1;
      const sh = [0.0, 0.5, shoulders[i]];
      const dir = [
        Math.sin(arm.swing),
        -Math.cos(arm.swing) * Math.cos(arm.abduct),
        side * Math.sin(arm.abduct),
      ];
      const elbow = [
        sh[0] + dir[0] * 0.28,
        sh[1] + dir[1] * 0.28,
        sh[2] + dir[2] * 0.28,
      ];
      const fa = arm.swing + arm.elbow;
      const fdir = [
        Math.sin(fa),
        -Math.cos(fa) * Math.cos(arm.abduct * 0.6),
        side * Math.sin(arm.abduct * 0.6),
      ];
      const hand = [
        elbow[0] + fdir[0] * 0.26,
        elbow[1] + fdir[1] * 0.26,
        elbow[2] + fdir[2] * 0.26,
      ];

      add(
        MESH.limbTaper,
        chain(
          torsoM,
          alignY(sh, elbow),
          [0.058, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.058, 0],
        ),
        "sleeve",
      );
      add(
        MESH.limbTaper,
        chain(
          torsoM,
          alignY(elbow, hand),
          [0.05, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.05, 0],
        ),
        "jacket",
      );
      add(MESH.glove, chain(torsoM, T(...hand)), "glove");

      // Poles: planted in the snow behind the hand while skinning,
      // raised overhead at the summit, tucked back on the way down
      const handBody = apply(torsoLocal, hand);
      const length = 1.15;
      let target;
      if (arm.raise) {
        target = norm([fdir[0], fdir[1], fdir[2] * 0.6 + side * 0.4]);
      } else if (arm.tuck) {
        target = norm([-0.85, -0.45, side * 0.12]);
      } else {
        const tipY = ground(handBody[0] - 0.4) + (arm.planted ? 0.01 : 0.09);
        const dy = Math.min(length - 0.01, handBody[1] - tipY);
        const back = Math.sqrt(Math.max(0, length * length - dy * dy));
        target = norm([-back, -dy, side * 0.06]);
      }
      arm.pole = norm(
        arm.pole.map((v, n) => lerp(v, target[n], snap ? 1 : 0.3)),
      );
      const tip = arm.pole.map((v, n) => handBody[n] + v * length);
      const grip = arm.pole.map((v, n) => handBody[n] - v * 0.08);
      add(
        MESH.pole,
        chain(
          body,
          alignY(grip, tip),
          [0.012, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.012, 0],
        ),
        "pole",
      );
      add(
        MESH.pole,
        chain(
          body,
          alignY(grip, handBody),
          [0.022, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.022, 0],
        ),
        "grip",
      );
      const basketAt = arm.pole.map((v, n) => handBody[n] + v * (length - 0.1));
      add(
        MESH.basket,
        chain(
          body,
          alignY(
            basketAt,
            basketAt.map((v, n) => v + arm.pole[n] * 0.012),
          ),
          [0.05, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0.05, 0],
        ),
        "grip",
      );
    });

    return { parts, headM, lampLocal };
  }

  /* ---------- Render ---------- */
  const light = norm([-0.55, 0.72, 0.42]);
  const camPitch = 13 * DEG;
  const cosP = Math.cos(camPitch);
  const sinP = Math.sin(camPitch);
  const distance = 9;

  function draw(scalePx, { snap = false } = {}) {
    ctx.clearRect(0, 0, width, height);
    const { parts, headM, lampLocal } = build(snap);
    const focal = (scalePx * distance) / 1.75;
    const cx = width / 2;
    const cy = height * 0.75;

    const view = ([x, y, z]) => [x, y * cosP - z * sinP, y * sinP + z * cosP];
    const project = ([x, y, z]) => {
      const s = focal / (distance - z);
      return [cx + x * s, cy - y * s];
    };

    // Soft contact shadow on the snow
    const reach = 0.95 * (0.45 + 0.55 * Math.abs(Math.cos(pose.yaw)));
    const [sx, sy] = project(view([0, 0, 0]));
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(1, 0.16);
    const shadow = ctx.createRadialGradient(
      0,
      0,
      0,
      0,
      0,
      (reach * focal) / distance,
    );
    shadow.addColorStop(0, dark ? "rgba(0,0,0,0.45)" : "rgba(10,19,56,0.28)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(0, 0, (reach * focal) / distance, 0, TAU);
    ctx.fill();
    ctx.restore();

    // Headlamp beam (dark mode): behind the figure when facing into the scene
    const lampWorld = view(apply(headM, lampLocal));
    const forward = view(apply(RY(pose.yaw), [1, -0.12, 0]));
    const beam = () => {
      if (!dark) return;
      const from = project(lampWorld);
      const far = project(lampWorld.map((v, n) => v + forward[n] * 1.7));
      const side = project(
        lampWorld.map((v, n) => v + forward[n] * 1.7 + (n === 1 ? 0.45 : 0)),
      );
      const side2 = project(
        lampWorld.map((v, n) => v + forward[n] * 1.7 - (n === 1 ? 0.35 : 0)),
      );
      const g = ctx.createLinearGradient(from[0], from[1], far[0], far[1]);
      g.addColorStop(0, "rgba(255,233,168,0.55)");
      g.addColorStop(1, "rgba(255,233,168,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(side[0], side[1]);
      ctx.lineTo(side2[0], side2[1]);
      ctx.closePath();
      ctx.fill();
    };
    if (forward[2] < 0) beam();

    // Transform, light and depth-sort every triangle
    const tris = [];
    for (const { mesh, m, color } of parts) {
      const rgb = colors[color] || [255, 0, 255];
      for (const tri of mesh) {
        const a = view(apply(m, tri[0]));
        const b = view(apply(m, tri[1]));
        const c = view(apply(m, tri[2]));
        let n = norm(cross(sub(b, a), sub(c, a)));
        // Two-sided lighting: use the side facing the camera
        const toCam = sub([0, 0, distance], a);
        if (n[0] * toCam[0] + n[1] * toCam[1] + n[2] * toCam[2] < 0)
          n = n.map((v) => -v);
        const diffuse = Math.max(
          0,
          n[0] * light[0] + n[1] * light[1] + n[2] * light[2],
        );
        const shade = (dark ? 0.42 : 0.6) + diffuse * (dark ? 0.62 : 0.5);
        tris.push({
          z: (a[2] + b[2] + c[2]) / 3,
          p: [project(a), project(b), project(c)],
          fill: `rgb(${rgb.map((v) => Math.min(255, Math.round(v * shade))).join(",")})`,
        });
      }
    }
    tris.sort((p, q) => p.z - q.z);

    ctx.lineJoin = "round";
    ctx.lineWidth = 0.6;
    for (const t of tris) {
      ctx.fillStyle = t.fill;
      ctx.strokeStyle = t.fill;
      ctx.beginPath();
      ctx.moveTo(t.p[0][0], t.p[0][1]);
      ctx.lineTo(t.p[1][0], t.p[1][1]);
      ctx.lineTo(t.p[2][0], t.p[2][1]);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    if (forward[2] >= 0) beam();

    // Lamp on the helmet
    if (dark) {
      const [lx, ly] = project(lampWorld);
      const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 5);
      glow.addColorStop(0, "rgba(255,246,208,1)");
      glow.addColorStop(1, "rgba(255,246,208,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(lx, ly, 5, 0, TAU);
      ctx.fill();
    }
  }

  /**
   * Snap straight to a heading and an upright stance
   * @param {number} yawDeg - Heading in degrees
   */
  function reset(yawDeg) {
    pose.yaw = yawDeg * DEG;
    pose.roll = 0;
    mode = "climb";
    modeTime = 0;
  }

  return { update, draw, resize, readColors, reset };
}
