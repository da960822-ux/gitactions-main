# Across the Distance — first desktop hero review

This is the first implementation review requested by the user. It is not completion of the whole landing. The full original brief and cumulative operating instructions remain authoritative in the conversation. No main merge or deployment has been performed.

## Checkout and preservation

- Workspace: `/workspace/gitactions-main`
- Starting commit: `b37c10b`
- Starting branch: `work`
- Implementation branch: `redesign/across-the-distance`
- Full pre-edit archive: `/workspace/shared/across-distance/baseline/project-before.tar.gz`
- Original gallery component/CSS plus captures: `/workspace/shared/across-distance/baseline/`
- Couple image: `public/images/yeonseok-lisbeth-cutout.webp`, inspected and used unchanged.
- `GameRail.tsx`, `game-rail.css`, `home.ts` letter content, game engines, feedback routes and `public/rhythm` are unchanged.
- No unverified gallery restoration candidate has been adopted. The preferred reference was subsequently identified; its separate restoration is described below.

## Art direction

Three routes considered: an architectural aperture joining warm/cool light; abstract translucent islands moving together; a paper/light sculptural theatre. Selected a folded-light aperture because it gives the approved portrait a clear stage, supports physical foreground occlusion and reversible camera travel, and can reuse its surfaces across the intro, real-time hero and subsequent story.

The first stable frame combines oversized cream/peach editorial type, a teal/amber scene, the actual portrait on an alpha-tested 3D plane, curved reflective ribbons, a rounded 3D surface, moving key lights and independent small depth markers. The same ribbons morph into longitudinal structures as the camera dollies into the surface. The portrait moves backward in the same world instead of being replaced by another image. The next heading moves on a separate depth plane.

The intro uses Remotion frame interpolation and SVG layered geometry. It is skippable, dismissed on scroll, limited to 5.5 seconds if media stalls, and skipped for reduced-motion preference and repeat visits in the same session. It shares palette and folded-light geometry with the real-time scene; its final crossfade is a remaining artistic seam to review, not a claimed seamless video-to-3D simulation.

## Actual implementation

| File | Actual role |
| --- | --- |
| `src/landing/Landing.tsx` | Mounts the new hero; retains navigation, language preference, gallery and letter |
| `src/landing/AcrossHero.tsx` | Entry states, skip/revisit, GSAP pin/scrub/reverse, depth typography, WAAPI entrance |
| `src/landing/across-hero.css` | New hero/nav composition, touch and reduced-motion variants |
| `src/landing/cinematic/across-world.ts` | Three.js camera, shaders, physical materials on hardware / light-responsive reflection shaders on software, cambered mesh morphing, alpha portrait, pointer rig, lights, video texture and disposal |
| `videos/across-distance-remotion/GiftIntro.tsx` | Rendered cinematic intro source |
| `videos/across-distance-remotion/index.tsx` | Remotion composition registration |
| `videos/folded-light-hyperframes/index.html` | Deterministic GSAP/CSS 3D surface-film source |
| `scripts/verify-across-hero.mjs` | Real Playwright capture/recording and first-stage navigation checks |

## Rendered assets actually consumed by the landing

- `public/motion/gift-intro-remotion.mp4`: Remotion `GiftIntro`, 1920×1080, 30fps, 3.6s, 1,270,207 bytes. Native muted inline video on first visit.
- `public/motion/folded-light-hyperframes.mp4`: HyperFrames `folded-light`, 960×1080, 30fps, 6.0s, 1,730,474 bytes. VideoTexture inside the same live Three.js surface, with procedural fallback before loading.
- HyperFrames render summary: screenshot capture, software GPU, approximately 18s. Not a hardware render. `check` passes errors but reports intentional off-canvas decorative folds and a composition-structure warning; these are documented, not a claim of zero findings.
- HyperFrames usage query returned `unknown / no_subscription_login`; no allowance is inferred.
- These are authored motion assets. They do not prove website interaction; raw browser videos are separate.

## Applied guidance and verified sources

- Project Ponytail full-mode, Three.js scene setup/materials-lighting, and Playwright skills.
- Official Remotion skills from `remotion-dev/skills`, upstream HEAD observed `7ba4dcf8ebe1626b00baa41e1f2478113719b60b`.
- Official HyperFrames skills from `heygen-com/hyperframes`, upstream HEAD observed `fbbc4e88c59c01bfec69368a9a587d3438a7d32a`.
- Official Emil skills from `emilkowalski/skills`, upstream HEAD observed `2d228630ba1446365f614a108cb8252f1feda202`.
- `animate`, `review-animations`, `animation-performance`, `emil-design-eng`: WAAPI entrances under initial WebGL load; reversible scrub; hover gating; short press feedback; live reduced-motion handling. No cinematic reduction.
- Existing `taste-redesign`, and exact newly installed `gpt-taste` from `Leonxlnx/taste-skill`, HEAD observed `d237dd399d57524945c0c81327da5da19f7a468d`.
- Taste guidance supplies three-line maximum, legible CTA, editorial hierarchy, asymmetry, constrained real assets and scroll depth. Its commercial AIDA, random mock planning, stock-photo and generic card prescriptions do not override the user's private-gift story and preservation rules.
- CLI installation hashes/source paths are recorded in `skills-lock.json`; observed HEAD values are provenance observations, not assertions that the installer pins every downloaded file to those commits.
- Runtime versions: GSAP 3.15.0; Three.js 0.186.1; Remotion 4.0.535; HyperFrames 0.8.149; Playwright 1.64.0.
- Three.js MIT; HyperFrames Apache-2.0; Remotion individual Free License; GSAP standard no-charge website-use license checked at https://gsap.com/community/standard-license/. Upstream notices retained.

