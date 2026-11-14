# Check Your Memory 🧠

A Simon-style memory game for kids: watch the sequence of lighting buttons, then repeat it. Each round adds one more step.

**Live:** https://memory-game.orpi.pl

## Features

- 8 big round buttons, fullscreen, mobile-first (phone landscape, iPad, desktop)
- Sequence playback → "Your turn" → repeat → +1 point per correct press
- Wrong press or timeout = game over; best score kept per session
- Four modes: **Normal** (fixed 10 s), **Hard** (time scales: `2 s + 0.8 s × steps`), **Expert** (Hard + no sound), **Master** (Hard + no sound, no button numbers)
- In-game settings (⚙️): reset best, switch language / theme / mode
- 6 languages: PL / EN / ES / DE / FR / UK
- 4 color themes (Classic Blue, Ocean, Candy, Forest)
- Player name at start; optional "public computer" mode wipes the session after 5 min of inactivity
- Sounds via WebAudio (mutable), no assets needed

## Tech

Vite + React 18 + TypeScript + Tailwind CSS. Fully static — host anywhere.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs static site to dist/
npm run preview    # serve the built site locally
```

## Deploy (Cloudflare Pages)

1. Push this repo to GitHub.
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select `check-your-memory`, framework preset **Vite**:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. After deploy: **Custom domains** → add `memory-game.orpi.pl` (automatic if orpi.pl DNS is on Cloudflare).
