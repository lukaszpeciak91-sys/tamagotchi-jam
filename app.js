const STORAGE_KEY = "tamagotchi-jam-state-v1";
const TICK_MS = 15000;
const MAX_CATCHUP_TICKS = 8;
const BG_VARIANTS = 6;
const HAPPY_POSE_MS = 2000;
const SLEEP_POSE_MS = 3000;
const MOVE_INTERVAL_MIN_MS = 2000;
const MOVE_INTERVAL_MAX_MS = 4000;
const MOVE_EPSILON_PX = 2;
const MOVE_SAFE_MARGIN_PX = 12;
const MOVE_NORMAL_SPEED_PX_PER_S = 64;
const MOVE_SLOW_SPEED_PX_PER_S = 34;
const MOVE_POSE_SPEED_FACTOR = 0.88;
const PETS = {
  penguin: {
    sheet: "assets/pets/penguin/Penguin_sheet.png",
    cols: 3,
    rows: 2,
    map: {
      idle: { col: 0, row: 0 },
      happy: { col: 1, row: 0 },
      hungry: { col: 2, row: 0 },
      bored: { col: 0, row: 0 },
      sleep: { col: 0, row: 1 },
      sleepy: { col: 0, row: 1 },
      poop: { col: 1, row: 1 },
      dirty: { col: 1, row: 1 },
      dead: { col: 2, row: 1 },
    },
  },
  bee: {
    sheet: "assets/pets/bee/Bee_sheet.png",
    cols: 3,
    rows: 2,
    map: {
      idle: { col: 0, row: 0 },
      happy: { col: 1, row: 0 },
      hungry: { col: 2, row: 0 },
      bored: { col: 0, row: 0 },
      sleep: { col: 0, row: 1 },
      sleepy: { col: 0, row: 1 },
      poop: { col: 1, row: 1 },
      dirty: { col: 1, row: 1 },
      dead: { col: 2, row: 1 },
    },
  },
  bear: {
    sheet: "assets/pets/bear/Bear_sheet.png",
    cols: 3,
    rows: 2,
    map: {
      idle: { col: 0, row: 0 },
      happy: { col: 1, row: 0 },
      hungry: { col: 2, row: 0 },
      bored: { col: 0, row: 0 },
      sleep: { col: 0, row: 1 },
      sleepy: { col: 0, row: 1 },
      poop: { col: 1, row: 1 },
      dirty: { col: 1, row: 1 },
      dead: { col: 2, row: 1 },
    },
  },
  boar: {
    sheet: "assets/pets/boar/Boar_sheet.png",
    cols: 3,
    rows: 2,
    map: {
      idle: { col: 0, row: 0 },
      happy: { col: 1, row: 0 },
      hungry: { col: 2, row: 0 },
      bored: { col: 0, row: 0 },
      sleep: { col: 0, row: 1 },
      sleepy: { col: 0, row: 1 },
      poop: { col: 1, row: 1 },
      dirty: { col: 1, row: 1 },
      dead: { col: 2, row: 1 },
    },
  },
  kukong: {
    sheet: "assets/pets/kukong/Kukong_sheet.png",
    cols: 3,
    rows: 2,
    map: {
      idle: { col: 0, row: 0 },
      happy: { col: 1, row: 0 },
      hungry: { col: 2, row: 0 },
      bored: { col: 0, row: 0 },
      sleep: { col: 0, row: 1 },
      sleepy: { col: 0, row: 1 },
      poop: { col: 1, row: 1 },
      dirty: { col: 1, row: 1 },
      dead: { col: 2, row: 1 },
    },
  },
  shark: {
    sheet: "assets/pets/shark/Shark_sheet.png",
    cols: 3,
    rows: 2,
    map: {
      idle: { col: 0, row: 0 },
      happy: { col: 1, row: 0 },
      hungry: { col: 2, row: 0 },
      bored: { col: 0, row: 0 },
      sleep: { col: 0, row: 1 },
      sleepy: { col: 0, row: 1 },
      poop: { col: 1, row: 1 },
      dirty: { col: 1, row: 1 },
      dead: { col: 2, row: 1 },
    },
  },
  sloth: {
    sheet: "assets/pets/sloth/Sloth_sheet.png",
    cols: 3,
    rows: 2,
    map: {
      idle: { col: 0, row: 0 },
      happy: { col: 1, row: 0 },
      hungry: { col: 2, row: 0 },
      bored: { col: 0, row: 0 },
      sleep: { col: 0, row: 1 },
      sleepy: { col: 0, row: 1 },
      poop: { col: 1, row: 1 },
      dirty: { col: 1, row: 1 },
      dead: { col: 2, row: 1 },
    },
  },
};
const DEFAULT_PET = "penguin";

