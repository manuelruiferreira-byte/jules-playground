# ACED Shell Contract v1

Status: FOUNDATION DRAFT

This contract is normative for every ACED application. `ARCHITECTURE.md` remains the higher authority.

## Scope

The shared shell owns:

- app identity and canonical logo resolution
- startup transition after the native browser, PWA, or Android launch surface
- header and frame primitives
- chamber state and continuous rotation
- swipe recognition and scroll discrimination
- protected interaction zones
- modal and transient overlay stack
- browser and Android back behavior
- common accessibility and reduced-motion behavior
- shared visual tokens and minimal UI grammar

The shell does not own supplements, astrology, markets, creative projects, THEON verdicts, finance, health selection logic, or any other app-domain engine.

## Navigation model

### Chamber counts

- 0 chambers: invalid configuration, fail closed.
- 1 chamber: valid, no loop, swipe disabled, navigation dots hidden.
- 2 to 12 chambers: valid, continuous loop required.
- More than 12: requires an accepted architecture decision.

### Gesture acceptance

A chamber swipe is accepted only when:

- one pointer is active
- the gesture starts outside a protected zone
- horizontal displacement is at least 48 CSS px, or 32 CSS px with velocity at least 0.35 px/ms
- horizontal displacement is at least 1.35 times vertical displacement
- total gesture duration is no more than 700 ms
- no transition is already running

Ambiguous or diagonal gestures belong to vertical scrolling. The shell must not cancel native scrolling before horizontal intent is established.

### Protected zones

The following own their gestures and block chamber swipes:

- form controls
- contenteditable regions
- range sliders
- media controls
- open modals, dialogs, drawers, and menus
- horizontal scrollers marked `data-aced-horizontal-scroll`
- elements marked `data-aced-swipe-lock`
- charts, canvases, and custom controls explicitly marked as gesture-owned

### Rotation

- One accepted gesture produces one transition.
- Duration: 360 ms.
- Easing: `cubic-bezier(.22, 1, .36, 1)`.
- Transition lock releases on `transitionend`, with a 450 ms fallback.
- First-to-last and last-to-first use clone-and-snap or an equivalent no-flash method.
- The snap occurs with transitions disabled before the next rendered frame.
- Reduced-motion mode uses 0 ms while preserving state and focus.

## Back behavior

Back resolves in this order:

1. Close the topmost modal, dialog, drawer, menu, or handoff overlay.
2. Return from an app detail route to its parent route.
3. Return to the previous chamber in shell history without wrapping.
4. At the default chamber with no transient state, allow the browser or Android host to perform normal back or exit behavior.

Back never loops through chambers.

## Startup behavior

Allowed sequence:

```text
native launch surface -> shell readiness -> correct initial chamber
```

Forbidden:

- enter buttons or gates
- duplicate HTML splash screens
- emoji or text used as a fallback app identity
- iframe boot wrappers
- fixed artificial delays
- redirects to unfinished runtimes

The app background may appear immediately while the shell initializes.

## Branding

- Identity comes only from validated `app.config.json`.
- The canonical source logo is a repository-relative PNG.
- No component may invent a second logo path.
- PWA, maskable, Apple, splash, and Android assets are generated or validated from the canonical source.
- Missing branding fails validation rather than substituting emoji or text.

## UI grammar

- Mobile-first and readable.
- Large controls and clear state.
- No permanent technical microcopy in the main experience.
- No repeated app name on every chamber.
- No visible chamber arrows.
- Dots may indicate chamber position when chamber count is 2 or more.
- Explanations belong in Lens, About, documentation, or agent metadata.

## Accessibility

- Focus must move into an opened modal and return to the invoking control when closed.
- Keyboard navigation must reach every actionable control.
- Active chamber changes must be announced through an accessible status mechanism.
- Reduced-motion preferences must be honored.
- Touch targets should be at least 44 by 44 CSS px unless the control is inherently larger through its container.

## Acceptance tests

A migrated app cannot pass shell verification until automated or documented manual tests confirm:

- correct logo resolution
- no duplicate splash or enter gate
- valid 0, 1, 2, and normal chamber-count behavior
- one gesture equals one transition
- first-to-last and last-to-first wrapping
- vertical scrolling does not navigate
- protected controls do not navigate
- modal close precedence on Back
- detail-route precedence on Back
- chamber-history precedence on Back
- reduced-motion behavior
- state restoration after refresh and page restoration
