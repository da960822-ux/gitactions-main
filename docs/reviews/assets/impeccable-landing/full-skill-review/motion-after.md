# Motion review after corrective implementation

**Approve M01–M07 as the seven scoped corrective findings within the checked desktop scope.** Assessment A has now reviewed the final twelve Hero frames at 1440 and 1920 and cleared the specific M01 face-overlay defect. This is not a broader visual-quality or seamless-3D-room sign-off. No numeric motion score is defined or invented.

## Before / After / Why

| Before | After | Why |
| --- | --- | --- |
| M01: cosmic sheet opacity exposed telescope/orbit RGB over B faces at exact p=.35 | Final Hero spatial retirement, outer-row shader and MSAA matte correction keep the room faces opaque; Assessment A confirms the lower desk strip and pinholes are resolved and forward/reverse p=.35 faces remain clear | The original cosmic RGB overprinting defect is fixed in the final actual desktop frames; the remaining editorial cut and curved opening are separate visual-quality limits |
| M02: live reduced-motion change left birds at reduced=false / phase=greet | Native live media subscription is shared by CountryCompanions.tsx:36, PartnerPact.tsx:52, StoryTimeInteraction.tsx:26 and PostHeroPreview.tsx:36 | Final actual browser check begins with visible=true, together=true, phase=greet; switching reduce gives reduced=true, together=false, phase=instant and both body transforms identity. Restoring no-preference then actual keyboard Enter gives visible=true, together=true, phase=instant |
| M03: room hints moved on keyboard focus and ungated hover | landing-world.css:39–44: instant focus-visible; fine-hover reveal; only no-preference uses 150ms var(--ease-out) movement | Actual Tab produces focus-visible=true, opacity=1, final transform and transition=0s. Fine pointer with reduced motion also reveals at opacity=1 / transition=0s. Reduced feedback remains available |
| M04: each projected-paper callback changed width and synchronously read height | PostHeroPreview.tsx:72 uses cached natural dimensions; :216 measures semantic layout with ResizeObserver; LandingWorldHost.tsx:174 consumes the cache | The original DOM letter keeps one stable layout. Instrumented 60-pose probe changed from 120 offsetHeight reads to zero. Whole app shows 740×838 natural layout mapped to a 705px visual quad, followed by exact natural reader dimensions |
| M05: broad React renders followed every envelope and scroll frame | PostHeroPreview.tsx:17/66 keeps React updates at semantic thresholds, :90 publishes exact ref scalars to the shared scene; standalone continuous state branch remains | Same isolated actual Chromium opening probe: 110 commits before, 7 after, with 109 distinct exact opening samples preserved. 100 exact progress samples require 4 commits. Unbounded standalone state branch still produces 110 commits |
| M06: settled game sculpture scene kept drawing and running diagnostics | StudioScene.tsx:53/77 uses collection settling and stops the WebGL animation loop until invalidated; bounds/readiness diagnostics are cached | Gallery owner’s actual desktop checks show settled render counters 24→24 at 1440 and 23→23 at 1920 over 2.1 seconds. Pointer wake and raycast selection pass afterward |
| M07: two expression drawings crossfaded for 280ms, producing doubled facial features | duel-illustration.css:5 has direct opacity cuts; existing 160ms control feedback remains | Actual whole-app former-140ms sample is exactly 0/1 opacity with 0s image transitions. Keyboard choice reports data-animate=false. Original layers, masks and endpoints remain |

## Runtime evidence and limits

The whole-app desktop pass used actual pointer input to open the envelope, read the original letter, draw and accept a signature, close the pact, interrupt a fold and reopen, then complete a subsequent fold and the rose delivery. Accepted drawn signature retained one polyline and focus landed on `.pp-signed`; closing restored focus to `.pp-dolls`. Reopening restored natural paper height 838px and removed frozen inline height. Rose reached phase=received with opening=0 and letterView=rose. The physical paper, signed pact and received rose screenshots were opened and visually inspected:

- after-letter-physical.png
- after-pact-signed.png
- after-rose-received.png

A later App storage correction caused HMR during the first attempted suffix rerun. That invalidated the rerun, not the product flow; after-integration.json retains that failed harness/invalidation result and must not be cited as a product pass. Following final QA release, only the necessary rose→reread suffix and stronger live-bird checks were repeated. **after-final-recheck.json passes with no page errors:** reread restores letterView=reading, opening=1, exactly one original letter, cachedHeight=naturalHeight=838, no inline frozen height and hidden=false. after-reread.png records the restored reader. Live-bird checks require an actual visible active greeting before the preference switch and an actual visible keyboard activation after restoring the preference. The pin teardown changes scroll positioning when preference changes; the hook result is checked separately from the resulting IntersectionObserver visibility.

Performance numbers above are previously measured actual component commits, exact callback values and layout getter counts; this pass did not rerun that benchmark. The retained regression is post-hero-preview/src/PostHeroPreview.browser-test.mjs. It also verifies a projected 1257.07px frozen close returns to the prior 838px natural height on interrupted reopen. Four existing projection/collection tests and 37 targeted Vitest tests passed; TypeScript passed. The production build is coordinated by root.

M06 detailed evidence belongs to ../gallery-after/results.json and ../gallery-after/report.md. It was reviewed without duplicating the gallery runtime benchmark. M01 uses Assessment A’s final twelve actual Hero frames in ../critique-a/after/hero-final/ and its held-hero-states-1440.json / held-hero-states-1920.json. A opened all twelve frames, confirmed opaque faces and clear reverse p=.35, and confirmed that the lower desk strip and pinholes are resolved. No new captures were made for this verdict update.

## Verdict

**Approve** the seven corrective findings M01–M07 for the checked desktop behaviors: cosmic detail no longer overprints the room faces, reduced preference settles active movement, keyboard hints and choices respond instantly, the duel expression dissolve is removed, paper layout stays stable, exact scene values continue independently of broad React reconciliation, and gallery rendering rests after settling.

Assessment A retains P2 visual-quality limitations: the editorial cut near p=.24 remains perceptible, and the curved opening near p=.39 remains conspicuous. Its overall assessment is 31/40; that is A’s visual score, not a motion score. Those limits prevent describing the result as seamless, a fully 3D room, or a Lusion-quality sign-off. They do not reopen the seven specific corrective findings cleared here. No fresh feel-breaking defect was observed in the checked post-Hero path.

Skipped: full mobile, video, physical-device gestures and hardware GPU/FPS profiling; no dropped-frame or shipping frame-budget claim. No MotionScore hosted audit/score was run. The unbounded standalone scalar-state branch is tested; a full standalone WebGL canvas journey is not claimed.
