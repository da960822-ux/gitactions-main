# Third-party notices

## ThreeUI Community — selected source adaptations

The landing site selectively adapts two visual-layout patterns from ThreeUI Community source, pinned to [`MengTo/threeui` commit `68802d5428071ada5c20db8094b1649e6bb770ed`](https://github.com/MengTo/threeui/tree/68802d5428071ada5c20db8094b1649e6bb770ed):

- `src/landing/cinematic/folded/heroRoomJourney.ts`: camera-distance framing derived from `src/shaders/skeuomorphic-toggle/glassToggleScene.ts` (upstream lines 553–571; SHA-256 `a708e388eaec0a1feab2b97b59e523eda92c5083202bf0015d7554d9928c4895`), fitted to the approved room subject without scaling its geometry.
- `src/landing/gallery/GalleryCollection.ts`: selected-object focus/depth staging informed by `src/shaders/character-carousel/sources/character-filmstrip.html` (upstream lines 401–434; SHA-256 `4c98939e0e2b67efabcb8561c8b2e53b8c756e97bda44906b235ee7bc8f68b1c`), recalibrated for the existing Three.js game sculptures and fixed selection flow.

No ThreeUI package or full library is installed. No Pro/Beta code, remote preview media, fonts, or image assets were copied. The independently authored FirstConversation SVG is not ThreeUI code or artwork. ThreeUI Community source is licensed under MIT; its exact notice follows.

MIT License

Copyright (c) 2026 Meng To

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
