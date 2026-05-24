# Hero video slot

The landing hero references `/videos/bucky-ball-hero.mp4`. Drop the source file here.

Recommended encode:
- 9:16 vertical OR 4:5 portrait, 1080x1350 minimum
- H.264 baseline, 2 Mbps, ~10s loop
- No audio (it's muted-autoplay)
- Keep under 4MB so first paint isn't blocked

For the WebM companion (~30% smaller), encode `bucky-ball-hero.webm` next to
the mp4. If you do, update `src/components/sections/hero.tsx` to use a
`<source>` chain with the WebM listed first.

Until the file is present the hero falls back to the poster image
(`/photos/bucky_avni1.jpg`) so the layout never breaks.
