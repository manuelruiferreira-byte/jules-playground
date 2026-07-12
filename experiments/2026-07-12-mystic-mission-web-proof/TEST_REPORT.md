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
- The meter has visual feedback, but screen-reader puzzle feedback and dynamic focus behavior require senior audit.
- No automated browser test suite or cross-browser matrix is included.

## Current recommendation

Ready for focused senior audit. Not yet approved for promotion or merge.
