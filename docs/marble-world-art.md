# Marble printed travel board artwork

Direction: a travel collector's printed paper board. The authored backing uses warm ivory #F5F1E7, dark ink #20343A and muted jade accents. The central hero is a recognizable decorative world map, not a text substitute. It has continent silhouettes, two unlabeled route endpoints and a dashed travel arc; functional city names, prices and game state remain DOM content.

## Import contract

- `public/images/marble/backing-board.svg`: 1000×1000 viewBox, opaque printed-paper edge/backing, original geometry authored by Codex. Use as the board wrapper background with size 100% 100%; the border is decorative, with no gameplay labels. No external references or fonts.
- `public/images/marble/world-map-board.webp`: intended 840×760 (2× asset for 420×380 CSS display). Keep the complete map with object-fit contain, not cover; avoid cropping continental edges. It is decorative and should have empty alt text when adjacent DOM text explains the route. Do not position functional controls through the art.

The central inset is a bounded decoration rather than a navigation map. Scale it within the existing center grid cell. Place live dice/actions in their own opaque card so their labels preserve contrast and keyboard focus. Do not bake prices, turn labels or ownership into the image. No continent or endpoint placement is claimed to have GIS/cartographic accuracy; the stylized map is not suitable for navigation.

## Provenance and scope

Backing-board geometry is project-authored work; no third-party license or attribution is fabricated. The map is original imagegen output commissioned for this project, using no input reference image or competitor artwork. Generated source is retained separately; normalization only resizes and WebP-encodes the source without painting or compositing it. Existing collector and special atlases are retained unchanged. No landing or excluded-game artwork changes are included.

## Production result and inspection

Generated 2026-10-11 with the OpenAI image_gen tool as a brand-new image; reference-image options omitted. Original source: `/workspace/generated_images/exec-e8e24ec2-453d-4d41-b2c2-c8d54d0cb598.png` (1317×1194 RGB). The original remains untouched at that path, retaining its source content/provenance metadata. This path is an execution-workspace source record, not a deployed static URL.

Normalization: Lanczos resize to exactly 840×760, RGB, WebP quality85 method6. Shipped map: 121924 bytes. Compared quality75 (79774 bytes), quality85 (121924 bytes), quality90 (162498 bytes) at 420×380 CSS px. Quality85 retained fine printed-coastline edges and paper detail without an obvious quality90 benefit. The authored backing is 1049 bytes (actual filesystem byte count is authoritative if subsequent edits change it).

Native browser contact preview: `/workspace/onboarding/review/marble-world-map-native.png`. Visually inspected: Americas, Africa, Eurasia and Australia remain separately recognizable, route/endpoints and compass are visible, frame content is complete, no baked words/numbers/prices appeared. The prompt requested Caribbean/Hispaniola to southwestern Korea; generated endpoint positions are illustrative, not validated coordinates. The ocean-heavy, low-detail lower center leaves a calmer surface for live UI, but functional labels/actions should still sit on their own opaque card.

Checks: exact dimensions/RGB and WebP decoding verified with Pillow; backing SVG XML/viewBox and absence of text/script verified. Runtime board integration and game-state screenshots are owned by the Marble table agent.

Prompt record: original production world-map inset, flat overhead printed-cartography view, warm ivory/ink/muted-jade palette; recognizable continent silhouettes with restrained mountain/forest marks; single dashed Caribbean-to-Korea travel arc, two unlabeled pins, tiny airplane, compass without letters; complete map and ample breathing room; no words/numbers/prices/flags/logos/tiles/pawns, no perspective tilt or photographic mockup. Target 420×380 native.

Generated media does not imply a third-party license. No third-party attribution or cartographic accuracy has been invented; project owner distribution/platform terms apply. No external asset library, font or dependency was added.
