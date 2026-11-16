# Contextual board-game Foley

18 short sample files for the six non-rhythm/non-Catchmind games. No music, speech,
paid assets, account login, or external runtime requests are required.

## Sources and permission

The official pages for [Casino Audio](https://kenney.nl/assets/casino-audio),
[Impact Sounds](https://kenney.nl/assets/impact-sounds), and
[Interface Sounds](https://kenney.nl/assets/interface-sounds) each identified their
assets as Creative Commons CC0 when checked on 2026-10-27. Downloads used the free
“continue without donating” links. Each original pack notice is retained under
`source/<pack>/LICENSE.txt`; the selected original OGG files are retained alongside
it. `manifest.json` records official URLs, archive SHA-256, source SHA-256, output
SHA-256, and the processing recipe for every output. Credit: Kenney, kenney.nl.

## Material design

- `dice`: actual shake plus throw, two variations.
- `step` / `tile`: light versus medium wood contact, two variations each.
- `card`: two real card slides.
- `coin`: two chip collisions, explicitly a stylized money-token proxy.
- `build`: an original two-hit composite of wood impacts.
- `key` / `jail`: light versus heavy metal contact, not literal key/door recordings.
- `blackout`: an original switch-and-glitch composite.
- `arrival`: a short bell; `pass`: card shove; `travel`: a rising interface swoosh.
- `gem`: light glass contact.

The files deliberately carry material/transient identity rather than using one
generic pitched beep for every action. They do not encode any hidden card value,
tile value, or opponent-private state. Event selection and presentation timing are
owned by `src/audio` and the existing presentation components, not these assets.

## Rebuild and checks

From the project root, run `node scripts/build-contextual-audio.mjs` with ffmpeg
available. The offline recipe decodes the checked-in sources, trims onset, crops,
adds click-preventing fades, composes where specified, and exports mono 48kHz
PCM16 WAV. Assertions verify finite/non-silent PCM, unique output hashes, duration,
format, and peak headroom. All 18 exported files total 469,752 bytes, last measured
at 110–620ms and -6.1005dBFS sample peak.

`node scripts/build-contextual-audio.mjs --verify-browser` additionally decodes and
renders every WAV in Chromium OfflineAudioContext and writes `verification.json`
only after all checks pass. The initial attempt was blocked by the environment's
Chromium process/socket sandbox; it is not recorded as a passed browser check.

No human headphone/speaker audition has been performed or claimed. Offline PCM
checks are not evidence of perceptual mix quality; the actual game mix still needs
presentation-timing, mute/volume, and listening review.

## Subsequent browser verification

The connected CUA Chromium browser subsequently decoded all 18 files successfully through visible local QA controls. The production graph rendered 84 cue paths plus the 21 existing Hwatu samples; see `docs/audio-browser-render.json` and `docs/audio-verification.md`. This supersedes only the initial standalone-browser launch blocker, not the no-human-audition limitation.