const PET_OPTIONS = [
  { id: "penguin", label: "Penguin" },
  { id: "bee", label: "Bee" },
  { id: "bear", label: "Bear" },
  { id: "boar", label: "Boar" },
  { id: "kukong", label: "Kukong" },
  { id: "shark", label: "Shark" },
  { id: "sloth", label: "Sloth" },
];

const sheetLoadState = {};

const defaultState = {
  phase: "select",
  selectedPet: null,
  eggTaps: 0,
  hunger: 1,
  sleep: 0,
  poop: 0,
  bored: 1,
  life: "alive",
  petMode: "idle",
  happyTicksRemaining: 0,
  poseOverride: null,
  poseOverrideTicks: 0,
  bgIndex: 0,
  bgTickCounter: 0,
  nextBgChangeInTicks: 2,
  pendingPoop: 0,
  poseOverrideUntilMs: 0,
  tickCounter: 0,
  lastTick: Date.now(),
  criticalTickStreak: 0,
  walkSeed: 0,
};

function randomBgTickInterval() {
  return 2 + Math.floor(Math.random() * 2);
}

const state = loadState();
function clampStat(value) {
  return Math.max(0, Math.min(4, Number(value) || 0));
}

function clampState(source = state) {
  const validPhases = new Set(["select", "egg", "pet", "dead"]);
  source.phase = validPhases.has(source.phase) ? source.phase : "select";
  source.selectedPet = typeof source.selectedPet === "string" && PETS[source.selectedPet]
    ? source.selectedPet
    : null;
  source.eggTaps = Math.max(0, Math.min(10, Number(source.eggTaps) || 0));
  source.hunger = clampStat(source.hunger);
  source.sleep = clampStat(source.sleep);
  source.poop = clampStat(source.poop);
  source.bored = clampStat(source.bored);
  source.life = source.life === "dead" ? "dead" : "alive";
  if (source.life === "dead" || source.phase === "dead") {
    source.phase = "select";
    source.selectedPet = null;
    source.life = "alive";
    source.eggTaps = 0;
    source.criticalTickStreak = 0;
    source.walkSeed = 0;
  }
  source.tickCounter = Math.max(0, Number(source.tickCounter) || 0);
  source.lastTick = Number(source.lastTick) || Date.now();
  source.criticalTickStreak = Math.max(0, Number(source.criticalTickStreak) || 0);
  source.walkSeed = Math.max(1, Math.floor(Number(source.walkSeed) || 0));
  source.happyTicksRemaining = Math.max(0, Number(source.happyTicksRemaining) || 0);
  const validModes = new Set(["idle", "happy", "hungry", "sleepy", "dirty", "bored", "dead"]);
  source.poseOverride = validModes.has(source.poseOverride) ? source.poseOverride : null;
  source.poseOverrideTicks = Math.max(0, Number(source.poseOverrideTicks) || 0);
  source.bgIndex = Math.max(0, Number(source.bgIndex) || 0) % BG_VARIANTS;
  source.bgTickCounter = Math.max(0, Number(source.bgTickCounter) || 0);
  source.nextBgChangeInTicks = Math.max(2, Math.min(3, Math.floor(Number(source.nextBgChangeInTicks) || 2)));
  source.pendingPoop = Math.max(0, Math.floor(Number(source.pendingPoop) || 0));
  source.poseOverrideUntilMs = Math.max(0, Number(source.poseOverrideUntilMs) || 0);
  if (source.poseOverride && source.poseOverrideUntilMs <= 0) source.poseOverride = null;
  if (source.poseOverride === null) source.poseOverrideUntilMs = 0;

  const legacyModeMap = {
    sleep: "sleepy",
    poop: "dirty",
  };
  const normalizedMode = legacyModeMap[source.petMode] ?? source.petMode;
  source.petMode = validModes.has(normalizedMode) ? normalizedMode : "idle";

  return source;
}

