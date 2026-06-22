const { useState, useEffect, useMemo, useRef, useCallback } = React;
// ============================================================================
// PROTOCOL — guided workout coach + tracker
// Data model (the council's "one clean table"):
//   sets:<dayKey>:<exId>  ->  [ { date, sets:[{weight,reps,feeling}], durationS } ]
//   program               ->  editable copy of the program (falls back to default)
// Storage is on-device (artifact persistent storage here; localStorage when hosted).
// ============================================================================

// ---- default program (editable at runtime) --------------------------------
const DEFAULT_PROGRAM = {
  push: {
    name: "Push",
    sub: "Chest · Shoulders · Triceps",
    accent: "aesthetic",
    warmup: [{
      name: "Arm circles",
      detail: "20 fwd, 20 back. Small to big, big to small.",
      demo: "mobility",
      video: "Arm-Circles.mp4"
    }, {
      name: "Arm swings (chest opener)",
      detail: "20 reps.",
      demo: "mobility",
      video: "Arm_swings.mp4"
    }, {
      name: "Shoulder rolls",
      detail: "Hands on shoulders, 15 reps.",
      demo: "mobility",
      video: "Shoulder_rolls.mp4"
    }, {
      name: "Band pull-aparts",
      detail: "5 reps, squeeze blades.",
      demo: "rotator"
    }],
    exercises: [{
      id: "incline_bench",
      name: "Incline Bench",
      cue: "One seat up, 32° angle",
      demo: "press",
      video: "Incline-Dumbell-Bench-press.mp4",
      sets: [{
        warmup: true,
        weight: 10,
        reps: 10,
        rest: 45
      }, {
        warmup: true,
        weight: 12.5,
        reps: 10,
        rest: 60
      }, {
        warmup: true,
        weight: 15,
        reps: 5,
        rest: 60
      }, {
        weight: 17.5,
        reps: 13,
        rest: 60
      }, {
        weight: 17.5,
        reps: 7,
        rest: 60
      }, {
        weight: 17.5,
        reps: 6,
        rest: 60
      }]
    }, {
      id: "flat_bench",
      name: "Flat Bench",
      cue: "Barbell · weights shown are total (incl. 20kg bar)",
      demo: "press",
      video: "Flat-Bench-Press.mp4",
      sets: [{
        warmup: true,
        weight: 30,
        reps: 10,
        rest: 45
      }, {
        weight: 40,
        reps: 12,
        rest: 60
      }, {
        weight: 40,
        reps: 5,
        rest: 60
      }, {
        weight: 36,
        reps: 12,
        rest: 60
      }, {
        weight: 36,
        reps: 6,
        rest: 60
      }]
    }, {
      id: "shoulder_press",
      name: "Shoulder Press",
      cue: "One seat up, 65° angle",
      demo: "overhead",
      video: "Shoulder-Press.mp4",
      sets: [{
        warmup: true,
        weight: 5,
        reps: 12,
        rest: 45
      }, {
        warmup: true,
        weight: 7.5,
        reps: 9,
        rest: 60
      }, {
        warmup: true,
        weight: 10,
        reps: 12,
        rest: 60
      }, {
        weight: 10,
        reps: 19,
        rest: 60
      }, {
        weight: 10,
        reps: 14,
        rest: 60
      }, {
        weight: 10,
        reps: 12,
        rest: 60
      }]
    }, {
      id: "lateral",
      name: "Cable Lateral Raises",
      cue: "Straight-arm · top of handle on 3",
      demo: "lateral",
      video: "Cable_Lat_Raise.mp4",
      sets: [{
        weight: 5,
        reps: 12,
        rest: 60
      }, {
        weight: 5,
        reps: 10,
        rest: 60
      }, {
        weight: 5,
        reps: 8,
        rest: 60
      }]
    }, {
      id: "rear_delt",
      name: "Katana Pull (Rear Delts)",
      cue: "Cable rear delts · top of handle on 23",
      demo: "row",
      video: "Cable_Rear_Delt_Fly.mp4",
      sets: [{
        weight: 10,
        reps: 12,
        rest: 60
      }, {
        weight: 10,
        reps: 9,
        rest: 60
      }, {
        weight: 10,
        reps: 8,
        rest: 60
      }]
    }, {
      id: "ext_rotator",
      name: "External Rotator Cuffs",
      cue: "14 on top, D handle",
      demo: "rotator",
      video: "External_Rotator_Cuff.mp4",
      sets: [{
        weight: 5,
        reps: 16,
        rest: 45
      }]
    }, {
      id: "skull_crusher",
      name: "Skull Crushers (Triceps)",
      cue: "Flat bench · EZ curl bar · 5kg each side",
      demo: "pushdown",
      video: "Skull_Crusher.mp4",
      sets: [{
        weight: 5,
        reps: 10,
        rest: 60
      }, {
        weight: 5,
        reps: 7,
        rest: 60
      }, {
        weight: 5,
        reps: 6,
        rest: 60
      }]
    }, {
      id: "tri_rope",
      name: "Tricep Rope Pushdown",
      cue: "Full extension",
      demo: "pushdown",
      video: "Rope_Tricep_Pushdown.mp4",
      sets: [{
        warmup: true,
        weight: 5,
        reps: 10,
        rest: 45
      }, {
        weight: 10,
        reps: 8,
        rest: 60
      }, {
        weight: 10,
        reps: 7,
        rest: 60
      }, {
        weight: 10,
        reps: 6,
        rest: 60
      }]
    }],
    stretches: [{
      name: "Chest doorway stretch",
      detail: "30-45s each side.",
      demo: "stretch"
    }, {
      name: "Overhead tricep stretch",
      detail: "30s each arm.",
      demo: "stretch"
    }]
  },
  pull: {
    name: "Pull",
    sub: "Back · Biceps · Abs",
    accent: "aesthetic",
    warmup: [{
      name: "General warm-up",
      detail: "Raise temperature.",
      demo: "mobility"
    }, {
      name: "Light primer",
      detail: "10 kg × 8-7-6.",
      demo: "row"
    }],
    exercises: [{
      id: "spider_curls",
      name: "Spider Curls",
      cue: "38° bench, chest on top",
      demo: "curl",
      sets: [{
        warmup: true,
        weight: 5,
        reps: 10,
        rest: 45
      }, {
        weight: 5,
        reps: 11,
        rest: 75
      }]
    }, {
      id: "incline_curls",
      name: "Incline Bench Curls",
      cue: "26° angle",
      demo: "curl",
      sets: [{
        weight: 7.5,
        reps: 8,
        rest: 75
      }, {
        weight: 5,
        reps: 14,
        rest: 75
      }]
    }, {
      id: "hammer_curls",
      name: "EZ-Bar Hammer Curls",
      cue: "Empty bar warm-up",
      demo: "curl",
      sets: [{
        warmup: true,
        weight: 0,
        reps: 10,
        rest: 45
      }, {
        weight: 5,
        reps: 7,
        rest: 75
      }]
    }, {
      id: "int_rotator",
      name: "Internal Rotator Cuffs",
      cue: "14 on top, D handle",
      demo: "rotator",
      sets: [{
        warmup: true,
        weight: 0,
        reps: 10,
        rest: 45
      }, {
        weight: 15,
        reps: 8,
        rest: 60
      }]
    }, {
      id: "cable_crunch",
      name: "Cable Crunch (Abs)",
      cue: "Straight bar, on knees",
      demo: "crunch",
      abs: true,
      sets: [{
        weight: 15,
        reps: 12,
        rest: 60
      }, {
        weight: 20,
        reps: 12,
        rest: 60
      }, {
        weight: 25,
        reps: 12,
        rest: 60
      }, {
        weight: 25,
        reps: 12,
        rest: 60
      }, {
        weight: 25,
        reps: 6,
        rest: 60
      }]
    }, {
      id: "deadlift",
      name: "Deadlift",
      cue: "Flat back, drive floor",
      demo: "hinge",
      sets: [{
        warmup: true,
        weight: 60,
        reps: 10,
        rest: 120
      }, {
        weight: 70,
        reps: 8,
        rest: 150
      }]
    }, {
      id: "cable_row",
      name: "Cable Row",
      cue: "Pull to torso, squeeze",
      demo: "row",
      sets: [{
        warmup: true,
        weight: 30,
        reps: 12,
        rest: 60
      }, {
        weight: 35,
        reps: 10,
        rest: 90
      }, {
        weight: 45,
        reps: 10,
        rest: 90
      }, {
        weight: 40,
        reps: 10,
        rest: 90
      }]
    }, {
      id: "lat_work",
      name: "Lat Pull / Pulldown",
      cue: "Ring on grippy side",
      demo: "pulldown",
      sets: [{
        warmup: true,
        weight: 0,
        reps: 10,
        rest: 45
      }, {
        weight: 15,
        reps: 10,
        rest: 75
      }, {
        weight: 20,
        reps: 8,
        rest: 75
      }]
    }],
    stretches: []
  },
  legs: {
    name: "Legs",
    sub: "Power · Jump · Sprint",
    accent: "power",
    warmup: [{
      name: "Cycle done",
      detail: "Ride covered temp + blood flow.",
      demo: "mobility"
    }, {
      name: "Leg swings",
      detail: "15 each direction.",
      demo: "mobility"
    }, {
      name: "Walking lunges",
      detail: "10 each leg.",
      demo: "squat"
    }, {
      name: "Deep squat hold",
      detail: "30 sec.",
      demo: "squat"
    }, {
      name: "Ankle rocks",
      detail: "Knee over toes, 15 each.",
      demo: "mobility"
    }, {
      name: "Glute bridges",
      detail: "2 × 15.",
      demo: "hinge"
    }, {
      name: "Banded lateral walks",
      detail: "2 × 15 each way.",
      demo: "mobility"
    }, {
      name: "Practice jumps",
      detail: "3 at ~70-80%.",
      demo: "jump"
    }],
    exercises: [{
      id: "box_jumps",
      name: "Box Jumps",
      cue: "Land quiet, full power",
      demo: "jump",
      power: true,
      sets: [{
        weight: 0,
        reps: 3,
        rest: 120
      }, {
        weight: 0,
        reps: 3,
        rest: 120
      }, {
        weight: 0,
        reps: 3,
        rest: 120
      }, {
        weight: 0,
        reps: 3,
        rest: 120
      }]
    }, {
      id: "broad_jumps",
      name: "Broad Jumps",
      cue: "Max distance",
      demo: "broad",
      power: true,
      sets: [{
        weight: 0,
        reps: 3,
        rest: 120
      }, {
        weight: 0,
        reps: 3,
        rest: 120
      }, {
        weight: 0,
        reps: 3,
        rest: 120
      }]
    }, {
      id: "squat",
      name: "Back / Front Squat",
      cue: "Train heavy",
      demo: "squat",
      power: true,
      sets: [{
        weight: 0,
        reps: 5,
        rest: 150
      }, {
        weight: 0,
        reps: 5,
        rest: 150
      }, {
        weight: 0,
        reps: 5,
        rest: 150
      }, {
        weight: 0,
        reps: 5,
        rest: 150
      }]
    }, {
      id: "rdl",
      name: "Barbell RDL",
      cue: "Hips back, spring stretch",
      demo: "hinge",
      power: true,
      sets: [{
        weight: 0,
        reps: 8,
        rest: 120
      }, {
        weight: 0,
        reps: 8,
        rest: 120
      }, {
        weight: 0,
        reps: 8,
        rest: 120
      }]
    }, {
      id: "bulgarian",
      name: "Bulgarian Split Squat",
      cue: "Single-leg",
      demo: "squat",
      power: true,
      sets: [{
        weight: 0,
        reps: 8,
        rest: 90
      }, {
        weight: 0,
        reps: 8,
        rest: 90
      }, {
        weight: 0,
        reps: 8,
        rest: 90
      }]
    }, {
      id: "nordic",
      name: "Nordic Curls",
      cue: "Lower slow, eccentric",
      demo: "hinge",
      power: true,
      sets: [{
        weight: 0,
        reps: 6,
        rest: 90
      }, {
        weight: 0,
        reps: 6,
        rest: 90
      }, {
        weight: 0,
        reps: 6,
        rest: 90
      }]
    }, {
      id: "calf",
      name: "Standing Calf Raise",
      cue: "Pause at top",
      demo: "calf",
      power: true,
      sets: [{
        weight: 0,
        reps: 10,
        rest: 60
      }, {
        weight: 0,
        reps: 10,
        rest: 60
      }, {
        weight: 0,
        reps: 10,
        rest: 60
      }, {
        weight: 0,
        reps: 10,
        rest: 60
      }]
    }, {
      id: "tib",
      name: "Tibialis Raises",
      cue: "Full range",
      demo: "calf",
      power: true,
      sets: [{
        weight: 0,
        reps: 18,
        rest: 45
      }, {
        weight: 0,
        reps: 18,
        rest: 45
      }, {
        weight: 0,
        reps: 18,
        rest: 45
      }]
    }],
    stretches: [{
      name: "Hip flexor stretch",
      detail: "45-60s each.",
      demo: "stretch"
    }, {
      name: "Couch stretch",
      detail: "45-60s each.",
      demo: "stretch"
    }, {
      name: "Pigeon",
      detail: "45-60s each.",
      demo: "stretch"
    }, {
      name: "Hamstring stretch",
      detail: "45-60s each.",
      demo: "stretch"
    }, {
      name: "Deep squat hold",
      detail: "1-2 min.",
      demo: "squat"
    }]
  }
};
const PPL = ["push", "pull", "legs"];
// Bump when DEFAULT_PROGRAM changes structurally. A saved program with an older
// (or missing) version stamp is treated as stale and replaced with the built-in
// one, so structural fixes (rest timers, warm-up/working splits) always reach you.
const PROGRAM_VERSION = 2;

