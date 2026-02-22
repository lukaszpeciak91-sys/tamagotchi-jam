const STORAGE_KEY = "tamagotchi-jam-state-v1";
const TICK_MS = 20000;
const MAX_CATCHUP_TICKS = 8;

const defaultState = {
  hunger: 1,
  sleep: 0,
  poop: 0,
  bored: 1,
  life: "alive",
  petMode: "idle",
  tickCounter: 0,
  lastTick: Date.now(),
  criticalTickStreak: 0,
};

const state = loadState();
let happyTimeoutId = null;

function clampStat(value) {
  return Math.max(0, Math.min(4, Number(value) || 0));
}

function clampState(source = state) {
  source.hunger = clampStat(source.hunger);
  source.sleep = clampStat(source.sleep);
  source.poop = clampStat(source.poop);
  source.bored = clampStat(source.bored);
  source.life = source.life === "dead" ? "dead" : "alive";
  source.tickCounter = Math.max(0, Number(source.tickCounter) || 0);
  source.lastTick = Number(source.lastTick) || Date.now();
  source.criticalTickStreak = Math.max(0, Number(source.criticalTickStreak) || 0);

  const validModes = new Set(["idle", "hungry", "sleep", "poop", "happy", "dead"]);
  source.petMode = validModes.has(source.petMode) ? source.petMode : "idle";

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
  if (source.sleep >= 3) return "sleep";
  if (source.poop >= 3) return "poop";
  if (source.hunger >= 3) return "hungry";
  if (source.bored >= 3) return "idle";
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
    poopLayer.innerHTML = '<div class="poop poop--1"></div>';
    return;
  }

  poopLayer.innerHTML =
    '<div class="poop poop--1"></div><div class="poop poop--2"></div>';
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
  petElement.className = `pet pet--${state.petMode}`;

  const screenElement = document.getElementById("screen");
  screenElement.classList.toggle("screen--dirty", state.poop >= 2);

  renderPoop();

  const actionDisabled = state.life === "dead";
  ["feedBtn", "sleepBtn", "cleanBtn", "playBtn"].forEach((id) => {
    document.getElementById(id).disabled = actionDisabled;
  });

  document.getElementById("debugLine").textContent =
    `hunger:${state.hunger} sleep:${state.sleep} poop:${state.poop} bored:${state.bored} life:${state.life} mode:${state.petMode} ticks:${state.tickCounter}`;
}

function applyTick() {
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

function withHappyBounce(mutator) {
  if (state.life === "dead") return;

  mutator();
  clampState();
  state.petMode = "happy";
  saveState();
  render();

  if (happyTimeoutId) {
    clearTimeout(happyTimeoutId);
  }

  happyTimeoutId = setTimeout(() => {
    state.petMode = derivePetMode(state);
    saveState();
    render();
  }, 800);
}

function init() {
  document.getElementById("feedBtn").addEventListener("click", () => {
    withHappyBounce(() => {
      state.hunger = Math.max(0, state.hunger - 1);
      state.bored = Math.min(4, state.bored + 0);
    });
  });

  document.getElementById("sleepBtn").addEventListener("click", () => {
    withHappyBounce(() => {
      state.sleep = state.sleep > 0 ? state.sleep - 1 : state.sleep + 1;
    });
  });

  document.getElementById("cleanBtn").addEventListener("click", () => {
    if (state.life === "dead") return;

    if (state.poop > 0) {
      state.poop = Math.max(0, state.poop - 1);
    }

    clampState();
    state.petMode = "happy";
    saveState();
    render();

    if (happyTimeoutId) {
      clearTimeout(happyTimeoutId);
    }

    happyTimeoutId = setTimeout(() => {
      state.petMode = derivePetMode(state);
      saveState();
      render();
    }, 800);
  });

  document.getElementById("playBtn").addEventListener("click", () => {
    withHappyBounce(() => {
      state.bored = Math.max(0, state.bored - 2);
      state.hunger = Math.min(4, state.hunger + 1);

      if (Math.random() < 0.5) {
        state.sleep = Math.min(4, state.sleep + 1);
      }
    });
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    Object.assign(state, { ...defaultState, lastTick: Date.now() });
    state.petMode = derivePetMode(state);
    saveState();
    render();
  });

  setInterval(checkTick, 1000);

  state.petMode = derivePetMode(state);
  saveState();
  render();
}

init();
