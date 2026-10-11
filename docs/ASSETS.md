# Homepage assets

## Portrait images

The original `couple-landing-design/assets/couple-illustration.png` from the user-supplied ZIP is preserved unchanged as [`yeonseok-lisbeth-portrait.jpg`](../public/images/yeonseok-lisbeth-portrait.jpg). It is a JPEG image despite the original `.png` suffix. A separate background-removed hero cutout, [`yeonseok-lisbeth-cutout.png`](../public/images/yeonseok-lisbeth-cutout.png), was generated from it for the unframed desktop hero. Image generation can redraw small details, so the cutout is not pixel-identical to the preserved source.

The archive was consulted as a visual reference only; it was not installed as a project skill or runtime.

## Retained personal images

The earlier four user-supplied JPEGs remain byte-for-byte unchanged in `public/images/`. The user does not plan to use a gallery, so these are retained but not rendered by the active homepage:

| Supplied file | Public path |
| --- | --- |
| `1-11851.jpg` | [`dos-cafe-memory-11851.jpg`](../public/images/dos-cafe-memory-11851.jpg) |
| `2-11850.jpg` | [`dos-couple-hero-11850.jpg`](../public/images/dos-couple-hero-11850.jpg) |
| `3-11849.jpg` | [`dos-couple-scrapbook-11849.jpg`](../public/images/dos-couple-scrapbook-11849.jpg) |
| `4-11848.jpg` | [`dos-couple-figurine-11848.jpg`](../public/images/dos-couple-figurine-11848.jpg) |

No separate photographer, public source URL, or license information accompanied the files. Their provenance is user-supplied.

## Game artwork and fonts

[`our-universe-scene.png`](../public/images/our-universe-scene.png) is a newly generated cinematic hero environment with textured planets, rose-gold orbital light, roses, candles, and a letter. It contains no people or interface text; the couple portrait is composited separately. Its 3D appearance is a rendered image, with browser motion implemented on separate DOM layers rather than a live WebGL model.

[`lisbeth-letter-envelope.png`](../public/images/lisbeth-letter-envelope.png) is a generated RGBA envelope with paper texture and a heart-shaped wax seal, rendered separately as the floating foreground letter.

[`splendor/box-cover.jpg`](../public/images/splendor/box-cover.jpg) is the unchanged user-supplied `11861.jpg` box cover. It replaces the development-card thumbnail in both the homepage and room game picker; the playable card faces and their cost/point mappings are retained.

[`rose-game-atlas.png`](../public/images/rose-game-atlas.png) is an original static sprite sheet with eight decorative game illustrations in four columns and two rows. CSS positions each crop while preserving its tall aspect ratio. The illustrations have a 3D look but are not 3D models, WebGL scenes, or game states. [`midnight-rose-sky.png`](../public/images/midnight-rose-sky.png) is the generated page background.

The Jaipur market uses [`ingame-jaipur-goods.png`](../public/images/ingame-jaipur-goods.png), an original generated sprite sheet with seven decorative goods. Splendor uses six generated gem-token icons from [`ingame-splendor-gems.png`](../public/images/ingame-splendor-gems.png) and 90 development-card faces plus 10 noble faces from [`splendor/`](../public/images/splendor/). The source repository is [`hexanome-04/splendor`](https://github.com/hexanome-04/splendor/tree/d1797acf5d43c6bc512b57ef3c1d990006a49a5c), pinned to commit `d1797acf5d43c6bc512b57ef3c1d990006a49a5c`; its MIT notice is included as [`splendor/LICENSE`](../public/images/splendor/LICENSE). The map matches all 90 development-card images to the game's tier, bonus, points, and five-color cost signature, and maps all 10 nobles by requirement order. The image files are unchanged. The source repository does not include a separate rights statement for the commercial card artwork, so its MIT notice does not establish independent publisher clearance.

Minhwatu uses 48 individual Hwatu SVG card faces in [`hwatu/`](../public/images/hwatu/), mapped one-to-one to the engine deck. The SVG contents are unchanged; only filenames use the app's month-slot IDs. The Commons source titles, authors, SHA-1 values, and license metadata are recorded in [`source-verification.json`](../public/images/hwatu/source-verification.json); required credit and terms are in [`ATTRIBUTION.txt`](../public/images/hwatu/ATTRIBUTION.txt). These images are CC BY-SA 4.0, credited to Spenĉjo, with the Korean-style master design by Marcus Richert and source Hanafuda graphics by Louie Mantia Jr. Adaptations must retain the same license and attribution.

The site does not claim that generated or sourced art meets or exceeds the original games' artwork. No measured comparison against publisher originals was performed. Game values, rules, card labels, and accessibility text come from the app's components and engine data. Artwork is static; the project does not use 3D models, WebGL scenes, video, or a HyperFrames render.

The page self-hosts DM Sans and Gowun Batang display text. DM Sans regular and bold match the 400 and 700 files returned by [Google Fonts](https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700); its copyright notice names The DM Sans Project Authors (2014), and its SIL Open Font License 1.1 text is in [`DM-SANS-OFL.txt`](../public/fonts/DM-SANS-OFL.txt). Gowun Batang's bundled notice identifies The Gowun Batang Project Authors (2021); its OFL text is in [`GOWUN-BATANG-OFL.txt`](../public/fonts/GOWUN-BATANG-OFL.txt). Cormorant font files and their license remain in `public/fonts/` from an earlier design and are unused by the current landing CSS.

All files in `public/images/` are public static assets when deployed. Supabase room authentication does not protect them. Restrict access to the site at the hosting layer if the couple's images should not be available to anyone who can reach the Pages URL.

## Marble collector artwork and derived images

`public/images/marble/collector-atlas.png` is newly generated original artwork: a 1774×887 four-column, two-row sheet containing Santo Domingo and Gwangju miniatures, harbor and garden scenery, decorative dice, two distinct pawn shapes, event cards, and coins/buildings. Playable dice use exact SVG pip patterns; player tokens use separate heart/diamond SVGs. City sprites are illustrations, not location photographs or live 3D models. The browser supplies dice, movement, landing, card-reveal and property-purchase effects from authoritative game state.

Six lossless WebP derivatives preserve source dimensions and every decoded RGBA pixel: the universe scene, envelope, portrait cutout, sky, game atlas and Marble atlas. Their combined size decreased from 14,083,148 to 9,632,786 bytes (31.6%). Original files remain available; current rendered paths use the derived files.

`public/images/marble/special-atlas.png` is original generated 1254×1254 artwork in four crops: island, train station, escape pass and train ticket. Its lossless WebP preserves decoded pixels and reduces 2,559,286 bytes to 1,796,666 bytes. These illustrations decorate the actual corresponding engine states; they do not determine gameplay.

The 16 country flags in `public/images/marble/flags/` are self-hosted SVGs fetched from FlagCDN. Country codes and source URLs are recorded in that directory's `SOURCE.txt`. The board maps all 24 city names in both languages to their countries. These files were checked for valid XML and executable SVG content; the UI constrains them to small fixed dimensions.

## Feedback entries

The private “남편에게 / Para mi esposo” inbox has a standalone two-person invitation space, independent of game rooms. Both members can read entries; only p2 can create one, and only p1 can change its status. Row-level security enforces these rules. Each entry becomes inaccessible seven days after its own creation, and hourly scheduled cleanup physically deletes expired entries while retaining the private space. A forward migration preserves and detaches any existing room-linked entries. Without Supabase configuration, entries use this browser's local storage for the clearly labelled same-browser demo and are not shared.

Rhythm's SWF and Ruffle provenance is documented in [`RHYTHM.md`](RHYTHM.md).
