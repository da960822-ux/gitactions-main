# Public assets

The production app starts at `src/main.tsx` and renders the landing from `src/landing/Landing.tsx` through `src/landing/LandingWorldHost.tsx`. Files in `public/` are served as static URLs; Supabase room access does not protect them. Limit site access at the hosting layer if these personal images should not be publicly reachable.

## Landing, story, and letter

The current landing uses the approved room and character source art in `public/images/approved-couple-room/`, including its masks, room textures, reaction poses, and result overlays. Its provenance, source hashes, masks, and current hero derivatives remain with those approved assets. `public/images/hero-cosmic-layers/provenance.json` also documents the active universe texture and hero transition, so it remains despite being metadata rather than a runtime image. The shared scene loads `public/images/our-universe-scene.webp` and `public/models/folded-chamber-r8-space-v6/arrival-environment.hdr`; the CSS sky fallback uses `public/images/midnight-rose-sky.webp`.

The letter and story components now live in `src/landing/story/`. Their active image dependencies include `public/images/rose-gift/` for the signing and rose animation, `public/images/story/`, and `public/images/story-companions/`. Current provenance files for those assets remain in place.

`public/images/landing-preview/` is a historical directory name, not a retired folder. The current landing still uses its eight `games/*.png` images as gallery fallbacks, `art/leonardo-self-portrait.jpg` in the game gallery, `letter-roses-atlas.png` beside the open letter, and `envelope-paper-grain.svg` in the letter and pact styling. Their provenance records are retained. The older `hero/` effects and generated standalone-preview rose are retired; the cleanup list is in [canonical main cleanup record](reviews/CANONICAL-MAIN-20261023.md).

Unused older public photos, standalone-preview portrait/envelope images, obsolete atlas PNGs, and the two manifests for models no longer present in `public/models/` have been removed from the working tree. Their earlier versions remain in Git history. The current approved room and animation sources remain available in `public/` with their provenance.

## Game assets

The eight game routes retain their active artwork and instructions: shared thumbnails in `public/images/rose-game-atlas.webp`, guide figures in `public/images/guides/`, and game-specific assets in `catchmind/`, `davinci/`, `domino/`, `game-premium-tokens/`, `hwatu/`, `hwatu-support/`, `jaipur/`, `marble/`, `personalization/`, `splendor/`, and `splendor-gems/`. The green emerald token and Hwatu ribbon graphics are active game art. Minhwatu runtime sound files remain in `public/audio/minhwatu/`; its manifest records that the source recordings are from Kenney's Casino Audio, CC0, and describes the WAV processing.

The mapped Splendor card and noble images are preserved. The source repository and its MIT notice are recorded in `public/images/splendor/LICENSE`; that notice does not establish independent publisher clearance for commercial card artwork. The 48 Hwatu card faces are CC BY-SA 4.0, credited to Spenĉjo, with the master design by Marcus Richert and source Hanafuda graphics by Louie Mantia Jr. Preserve `public/images/hwatu/ATTRIBUTION.txt` and `source-verification.json`; adaptations must keep the same license and attribution. Game names and rules are app content; the artwork does not claim to meet or exceed publisher originals.

Marble flag source URLs are recorded in `public/images/marble/flags/SOURCE.txt`; the file does not state a separate license. The Marble icons are project-authored vectors documented in `public/images/marble/icons/SOURCE.txt`. Generated Domino and Jaipur assets retain their manifests; the active Jaipur runtime is the WebP atlas under `public/images/jaipur/`.

Rhythm's unmodified SWFs and self-hosted Ruffle bundle are documented in [`RHYTHM.md`](RHYTHM.md). The SWF source post does not state a license for the game files, so no redistribution grant is implied. Keep both Ruffle license texts, MIT and Apache-2.0, beside its runtime files.

## Fonts and notices

The active landing uses DM Sans regular and bold plus Gowun Batang display text from `public/fonts/`. Preserve their bundled SIL Open Font License 1.1 notices, `DM-SANS-OFL.txt` and `GOWUN-BATANG-OFL.txt`.

## Image encoding

Runtime paths use WebP for the active universe, sky, game thumbnail, Jaipur atlas, and Marble atlases where available. Unused public PNG counterparts of the universe, sky, and thumbnail were retired; the runtime WebPs and all current approved room and rose-animation source files remain. Source and provenance records for current assets were not included in the retirement list.
