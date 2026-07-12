# Mystic Mission Web Proof

This is an experimental proof of the first public doorway into Mystic Mission. It is a completely static, zero-cost, browser-based experience.

It connects the story, atmosphere, signal decoding, a small interactive puzzle, and a hidden revelation without requiring a backend or user accounts.

**STATUS:** EXPERIMENTAL NON-CANONICAL PROOF

## How to run locally

Since the Javascript fetches `public-export.mock.json` using the Fetch API, opening `index.html` directly from the file system (via `file://`) will typically throw a CORS error. You must serve these files over HTTP.

1. Navigate to this directory in your terminal:
   ```bash
   cd experiments/2026-07-12-mystic-mission-web-proof
   ```

2. Start a local static server. If you have Python 3 installed:
   ```bash
   python3 -m http.server 8000
   ```
   Or if you prefer Node.js with `npx`:
   ```bash
   npx serve .
   ```

3. Open your browser and navigate to the address shown (usually `http://localhost:8000`).

## Interaction solution

To complete the puzzle and reveal the hidden text:
- Align **Frequency** to around `73`
- Align **Phase** to around `42`

Once both values are within 5 points of the target, the signal locks, the meter fills, and you are smoothly transitioned to the revelation view.