// ---- storage helpers -------------------------------------------------------
const store = {
  async get(key) {
    try {
      const r = await window.storage.get(key);
      return r && r.value ? JSON.parse(r.value) : null;
    } catch {
      return null;
    }
  },
  async set(key, val) {
    try {
      await window.storage.set(key, JSON.stringify(val));
    } catch (e) {
      console.error(e);
    }
  },
  async list(prefix) {
    try {
      const r = await window.storage.list(prefix);
      return r && r.keys ? r.keys : [];
    } catch {
      return [];
    }
  },
  async del(key) {
    try {
      if (window.storage.delete) await window.storage.delete(key);
      else await window.storage.set(key, JSON.stringify(null));
    } catch (e) {
      console.error(e);
    }
  }
};

// ---- animated SVG demos (placeholders; video overrides when present) -------
function Stick({
  anim
}) {
  return /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 200 200",
    style: {
      width: "100%",
      height: "auto"
    }
  }, /*#__PURE__*/React.createElement("line", {
    x1: "20",
    y1: "180",
    x2: "180",
    y2: "180",
    stroke: "var(--line)",
    strokeWidth: "2"
  }), /*#__PURE__*/React.createElement("g", {
    stroke: "var(--text)",
    strokeWidth: "4",
    fill: "none",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("g", null, anim, /*#__PURE__*/React.createElement("circle", {
    cx: "100",
    cy: "54",
    r: "11",
    fill: "var(--text)",
    stroke: "none"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "100",
    y1: "65",
    x2: "100",
    y2: "112"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "100",
    y1: "74",
    x2: "80",
    y2: "92"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "100",
    y1: "74",
    x2: "120",
    y2: "92"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "100",
    y1: "112",
    x2: "88",
    y2: "150"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "100",
    y1: "112",
    x2: "112",
    y2: "150"
  }))));
}
const bob = /*#__PURE__*/React.createElement("animateTransform", {
  attributeName: "transform",
  type: "translate",
  values: "0 0;0 16;0 0",
  dur: "2.2s",
  repeatCount: "indefinite",
  keyTimes: "0;0.5;1"
});
function Demo({
  demoKey,
  video,
  label
}) {
  const [hasVideo, setHasVideo] = useState(false);
  // an exercise can name its own file via `video`; otherwise try videos/<demoKey>.mp4
  const src = video ? `videos/${video}` : `videos/${demoKey}.mp4`;
  useEffect(() => {
    let ok = true;
    setHasVideo(false);
    fetch(src, {
      method: "HEAD"
    }).then(r => {
      if (ok && r.ok) setHasVideo(true);
    }).catch(() => {});
    return () => {
      ok = false;
    };
  }, [src]);
  return /*#__PURE__*/React.createElement("div", {
    className: "demo"
  }, hasVideo ? /*#__PURE__*/React.createElement("video", {
    src: src,
    autoPlay: true,
    loop: true,
    muted: true,
    playsInline: true,
    className: "demo-media"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "demo-media"
  }, /*#__PURE__*/React.createElement(Stick, {
    anim: bob
  })), label && /*#__PURE__*/React.createElement("span", {
    className: "demo-label"
  }, label));
}

