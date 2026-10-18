# Baseline hero profile

Measured the existing baseline at `http://127.0.0.1:5191/` in headless Chromium, viewport 1920×1080 CSS px, device scale factor 1. No screenshot or recording was made. One forward/reverse scroll profile targeted 170vh total over a nominal 9 seconds (4.5 seconds each direction). The run reached its end condition at **12,266.2 ms of rAF timestamps** because the main thread stalled; this is a severe cadence failure, so treat the profile as a stressed baseline observation, not a clean nine-second timing comparison. Browser closed after the run.

| rAF interval measure | Result |
| --- | ---: |
| Exact interval samples | 19 |
| Average | 645.59 ms |
| P95 (nearest-rank sample) | 6,966.30 ms |
| Maximum | 6,966.30 ms |
| Long tasks observed | 20; aggregate 12,225 ms; maximum 5,607 ms |

## Renderer and CPU/GPU distinction

The page’s existing WebGL context was queried directly through `WEBGL_debug_renderer_info`; Chromium `SystemInfo.getInfo` corroborated the same device. Actual unmasked renderer: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`. CDP reports `displayType=ANGLE_SWIFTSHADER`, `glImplementationParts=(gl=egl-angle,angle=swiftshader)`, and `gpu_compositing=disabled_software`. This is software WebGL rendered by the CPU in this headless Chromium run, **not a hardware-GPU measurement**. The baseline’s own software-renderer path set renderer pixel ratio to 0.65, producing a 1248×702 canvas backing store at the requested 1920×1080 viewport and DPR 1. The target scroll positions reached 0–1836 CSS px, and the sampled scene progress peaked at 0.99; the final frame data remained at 0.822 after the last long stall, so the return scroll had not fully propagated through ScrollTrigger at termination.

No page errors were recorded. Raw sampled intervals, per-frame states, long-task entries, WebGL identification, and CDP GPU details are in [`baseline-profile.json`](baseline-profile.json). No source files or server state were changed.
