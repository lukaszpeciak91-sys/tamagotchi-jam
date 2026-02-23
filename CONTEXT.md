# CONTEXT.md — tamagotchi-jam handoff

## 1) Project summary
- App type: a lightweight Tamagotchi parody designed for quick play in a mobile browser.
- Product shape: single-screen virtual pet with simple stats + action buttons.
- Deployment target: GitHub Pages static hosting.
- Stack: plain `index.html` + `style.css` + `app.js` (no framework/build step).
- Runtime: fully client-side; all progression is saved in browser `localStorage`.
- Repository URL pattern for deploys:
  - `https://<github-username>.github.io/tamagotchi-jam/`
- Current live URL in README:
  - `https://lukaszpeciak91-sys.github.io/tamagotchi-jam/`

## 2) Current gameplay/state machine
- Canonical player flow:
  - `select` → choose pet button.
  - `egg` → tap egg until hatch.
  - `pet` → normal life loop + actions.
  - dead condition uses `life: "dead"` while `phase` remains `pet` in normalized state.
- Allowed phases in state validator: `select`, `egg`, `pet`, `dead`.
- Important normalization behavior:
  - `clampState()` rewrites `phase === "dead"` back to `"pet"`.
  - Treat death as `life`-driven, not as a durable standalone phase.
- Reset behavior:
  - Reset button removes persisted storage key.
  - Then `transitionToSelect()` restores defaults + returns to `select` overlay.
  - Next run is always `select` → `egg` once user picks a pet.
- Hatch behavior:
  - Egg taps required: `10` (`eggTaps` clamped `0..10`).
  - On hatch, state enters `phase: "pet"`, clears overrides, and starts life loop.

### Core stats and meanings
- `hunger` (`0..4`): food need; rises every tick; reduced by Feed.
- `sleep` (`0..4`): tiredness; rises slower (every 2nd tick); reduced by Sleep.
- `bored` (`0..4`): boredom; rises every tick; reduced by Play.
- `poop` (`0..4`): mess level shown as poop dots + overlays; reduced by Clean.
- Any stat at `>= 4` is critical; 2 consecutive critical ticks causes death.

### Tick cadence and tick effects
- Tick length constant: `TICK_MS = 15000` (15s).
- Tick processing is polled every second via `checkTick()`.
- Catch-up limit for background tab/sleep resumes: `MAX_CATCHUP_TICKS = 8`.
- Per applied tick (when alive and in pet phase):
  - `tickCounter += 1`
  - `hunger += 1`
  - `bored += 1`
  - `sleep += 1` only when `tickCounter % 2 === 0`
  - background rotation counters updated
  - pending poop may convert into visible poop
  - critical streak updated; death can trigger

### Poop rules
- Hard cap constant: `MAX_POOP_DOTS = 4`.
- Feed action increments `pendingPoop` by `1` (does not instantly add visible poop).
- On each tick, if `pendingPoop > 0` and `poop < 4`:
  - decrement `pendingPoop` by `1`
  - increment visible `poop` by `1`
- Clean action removes one visible poop dot per click (`poop -= 1` down to `0`).

### Pose override rules
- Overrides are ms-based via `poseOverrideUntilMs`.
- Happy override duration: `HAPPY_POSE_MS = 2000`.
- Sleep override duration: `SLEEP_POSE_MS = 3000`.
- Applied by actions:
  - Feed → `poseOverride: "happy"` for ~2s.
  - Play → `poseOverride: "happy"` for ~2s.
  - Sleep → `poseOverride: "sleepy"` for ~3s.
- Expiry logic:
  - `applyPoseExpiry(nowMs)` clears override when `nowMs >= poseOverrideUntilMs`.
  - Also clears invalid legacy/expired override during state clamping.

## 3) Sprites / assets contract
- Sprite sheet contract is strict: `3 columns x 2 rows` per pet.
- Required pose slot order by sheet coordinates:
  - Row 1: `idle`, `happy`, `hungry`
  - Row 2: `sleep`, `dirty`, `dead` (RIP frame)
- Rendering expects transparent sprite backgrounds.
- File placement contract (case-sensitive):
  - `assets/pets/<petId>/<Pet>_sheet.png`
  - Example: `assets/pets/penguin/Penguin_sheet.png`