// ---- feeling rating (RPE-style) -------------------------------------------
const FEELINGS = [{
  key: "easy",
  label: "Had more",
  icon: "↑",
  hint: "go heavier next week"
}, {
  key: "solid",
  label: "On target",
  icon: "=",
  hint: "repeat / small bump"
}, {
  key: "grind",
  label: "Grind",
  icon: "~",
  hint: "hold load"
}, {
  key: "fail",
  label: "Missed",
  icon: "↓",
  hint: "drop or deload"
}];

// suggest next load from last feeling + weight
function suggestNext(lastWeight, feeling) {
  if (lastWeight == null) return null;
  if (feeling === "easy") return Math.round((lastWeight + 2.5) * 10) / 10;
  if (feeling === "solid") return Math.round((lastWeight + 1.25) * 10) / 10;
  if (feeling === "grind") return lastWeight;
  if (feeling === "fail") return Math.round((lastWeight - 2.5) * 10) / 10;
  return lastWeight;
}

// ---- background rest-timer push (fires even when the phone is locked) ------
// VAPID public key is safe to embed; the scheduler Worker holds the private key.
const PUSH_VAPID_PUBLIC = "BIAF6vk3vuZhX77IOc0i3EQs3xVwmCLNop-0ZJHG9otYkwlOK_dxmU8t8Xi9yRamHFvtTV7mGrCKnfKzAUVNK_8";
const PUSH_WORKER_URL = "https://protocol-push.protocol-kabir.workers.dev"; // scheduler Worker
function pushConfigured() {
  return PUSH_WORKER_URL && PUSH_WORKER_URL.indexOf("__") !== 0;
}
function pushPermission() {
  return typeof Notification !== "undefined" ? Notification.permission : "unsupported";
}
function pushClientId() {
  let id = localStorage.getItem("pushClientId");
  if (!id) {
    id = window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2);
    localStorage.setItem("pushClientId", id);
  }
  return id;
}
function urlB64ToUint8(b) {
  const pad = "=".repeat((4 - b.length % 4) % 4);
  const s = (b + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(s);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}
async function getPushSubscription(allowSubscribe) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || typeof Notification === "undefined") return null;
  if (Notification.permission !== "granted") return null;
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub && allowSubscribe) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(PUSH_VAPID_PUBLIC) });
  }
  return sub;
}
// must be called from a user gesture (iOS requirement)
async function requestPushPermission() {
  if (typeof Notification === "undefined") return false;
  try {
    let p = Notification.permission;
    if (p === "default") p = await Notification.requestPermission();
    if (p !== "granted") return false;
    return !!(await getPushSubscription(true));
  } catch (_) {
    return false;
  }
}
async function schedulePush(delaySeconds, title, body) {
  if (!pushConfigured()) return;
  try {
    const sub = await getPushSubscription(true);
    if (!sub) return;
    await fetch(PUSH_WORKER_URL + "/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ id: pushClientId(), subscription: sub.toJSON(), delaySeconds: Math.round(delaySeconds), title, body }),
    });
  } catch (_) {}
}
async function cancelPush() {
  if (!pushConfigured()) return;
  try {
    await fetch(PUSH_WORKER_URL + "/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({ id: pushClientId() }),
    });
  } catch (_) {}
}

// ---- training stats: streaks, weekly load, session log ---------------------
// History is keyed `sets:<dayKey>:<exId>` -> [{date, sets, durationS}]. Several
// exercises share one session date, so we regroup into whole-session records.
const DAY_MS = 86400000;
function dateToDayNum(d) {
  const [y, m, dd] = d.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, dd) / DAY_MS);
}
function computeStats(history) {
  const byKey = {}; // `${date}|${dayKey}` -> aggregated session
  for (const k of Object.keys(history)) {
    const dayKey = k.split(":")[1];
    for (const sess of history[k] || []) {
      const id = `${sess.date}|${dayKey}`;
      if (!byKey[id]) byKey[id] = { date: sess.date, dayKey, volume: 0, sets: 0 };
      for (const s of sess.sets) {
        byKey[id].volume += (s.weight || 0) * (s.reps || 0);
        byKey[id].sets += 1;
      }
    }
  }
  const sessions = Object.values(byKey).sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  const dates = [...new Set(sessions.map(s => s.date))].map(dateToDayNum).sort((a, b) => a - b);
  // day streak: consecutive calendar days with a session, ending today or yesterday
  let streak = 0;
  if (dates.length) {
    const today = Math.floor(Date.now() / DAY_MS);
    if (today - dates[dates.length - 1] <= 1) {
      streak = 1;
      for (let j = dates.length - 2; j >= 0; j--) {
        if (dates[j + 1] - dates[j] === 1) streak++;else break;
      }
    }
  }
  const weekAgo = Math.floor(Date.now() / DAY_MS) - 6;
  let weekCount = 0, weekVolume = 0;
  for (const s of sessions) {
    if (dateToDayNum(s.date) >= weekAgo) {
      weekCount++;
      weekVolume += s.volume;
    }
  }
  return { sessions, streak, weekCount, weekVolume };
}
function fmtVol(v) {
  return v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(Math.round(v));
}

// ---- rest timer with alarm + vibration + wake lock -------------------------
function RestTimer({
  seconds,
  onDone
}) {
  const endRef = useRef(Date.now() + seconds * 1000); // wall-clock target end
  const [left, setLeft] = useState(seconds);
  const wakeRef = useRef(null);
  const firedRef = useRef(false);
  useEffect(() => {
    // keep screen awake during rest if supported
    (async () => {
      try {
        if ("wakeLock" in navigator) wakeRef.current = await navigator.wakeLock.request("screen");
      } catch {}
    })();
    return () => {
      try {
        wakeRef.current && wakeRef.current.release();
      } catch {}
    };
  }, []);
  // queue a background push for when this rest ends (fires even if the phone is
  // locked / app closed). Cancelled if you advance while still in the app.
  useEffect(() => {
    schedulePush(seconds, "Rest's up", "Time for your next set 💪");
    return () => {
      cancelPush();
    };
  }, []);
  // drive the countdown from the wall clock and re-sync the instant the app
  // returns to the foreground. iOS freezes JS timers while the phone is locked,
  // so a plain per-second tick drifts; this snaps to the true remaining time.
  useEffect(() => {
    const sync = () => setLeft(Math.max(0, Math.round((endRef.current - Date.now()) / 1000)));
    sync();
    const iv = setInterval(sync, 250);
    const onVis = () => {
      if (!document.hidden) sync();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  useEffect(() => {
    if (left <= 0 && !firedRef.current) {
      firedRef.current = true;
      // if you're watching in-app, the beep is enough — drop the queued push
      try {
        if (typeof document !== "undefined" && !document.hidden) cancelPush();
      } catch {}
      // vibration
      try {
        if (navigator.vibrate) navigator.vibrate([300, 120, 300]);
      } catch {}
      // beep via WebAudio (no asset needed)
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const beep = (t, f) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = f;
          o.connect(g);
          g.connect(ctx.destination);
          g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.25);
          o.start(ctx.currentTime + t);
          o.stop(ctx.currentTime + t + 0.26);
        };
        beep(0, 880);
        beep(0.3, 1170);
      } catch {}
    }
  }, [left]);
  const mm = Math.floor(Math.max(left, 0) / 60);
  const ss = String(Math.max(left, 0) % 60).padStart(2, "0");
  const done = left <= 0;
  return /*#__PURE__*/React.createElement("div", {
    className: "step-rest"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rest-label"
  }, done ? "READY" : "REST"), /*#__PURE__*/React.createElement("div", {
    className: "rest-clock" + (done ? " rest-done" : "")
  }, done ? "GO" : `${mm}:${ss}`), /*#__PURE__*/React.createElement("p", {
    className: "rest-note"
  }, pushConfigured() && pushPermission() === "granted" ? "Lock-screen alarm is on — you'll get a buzz even if your phone is locked." : "Alarm + vibration fire while the app is open."), /*#__PURE__*/React.createElement("div", {
    className: "rest-controls"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      firedRef.current = false;
      endRef.current += 30000;
      const rem = Math.max(1, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(rem);
      schedulePush(rem, "Rest's up", "Time for your next set 💪");
    }
  }, "+30s"), /*#__PURE__*/React.createElement("button", {
    className: "rest-skip",
    onClick: () => {
      cancelPush();
      onDone();
    }
  }, done ? "Next set" : "Skip")), pushConfigured() && pushPermission() !== "granted" && /*#__PURE__*/React.createElement("button", {
    className: "rest-enable",
    onClick: async () => {
      const ok = await requestPushPermission();
      if (ok) schedulePush(Math.max(left, 1), "Rest's up", "Time for your next set 💪");
    }
  }, "🔔 Alarm me on the lock screen"));
}