function isPetSheetAvailable(petId) {
  const config = PETS[petId];
  if (!config) return false;
  if (sheetLoadState[petId] === false) return false;
  if (sheetLoadState[petId] === true) return true;

  const image = new Image();
  image.onload = () => {
    sheetLoadState[petId] = true;
  };
  image.onerror = () => {
    sheetLoadState[petId] = false;
    if (state.phase === "pet") {
      render();
    }
  };
  image.src = config.sheet;
  sheetLoadState[petId] = true;
  return true;
}

function getActivePetId() {
  const preferredPet = state.selectedPet ?? DEFAULT_PET;
  if (isPetSheetAvailable(preferredPet)) return preferredPet;
  return DEFAULT_PET;
}

function transitionToSelect() {
  // New life starts at pet selection.
  Object.assign(state, { ...defaultState, lastTick: Date.now() });
  state.nextBgChangeInTicks = randomBgTickInterval();
  state.phase = "select";
  state.selectedPet = null;
  state.walkSeed = 0;
  refreshMovementSeed();
}

function applyPoseExpiry(nowMs) {
  if (!state.poseOverride) {
    return false;
  }

  if (state.poseOverrideUntilMs <= 0) {
    state.poseOverride = null;
    state.poseOverrideUntilMs = 0;
    state.poseOverrideTicks = 0;
    clampState();
    return true;
  }

  if (nowMs < state.poseOverrideUntilMs) {
    return false;
  }

  state.poseOverride = null;
  state.poseOverrideUntilMs = 0;
  state.poseOverrideTicks = 0;
  clampState();
  return true;
}

const movement = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  minX: 0,
  maxX: 0,
  minY: 0,
  maxY: 0,
  nextTargetAtMs: 0,
  lastFrameAtMs: 0,
  speedPxPerS: 0,
  seededRandom: null,
};

