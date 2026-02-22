const STORAGE_KEY = "tamagotchi-jam-state-v1";

const defaultState = {
  hunger: 1,
  sleep: 0,
  poop: 0,
  bored: 1,
  life: "alive",
  petMode: "idle",
  lastSeen: Date.now(),
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

  const validModes = new Set(["idle", "hungry", "sleep", "poop", "happy", "dead"]);
  source.petMode = validModes.has(source.petMode) ? source.petMode : "idle";
  source.lastSeen = Number(source.lastSeen) || Date.now();

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
  state.lastSeen = Date.now();
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

  document.getElementById("debugLine").textContent =
    `hunger:${state.hunger} sleep:${state.sleep} poop:${state.poop} bored:${state.bored} life:${state.life} mode:${state.petMode}`;
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
    withHappyBounce(() => {
      state.poop = Math.max(0, state.poop - 1);
    });
  });

  document.getElementById("resetBtn").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    Object.assign(state, { ...defaultState, lastSeen: Date.now() });
    state.petMode = derivePetMode(state);
    saveState();
    render();
  });

  state.petMode = derivePetMode(state);
  saveState();
  render();
}

init();
