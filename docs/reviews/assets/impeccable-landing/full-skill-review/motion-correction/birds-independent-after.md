# Bird-only after review — offline scope

| Before | After | Why |
|---|---|---|
| M2:1.8s multisegment route repeatedly reverses horizontal approach and pitch. | One bounded progress q; x=-travel*q, shallow parabolic lift<=24px and pitch<=3deg.1.15s single strong ease-in-out. Duck translates0px and leans<=2deg around62%/90% foot-near origin. | The trajectory now explains coming closer, without a decorative loop or repeated segment pauses. Rotating a complete duck still moves nonpivot pixels slightly; this is a restrained lean, not a claim both feet are mathematically immobile. |
| M2:both wings were behind the body; static wing-root/flight consistency uncertain. | Farwing→body→nearwing painter order. Shared phase, fixed shoulder roots and smaller.34/.42 source scales. Offline pose sheet shows the articulated wing poses over the same birds. | Layering now gives the near wing visibility and maintains a coherent attachment. Above/below tip sampling proves geometric sweep; it does not prove natural blur or visual quality at110ms inbrowser. |
| M3:pointer separation1.15s, reset/return.22s; array route could restart during changing intent. | Pointer separation and return both.22s using[.23,1,.32,1]; greet1.15s. Existing MotionValue animates from current progress; cleanup stops previous animation before retarget. Keyboard/reduced/offscreen branches jump to state. | Prompt reversal and a single continuous state parameter remove the structural restart problem. Sampled q reversals begin from exact current pose; event timing and velocity continuity need actual interaction. |

**M2 and M3 mechanics corrected. Entire motion approval remains withheld pending runtime.** No fresh browser or fullflow was run, because the execution sandbox still blocks that path. No rose in-flight source was read.

Evidence: the actual source, all five focused tests, and the owner offline source-SVG pose sheet were inspected. This SVG shows static authored poses, not browser playback. Reviewer directly ran `vitest run src/landing/CountryCompanions.test.ts`: **5/5 pass**. Parent broader7test/tsc result is separate.

Remaining runtime gate: actual1440×900 and1920×1080 approach/return, rapid reversal from midflight, scroll/resize/hidden-page changes,110ms wing visibility/flicker, keyboard instant action and live reduced preference. The1.15s authored greeting is permitted by the rare narrative context; it must still feel justified and responsive.

No invented aggregate score. Preserve approved assets, truthful copy, focus/keyboard alternatives and offscreen guards. Do not add more flourish to compensate for unverified feel.

Skipped fresh browser/fullflow, mobile/video and hardwareperformance. Risk: passing path math/static pose renders cannot establish animation smoothness, pacing or event interruption in the actual page.