## Reference access limitation

https://www.landing.love/sites/lusion/ and https://lusion.co/ were opened through web tools. The execution environment's proxy rejects the Landing Love page connection with 403. No full recording was downloaded or watched; the requested timestamps are user-supplied evidence, not independently verified analysis. A playable copy of the 2023 full recording or a directly accessible media URL remains needed for that analysis. No Bruno Simon reference was used.

## Still outstanding

User/dot review of the first hero; complete Remotion story; HyperFrames kinetic type/game-specific previews and highlight; further continuous gallery entrance; redesigned letter opening with original selectable text; new ending; final full-page desktop/mobile QA and recording; Safari/Android physical-device and hardware-GPU performance verification. Browser captures of the existing gallery/letter/footer only check preservation; they are not new implementations of those scenes.

## Gallery boundary update

The parent supplied the actual preferred-gallery reference: `landing-redesign-pass2-desktop-actual.mp4`, SHA-256 `18a974c22a735c99a209f867da9ce3ef7e95afbf0ef6db113bcb796c9a4466fa`, associated commit `caa6d31c42902ae359f51fc4372467c478fe593d`. Its layout is a large central selected-game 3D sculpture, smaller surrounding sculptures, and a four-column by two-row selector. Separate work owns its restoration. The expected `/workspace/gitactions-landing-redesign-pass2` directory was checked and is **not present** in this environment. No source from that directory has been read, copied or edited here. A later handoff must supply the isolated component/assets and route/language contracts for integration.

## Motion review and concrete repairs

| Before | After | Why |
| --- | --- | --- |
| JS title entry competes with first WebGL initialization | WAAPI transform entrance, 80ms stagger | Keeps the predetermined entry independent of the busy main thread |
| Entry and scrub both initialized caption opacity | Explicit scrub start poses and transient WAAPI entry | Fixes CTA and coordinate restoration after reverse scroll |
| A tween interpolates scene index into decimals | Discrete onUpdate index | Scene identifier stays legible during partial scrolling |
| Ungated CTA hover transform | Fine-pointer hover query, 160ms press transition | Prevents sticky hover on touch and gives immediate feedback |
| Reduced motion captured only at mount | Live preference listener, pointer reset and video pause | Preference changes restore a static world |
| Full Three.js eagerly included in landing entry | Dynamically imported world chunk | Core text, links and portrait fallback are available first |
| Full PBR shader cost in software WebGL | Light-responsive procedural reflection shader on identical meshes | Reduces shader cost while preserving geometry, camera, lights and foreground occlusion |

Verdict: **Block on final motion-quality approval** pending dot review and performance verification. The first full-PBR software-browser measurement was approximately 418–429ms per frame. Subsequent targeted shader checks improved to about 80ms per frame before recording overhead; this remains insufficient to claim 60fps. Hardware GPU and physical Safari/Android have not been tested. This is a concrete first review candidate, not a final Awwwards-quality declaration.

## Latest real browser verification

The refined raw recordings are in `output/playwright/across-distance/refined/`. Each captures first visit, stable pose, desktop pointer movement, scrub poses at 20/45/72/95%, reverse, language switch, preserved gallery, existing letter fold/unfold and current footer. These are unedited Playwright browser recordings.

| Viewport | Mean frame interval while recording | Page/console errors | Failed asset responses | Horizontal overflow |
| --- | --- | --- | --- | --- |
| 1920×1080 | 168.9ms | 0 | 0 | False |
| 1440×900 | 73.1ms | 0 | 0 | False |
| 390×844 | 28.8ms | 0 | 0 | False |

Recording includes encoding overhead and software GPU rendering; these measurements are not hardware-device benchmarks. Desktop motion performance remains a blocker.

`npm run build` passes; five existing landing preservation tests pass; Luna route checks pass 12/12 (exact result: `output/playwright/across-distance/routes-verification.json`). Gallery component and stylesheet SHA-256 values match the baseline.

A final mobile-only refinement moves the canvas below the CTA to fix a discovered portrait/CTA collision. Its updated recording and frames are stored separately in `output/playwright/across-distance/mobile-refined/` once that run completes.

The mobile-only final run completed: `output/playwright/across-distance/mobile-refined/390x844-raw-browser.webm` and `verification.json`. Mean frame interval 26.6ms, no page/console errors, no failed asset responses, no horizontal overflow; camera scrub/reverse, ES/KO, CTA, existing gallery, existing letter fold/unfold and feedback/play navigation assertions pass. Physical devices remain untested. No new edited highlight has been produced yet.
