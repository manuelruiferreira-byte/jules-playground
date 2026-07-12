# Test Report

Status: Jules-reported manual verification. Independent senior audit pending.

## Interaction solution and test method

The signal resolver requires both controls to fall within the accepted target ranges.

- Frequency target: `73`
- Phase target: `42`
- Tolerance: `±5`

Test path:

1. Serve the experiment folder over HTTP.
2. Open the site in a browser.
3. Activate `ENTER THE SIGNAL`.
4. Move Frequency into the range `68` to `78`.
5. Move Phase into the range `37` to `47`.
6. Confirm the meter reaches 100 percent and the sliders become disabled.
7. Confirm the hidden revelation appears.
8. Confirm all four gateways are visible.
9. Refresh and confirm the experience returns to the landing threshold.

## Jules-reported manual tests

### Responsiveness

Jules reported checks at:

- Desktop: `1920x1080`
- Tablet: `768x1024`
- Mobile: `480x800`
- Small mobile: `360x640`

Reported result: no text overlap or horizontal spill, full-width mobile entry button, and usable range controls.

### Keyboard and accessibility structure

Jules reported:

- The entry button and range inputs are reachable by keyboard.
- Range inputs can be changed with arrow keys.
- Labels, regions, and live-region attributes are present.
- Focus styling is defined in CSS.
- `prefers-reduced-motion` disables CSS animation and transition effects.

These items still require focused senior review in a real browser, especially:

- Whether focus remains clearly visible on every interactive control.
- Whether focus is moved or announced appropriately after view changes.
- Whether a screen-reader user receives enough puzzle feedback to solve without sight.
- Whether the unlocked revelation is announced clearly.
- Whether range controls are comfortable on touch devices.

### Functional checks

Jules reported:

- `public-export.mock.json` loads successfully when served over HTTP.
- Landing, transmission, puzzle, revelation, and gateway states appear in sequence.
- The puzzle unlock condition works at the documented tolerance.
- Refresh resets the app to the landing state.
- Reduced-motion mode remains functionally usable.

## Static review completed after PR consolidation

A read-only source review confirmed:

- Static HTML, CSS, JavaScript, and local JSON only.
- No database, account system, authentication, payments, analytics, or live AI.
- No external fonts, remote images, runtime libraries, API keys, or secrets in the implementation files.
- Kael is used as the current protagonist.
- The named withheld lore items do not appear in the public mock content.
- The experience is clearly labeled experimental and non-canonical.

## Known limitations

- The experience must be served over HTTP because `app.js` fetches the local JSON file.
- Refresh intentionally resets all progress.
- Native range controls may vary between browsers.
- The meter now exposes progress semantics and spoken strength feedback, and
  focus is moved on view changes (verified in the senior audit below).
- No automated browser test suite or cross-browser matrix is included; the
  senior audit was run in Chromium only.

## Independent senior audit (2026-07-12)

An independent senior audit was run against a live browser at 360px width
(Chromium via Playwright), driving the full landing → transmission → puzzle →
revelation path with both mouse-equivalent and keyboard/programmatic input,
under normal and `prefers-reduced-motion: reduce`.

Confirmed passing:

- No horizontal overflow at 360px; all four gateways render.
- Puzzle solves at the documented tolerance; sliders disable on lock; refresh
  resets to the landing threshold.
- No off-host or failed network requests; static-hosting compatible.
- Canon: Kael only; none of the withheld lore items appear in visible content.
- Reduced-motion path completes fully.

Blockers found and fixed on this branch:

1. **Screen-reader puzzle feedback.** The strength meter was a presentational
   `<div>` with no ARIA. It is now `role="progressbar"` with a live
   `aria-valuenow`/`aria-valuetext`, and a `role="status"` region announces
   bucketed strength ("Signal strength N percent") as controls move and
   "Signal locked" on success — enough directional feedback to solve without
   sight.
2. **Focus transfer after view changes.** Focus previously fell to `<body>`
   after Enter and after solving. Focus is now moved into the newly shown
   `transmission-view` and `revelation-view` (both `tabindex="-1"` with
   descriptive `aria-label`), so the revelation is announced and keyboard users
   are not stranded.
3. **Puzzle instruction clarity.** The instruction named only "frequency"
   though both Frequency and Phase must align; it now names both and points to
   the strength meter.
4. **Live-region noise.** `aria-live="polite"` on the whole `#app` container
   was removed; announcements now come from the dedicated status region.
5. **Console error.** A `favicon.ico` 404 was eliminated with an inline icon
   link; normal use now logs zero console errors.

## Current recommendation

Independent senior audit complete; the accessibility blockers above are fixed
and verified. Remaining items are non-blocking limitations (see above). Still
not approved for promotion or merge — that decision is Manuel's alone.
