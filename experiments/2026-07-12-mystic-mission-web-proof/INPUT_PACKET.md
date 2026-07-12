# Mystic Mission Web Proof

Status: EXPERIMENT ONLY
Branch: `jules/mystic-mission-web-proof`
Cost lane: zero cost
Promotion: prohibited without Manuel's explicit approval

## Mission

Build the first static, mobile-first public doorway into Mystic Mission.

This is not the final website and it is not canon. It is a proof that one person with free tools can connect story, atmosphere, signal decoding, a tiny playable interaction, and a hidden revelation in one self-contained browser experience.

The experience should feel like a damaged transmission from a reality that has been partially erased.

## Required experience flow

```text
Arrival
  -> atmospheric landing page
  -> visitor notices a damaged transmission
  -> visitor opens the transmission
  -> visitor solves a small signal/frequency puzzle
  -> the signal stabilizes
  -> a hidden text fragment is revealed
  -> visitor reaches four future gateways:
     Book / Film / Game / Mystic Mission
```

The proof must remain complete even without future material.

## Required sections

1. **Landing / Threshold**
   - Title: `MYSTIC MISSION`
   - Minimal subtitle suggesting that reality has a hidden layer
   - One primary action: `ENTER THE SIGNAL`
   - Strong atmosphere using CSS, typography, gradients, noise, light, and restrained animation
   - No stock template feeling

2. **Story Introduction**
   - Explain only enough for orientation
   - The war is about remembrance, not conquest
   - History may have been edited
   - A damaged signal has crossed from an erased timeline
   - Do not dump lore or explain Erebus, Kairoth, SIPR, or the full ending

3. **Damaged Transmission**
   - A short text-based transmission with missing fragments, interruptions, repeated words, timestamps, and signal loss
   - The transmission must feel meaningful rather than random glitch decoration
   - It may refer to Kael by name
   - Never use Juno in current output

4. **Signal Resolver**
   - A tiny browser interaction using 2 or 3 controls
   - Preferred mechanic: align frequency, phase, and coherence until the signal locks
   - Must be understandable without instructions longer than two sentences
   - Keyboard and touch accessible
   - No external service or backend
   - Optional Web Audio is allowed, but audio must start muted and require user activation

5. **Hidden Revelation**
   - Revealed only after solving the interaction
   - Use this experimental text unless a better non-canonical alternative is created:

```text
You are not fighting to win.
You are fighting to remember.
The signal did not survive the timeline.
It survived inside you.
```

6. **Four Gateways**
   - Book
   - Film
   - Game
   - Mystic Mission
   - These are atmospheric future doors, not promises of finished products
   - Each needs one sentence explaining its distinct medium role

7. **Credits / Status**
   - Clearly label the build as an experimental proof
   - State that no account, tracking profile, paid AI inference, or payment is required

## Visual direction

- Dark, cinematic, sacred-technical
- Night, static, ember, hidden sunlight, damaged geometry
- Avoid generic cyberpunk neon overload
- Avoid fantasy castle aesthetics
- Avoid corporate SaaS styling
- Avoid a giant wall of text
- Use one distinctive visual system throughout
- The site should feel mysterious but readable

## Technical constraints

- Self-contained inside this experiment folder
- Static HTML, CSS, and JavaScript preferred
- A lightweight zero-cost framework is acceptable only when it clearly improves maintainability
- No database
- No user accounts
- No authentication
- No payments
- No analytics
- No cookies required
- No live AI calls
- No API keys
- No paid dependencies
- No dependency on another repository
- No external fonts required
- No remote image dependency required
- Must run locally with a simple static server
- Must be deployable to GitHub Pages, Netlify, or Cloudflare Pages at zero cost

## Accessibility and performance

- Mobile-first
- Works on current Android Chrome
- Keyboard navigable
- Visible focus states
- Semantic HTML
- Good contrast
- Respect `prefers-reduced-motion`
- No autoplay audio
- No flashing effects
- Core experience usable with audio off
- Avoid heavy assets
- Target fast first load on mobile data

## Public export contract

Create a mock JSON file representing future approved public canon exports.

The site must read its visible story text from that local JSON rather than hardcoding all copy into the JavaScript.

Suggested shape:

```json
{
  "export_version": "mystic-public-export.v0.1",
  "status": "experimental_mock",
  "experience": {
    "title": "MYSTIC MISSION",
    "subtitle": "Reality contains a hidden layer.",
    "intro": [],
    "transmission": {},
    "revelation": [],
    "gateways": []
  }
}
```

Do not claim this mock file is canonical.

## Agent boundaries

- Follow the root `AGENTS.md`
- Do not access or reference other repositories
- Do not edit `canon/`
- Do not self-promote
- Do not invent definitive canon
- Do not merge
- Work only on `jules/mystic-mission-web-proof`
- Commit checkpoints after structure, interaction, polish/tests, and handoff

## Deliverables

```text
README.md
index.html
styles.css
app.js
public-export.mock.json
TEST_REPORT.md
PROMOTION_PACKET.md
```

Additional local assets are permitted when necessary.

## Completion standard

The proof is complete when:

- the full path from landing to revelation works
- the puzzle has a clear success state
- refreshing resets safely
- mobile layout is usable at 360px width
- reduced-motion mode remains usable
- no network services are required after files are loaded
- no console errors occur during normal use
- all copy is clearly experimental and non-canonical
- `PROMOTION_PACKET.md` documents provenance, risks, tests, rollback, and files

## Final report

Return:

```text
branch
latest commit SHA
files created or changed
how to run locally
interaction solution and test method
tests completed
known limitations
promotion recommendation
```

Do not merge the branch.
