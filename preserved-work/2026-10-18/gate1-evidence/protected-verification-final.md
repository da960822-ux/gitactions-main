# Gate 1 final protected-file verification

Latest read-only check of `/workspace/yl-folded-playhouse-g1` against `protected-file-sha256.json` (baseline commit `24a6ec69eea712f632ee80e8f3cae863d38c769f`). No browser or render was run.

- Protected baseline files checked: **2,255**; changed: **0**; missing: **0**.
- Package and lock files: `package.json` and `package-lock.json` have no diff and remain covered by the unchanged protected baseline hashes.
- Current `src` change list: modified `src/landing/AcrossHero.tsx` and `src/landing/across-hero.css`; new `src/landing/cinematic/folded/pose.ts`, `pose.test.ts`, and `world.ts`.
- New public media: `public/motion/folded-playhouse-intro-wide.mp4`, `folded-playhouse-intro-classic.mp4`, `folded-playhouse-intro-tall.mp4`, and `folded-playhouse-surface.mp4`.
- New authoring sources: `videos/folded-playhouse-hyperframes/{BRIEF.md,assets/gsap.min.js,hyperframes.json,index.html}` and `videos/folded-playhouse-remotion/index.tsx`.
- No other tracked or untracked paths appeared in Git status. All current source, public media, and video authoring paths are within the Gate 1 folded-playhouse scope.