- Keep per-pet geometry normalized:
  - no special per-pet offsets,
  - no per-pet frame-size exceptions,
  - avoid edge bleed by consistent sprite framing.
- Pet availability is defined in `PETS` config in `app.js`.
- Pet picker labels come from `PET_OPTIONS` in `app.js`.

## 4) Rendering / UX rules (important)
- Sprite bleed fix approach in current renderer:
  - pixel-based CSS vars are set at runtime (`--pet-frame-w`, `--pet-frame-h`),
  - `background-size` uses exact frame pixel multiples,
  - `background-position` uses px offsets from `--pet-col` / `--pet-row`,
  - `image-rendering: pixelated` is enabled.
- Movement model:
  - random-walk target is re-picked every `2–4s` (`MOVE_INTERVAL_MIN_MS=2000`, `MAX=4000`),
  - movement is clamped to viewport bounds with safe margin,
  - motion speed changes by mode (normal vs slow).
- Movement pause rules:
  - paused when `phase` is `select` or `egg`,
  - paused when `life === "dead"`,
  - paused whenever `poseOverride` is active (includes sleep pose).
- Death rendering rule:
  - pet stays at last coordinates (`state.petX/petY`),
  - only RIP/dead frame is shown (`petMode: "dead"`),
  - no automatic return to select on death.

## 5) Background system
- Backgrounds are CSS classes on `#screen`:
  - `bg-0` ... `bg-5` (count from `BG_VARIANTS = 6`).
- Rotation uses persisted counters in state:
  - `bgTickCounter`
  - `nextBgChangeInTicks`
  - `bgIndex`
- Rotation interval is randomized to every `2` or `3` ticks:
  - `randomBgTickInterval()` returns `2 + floor(random * 2)`.
- On threshold hit, background advances cyclically by one.
- Visual constraint to preserve:
  - keep backgrounds bright/readable enough so sprites remain legible.

### Implemented background themes (current mapping)
- `bg-0`: child room 90s
- `bg-1`: tropical beach
- `bg-2`: winter
- `bg-3`: space
- `bg-4`: open space office
- `bg-5`: soccer field

## 6) Repo structure
- Key files:
  - `index.html` → app structure, controls, debug/details node, main screen layers.
  - `style.css` → layout, backgrounds, sprite rendering, mobile sizing, overlays.
  - `app.js` → state machine, persistence, ticking, actions, movement, render loop.
- Asset roots:
  - `assets/pets/<petId>/...` for sprite sheets.
- Debug panel:
  - UI is `<details class="debug">` near reset button in `index.html`.
  - Content target is `#debugLine`.
  - When opened, it shows phase/stats/life/mode/pose/ticks/position/target/speed data.
- Persistence key:
  - `localStorage` key = `tamagotchi-jam-state-v1` (`STORAGE_KEY`).

## 7) How to safely extend
- Add a new pet safely:
  - add folder + correctly cased `*_sheet.png` under `assets/pets/<petId>/`,
  - add entry to `PETS` (sheet path + `cols:3`, `rows:2`, pose map),
  - add picker entry to `PET_OPTIONS`,
  - avoid logic changes unless mechanic intentionally changes.
- Add a new background safely:
  - add `.bg-N` CSS class in `style.css`,
  - increment `BG_VARIANTS` in `app.js`,
  - keep contrast/readability for sprite + poop overlays + controls.
- Balance gameplay safely:
  - adjust `TICK_MS` for global pacing,
  - tweak thresholds by changing stat increments/decrements,
  - tune poop pacing via feed-side `pendingPoop` increment and tick conversion,
  - keep death guardrails (`criticalTickStreak >= 2`) intentional.

## 8) “Don’t break” checklist
- Select overlay must disappear outside select phase:
  - `#petSelect[hidden] { display: none !important; }` must keep winning.
- Egg tapping must still hatch:
  - tap in `#screen` during egg phase increments `eggTaps` and hatches at `10`.
- Save/load must recover cleanly from `localStorage`:
  - no stuck `poseOverride`,
  - no invalid dead phase persistence loop,
  - state clamping remains defensive.
- Mobile layout must remain intact:
  - action buttons visible without overlap,
  - overlays not blocking intended taps,
  - panel still fits narrow viewport.
