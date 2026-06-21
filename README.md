# Bug Hunter

A self-contained Chrome T-Rex–style endless runner built with **React + TypeScript + Vite**, packaged as a single inlined HTML file suitable for [Port custom widgets](https://docs.port.io/customize-pages-dashboards-and-plugins/plugins/).

## Gameplay

Dodge incoming bugs by jumping. Hold on as long as you can — the world speeds up over time. Your best score is saved in `localStorage`.

| Control | Action |
|---------|--------|
| `Space` / `↑` | Jump (start / restart) |
| Tap / click canvas | Jump (start / restart) |

## Development

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev    # dev server at http://localhost:5173
```

## Build

```bash
npm run build
```

Produces `dist/index.html` — a single fully self-contained file (~200 kB) with all JavaScript and CSS inlined. No external requests, no extra assets.

## Deploy to Port

### Install the Port plugins CLI

```bash
npm install -g @port-labs/port-plugins-cli
```

### Configure credentials (once)

```bash
port-plugins config   # interactive; saves to .port/config
```

Alternatively use env vars: `PORT_CLIENT_ID`, `PORT_CLIENT_SECRET`.

### Upload

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier bug-hunter \
  --title "Bug Hunter" \
  --description "Dodge the bugs — an endless runner minigame" \
  --upsert
```

Then in Port: **+ Widget → Custom**, choose **Bug Hunter**, save.

## Architecture

```
src/
  main.tsx          React entry point
  App.tsx           HUD (score, high score) + canvas mount + keyboard/touch input
  game/
    engine.ts       Pure-TS game loop: physics, obstacles, collision, drawing
index.html          Vite entry
vite.config.ts      vite-plugin-singlefile → single inlined dist/index.html
```

## Port constraints satisfied

- No network calls to external hosts (CSP `connect-src` safe).
- No `window.open` calls.
- Single artifact; well under 10 MB.
- `localStorage` for high score (same-origin, no network).