// ---- guided session --------------------------------------------------------
function buildSteps(day) {
  const steps = [{
    type: "intro",
    title: day.name + " Day",
    sub: day.sub
  }];
  day.warmup.forEach((w, i) => steps.push({
    type: "warmup",
    w,
    n: i + 1,
    total: day.warmup.length
  }));
  day.exercises.forEach(ex => {
    steps.push({
      type: "ex_intro",
      ex
    });
    ex.sets.forEach((set, si) => {
      steps.push({
        type: "set",
        ex,
        set,
        setNum: si + 1,
        totalSets: ex.sets.length
      });
      if (set.rest) steps.push({
        type: "rest",
        seconds: set.rest
      });
    });
  });
  (day.stretches || []).forEach((s, i) => steps.push({
    type: "stretch",
    s,
    n: i + 1,
    total: day.stretches.length
  }));
  steps.push({
    type: "done",
    name: day.name
  });
  return steps;
}
function Session({
  dayKey,
  day,
  history,
  onSave,
  onExit
}) {
  const steps = useMemo(() => buildSteps(day), [day]);
  const [i, setI] = useState(0);
  const [logged, setLogged] = useState({}); // exId -> [{weight,reps,feeling}]
  const [summary, setSummary] = useState(null); // computed at finish for the done screen
  const startRef = useRef(Date.now());
  const step = steps[i];
  const next = useCallback(() => setI(x => Math.min(x + 1, steps.length - 1)), [steps.length]);
  const back = useCallback(() => setI(x => Math.max(x - 1, 0)), []);
  const pct = Math.round(i / (steps.length - 1) * 100);
  const lastForEx = exId => {
    const h = history[`sets:${dayKey}:${exId}`];
    return h && h.length ? h[h.length - 1] : null;
  };
  const logSet = (exId, setIdx, val) => {
    setLogged(prev => {
      const arr = prev[exId] ? [...prev[exId]] : [];
      arr[setIdx] = val;
      return {
        ...prev,
        [exId]: arr
      };
    });
  };
  const finish = async () => {
    const durationS = Math.round((Date.now() - startRef.current) / 1000);
    // build the done-screen summary BEFORE saving, so PRs compare against
    // prior history (onSave merges this session into history).
    const flat = Object.values(logged).flat().filter(Boolean);
    const volume = flat.reduce((a, s) => a + (s.weight || 0) * (s.reps || 0), 0);
    const setCount = flat.length;
    const prs = [];
    for (const ex of day.exercises) {
      const mine = (logged[ex.id] || []).filter(Boolean);
      if (!mine.length) continue;
      const myBest = Math.max(...mine.map(s => s.weight || 0));
      if (myBest <= 0) continue;
      let prevBest = 0;
      (history[`sets:${dayKey}:${ex.id}`] || []).forEach(se => se.sets.forEach(s => {
        if ((s.weight || 0) > prevBest) prevBest = s.weight || 0;
      }));
      if (myBest > prevBest) prs.push({ name: ex.name, weight: myBest });
    }
    setSummary({ volume, setCount, prs, durationS });
    await onSave(logged, durationS);
    next();
  };
  let body;
  if (step.type === "intro") {
    body = /*#__PURE__*/React.createElement("div", {
      className: "step"
    }, /*#__PURE__*/React.createElement("span", {
      className: "eyebrow"
    }, "Let's go"), /*#__PURE__*/React.createElement("h1", null, step.title), /*#__PURE__*/React.createElement("p", null, step.sub), /*#__PURE__*/React.createElement("p", {
      className: "note"
    }, "One step at a time. Tap next when ready. Log every working set with how it felt."));
  } else if (step.type === "warmup") {
    body = /*#__PURE__*/React.createElement("div", {
      className: "step"
    }, /*#__PURE__*/React.createElement("span", {
      className: "eyebrow"
    }, "Warm-up · ", step.n, "/", step.total), /*#__PURE__*/React.createElement("h2", null, step.w.name), /*#__PURE__*/React.createElement(Demo, {
      demoKey: step.w.demo,
      video: step.w.video
    }), /*#__PURE__*/React.createElement("p", {
      className: "detail"
    }, step.w.detail));
  } else if (step.type === "ex_intro") {
    const last = lastForEx(step.ex.id);
    body = /*#__PURE__*/React.createElement("div", {
      className: "step"
    }, /*#__PURE__*/React.createElement("span", {
      className: "eyebrow"
    }, step.ex.power ? "Power lift" : step.ex.abs ? "Core" : "Exercise"), /*#__PURE__*/React.createElement("h2", null, step.ex.name), /*#__PURE__*/React.createElement(Demo, {
      demoKey: step.ex.demo,
      video: step.ex.video
    }), step.ex.cue && /*#__PURE__*/React.createElement("p", {
      className: "detail"
    }, step.ex.cue), last && /*#__PURE__*/React.createElement("p", {
      className: "lasttime"
    }, "Last: ", last.sets.map(s => `${s.weight ?? "?"}×${s.reps ?? "?"}`).join(", ")));
  } else if (step.type === "set") {
    body = /*#__PURE__*/React.createElement(SetStep, {
      dayKey: dayKey,
      ex: step.ex,
      set: step.set,
      setNum: step.setNum,
      total: step.totalSets,
      last: lastForEx(step.ex.id),
      value: logged[step.ex.id]?.[step.setNum - 1],
      onLog: v => logSet(step.ex.id, step.setNum - 1, v)
    });
  } else if (step.type === "rest") {
    body = /*#__PURE__*/React.createElement(RestTimer, {
      key: i,
      seconds: step.seconds,
      onDone: next
    });
  } else if (step.type === "stretch") {
    body = /*#__PURE__*/React.createElement("div", {
      className: "step"
    }, /*#__PURE__*/React.createElement("span", {
      className: "eyebrow"
    }, "Cooldown · ", step.n, "/", step.total), /*#__PURE__*/React.createElement("h2", null, step.s.name), /*#__PURE__*/React.createElement(Demo, {
      demoKey: step.s.demo,
      video: step.s.video
    }), /*#__PURE__*/React.createElement("p", {
      className: "detail"
    }, step.s.detail));
  } else if (step.type === "done") {
    const mm = summary ? Math.floor(summary.durationS / 60) : 0;
    const ss = summary ? String(summary.durationS % 60).padStart(2, "0") : "00";
    body = /*#__PURE__*/React.createElement("div", {
      className: "step"
    }, /*#__PURE__*/React.createElement("span", {
      className: "eyebrow"
    }, "Done"), /*#__PURE__*/React.createElement("h1", null, "Session saved"), summary && summary.prs.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "prbanner"
    }, "🏆 New PR — ", summary.prs.map(p => `${p.name} ${p.weight}kg`).join(" · ")), summary && /*#__PURE__*/React.createElement("div", {
      className: "donestats"
    }, /*#__PURE__*/React.createElement("div", {
      className: "donestat"
    }, /*#__PURE__*/React.createElement("span", {
      className: "stat-num"
    }, fmtVol(summary.volume)), /*#__PURE__*/React.createElement("span", {
      className: "stat-label"
    }, "kg volume")), /*#__PURE__*/React.createElement("div", {
      className: "donestat"
    }, /*#__PURE__*/React.createElement("span", {
      className: "stat-num"
    }, summary.setCount), /*#__PURE__*/React.createElement("span", {
      className: "stat-label"
    }, "sets")), /*#__PURE__*/React.createElement("div", {
      className: "donestat"
    }, /*#__PURE__*/React.createElement("span", {
      className: "stat-num"
    }, mm, ":", ss), /*#__PURE__*/React.createElement("span", {
      className: "stat-label"
    }, "time"))), /*#__PURE__*/React.createElement("p", null, step.name, " day logged. Next up in your cycle is ready."), /*#__PURE__*/React.createElement("button", {
      className: "big",
      onClick: onExit
    }, "Back to schedule"));
  }
  const isLastBeforeDone = steps[i + 1] && steps[i + 1].type === "done";
  return /*#__PURE__*/React.createElement("div", {
    className: "session accent-" + day.accent
  }, /*#__PURE__*/React.createElement("div", {
    className: "session-top"
  }, /*#__PURE__*/React.createElement("button", {
    className: "exit",
    onClick: onExit
  }, "✕"), /*#__PURE__*/React.createElement("div", {
    className: "pbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pfill",
    style: {
      width: pct + "%"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "session-body"
  }, body), step.type !== "rest" && step.type !== "done" && /*#__PURE__*/React.createElement("div", {
    className: "nav"
  }, i > 0 && /*#__PURE__*/React.createElement("button", {
    className: "back",
    onClick: back
  }, "Back"), isLastBeforeDone ? /*#__PURE__*/React.createElement("button", {
    className: "nextbtn",
    onClick: finish
  }, "Finish & save") : /*#__PURE__*/React.createElement("button", {
    className: "nextbtn",
    onClick: next
  }, step.type === "intro" ? "Start" : "Next")));
}
function SetStep({
  ex,
  set,
  setNum,
  total,
  last,
  value,
  onLog
}) {
  const lastSet = last?.sets?.[setNum - 1];
  const suggested = lastSet ? suggestNext(lastSet.weight, lastSet.feeling) : null;
  const [w, setW] = useState(value?.weight != null ? String(value.weight) : set.weight !== 0 || ex.power ? suggested ?? set.weight ?? "" : "");
  const [r, setR] = useState(value?.reps != null ? String(value.reps) : String(set.reps ?? ""));
  const [feeling, setFeeling] = useState(value?.feeling || null);
  const commit = f => {
    const fl = f ?? feeling;
    setFeeling(fl);
    onLog({
      weight: w === "" ? null : Number(w),
      reps: r === "" ? null : Number(r),
      feeling: fl
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "step"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, ex.name, " · set ", setNum, "/", total, set.warmup ? " · warm-up" : ""), /*#__PURE__*/React.createElement("div", {
    className: "setbox"
  }, /*#__PURE__*/React.createElement("div", {
    className: "setbox-row"
  }, /*#__PURE__*/React.createElement("label", null, "kg"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    inputMode: "decimal",
    value: w,
    onChange: e => {
      setW(e.target.value);
    },
    onBlur: () => commit()
  })), /*#__PURE__*/React.createElement("div", {
    className: "setbox-row"
  }, /*#__PURE__*/React.createElement("label", null, "reps"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    inputMode: "numeric",
    value: r,
    onChange: e => {
      setR(e.target.value);
    },
    onBlur: () => commit()
  }))), lastSet && /*#__PURE__*/React.createElement("p", {
    className: "lasttime"
  }, "Last: ", lastSet.weight ?? "?", "×", lastSet.reps ?? "?", suggested != null ? ` · try ${suggested}kg` : ""), /*#__PURE__*/React.createElement(Demo, {
    demoKey: ex.demo,
    video: ex.video
  }), ex.cue && /*#__PURE__*/React.createElement("p", {
    className: "detail"
  }, ex.cue), !set.warmup && /*#__PURE__*/React.createElement("div", {
    className: "feelings"
  }, FEELINGS.map(f => /*#__PURE__*/React.createElement("button", {
    key: f.key,
    className: "feel" + (feeling === f.key ? " feel-on" : ""),
    onClick: () => commit(f.key)
  }, /*#__PURE__*/React.createElement("span", {
    className: "feel-icon"
  }, f.icon), /*#__PURE__*/React.createElement("span", {
    className: "feel-label"
  }, f.label)))));
}