function makeSeededRandom(seed) {
  let seedValue = Math.max(1, Math.floor(seed) || 1) >>> 0;
  return () => {
    seedValue += 0x6D2B79F5;
    let t = seedValue;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(min, max) {
  const rand = movement.seededRandom ? movement.seededRandom() : Math.random();
  return min + (max - min) * rand;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isSlowMode() {
  return state.petMode === "sleepy" || state.petMode === "hungry" || state.petMode === "dirty";
}

function updateMovementBounds() {
  const screen = document.getElementById("screen");
  const petMover = document.getElementById("petMover");
  const pet = document.getElementById("pet");
  if (!screen || !petMover || !pet) return;

  const screenRect = screen.getBoundingClientRect();
  const petRect = pet.getBoundingClientRect();
  const safeMargin = MOVE_SAFE_MARGIN_PX;

  movement.minX = safeMargin;
  movement.maxX = Math.max(movement.minX, screenRect.width - petRect.width - safeMargin);
  movement.minY = safeMargin;
  movement.maxY = Math.max(movement.minY, screenRect.height - petRect.height - safeMargin);

  movement.x = clamp(movement.x, movement.minX, movement.maxX);
  movement.y = clamp(movement.y, movement.minY, movement.maxY);
  movement.targetX = clamp(movement.targetX, movement.minX, movement.maxX);
  movement.targetY = clamp(movement.targetY, movement.minY, movement.maxY);

  petMover.style.transform = `translate(${movement.x.toFixed(2)}px, ${movement.y.toFixed(2)}px)`;
}

function scheduleNextTarget(nowMs) {
  movement.nextTargetAtMs = nowMs + randomBetween(MOVE_INTERVAL_MIN_MS, MOVE_INTERVAL_MAX_MS);
}

function pickNextTarget(nowMs) {
  const currentX = movement.x;
  const currentY = movement.y;

  if (isSlowMode()) {
    const maxStepX = Math.max(24, (movement.maxX - movement.minX) * 0.3);
    const maxStepY = Math.max(20, (movement.maxY - movement.minY) * 0.28);
    movement.targetX = clamp(currentX + randomBetween(-maxStepX, maxStepX), movement.minX, movement.maxX);
    movement.targetY = clamp(currentY + randomBetween(-maxStepY, maxStepY), movement.minY, movement.maxY);
  } else {
    movement.targetX = randomBetween(movement.minX, movement.maxX);
    movement.targetY = randomBetween(movement.minY, movement.maxY);
  }

  scheduleNextTarget(nowMs);
}

function refreshMovementSeed() {
  if (!state.walkSeed) {
    state.walkSeed = Math.floor((Date.now() ^ ((Math.random() * 0xFFFFFFFF) >>> 0)) >>> 0) || 1;
    saveState();
  }
  movement.seededRandom = makeSeededRandom(state.walkSeed);
}

function updatePetMovement(nowMs) {
  const petMover = document.getElementById("petMover");
  if (!petMover) return;

  const movementDisabled = state.phase === "egg" || state.phase === "select" || state.life === "dead";
  if (movementDisabled) {
    movement.lastFrameAtMs = nowMs;
    petMover.style.transform = `translate(${movement.x.toFixed(2)}px, ${movement.y.toFixed(2)}px)`;
    return;
  }

  const dtMs = movement.lastFrameAtMs ? Math.min(80, nowMs - movement.lastFrameAtMs) : 16;
  movement.lastFrameAtMs = nowMs;

  if (!movement.nextTargetAtMs || nowMs >= movement.nextTargetAtMs) {
    pickNextTarget(nowMs);
  }

  const dx = movement.targetX - movement.x;
  const dy = movement.targetY - movement.y;
  const distance = Math.hypot(dx, dy);

  let speed = isSlowMode() ? MOVE_SLOW_SPEED_PX_PER_S : MOVE_NORMAL_SPEED_PX_PER_S;
  if (state.poseOverride) speed *= MOVE_POSE_SPEED_FACTOR;
  movement.speedPxPerS = speed;

  if (distance > MOVE_EPSILON_PX) {
    const maxStep = speed * (dtMs / 1000);
    if (distance <= maxStep) {
      movement.x = movement.targetX;
      movement.y = movement.targetY;
    } else {
      movement.x += (dx / distance) * maxStep;
      movement.y += (dy / distance) * maxStep;
    }
  }

  movement.x = clamp(movement.x, movement.minX, movement.maxX);
  movement.y = clamp(movement.y, movement.minY, movement.maxY);
  petMover.style.transform = `translate(${movement.x.toFixed(2)}px, ${movement.y.toFixed(2)}px)`;
}

function movementLoop(nowMs) {
  updatePetMovement(nowMs);
  requestAnimationFrame(movementLoop);
}

function initPetMovement() {
  refreshMovementSeed();
  updateMovementBounds();
  movement.x = randomBetween(movement.minX, movement.maxX);
  movement.y = randomBetween(movement.minY, movement.maxY);
  movement.targetX = movement.x;
  movement.targetY = movement.y;
  movement.lastFrameAtMs = performance.now();
  scheduleNextTarget(movement.lastFrameAtMs);

  const petMover = document.getElementById("petMover");
  if (petMover) {
    petMover.style.transform = `translate(${movement.x.toFixed(2)}px, ${movement.y.toFixed(2)}px)`;
  }

  window.addEventListener("resize", updateMovementBounds);
  requestAnimationFrame(movementLoop);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultState };
    }

    const parsed = JSON.parse(raw);
    return clampState({ ...defaultState, ...parsed });
  } catch (error) {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function derivePetMode(source) {
  if (source.life === "dead") return "dead";
  if (source.poop >= 1) return "dirty";
  if (source.hunger >= 3) return "hungry";
  if (source.sleep >= 3) return "sleepy";
  if (source.bored >= 3) return "bored";
  return "idle";
}

function renderPoop() {
  const poopLayer = document.getElementById("poopLayer");
  let blobsCount = 0;

  if (state.poop >= 3) {
    blobsCount = 2;
  } else if (state.poop >= 1) {
    blobsCount = 1;
  }

  if (blobsCount === 0) {
    poopLayer.innerHTML = "";
    return;
  }

  if (blobsCount === 1) {
    poopLayer.innerHTML = '<div class="poop poop--ui poop--1"></div>';
    return;
  }

  poopLayer.innerHTML =
    '<div class="poop poop--ui poop--1"></div><div class="poop poop--ui poop--2"></div>';
}

function renderDots(targetId, value) {
  const dots = Array.from({ length: 4 }, (_, index) => {
    const onClass = index < value ? "dot on" : "dot";
    return `<span class="${onClass}" aria-hidden="true"></span>`;
  }).join("");

  document.getElementById(targetId).innerHTML = dots;
}

function render() {
  clampState();

  const isSelectPhase = state.phase === "select";
  const isEggPhase = state.phase === "egg";
  const isPetPhase = state.phase === "pet" || state.phase === "dead";

  renderDots("hungerDots", state.hunger);
  renderDots("sleepDots", state.sleep);
  renderDots("poopDots", state.poop);
  renderDots("boredDots", state.bored);

  state.petMode = derivePetMode(state);
  const renderMode = state.poseOverride ?? state.petMode;

  const petElement = document.getElementById("pet");
  const petMoverElement = document.getElementById("petMover");
  const eggElement = document.getElementById("egg");
  const selectElement = document.getElementById("petSelect");
  const petConfig = PETS[getActivePetId()] ?? PETS[DEFAULT_PET];
  const frame = petConfig.map[renderMode] ?? petConfig.map.idle ?? { col: 0, row: 0 };

  petElement.className = `pet pet--${renderMode}`;
  petElement.hidden = !isPetPhase;
  if (petMoverElement) petMoverElement.hidden = !isPetPhase;

  const frameWidth = isPetPhase ? petElement.offsetWidth : 0;
  const frameHeight = isPetPhase ? petElement.offsetHeight : 0;

  petElement.style.setProperty("--pet-col", frame.col);
  petElement.style.setProperty("--pet-row", frame.row);
  petElement.style.setProperty("--pet-cols", petConfig.cols);
  petElement.style.setProperty("--pet-rows", petConfig.rows);
  petElement.style.setProperty("--pet-frame-w", `${frameWidth}px`);
  petElement.style.setProperty("--pet-frame-h", `${frameHeight}px`);
  petElement.style.backgroundImage = `url("${petConfig.sheet}")`;

  eggElement.hidden = !isEggPhase;
  selectElement.hidden = !isSelectPhase;
  eggElement.className = `egg crack-${Math.floor(state.eggTaps / 2)}`;

  const screenElement = document.getElementById("screen");
  const bgClassPrefix = "bg-";
  Array.from(screenElement.classList)
    .filter((className) => className.startsWith(bgClassPrefix))
    .forEach((className) => {
      screenElement.classList.remove(className);
    });
  screenElement.classList.add(`${bgClassPrefix}${state.bgIndex}`);
  screenElement.classList.toggle("screen--dirty", state.poop >= 2);

  renderPoop();

  const actionDisabled = state.life === "dead" || state.phase === "egg" || state.phase === "select";
  ["feedBtn", "sleepBtn", "cleanBtn", "playBtn"].forEach((id) => {
    document.getElementById(id).disabled = actionDisabled;
  });

  const poseRemainingMs = state.poseOverrideUntilMs
    ? Math.max(0, state.poseOverrideUntilMs - Date.now())
    : 0;
  const debugRoot = document.querySelector(".debug");
  if (debugRoot?.open) {
    const nextMoveInMs = Math.max(0, Math.round(movement.nextTargetAtMs - performance.now()));
    document.getElementById("debugLine").textContent =
      `phase:${state.phase} egg:${state.eggTaps}/10 hunger:${state.hunger} sleep:${state.sleep} poop:${state.poop} bored:${state.bored} life:${state.life} mode:${state.petMode} pose:${state.poseOverride ?? "none"} poseMs:${poseRemainingMs} poseTicks:${state.poseOverrideTicks} ticks:${state.tickCounter} pos:(${movement.x.toFixed(1)},${movement.y.toFixed(1)}) target:(${movement.targetX.toFixed(1)},${movement.targetY.toFixed(1)}) nextMoveInMs:${nextMoveInMs} speed:${movement.speedPxPerS.toFixed(1)}`;
  }

  if (isPetPhase) {
    updateMovementBounds();
  }
}

function applyTick() {
  if (state.phase === "egg" || state.phase === "select") return;
  if (state.life === "dead") return;

  state.tickCounter += 1;
  state.hunger += 1;
  state.bored += 1;

  if (state.tickCounter % 2 === 0) {
    state.sleep += 1;
  }

  if (state.pendingPoop > 0 && state.poop < 4) {
    state.pendingPoop = Math.max(0, state.pendingPoop - 1);
    state.poop += 1;
  }

  if (!state.bgTickCounter) state.bgTickCounter = 0;
  state.bgTickCounter += 1;

  if (state.bgTickCounter >= state.nextBgChangeInTicks) {
    state.bgTickCounter = 0;
    state.bgIndex = (state.bgIndex + 1) % BG_VARIANTS;
    state.nextBgChangeInTicks = randomBgTickInterval();
  }

  if (state.happyTicksRemaining > 0) {
    state.happyTicksRemaining = Math.max(0, state.happyTicksRemaining - 1);
  }

  if (state.poseOverrideTicks > 0) {
    state.poseOverrideTicks = 0;
  }

  clampState();

  const hasCriticalStat = [state.hunger, state.sleep, state.poop, state.bored].some((stat) => stat >= 4);
  state.criticalTickStreak = hasCriticalStat ? state.criticalTickStreak + 1 : 0;

  if (state.criticalTickStreak >= 2) {
    transitionToSelect();
  } else {
    state.petMode = derivePetMode(state);
  }

  saveState();
}

function checkTick() {
  if (applyPoseExpiry(Date.now())) {
    saveState();
    render();
  }

  if (state.phase === "egg" || state.phase === "select") return;
  if (state.life === "dead") return;

  const now = Date.now();
  const elapsed = now - state.lastTick;
  const ticksPassed = Math.floor(elapsed / TICK_MS);

  if (ticksPassed <= 0) return;

  const ticksToApply = Math.min(ticksPassed, MAX_CATCHUP_TICKS);
  for (let tickIndex = 0; tickIndex < ticksToApply; tickIndex += 1) {
    applyTick();
  }

  state.lastTick += ticksToApply * TICK_MS;
  saveState();
  render();
}

function applyAction(
  mutator,
  { happyTicks = 0, poseOverride = null, poseOverrideDurationMs = 0 } = {},
) {
  if (state.phase === "egg" || state.phase === "select") return;
  if (state.life === "dead") return;

  mutator();
  state.happyTicksRemaining = happyTicks;
  state.poseOverride = poseOverride;
  state.poseOverrideTicks = 0;
  state.poseOverrideUntilMs = poseOverride ? Date.now() + poseOverrideDurationMs : 0;
  clampState();
  state.petMode = derivePetMode(state);
  saveState();
  render();
}

function init() {
  document.getElementById("feedBtn").addEventListener("click", () => {
    applyAction(
      () => {
        state.hunger = Math.max(0, state.hunger - 1);
        state.bored = Math.min(4, state.bored + 0);
        state.pendingPoop += 1;
      },
      { poseOverride: "happy", poseOverrideDurationMs: HAPPY_POSE_MS },
    );
  });

  document.getElementById("sleepBtn").addEventListener("click", () => {
    applyAction(
      () => {
        state.sleep = Math.max(0, state.sleep - 1);
      },
      { poseOverride: "sleepy", poseOverrideDurationMs: SLEEP_POSE_MS },
    );
  });

  document.getElementById("cleanBtn").addEventListener("click", () => {
    if (state.phase === "egg" || state.phase === "select") return;
    if (state.life === "dead") return;

    if (state.poop > 0) {
      state.poop = Math.max(0, state.poop - 1);
    }

    clampState();
    state.happyTicksRemaining = 0;
    state.petMode = derivePetMode(state);
    saveState();
    render();
  });

  document.getElementById("playBtn").addEventListener("click", () => {
    applyAction(
      () => {
        state.bored = Math.max(0, state.bored - 2);
        state.hunger = Math.min(4, state.hunger + 1);

        if (Math.random() < 0.5) {
          state.sleep = Math.min(4, state.sleep + 1);
        }
      },
      { happyTicks: 2, poseOverride: "happy", poseOverrideDurationMs: HAPPY_POSE_MS },
    );
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    transitionToSelect();
    saveState();
    render();
  });

  document.getElementById("petSelect").addEventListener("click", (event) => {
    event.stopPropagation();

    const button = event.target.closest("[data-pet-option]");
    if (!button) return;

    const petId = button.getAttribute("data-pet-option");
    if (!PETS[petId]) return;

    // Selection is one-time for this life and transitions into egg.
    state.selectedPet = petId;
    state.phase = "egg";
    state.eggTaps = 0;
    state.life = "alive";
    state.petMode = "idle";
    state.lastTick = Date.now();
    state.criticalTickStreak = 0;
    state.poseOverride = null;
    state.poseOverrideTicks = 0;
    state.poseOverrideUntilMs = 0;
    state.walkSeed = 0;
    state.nextBgChangeInTicks = randomBgTickInterval();
    state.pendingPoop = 0;
    refreshMovementSeed();

    clampState();
    saveState();
    render();
  });

  document.getElementById("screen").addEventListener("click", () => {
    if (state.phase !== "egg") return;

    state.eggTaps = Math.min(10, state.eggTaps + 1);

    const eggElement = document.getElementById("egg");
    eggElement.classList.remove("egg-shake");
    // force reflow so class re-add replays animation
    void eggElement.offsetWidth;
    eggElement.classList.add("egg-shake");

    if (state.eggTaps >= 10) {
      state.phase = "pet";
      state.petMode = derivePetMode(state);
      state.lastTick = Date.now();
      refreshMovementSeed();
      pickNextTarget(performance.now());
      document.getElementById("screen").classList.add("screen--hatch");
      setTimeout(() => {
        document.getElementById("screen").classList.remove("screen--hatch");
      }, 300);
    }

    saveState();
    render();
  });

  setInterval(checkTick, 1000);
  setInterval(() => {
    if (applyPoseExpiry(Date.now())) {
      saveState();
      render();
    }
  }, 250);

  if (state.phase !== "egg" && state.phase !== "select") {
    state.petMode = derivePetMode(state);
  }

  document.getElementById("petSelect").innerHTML = PET_OPTIONS.map(({ id, label }) => {
    return `<button class="pet-choice" type="button" data-pet-option="${id}">${label}</button>`;
  }).join("");

  saveState();
  render();
  initPetMovement();
}

init();
