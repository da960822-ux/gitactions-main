# Contextual audio verification — 2026-10-27

Scope: Marble, Splendor, Da Vinci, Minhwatu, Domino, Jaipur. Rhythm and Catchmind receive no new sound design.

## Native browser evidence

A temporary, visible local QA page loaded the production `src/audio/audio.ts` graph and GameFeedback controls. Its **Render and decode all samples and cues** button used native Chromium OfflineAudioContext nodes, native decodeAudioData, and the actual shipped files. Only the context lifecycle shim was replaced for offline scheduling; source, gain, filter, oscillator and sample processing were native. The check ran at per-game volume 1.

`audio-browser-render.json` records:
- 84 contextual/legacy cue paths rendered to nonzero PCM, all below the −1 dBFS safety threshold.
- Worst measured single-cue peak: −18.66 dBFS (landmark). This is not integrated LUFS, true-peak certification, or a perceptual loudness claim.
- 39 WAVs decoded: 18 new contextual Foley plus 21 existing Hwatu files; every file mono, with measured duration matching its manifest.
- The 18 new samples are 48kHz PCM16, 110–620ms, source-file peaks −6.1005 dBFS, 469,752 bytes combined. Three official Kenney CC0 packs and source notices are retained under `public/audio/contextual/source`.

Visible shared-control checks, using a QA-only native-node start/stop meter:
1. Disabled: attempted dice produced 0 sources, master gain 0.
2. Enabled: dice produced 1 source, master gain 0.42; no catch-up cue replay.
3. Keyboard End on volume: stored volume and master gain 1. Keyboard Home: stored volume and master gain 0.
4. Mute during a cue: source stop counter incremented, master gain 0; a second play while muted did not create a source.
5. Reload: disabled preference and retained volume still displayed; the volume slider was disabled while muted.

These are actual decode/render and UI/control checks, **not human headphone/speaker listening approval**. No subjective “heard correct” claim is made.

## Automated regression gates

- `src/audio/coverage.test.ts`: source-AST inventory of all 40 accepted actions, 59 public event types, 16 Marble cards and Jaipur take modes. Fails on missing or stale mappings.
- `src/audio/contextual.test.ts`: exact presented Marble dice → per-step → arrival → viewer-perspective money order; duplicate suppression; landmark vs construction; pending/applying/no-effect cards; outcome distinctions; private reservation identity invariance.
- `src/audio/audio.test.ts`: default-off and existing per-game storage preserved; gesture/autoplay rejection handled; loaded material variation; ≤8 concurrent sources; muted/hidden/scene-disposed source cancellation; missed downloads never replay later; Hwatu draw/special coverage.
- Existing board/presentation tests run alongside these tests. No dependency or engine migration.

## Reproduction / limits

`node scripts/build-contextual-audio.mjs` rebuilds the sourced material and validates PCM/header/hash/duration/peak assertions. The initial standalone Playwright process could not launch in this sandbox; subsequent verification used the connected CUA Chromium browser and visible local QA controls successfully. The temporary QA page is not part of the published application.

Hardware speaker/headphone balance and subjective audition remain unverified. The app intentionally suppresses historical, hidden-tab, interrupted/catch-up timelines; decorative hover/focus and unrevealed card identities are not sonified. Audio never affects rule authority or legal-action acceptance.