// ---- schedule --------------------------------------------------------------
function Schedule({
  program,
  cyclePos,
  cycleDays,
  history,
  onStart,
  onRemoveDay,
  onAddDay,
  onDeleteSession
}) {
  // Rolling queue over the ACTIVE days. Position 0 is up next; the rest show
  // the order ahead. Days can be dropped from the cycle (✕) and added back.
  const days = cycleDays && cycleDays.length ? cycleDays : PPL;
  const len = days.length;
  const order = days.map((_, i) => days[(cyclePos + i) % len]);
  const removed = PPL.filter(k => !days.includes(k));
  const stats = useMemo(() => computeStats(history), [history]);
  const recent = stats.sessions.slice(0, 5);
  const stat = (num, label) => /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("span", {
    className: "stat-num"
  }, num), /*#__PURE__*/React.createElement("span", {
    className: "stat-label"
  }, label));
  return /*#__PURE__*/React.createElement("div", {
    className: "schedule"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "big-title"
  }, "Your cycle"), /*#__PURE__*/React.createElement("p", {
    className: "muted"
  }, days.map(k => program[k].name).join(" → "), ", on repeat. Train any day — just keep the order."), /*#__PURE__*/React.createElement("div", {
    className: "statbar"
  }, stat((stats.streak > 0 ? "🔥 " : "") + stats.streak, "day streak"), stat(stats.weekCount, "this week"), stat(fmtVol(stats.weekVolume), "kg this wk")), order.map((key, i) => {
    const p = program[key];
    return /*#__PURE__*/React.createElement("div", {
      key: key,
      className: "srow" + (i === 0 ? " stoday" : " supcoming")
    }, /*#__PURE__*/React.createElement("div", {
      className: "sdate"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sday"
    }, i === 0 ? "UP NEXT" : "THEN")), /*#__PURE__*/React.createElement("div", {
      className: "sinfo"
    }, /*#__PURE__*/React.createElement("span", {
      className: "sname"
    }, p.name), /*#__PURE__*/React.createElement("span", {
      className: "smeta"
    }, p.sub)), /*#__PURE__*/React.createElement("div", {
      className: "srow-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: i === 0 ? "sgo" : "sgo sgo-ghost",
      onClick: () => onStart(key)
    }, "Start"), len > 1 && /*#__PURE__*/React.createElement("button", {
      className: "sremove",
      title: "Remove from cycle",
      "aria-label": "Remove " + p.name + " from cycle",
      onClick: () => onRemoveDay(key)
    }, "✕")));
  }), removed.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "removed-cycle"
  }, /*#__PURE__*/React.createElement("p", {
    className: "chart-cap"
  }, "Not in cycle"), removed.map(key => /*#__PURE__*/React.createElement("div", {
    key: key,
    className: "srow supcoming"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sinfo"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sname"
  }, program[key].name), /*#__PURE__*/React.createElement("span", {
    className: "smeta"
  }, program[key].sub)), /*#__PURE__*/React.createElement("button", {
    className: "sgo sgo-ghost",
    onClick: () => onAddDay(key)
  }, "Add back")))), recent.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "slog"
  }, /*#__PURE__*/React.createElement("p", {
    className: "chart-cap"
  }, "Recent sessions"), recent.map((s, k) => /*#__PURE__*/React.createElement("div", {
    className: "slog-row",
    key: k
  }, /*#__PURE__*/React.createElement("div", {
    className: "slog-info"
  }, /*#__PURE__*/React.createElement("span", {
    className: "slog-name"
  }, program[s.dayKey] ? program[s.dayKey].name : s.dayKey), /*#__PURE__*/React.createElement("span", {
    className: "slog-meta"
  }, new Date(s.date + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  }), " · ", s.sets, " sets · ", fmtVol(s.volume), " kg")), /*#__PURE__*/React.createElement("button", {
    className: "sremove",
    title: "Delete this session",
    "aria-label": "Delete session",
    onClick: () => {
      const label = (program[s.dayKey] ? program[s.dayKey].name : s.dayKey) + " · " + new Date(s.date + "T00:00:00").toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
      });
      if (window.confirm("Delete this logged session?\n\n" + label + "\n\nThis removes it from your progress/charts and can't be undone.")) onDeleteSession(s.dayKey, s.date);
    }
  }, "🗑")))));
}

