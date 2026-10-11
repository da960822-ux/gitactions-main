# Yeonseok & Lisbeth — private home

A personal Korean/Spanish game gift for Yeonseok and Lisbeth. The desktop homepage leads with all eight playable games in a wide row; a 400px unframed portrait cutout supports the personal welcome. Below the games, an explicitly static chat-translation example sits beside the bilingual letter. It is a private-feeling keepsake, not a public product or marketing site.

## Current homepage

The chat example is explanatory artwork, not a working conversation. Actual chat is available only inside game rooms. There is no photo gallery and no planned gallery feature. Do not add pretend features, fabricated anniversaries, counters, testimonials, visitor claims, or unfinished buttons. New sections belong here only after the couple chooses them and they are implemented.

The supplied portrait illustration is preserved unchanged as a local source asset. A separately generated background-removed cutout is used in the supporting hero; image generation can redraw details, so do not claim pixel identity between these files. The home atlas and Jaipur goods are generated decoration. Splendor uses 90 signature-mapped card faces, 10 noble faces, and generated gem icons; Minhwatu uses 48 Commons Hwatu card faces with CC BY-SA 4.0 attribution. The project makes no claim that these game assets match or exceed publisher-original art; see [asset sources and limits](docs/ASSETS.md).

The design target is desktop. Mobile CSS exists as a fallback but is not the current design target. Keep the UI and static copy bilingual in Korean and Dominican Spanish.

## Game and service scope

There are eight game routes: Da Vinci Code, Catchmind, Domino, Jaipur, Splendor, Minhwatu, the project's own two-player Marble rules, and Music Talk Talk. Rooms are private two-player invites with Korean/Spanish UI, recipient-language chat translation and an original-message fallback, and seven-day access expiry. Server-side rules, per-player views, version checks, request idempotency, and translation quota limits remain part of the contract.

Missing Supabase build values mean a same-browser demo, clearly labelled as a demo. Do not describe it as internet multiplayer. Cloudflare Pages and Supabase are the deployment targets; free-tier availability and uptime are not guaranteed, and inactive Supabase projects can pause.

The standalone “남편에게 / Para mi esposo” inbox has its own private two-person space and invitation, independent of game rooms. p2 can submit a message, game, or feature suggestion; p1 can update its status, and both members can read active posts. Each post becomes inaccessible seven days after its own creation and is physically removed by the scheduled cleanup; the private space itself remains. Without Supabase configuration, it is a clearly labelled same-browser local demo and does not share across devices.

## Privacy and hosting

Room records are protected by Supabase auth and row-level security. Files under `public/` are served as ordinary public assets by Pages, including both the generated cutout and the retained original illustration; room authentication does not protect them. Restrict site access at the hosting layer if the images should not be available to anyone with the site URL.

## Completion standard for every game

The requested target is the original game's quality or higher. This is an acceptance target, not a claim about the current build. A passing unit suite alone does not establish it.

- Rules: identify the original edition or selected variant; verify setup, every legal move, scoring, ties and end conditions against it. Marble remains explicitly our own rules; Domino regional variants must stay identified rather than described as universally Dominican.
- Presentation: recognizable correct assets, readable printed values, consistent card proportions, visible public information, and no private-state leaks. Artwork signatures must match the engine exactly.
- Controls: make ordinary moves available on the relevant cards or board where possible; selection, turn changes, illegal actions and results must be clear and keyboard accessible. Rare token-return choices retain the shared action selector.
- Audio and motion: relevant, optional feedback with no interference with timing or readability; reduced-motion support. Do not describe missing effects as implemented.
- Localization: static Korean and Dominican Spanish across rules and controls; preserve distinct Spanish ñ in answers. Machine translation remains confined to room chat, with original fallback.
- Verification: complete a real two-device game, including restart, reconnect, room expiry and win/lose/tie paths. Verify Rhythm timing, keyboard and audio on a normal browser before calling it complete.

Current engine audits and local browser checks improve this target but do not constitute a full eight-game original comparison. Live two-device sessions, full Rhythm play and mobile remain outside verified completion.
