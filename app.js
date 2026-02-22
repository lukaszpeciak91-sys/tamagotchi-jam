const STORAGE_KEY = "tamagotchi-jam-state-v1";
const TICK_MS = 20000;
const MAX_CATCHUP_TICKS = 8;
const PETS = {
  penguin: {
    sheet: "assets/pets/penguin/Penguin_sheet.png",
    cols: 3,
    rows: 2,
    map: {
      idle: { col: 0, row: 0 },
      happy: { col: 1, row: 0 },
      hungry: { col: 2, row: 0 },
      sleep: { col: 0, row: 1 },
      sleepy: { col: 0, row: 1 },
      poop: { col: 1, row: 1 },
      dirty: { col: 1, row: 1 },
      dead: { col: 2, row: 1 },
    },
  },
};
const DEFAULT_PET = "penguin";

const defaultState = {
  phase: "egg",
  eggTaps: 0,
  hunger: 1,
  sleep: 0,
  poop: 0,
  bored: 1,
  life: "alive",
  petMode: "idle",
  happyTicksRemaining: 0,
  tickCounter: 0,
  lastTick: Date.now(),
  criticalTickStreak: 0,
};

const state = loadState();
function clampStat(value) {
  return Math.max(0, Math.min(4, Number(value) || 0));
}

function clampState(source = state) {
  const validPhases = new Set(["egg", "pet", "dead"]);
  source.phase = validPhases.has(source.phase) ? source.phase : "pet";
  source.eggTaps = Math.max(0, Math.min(10, Number(source.eggTaps) || 0));
  source.hunger = clampStat(source.hunger);
  source.sleep = clampStat(source.sleep);
  source.poop = clampStat(source.poop);
  source.bored = clampStat(source.bored);
  source.life = source.life === "dead" ? "dead" : "alive";
  if (source.life === "dead") {
    source.phase = "dead";
  }
  source.tickCounter = Math.max(0, Number(source.tickCounter) || 0);
  source.lastTick = Number(source.lastTick) || Date.now();
  source.criticalTickStreak = Math.max(0, Number(source.criticalTickStreak) || 0);
  source.happyTicksRemaining = Math.max(0, Number(source.happyTicksRemaining) || 0);

  const legacyModeMap = {
    sleep: "sleepy",
    poop: "dirty",
  };
  const normalizedMode = legacyModeMap[source.petMode] ?? source.petMode;
  const validModes = new Set(["idle", "happy", "hungry", "sleepy", "dirty", "dead"]);
  source.petMode = validModes.has(normalizedMode) ? normalizedMode : "idle";

  return source;
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
  if (source.sleep >= 3) return "sleepy";
  if (source.hunger >= 3) return "hungry";
  if (source.happyTicksRemaining > 0) return "happy";
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

  renderDots("hungerDots", state.hunger);
  renderDots("sleepDots", state.sleep);
  renderDots("poopDots", state.poop);
  renderDots("boredDots", state.bored);

  const petElement = document.getElementById("pet");
  const eggElement = document.getElementById("egg");
  const petConfig = PETS[DEFAULT_PET];
  const frame = petConfig.map[state.petMode] ?? petConfig.map.idle ?? { col: 0, row: 0 };

  petElement.style.setProperty("--pet-col", frame.col);
  petElement.style.setProperty("--pet-row", frame.row);
  petElement.style.setProperty("--pet-cols", petConfig.cols);
  petElement.style.setProperty("--pet-rows", petConfig.rows);
  petElement.style.backgroundImage = `url("${petConfig.sheet}")`;

  petElement.className = `pet pet--${state.petMode}`;
  petElement.hidden = state.phase !== "pet" && state.phase !== "dead";
  eggElement.hidden = state.phase !== "egg";
  eggElement.className = `egg crack-${Math.floor(state.eggTaps / 2)}`;

  const screenElement = document.getElementById("screen");
  screenElement.classList.toggle("screen--dirty", state.poop >= 2);

  renderPoop();

  const actionDisabled = state.life === "dead" || state.phase === "egg";
  ["feedBtn", "sleepBtn", "cleanBtn", "playBtn"].forEach((id) => {
    document.getElementById(id).disabled = actionDisabled;
  });

  document.getElementById("debugLine").textContent =
    `phase:${state.phase} egg:${state.eggTaps}/10 hunger:${state.hunger} sleep:${state.sleep} poop:${state.poop} bored:${state.bored} life:${state.life} mode:${state.petMode} ticks:${state.tickCounter}`;
}

function applyTick() {
  if (state.phase === "egg") return;
  if (state.life === "dead") return;

  state.tickCounter += 1;
  state.hunger += 1;
  state.bored += 1;

  if (state.tickCounter % 2 === 0) {
    state.sleep += 1;
  }

  if (state.tickCounter % 3 === 0) {
    state.poop += 1;
  }

  if (state.happyTicksRemaining > 0) {
    state.happyTicksRemaining = Math.max(0, state.happyTicksRemaining - 1);
  }

  clampState();

  const hasCriticalStat = [state.hunger, state.sleep, state.poop, state.bored].some((stat) => stat >= 4);
  state.criticalTickStreak = hasCriticalStat ? state.criticalTickStreak + 1 : 0;

  if (state.criticalTickStreak >= 2) {
    state.life = "dead";
    state.petMode = "dead";
  } else {
    state.petMode = derivePetMode(state);
  }

  saveState();
}

function checkTick() {
  if (state.phase === "egg") return;
  if (state.life === "dead") return;

  const elapsed = Date.now() - state.lastTick;
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

function applyAction(mutator, { happyTicks = 0 } = {}) {
  if (state.phase === "egg") return;
  if (state.life === "dead") return;

  mutator();
  state.happyTicksRemaining = happyTicks;
  clampState();
  state.petMode = derivePetMode(state);
  saveState();
  render();
}

function init() {
  document.getElementById("feedBtn").addEventListener("click", () => {
    applyAction(() => {
      state.hunger = Math.max(0, state.hunger - 1);
      state.bored = Math.min(4, state.bored + 0);
    });
  });

  document.getElementById("sleepBtn").addEventListener("click", () => {
    applyAction(() => {
      state.sleep = state.sleep > 0 ? state.sleep - 1 : state.sleep + 1;
    });
  });

  document.getElementById("cleanBtn").addEventListener("click", () => {
    if (state.phase === "egg") return;
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
      { happyTicks: 2 },
    );
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    Object.assign(state, { ...defaultState, lastTick: Date.now() });
    state.phase = "egg";
    state.eggTaps = 0;
    state.petMode = "idle";
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
      document.getElementById("screen").classList.add("screen--hatch");
      setTimeout(() => {
        document.getElementById("screen").classList.remove("screen--hatch");
      }, 300);
    }

    saveState();
    render();
  });

  setInterval(checkTick, 1000);

  if (state.phase !== "egg") {
    state.petMode = derivePetMode(state);
  }
  saveState();
  render();
}

init();