// ---- progress / charts -----------------------------------------------------
function Progress({
  history
}) {
  const canvasRef = useRef(null);
  const volRef = useRef(null);
  const [exKey, setExKey] = useState(null);
  const exOptions = useMemo(() => {
    return Object.keys(history).filter(k => history[k] && history[k].length).map(k => {
      const [, dayKey, exId] = k.split(":");
      const ex = DEFAULT_PROGRAM[dayKey]?.exercises.find(e => e.id === exId);
      return {
        key: k,
        name: ex?.name || exId
      };
    });
  }, [history]);
  useEffect(() => {
    if (!exKey && exOptions.length) setExKey(exOptions[0].key);
  }, [exOptions, exKey]);
  useEffect(() => {
    if (!exKey || !window.Chart) return;
    const sessions = history[exKey] || [];
    const labels = sessions.map(s => s.date.slice(5));
    const topWeight = sessions.map(s => Math.max(...s.sets.map(x => x.weight || 0)));
    const volume = sessions.map(s => s.sets.reduce((a, x) => a + (x.weight || 0) * (x.reps || 0), 0));
    const mk = (ref, label, data, color, kind) => {
      if (!ref.current) return;
      if (ref.current._chart) ref.current._chart.destroy();
      ref.current._chart = new window.Chart(ref.current, {
        type: kind,
        data: {
          labels,
          datasets: [{
            label,
            data,
            borderColor: color,
            backgroundColor: color,
            tension: 0.3,
            fill: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              }
            },
            y: {
              beginAtZero: false
            }
          }
        }
      });
    };
    mk(canvasRef, "Top weight", topWeight, "#c7b3ff", "line");
    mk(volRef, "Volume", volume, "#d8ff3e", "bar");
  }, [exKey, history]);

  // PR detection
  const pr = useMemo(() => {
    if (!exKey) return null;
    const s = history[exKey] || [];
    let best = 0,
      when = "";
    s.forEach(sess => sess.sets.forEach(x => {
      if ((x.weight || 0) > best) {
        best = x.weight || 0;
        when = sess.date;
      }
    }));
    return best ? {
      best,
      when
    } : null;
  }, [exKey, history]);

  // fatigue flag: last 3 sessions trending grind/fail
  const fatigue = useMemo(() => {
    if (!exKey) return false;
    const s = (history[exKey] || []).slice(-3);
    if (s.length < 3) return false;
    const hard = s.filter(sess => sess.sets.some(x => x.feeling === "grind" || x.feeling === "fail")).length;
    return hard >= 3;
  }, [exKey, history]);
  if (!exOptions.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "empty"
    }, /*#__PURE__*/React.createElement("p", null, "No sessions logged yet."), /*#__PURE__*/React.createElement("p", {
      className: "muted"
    }, "Finish a workout and your charts appear here."));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "progress"
  }, /*#__PURE__*/React.createElement("select", {
    value: exKey || "",
    onChange: e => setExKey(e.target.value),
    className: "ex-select"
  }, exOptions.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.key,
    value: o.key
  }, o.name))), pr && /*#__PURE__*/React.createElement("div", {
    className: "pr"
  }, "PR: ", pr.best, " kg ", /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "(", pr.when, ")")), fatigue && /*#__PURE__*/React.createElement("div", {
    className: "fatigue"
  }, "You've ground the last 3 sessions. Consider a lighter week."), /*#__PURE__*/React.createElement("p", {
    className: "chart-cap"
  }, "Top weight over time"), /*#__PURE__*/React.createElement("div", {
    className: "chart-wrap"
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: canvasRef,
    role: "img",
    "aria-label": "Top weight over time"
  })), /*#__PURE__*/React.createElement("p", {
    className: "chart-cap"
  }, "Volume over time"), /*#__PURE__*/React.createElement("div", {
    className: "chart-wrap"
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: volRef,
    role: "img",
    "aria-label": "Training volume over time"
  })));
}

// ---- editor ----------------------------------------------------------------
function Editor({
  program,
  onChange
}) {
  const [dayKey, setDayKey] = useState("push");
  const day = program[dayKey];
  const update = fn => {
    const copy = JSON.parse(JSON.stringify(program));
    fn(copy[dayKey]);
    onChange(copy);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "editor"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "big-title"
  }, "Edit program"), /*#__PURE__*/React.createElement("div", {
    className: "daynav"
  }, ["push", "pull", "legs"].map(d => /*#__PURE__*/React.createElement("button", {
    key: d,
    className: "daytab" + (d === dayKey ? " active" : ""),
    onClick: () => setDayKey(d)
  }, program[d].name))), /*#__PURE__*/React.createElement("button", {
    className: "ed-reset",
    onClick: () => {
      if (window.confirm("Reset " + day.name + " to the default program?\n\nThis restores the original exercises, sets, reps and rest timers for this day. Your other days are untouched.")) {
        const copy = JSON.parse(JSON.stringify(program));
        copy[dayKey] = JSON.parse(JSON.stringify(DEFAULT_PROGRAM[dayKey]));
        onChange(copy);
      }
    }
  }, "↺ Reset ", day.name, " to default"), day.exercises.map((ex, ei) => /*#__PURE__*/React.createElement("div", {
    key: ex.id,
    className: "ed-ex"
  }, /*#__PURE__*/React.createElement("input", {
    className: "ed-name",
    value: ex.name,
    onChange: e => update(d => {
      d.exercises[ei].name = e.target.value;
    })
  }), ex.sets.map((s, si) => /*#__PURE__*/React.createElement("div", {
    key: si,
    className: "ed-set"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ed-tag"
  }, s.warmup ? "W" : si + 1), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: s.weight ?? "",
    placeholder: "kg",
    onChange: e => update(d => {
      d.exercises[ei].sets[si].weight = e.target.value === "" ? null : Number(e.target.value);
    })
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: s.reps ?? "",
    placeholder: "reps",
    onChange: e => update(d => {
      d.exercises[ei].sets[si].reps = e.target.value === "" ? null : Number(e.target.value);
    })
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: s.rest ?? "",
    placeholder: "rest s",
    onChange: e => update(d => {
      d.exercises[ei].sets[si].rest = e.target.value === "" ? null : Number(e.target.value);
    })
  }), /*#__PURE__*/React.createElement("button", {
    className: "ed-del",
    onClick: () => update(d => {
      d.exercises[ei].sets.splice(si, 1);
    })
  }, "✕"))), /*#__PURE__*/React.createElement("button", {
    className: "ed-add",
    onClick: () => update(d => {
      const last = d.exercises[ei].sets.slice(-1)[0] || {
        weight: 0,
        reps: 8,
        rest: 90
      };
      d.exercises[ei].sets.push({
        ...last
      });
    })
  }, "+ set"))));
}

