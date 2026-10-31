# Gallery 8 — device scroll QA checklist

Use after each scroll-related deploy. Hard-refresh the live URL first.

**Live:** https://hrnordleads-sso.github.io/gallary8/

## Pass criteria (all must pass)

1. Finger / wheel scroll advances **Arrival → Cortex → … → Whole** (7 chapters).
2. Brain camera / FX scrub with scroll (not stuck on Arrival).
3. Center of screen is **not** the WebGL canvas hit target (scroll reaches page).
4. No permanent CORTEX / VISION text clip on short landscape.
5. Chapter 7 has **no** desktop constellation angle-edge web.

## Device matrix

| Device | Mode | Check |
|--------|------|--------|
| iPhone Safari | Portrait | Full chapter run |
| iPhone Safari | Landscape | CORTEX/VISION readable; scroll advances |
| Android Chrome | Portrait + landscape | Same |
| iPad Safari | Landscape (primary regression) | Arrival not frozen; scrub works |
| iPad Safari | Portrait | Full chapter run |
| Desktop Chrome / Edge | Mouse wheel + trackpad | Cinematic scrub OK |
| Desktop + touch (Surface) | Finger | Snappier scrub (~0.55), no stick |
| OS reduced motion ON | Any | Scrub snappy; no heavy lag |

## Optional stress

- Rotate iPad mid-chapter twice; progress should stay coherent after settle.
- Split-screen / Slide Over ~600px height landscape.
- Zoom browser to 150% on desktop once.

## Scrub profile (implemented)

| Input | `scrub` |
|-------|---------|
| Reduced motion | `0.12` |
| Coarse pointer / touch / hover:none | `0.55` |
| Fine pointer (mouse) | `1.05` |
