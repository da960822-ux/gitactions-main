# Integrated release review

The screenshots in this folder are implementation checkpoints, not the final production screenshots. Root review found clipped text and weak pawn-to-cell association in that checkpoint and made the following integration corrections:

- Restored the 11×11 perimeter coordinate model so Start/island/fund/world travel retain their corner positions. Rectangular cells have separate 100px top/bottom bands and side text/art regions; no extra gameplay cells were added.
- Corrected CSS specificity: obsolete 10px grid text slots no longer override readable city-name rows. Long horizontal names can use two lines. Side art is absolutely separated from the name/price column.
- Enlarged pawn groups retain visible characters and now have a city-name label and a pointer toward their actual cell.
- Added a compact existing-owned-city inspection panel inside the center, beside current actions. It only reads public ownership/stage/rent and opens existing city inspection; it does not authorize construction.
- Enlarged original art remains in both board and city-detail views. House/apartment assets are owner-tinted; landmark assets remain city-specific.
- Fixed the v3 final-build action label from Hotel to Landmark and added a regression test.

Root browser QA used the managed browser and a temporary local React fixture with real engines/components. Two-player built/START construction and four-player all-cities-built/four-pawns-on-one-cell states were visually inspected. The temporary fixture files were removed before packaging. DOM geometry reported 24 property names and zero overflowing city-name boxes; actual Korean glyphs were also visually inspected. Exact START selected one landmark, deducted 90, changed its toll 180→240, and removed further construction choices. The money overlay showed one signed amount and remaining cash. Independent engine review verified legacy construction version separation and acquisition followed by normal construction, while still rejecting immediate landmark after acquisition.

Limits: root did not run a fresh natural two-human online match or video recording. Worker motion checks and screenshots predate the root text/center layout adjustments. A decision on adding a fourth building stage (hotel) remains with the user; this release preserves the existing three-stage game model and applies the user's explicit initial-cap/revisit/START conditions only to new construction-version games. Existing saved games retain their previous rule contract.