// ============================================================================
// ROOT
// ============================================================================
function App({
  onSignOut
}) {
  const [program, setProgram] = useState(DEFAULT_PROGRAM);
  const [history, setHistory] = useState({});
  const [cyclePos, setCyclePos] = useState(0); // index into cycleDays: which workout is up next
  const [cycleDays, setCycleDays] = useState(PPL); // active days in the rotation (subset of PPL, in order)
  const [view, setView] = useState("schedule"); // schedule | progress | edit
  const [active, setActive] = useState(null);
  const [ready, setReady] = useState(false);

  // inject styles into <head> ONCE so they apply to every return path
  // (session, loading, and main views), not just the main return.
  useEffect(() => {
    if (!document.getElementById("protocol-styles")) {
      const tag = document.createElement("style");
      tag.id = "protocol-styles";
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }
  }, []);
  useEffect(() => {
    (async () => {
      const savedProg = await store.get("program");
      const savedVer = await store.get("programVersion");
      // only honor a saved program if it matches the current structure version;
      // otherwise it's stale (e.g. missing rest timers) — fall back to the built-in.
      if (savedProg && savedVer === PROGRAM_VERSION) setProgram(savedProg);else if (savedProg) {
        await store.del("program");
        await store.del("programVersion");
      }
      const savedPos = await store.get("cyclePos");
      if (typeof savedPos === "number") setCyclePos(savedPos);
      const savedDays = await store.get("cycleDays");
      if (Array.isArray(savedDays)) {
        const valid = savedDays.filter(k => PPL.includes(k));
        if (valid.length) setCycleDays(valid);
      }
      const keys = await store.list("sets:");
      const h = {};
      for (const k of keys) {
        const v = await store.get(k);
        if (v) h[k] = v;
      }
      setHistory(h);
      // load chart.js
      if (!window.Chart) {
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
        document.head.appendChild(s);
      }
      setReady(true);
    })();
  }, []);
  const saveProgram = async p => {
    setProgram(p);
    await store.set("program", p);
    await store.set("programVersion", PROGRAM_VERSION);
  };
  const saveSession = async (logged, durationS) => {
    const dayKey = active;
    const stamp = new Date().toISOString().slice(0, 10);
    const newH = {
      ...history
    };
    for (const [exId, sets] of Object.entries(logged)) {
      const clean = sets.filter(Boolean);
      if (!clean.length) continue;
      const key = `sets:${dayKey}:${exId}`;
      const hist = newH[key] ? [...newH[key]] : [];
      hist.push({
        date: stamp,
        sets: clean,
        durationS
      });
      newH[key] = hist;
      await store.set(key, hist);
    }
    setHistory(newH);
    // advance the cycle: next up is whatever follows the one just finished,
    // among the ACTIVE days, so the order is always preserved.
    const base = cycleDays.includes(dayKey) ? cycleDays : PPL;
    const nextPos = (base.indexOf(dayKey) + 1) % base.length;
    setCyclePos(nextPos);
    await store.set("cyclePos", nextPos);
  };
  // drop a day from the rotation (keep at least one), preserving what's "up next"
  const removeDay = async key => {
    if (cycleDays.length <= 1) return;
    const upNext = cycleDays[cyclePos % cycleDays.length];
    const newDays = cycleDays.filter(k => k !== key);
    let newPos = newDays.indexOf(upNext);
    if (newPos < 0) newPos = cyclePos % newDays.length; // removed the up-next day
    setCycleDays(newDays);
    setCyclePos(newPos);
    await store.set("cycleDays", newDays);
    await store.set("cyclePos", newPos);
  };
  // add a day back, re-inserting it in canonical Push → Pull → Legs order
  const addDay = async key => {
    if (cycleDays.includes(key)) return;
    const upNext = cycleDays.length ? cycleDays[cyclePos % cycleDays.length] : key;
    const newDays = PPL.filter(k => cycleDays.includes(k) || k === key);
    const newPos = Math.max(0, newDays.indexOf(upNext));
    setCycleDays(newDays);
    setCyclePos(newPos);
    await store.set("cycleDays", newDays);
    await store.set("cyclePos", newPos);
  };
  // delete a logged session (a date+day) from history — clears the stored
  // progress/charts data for those exercises on that date.
  const deleteSession = async (dayKey, date) => {
    const newH = { ...history };
    const prefix = `sets:${dayKey}:`;
    for (const k of Object.keys(newH)) {
      if (!k.startsWith(prefix)) continue;
      const filtered = newH[k].filter(s => s.date !== date);
      if (filtered.length) {
        newH[k] = filtered;
        await store.set(k, filtered);
      } else {
        delete newH[k];
        await store.del(k);
      }
    }
    setHistory(newH);
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify({
      program,
      history
    }, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "protocol-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };
  if (!ready) return /*#__PURE__*/React.createElement("div", {
    className: "app loading"
  }, "Loading…");
  if (active) return /*#__PURE__*/React.createElement(Session, {
    dayKey: active,
    day: program[active],
    history: history,
    onSave: saveSession,
    onExit: () => {
      setActive(null);
      setView("schedule");
    }
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "app accent-aesthetic"
  }, /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mark"
  }, "▲"), /*#__PURE__*/React.createElement("span", {
    className: "bname"
  }, "PROTOCOL")), /*#__PURE__*/React.createElement("div", {
    className: "topbar-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "export",
    onClick: exportData
  }, "Export"), onSignOut && /*#__PURE__*/React.createElement("button", {
    className: "export",
    onClick: onSignOut
  }, "Sign out"))), /*#__PURE__*/React.createElement("nav", {
    className: "tabs"
  }, [["schedule", "Today"], ["progress", "Progress"], ["edit", "Edit"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: "tab" + (view === k ? " on" : ""),
    onClick: () => setView(k)
  }, l))), /*#__PURE__*/React.createElement("main", null, view === "schedule" && /*#__PURE__*/React.createElement(Schedule, {
    program: program,
    cyclePos: cyclePos,
    cycleDays: cycleDays,
    history: history,
    onStart: k => setActive(k),
    onRemoveDay: removeDay,
    onAddDay: addDay,
    onDeleteSession: deleteSession
  }), view === "progress" && /*#__PURE__*/React.createElement(Progress, {
    history: history
  }), view === "edit" && /*#__PURE__*/React.createElement(Editor, {
    program: program,
    onChange: saveProgram
  })));
}
const CSS = `
* { box-sizing:border-box; -webkit-tap-highlight-color:transparent; margin:0; padding:0; }
.app,.session,.gate { --bg:#0c0d10; --surface:#15171c; --surface-2:#1c1f26; --line:#2a2e38; --text:#f2f3f5; --muted:#888e9c; --aesthetic:#c7b3ff; --power:#d8ff3e; --accent:var(--aesthetic);
  min-height:100vh; background:var(--bg); color:var(--text); font-family:'Inter',system-ui,sans-serif; max-width:520px; margin:0 auto; }
.accent-power{--accent:var(--power);} .accent-aesthetic{--accent:var(--aesthetic);}
.loading{display:flex;align-items:center;justify-content:center;min-height:100vh;color:var(--muted);}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--line);}
.brand{display:flex;align-items:center;gap:8px;} .mark{color:var(--accent);} .bname{font-weight:800;letter-spacing:0.22em;font-size:13px;}
.export{background:transparent;border:1px solid var(--line);color:var(--text);padding:7px 14px;border-radius:100px;font-size:12px;font-weight:600;cursor:pointer;}
.tabs{display:flex;gap:6px;padding:12px 18px 4px;}
.tab{flex:1;background:var(--surface);border:1px solid var(--line);color:var(--muted);padding:10px 0;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;}
.tab.on{background:var(--accent);color:var(--bg);border-color:var(--accent);}
main{padding:14px 18px 40px;}
.big-title{font-size:28px;font-weight:850;letter-spacing:-0.02em;} .muted{color:var(--muted);font-size:13px;}
.srow{display:flex;align-items:center;gap:14px;padding:15px;background:var(--surface);border:1px solid var(--line);border-radius:14px;margin-top:10px;}
.stoday{border-color:var(--accent);background:var(--surface-2);} .srest{opacity:0.55;}
.sdate{display:flex;flex-direction:column;align-items:center;width:46px;flex-shrink:0;}
.sday{font-size:10px;font-weight:800;letter-spacing:0.08em;color:var(--muted);} .stoday .sday{color:var(--accent);}
.snum{font-size:23px;font-weight:800;line-height:1;} .sinfo{flex:1;display:flex;flex-direction:column;}
.sname{font-size:16px;font-weight:750;} .smeta{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;}
.sgo{background:var(--accent);color:var(--bg);border:none;border-radius:100px;padding:10px 20px;font-weight:800;cursor:pointer;}
.sgo-ghost{background:var(--surface-2);color:var(--text);border:1px solid var(--line);}
.supcoming{opacity:0.62;}
.srow-actions{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.sremove{background:transparent;border:1px solid var(--line);color:var(--muted);width:32px;height:32px;border-radius:9px;cursor:pointer;font-size:13px;line-height:1;flex-shrink:0;}
.removed-cycle{margin-top:18px;}
.ed-reset{width:100%;background:var(--surface-2);border:1px solid var(--line);color:var(--muted);padding:11px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;margin-bottom:14px;}
.statbar{display:flex;gap:10px;margin:14px 0 4px;}
.stat{flex:1;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:14px 6px;display:flex;flex-direction:column;align-items:center;gap:3px;}
.stat-num{font-size:22px;font-weight:850;letter-spacing:-0.02em;}
.stat-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;text-align:center;}
.slog{margin-top:22px;}
.slog-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;background:var(--surface);border:1px solid var(--line);border-radius:12px;margin-top:8px;}
.slog-info{display:flex;flex-direction:column;gap:2px;min-width:0;}
.slog-name{font-size:14px;font-weight:750;}
.slog-meta{font-size:11px;color:var(--muted);}
.donestats{display:flex;gap:10px;margin:18px 0;}
.donestat{flex:1;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:16px 6px;display:flex;flex-direction:column;align-items:center;gap:3px;}
.prbanner{background:var(--surface-2);border:1px solid var(--accent);color:var(--text);border-radius:12px;padding:12px 14px;font-weight:800;font-size:14px;margin:16px 0 2px;}
.session{display:flex;flex-direction:column;min-height:100vh;}
.session-top{display:flex;align-items:center;gap:14px;padding:16px 18px;}
.exit{background:var(--surface-2);border:1px solid var(--line);color:var(--text);width:34px;height:34px;border-radius:10px;cursor:pointer;flex-shrink:0;}
.pbar{flex:1;height:6px;background:var(--surface-2);border-radius:100px;overflow:hidden;} .pfill{height:100%;background:var(--accent);transition:width .3s;}
.session-body{flex:1;display:flex;align-items:center;justify-content:center;padding:8px 22px;}
.step{width:100%;text-align:center;} .eyebrow{font-size:12px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);}
.step h1{font-size:40px;font-weight:850;letter-spacing:-0.03em;margin:10px 0 6px;line-height:1;} .step h2{font-size:27px;font-weight:800;margin:10px 0 4px;}
.step p{color:var(--muted);font-size:14px;} .detail{color:var(--text)!important;opacity:0.85;margin-top:12px;font-size:15px;max-width:320px;margin-left:auto;margin-right:auto;}
.note{margin-top:16px;} .lasttime{color:var(--accent)!important;font-size:13px;margin-top:10px;font-weight:600;}
.demo{margin:18px auto;max-width:240px;} .demo-media{width:100%;background:var(--surface);border:1px solid var(--line);border-radius:16px;display:block;}
.demo-label{display:block;margin-top:8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:var(--accent);}
.setbox{display:flex;gap:10px;justify-content:center;margin:16px 0;}
.setbox-row{display:flex;flex-direction:column;align-items:center;gap:4px;}
.setbox-row label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;}
.setbox-row input{width:124px;background:var(--surface);border:1px solid var(--accent);color:var(--text);border-radius:14px;padding:16px 12px;font-size:30px;font-weight:800;text-align:center;font-variant-numeric:tabular-nums;-moz-appearance:textfield;appearance:textfield;}
.setbox-row input::-webkit-outer-spin-button,.setbox-row input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.setbox-row input:focus{outline:none;}
.feelings{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px;max-width:320px;margin-left:auto;margin-right:auto;}
.feel{display:flex;align-items:center;gap:8px;justify-content:center;background:var(--surface);border:1px solid var(--line);color:var(--text);padding:12px;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer;}
.feel-on{border-color:var(--accent);background:var(--surface-2);} .feel-icon{font-size:16px;color:var(--accent);}
.nav{display:flex;gap:10px;padding:18px 18px 28px;}
.back{background:var(--surface-2);border:1px solid var(--line);color:var(--text);padding:16px 22px;border-radius:14px;font-weight:700;cursor:pointer;}
.nextbtn{flex:1;background:var(--accent);color:var(--bg);border:none;border-radius:14px;padding:16px;font-weight:800;font-size:16px;cursor:pointer;}
.big{margin-top:22px;background:var(--accent);color:var(--bg);border:none;border-radius:14px;padding:15px 28px;font-weight:800;cursor:pointer;}
.step-rest{text-align:center;width:100%;} .rest-label{font-size:13px;font-weight:800;letter-spacing:0.3em;color:var(--accent);}
.rest-clock{font-size:84px;font-weight:850;letter-spacing:-0.04em;font-variant-numeric:tabular-nums;} .rest-done{color:var(--power);}
.rest-note{font-size:11px;color:var(--muted);max-width:280px;margin:6px auto 0;}
.rest-controls{display:flex;gap:12px;justify-content:center;margin-top:18px;}
.rest-controls button{background:var(--surface-2);border:1px solid var(--line);color:var(--text);padding:13px 26px;border-radius:100px;font-weight:700;cursor:pointer;}
.rest-skip{background:var(--accent)!important;color:var(--bg)!important;border:none!important;}
.rest-enable{display:block;margin:16px auto 0;background:transparent;border:1px solid var(--accent);color:var(--accent);padding:11px 20px;border-radius:100px;font-weight:700;font-size:13px;cursor:pointer;}
.progress,.editor{padding-top:6px;}
.ex-select{width:100%;background:var(--surface);border:1px solid var(--line);color:var(--text);padding:12px;border-radius:12px;font-size:15px;font-weight:600;margin-bottom:14px;}
.pr{background:var(--surface-2);border:1px solid var(--accent);border-radius:12px;padding:12px 14px;font-weight:800;margin-bottom:10px;}
.fatigue{background:var(--surface);border:1px solid var(--power);border-radius:12px;padding:12px 14px;color:var(--power);font-size:13px;font-weight:600;margin-bottom:14px;}
.chart-cap{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;margin:14px 0 8px;}
.chart-wrap{position:relative;height:200px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:10px;}
.empty{text-align:center;padding:60px 20px;color:var(--muted);}
.daynav{display:flex;gap:6px;margin:12px 0;}
.daytab{flex:1;background:var(--surface);border:1px solid var(--line);color:var(--muted);padding:10px 0;border-radius:10px;font-weight:700;cursor:pointer;}
.daytab.active{background:var(--accent);color:var(--bg);border-color:var(--accent);}
.ed-ex{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:12px;margin-bottom:12px;}
.ed-name{width:100%;background:var(--surface-2);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:10px;font-size:15px;font-weight:700;margin-bottom:8px;}
.ed-set{display:flex;align-items:center;gap:6px;margin-bottom:6px;}
.ed-tag{width:22px;height:22px;flex-shrink:0;border-radius:6px;background:var(--line);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;}
.ed-set input{flex:1;width:100%;min-width:0;background:var(--surface-2);border:1px solid var(--line);color:var(--text);border-radius:8px;padding:9px;font-size:13px;text-align:center;}
.ed-del{background:var(--surface-2);border:1px solid var(--line);color:var(--muted);width:30px;height:30px;border-radius:8px;cursor:pointer;flex-shrink:0;}
.ed-add{background:transparent;border:1px dashed var(--line);color:var(--accent);width:100%;padding:9px;border-radius:8px;font-weight:700;cursor:pointer;margin-top:4px;}
@media (prefers-reduced-motion: reduce){*{animation:none!important;}}
.topbar-actions{display:flex;gap:8px;align-items:center;}
.gate{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg);}
.gate-card{width:100%;max-width:360px;background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:36px 28px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;}
.gate-mark{font-size:34px;color:var(--accent);}
.gate-title{font-size:24px;font-weight:850;letter-spacing:0.04em;}
.gate-sub{color:var(--muted);font-size:14px;line-height:1.4;}
.gate-btn{margin-top:8px;background:var(--accent);color:var(--bg);border:none;border-radius:100px;padding:14px 26px;font-weight:800;font-size:15px;cursor:pointer;}
.gate-err{color:var(--power);font-size:12px;margin-top:4px;word-break:break-word;}
`;
// inject styles once at load so the auth gate (which renders before <App/>)
// is styled too, not just the main app.
(function injectStyles() {
  if (!document.getElementById("protocol-styles")) {
    const tag = document.createElement("style");
    tag.id = "protocol-styles";
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }
})();

