# Background Design Contract v1

Purpose: define must-pass rules for adding new `#screen.bg-N` CSS backgrounds without harming pet readability, mobile UX, or runtime performance.

## Scope
- Applies to all background variants (`.bg-0` to `.bg-(BG_VARIANTS-1)`).
- Backgrounds are decorative only; no gameplay or input behavior changes.
- This contract is enforced during CSS review and manual QA.

## A) Visual readability rules (must-pass)
1. Sprite legibility must remain clear at a glance in idle, happy, hungry, sleep, dirty, and dead poses.
2. Pet center area must avoid high-frequency detail (busy stripes/noise/textures directly behind the pet).
3. UI area (bottom controls/stat chips) must stay readable in all variants.
4. Each background must either:
   - provide a subtle dark overlay lane behind UI controls, or
   - keep UI region consistently low-contrast enough for text/buttons to remain clear.
5. Do not use extreme luminance backgrounds across the whole screen (pure white / near-black full field), except intentional night scenes with compensating UI readability.

## B) Performance rules (must-pass)
1. Prefer CSS gradients and simple geometric layers over bitmap-heavy assets.
2. Allowed animation properties: `transform`, `opacity`, `background-position`.
3. Forbidden techniques:
   - `backdrop-filter`
   - heavy blur stacks / expensive full-screen filters
   - huge GIF/video backgrounds
   - effects that trigger frequent full-screen repaint/reflow
4. Keep background effects lightweight enough to avoid visible tap/scroll lag on mobile.

## C) Layering pattern (recommended)
- Base scene on `#screen` via `background` / `background-image`.
- Optional atmosphere on `#screen::before` (e.g., haze, vignette), decorative only.
- Optional effect layer on `#screen::after` (e.g., rain/sparkles) with `pointer-events: none`.
- Do not place interactive elements in pseudo-element layers.

## D) Mobile safety rules (must-pass)
1. Backgrounds must not cause layout shifts (no geometry changes to core UI).
2. Keep backgrounds purely decorative (no hit-area overlap, no tap interception).
3. Action buttons must remain readable and distinguishable at `360px` viewport width.
4. If a scene is visually busy, add a subtle overlay behind controls to recover contrast.

## E) Naming + scaling conventions
1. Define variants only as `.bg-N` classes on `#screen`.
2. Avoid per-device/per-breakpoint background forks unless strictly necessary.
3. Keep default brightness in a mid range (not blown-out bright, not crushed dark).
4. If intentionally dark (night scene), add compensating contrast treatment for controls/pet area.

## F) Quick QA checklist (copy/paste)
- [ ] Pet visible on all 6 poses
- [ ] Poop dots visible
- [ ] Buttons readable at 360px width
- [ ] No noticeable lag on mobile scrolling / tapping
- [ ] No pointer-event interference from background layers

## Implementation note for adding `bg-6`
- Add `.bg-6` in `style.css` following this contract.
- Increment `BG_VARIANTS` in `app.js` to include the new class.
- Re-run the QA checklist above before merge.
