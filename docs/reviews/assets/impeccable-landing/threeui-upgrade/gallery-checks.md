# Gallery ThreeUI upgrade

The selected sculpture retains its existing size, position and 480ms finite selection exchange. Seven surrounding assets now form two open side arcs with real depth. This removes the top/bottom silhouette collision and enlarges every desktop peer, while preserving the Splendor cover, Da Vinci portrait and all other existing geometry. Mobile diagonal peers spread outward within the same stage and center size. Material colors, reflection strength, lighting, caption, CTA, camera, section height and story-focus calibration remain unchanged.

## Measured current dev results

All measurements project the actual current Three.js mesh bounds through the stage camera; they are not hand-entered placement thresholds. Each viewport includes every selected game.

| Viewport | Minimum selected/peer clearance | Smallest peer height | Contained |
|---|---:|---:|---|
| 1440×900 | 35.47px | 48.49px | All eight |
| 1920×1080 | 42.56px | 58.19px | All eight |
| 390×844 | 12.78px | 25.95px | All eight |

Before: the 1440px selected covers intersected the Domino projected bounds by35×55px and Marble by57×59px; at1920px by42×66px and69×70px. Mobile previously had a5.56px diagonal overlap; the final minimum is12.78px.

Unit coverage additionally verifies >=16px desktop clearance with all four extremes of the selected sculpture's existing pointer tilt, all eight raycasts, hover reset, reduced motion, 480ms settling and interruption, mobile fit, and unchanged story calibration. Seven tests pass across GalleryCollection.test.ts and studioObjects.test.ts, including original asset hash/proportion checks. The scoped detector returns[] and git diff --check is clean.

Actual browser actions: all eight game choices update their pressed state and exact play href at both desktops and390px; pointer hover/click on the now-separated Domino selects it; Home selects immediately; touch on the mobile Splendor sculpture selects it without a sticky hover. No page errors. The first pointer attempt switched media preferences immediately before the move and was cleared by the expected preference-reset handler; the confirmed attempt starts with the final preference already active.

## Visual evidence

- before-1440-splendor.png → after-1440-splendor.png
- before-1920-davinci.png → after-1920-davinci.png
- Additional matching cover/portrait stills at both desktop sizes.
- after-390-catchmind.png
- before.json and after.json contain bounds and interaction results.

The screenshots were inspected. The center has a clean silhouette; peers remain recognizable with no new frames, card grid or asset replacements. Reflection was left alone because the structural correction already provided the needed clarity.

## Provenance and scope

See provenance.md for the upstream Community source path/SHA/excerpt and full MIT notice for central attribution. This adapts focus/depth staging, not the source component UI, artwork, iframe, wheel interception or idle loop. No packages or new assets were added. Only GalleryCollection.ts and its matching test changed in this pass.

No build, server, commit or full-journey changes were performed. Software-rendered browser evidence is not a hardware performance claim; root owns the integrated whole-site verification.
