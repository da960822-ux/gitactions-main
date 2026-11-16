# World iconic landmark replacements — staged, not integrated

Generated 2026-10-27 through built-in image_gen__imagegen, six separate transparent raster calls. No API/CLI fallback. Originals are unchanged PNGs copied from tool-confirmed saved paths. No canonical project files or economics modified.

## Provenance
| Output | Original generated file (under /workspace/scratch/57bb19a9e9a6/generated_images/) | Reference |
|---|---|---|
| new-york-statue-of-liberty-v2.png | exec-7773a03a-a1b7-4e03-8dca-89c9c6d06493.png | new-york-empire-state.webp |
| giza-pyramids-v1.png | exec-8a77a47e-952f-421b-b110-6e70b6a73ac4.png | rome-colosseum.webp |
| rio-christ-redeemer-v1.png | exec-ebce56af-9a86-4b15-9d65-7e1d10948d1b.png | generated NYC sprite |
| singapore-marina-bay-sands-v1.png | exec-d008b7bb-b2a8-4388-af8e-ac40738d4f9e.png | sydney-opera-house.webp |
| dubai-burj-khalifa-v1.png | exec-3ccdd2e3-397b-4de3-bbbc-5086e0b6f7b2.png | new-york-empire-state.webp |
| beijing-temple-of-heaven-v1.png | exec-87d45334-2b29-4509-b1e7-64cc1324669c.png | tokyo-kaminarimon.webp |

Existing references reside in art-integration-site/public/images/marble/premium/cities/. Each inspected before tool input. Every output visually inspected fullsize and in native85-review.png. alpha-audit.json confirms real alpha0–255 on all six, not a painted checkerboard.

## Prompt set (production specification)
All calls: replace reference subject entirely, keep warm upper-left light, miniature architectural 3D diorama realism, elevated three-quarter camera, compact grounded footprint, bottom-center anchor, crisp transparent cutout; readable at85px; entire landmark visible with padding. No text, flags, people, UI, watermark, skyline, large floating ground card. transparent_background=true.
- NYC: verdigris statue, right hand raised golden torch, seven-point crown, tablet in left arm, flowing robe, warm stone pedestal and tiny grass edge. No skyscraper. Natural green material.
- Giza: one dominant large sandy-gold triangular pyramid with two smaller subordinate pyramids, clean silhouettes, compact sand contact not desert scene. No Colosseum.
- Rio: pale stone Christ the Redeemer, unobstructed horizontal outstretched arms, flowing robe, short pedestal with compact rocky Corcovado support and minimal green edge. No Liberty elements or large mountain landscape.
- Singapore: three separate slim curved blue-gray glass towers supporting one long boat-shaped SkyPark, small roof greenery, compact podium/narrow water edge. No opera sails.
- Dubai: Burj Khalifa, asymmetric stepped wings tapering to long needle spire, silver-blue glass, broad Y-derived lower tower and compact entrance. No Empire State details.
- Beijing: circular Hall of Prayer for Good Harvests, three diminishing cobalt-blue roof tiers, golden finial, red-column round hall, compact concentric pale stone terrace. No rectangular Japanese gate/lantern/writing.

## QA and integration constraints
The 85px contact sheet is a technical Sharp resize/composite for inspection only; it does not alter deliverable sprites. Six silhouettes remain distinguishable. Thin Dubai necessarily reads narrower than other monuments; do not force equal width by stretching it. Match available art-slot height with object-fit:contain. Source sizes differ and are intentionally preserved. Parent can losslessly normalize/pad/encode after approval, preserving alpha and aspect ratio. New sprites are stylistic likenesses, not architectural surveying models. Rio uses softer sculpted folds rather than strict Art Deco planar geometry.

Use display-theme-patch.json as a stable-index display-only mapping plan, not rule migration. Preserve 18 existing assets, including personal Gwangju and Santo Domingo. No Vietnam. Actual live-board rendering/overlap verification remains pending parent integration. These files alone do not complete broader motion requests.
