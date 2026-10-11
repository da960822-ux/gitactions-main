# Game asset family

Original vector families follow the delegated DaVinci precision-table, Catchmind sketchbook and Marble travel-miniature directions. UI icons use currentColor and 2px rounded strokes; Marble uses #20343A outlines with #F5F1E7 and #58C7B0 fills. Functional labels, prices, ownership and state remain DOM text.

Use external SVG symbols with `<svg viewBox="0 0 24 24"><use href="/images/davinci/state-icons.svg#revealed" /></svg>`. Marble symbol viewBox is 32×32. A sprite URL alone is not an img source. Phase illustrations are ordinary img sources at 160×120, displayed 80×60–120×90. IDs and provenance are in game-art-manifest.json.

Pawn SVGs retain all six engine IDs, 120×150 viewBox and (60,137) ground anchor. Their tails, flippers, visor, antenna and wings carry identity at small scale. Native browser inspection at 24,32,72px showed separate silhouettes; game-context assessment is separate.

The two city detail WebPs are source-based imagegen edits, with source output retained at the manifest path. They are retained reference pilots and are not used in the game. Runtime city art uses the coherent 24-city SVG family in `public/images/marble/cities/`; its contract and per-file provenance are in [cities/manifest.json](../public/images/marble/cities/manifest.json). None of this artwork determines prices or rules. They are illustrations rather than verified landmark/location representations. No third-party ownership or license is asserted for authored/generated work. Existing atlas PNGs and WebPs are preserved.

The printed world-map hero and paper board backing have their import contract, source record and native-size inspection in [marble-world-art.md](marble-world-art.md). The physical ownership-card frame and three isometric building pieces have their dimensions, safe zones, pivots and authored-source record in [marble-physical-assets.json](marble-physical-assets.json). These are separate families from the 32px building-level symbols.

QA status: native asset/contact-sheet inspection is recorded per family. Final integrated gameplay-screen review is pending root verification; native inspection does not establish in-game approval. Generated city and map originals are retained under `/workspace/generated_images/` outside the repository, as workspace source records rather than committed or deployed asset URLs.