// ---- auth gate: Google sign-in, single allowed account --------------------
const ALLOWED_EMAIL = "kabirtkhan@gmail.com";
function AuthGate() {
  const [phase, setPhase] = useState("loading"); // loading | signedout | denied | ok
  const [email, setEmail] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (!window.firebase || !window.FIREBASE_CONFIG) {
      setErr("Sign-in is not configured yet.");
      setPhase("signedout");
      return;
    }
    if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
    const auth = firebase.auth();
    auth.getRedirectResult().catch(e => setErr(e && e.message || String(e)));
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) {
        setEmail(null);
        setPhase("signedout");
        return;
      }
      if ((user.email || "").toLowerCase() === ALLOWED_EMAIL) {
        setEmail(user.email);
        setPhase("ok");
      } else {
        setEmail(user.email);
        setPhase("denied");
        auth.signOut().catch(() => {});
      }
    });
    return unsub;
  }, []);
  const signIn = async () => {
    setErr(null);
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await firebase.auth().signInWithPopup(provider);
    } catch (e) {
      const code = e && (e.code || e.message) || "";
      if (/popup|operation-not-supported|cancelled|disallowed|blocked/i.test(code)) {
        try {
          await firebase.auth().signInWithRedirect(provider);
        } catch (e2) {
          setErr(e2 && e2.message || String(e2));
        }
      } else {
        setErr(e && e.message || String(e));
      }
    }
  };
  const signOut = () => firebase.auth().signOut();
  if (phase === "ok") return /*#__PURE__*/React.createElement(App, {
    onSignOut: signOut,
    account: email
  });
  const shell = children => /*#__PURE__*/React.createElement("div", {
    className: "gate"
  }, /*#__PURE__*/React.createElement("div", {
    className: "gate-card"
  }, children));
  if (phase === "loading") return shell([/*#__PURE__*/React.createElement("span", {
    className: "gate-mark",
    key: "m"
  }, "▲"), /*#__PURE__*/React.createElement("p", {
    className: "gate-sub",
    key: "s"
  }, "Loading…")]);
  const denied = phase === "denied";
  return shell([/*#__PURE__*/React.createElement("span", {
    className: "gate-mark",
    key: "m"
  }, "▲"), /*#__PURE__*/React.createElement("h1", {
    className: "gate-title",
    key: "t"
  }, denied ? "Not authorized" : "PROTOCOL"), /*#__PURE__*/React.createElement("p", {
    className: "gate-sub",
    key: "s"
  }, denied ? (email ? email + " can't access this app." : "This account can't access this app.") : "Private app. Sign in to continue."), /*#__PURE__*/React.createElement("button", {
    className: "gate-btn",
    key: "b",
    onClick: signIn
  }, denied ? "Use a different account" : "Sign in with Google"), err && /*#__PURE__*/React.createElement("p", {
    className: "gate-err",
    key: "e"
  }, err)]);
}
ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(AuthGate));
