# Independent motion after review — offline evidence

| Before | After | Why |
|---|---|---|
| **M1 P1** Oversized overlapping giver/receiver hand swaps, color-keyed wrist grafts and multi-joint cutout seams. | **PARTIAL improvement; visual BLOCK remains.** Removed offer-hand sprites, skinfilters and fictitious finger swaps. Fixed donor shoulder, forearm-only reach; receiver rotates8degrees, supportarm staysstatic. Distinct44.369px contacts on one rigidstem hold1.20–1.85s; owner switches1.65s. Refreshed offline contact still has a deep hair-shaped innerforearm notch and thin skin/finger-like sliver betweenhands; finaldetail retains cutoutintrusion. | Kinematic continuity is improved, but clean anatomical silhouette and legible touch are separate acceptance criteria. Matching stem equations cannot clear visible missing/extra skin. Source: post-hero-preview/src/RoseGiftFinale.tsx:19–41, armPaths/fixedmask and finaljointgroups. Evidence: output/current-review/rose-naturalness/detail-1.2.png; output/current-review/rose-naturalness/detail-1.5.png; output/current-review/rose-naturalness/detail-1.7.png; output/current-review/rose-naturalness/detail-3.png. |
| **M2 P1** Eight-segment1.8s bird route repeatedly backtracks and changes height/pitch. | **Mechanically corrected; runtime gate remains.** One scalarprogress, monotonic approach, shallow<=24pxlift and<=3degpitch;1150ms authoredgreet. Duckhas0translation and<=2deg foot-nearlean. Farwing/body/nearwing order corrected; static pose sheet inspected. | Direct flight explains comingcloser. Staticwingposes and densepathsampling do not establish natural110ms wingbeat or perceivedvelocity. Source: post-hero-preview/src/CountryCompanions.tsx:10–32; country-companions.css wingkeyframes. Evidence: output/current-review/bird-correction/authored-poses.png. |
| **M3 P2** Pointerseparation1.15s versus scrollreturn.22s; multi-stop route retarget uncertain. | **Mechanically corrected; runtime gate remains.** Pointerseparation andreturn both220ms. MotionValue carries currentprogress; previousanimation stops before newtarget. Keyboard/reduced/offscreen branch jumps. | Changing intent now has a continuous state parameter and promptreturn target. Actual event ordering/velocity under rapidclick+scroll has not been run. Source: post-hero-preview/src/CountryCompanions.tsx:16–27,:43–61. Evidence: src/landing/CountryCompanions.test.ts. |
| **M4 P2** Replay first visually rewinds gifting for up to.9s, then runs forward3s. | **Numerical rewind corrected; replay feel unverified.** play kills oldtimeline, sets time0, paints, and plays only forward. Keyboardinstantcompletion and callback-once guard preserved. | No reverse gifting sequence remains in source. The instantreset itself can still feel abrupt; only real replay can clear that pacing/composition. Source: post-hero-preview/src/RoseGiftFinale.tsx:76–82. Evidence: post-hero-preview/src/RoseGiftFinale.tsx. |

## Verdict

**Block.** M1 retains a visible anatomical cutout defect. M2/M3 mechanics and M4 numerical replay direction are corrected, but none earns full motion approval without runtime. No aggregate score is invented.

**Origin, physicality and cohesion:** refreshed `detail-1.2/1.5/1.7.png` show the innerforearm notch and a thin skin-shaped projection between palms; final`detail-3.png` still shows the cutout intrusion. The removed doublefists/largeelbow artifacts are a material improvement, not a clean-anatomy pass. At time0, receiver already has a closedpalm and giver an openpalm: an ownership label does not establish the readable offered→received gesture.

Corrective prompt to the same owner: Repair source limb topology rather than adding joint equations: use a complete clean forearm/palm layer under the hair, remove the residual skin sliver at the fixed/moving boundary, and register the restpose back to clean approved received.png. Keep giver/receiver contacts separate along one stem and secure recipient contact before giver retreat. If existing assets cannot supply hidden skin, obtain a correctly registered arm-only atlas preserving original faces/outfits; do not fake completeness with blur or another crossfade.

**Interruptibility and timing:** scalar birdretargeting,220msseparation and forward-only rose replay are source-level corrections. The1150ms greeting and3s raregift remain authored narrative exceptions to ordinaryUI timing limits, but their perceivedpacing must be watched. Instant replayreset can still jump even when numericalrewind isgone.

**Performance:** removal of color-keySVGfilters and unusedofferasset reduces complexity. No hardware/compositor measurement was available; noFPS or smoothexperience claim.

**Accessibility:** source retains keyboardinstant, reduced/static and hidden/offscreen controls. Runtimepreference changes, focus, actualflow and callbacks were not freshly tested.

## Evidence and validation

Rose frames are actual componentSSR plus actual runtime transform expressions, original sourcePNGs inlined, rendered bySharp/libRSVG at authored1199x1312 coordinate space; detail crops magnified. They are not browser screenshots at1440/1920, natural playback, pagevisibility tests or hardwareperformance proof. Birdsheet is offline authoredSVG staticposes.

Viewed full0/final3 and allnine refreshedhanddetail poses, plus the birdauthoredposesheet. Dense samples preserve44.369pxcontactseparation duringhold, and transfer keeps roseposition/anglecontinuous. Reviewer directly ran **5birdtests +7rosetests, allpass**. Root separately reports88files684tests/buildpass. Geometry/test success does not override the visible residual.

Remaining gate: Actual1440x900 and1920x1080 full usertrigger and composition; Birdapproach/return pacing, near/farwing visibility and110msflicker; Rapidbirdinterruption/scroll/resize/offscreen/hiddenpagereturn; Rose wholeoffer→contacthold→receive and replayreset atnaturalspeed; Keyboardinstant, live reducedmotion, focus/callback/loading behavior.

Guidance applied: Impeccable animate/delight and Emil/review-animations STANDARDS. The selected motion job is affectionate approach and believable gifttransfer; added spectacle is not a substitute for silhouette repair. No face/outfit changes, new claims, fakechat, newrenderer or unrelatedgame edits recommended.

Skipped fresh browser/fullflow and requestedcurrent1440/1920motion checks because the active sandbox blockedserver/browser. Mobile/video and hardware/screenreader checks remainexcluded. Risk: offlineSVG and equations cannot certify current naturalness, tempo or interruption; M1 is still visibly blocked.
