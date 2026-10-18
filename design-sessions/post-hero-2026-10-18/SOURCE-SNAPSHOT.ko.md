# 기존 편지 원문 스냅샷

2026-10-18 · `src/copy/home.ts`에서 그대로 추출. 런타임에서는 원래 landingCopy를 직접 사용한다.

## KO

```ts
    letterAddress: 'For my Mami ♡',
    letterTitle: 'Baby, surprise!',
    letterBody: [
      '이거 만들면서 네가 보고 어떤 반응을 할까 계속 생각했어.',
      '네가 가족들이랑 자주 하는 도미노도 같이 해보고 싶었고, 다른 게임도 우리 둘이 하면 재밌을 것 같았어.',
      '직접 옆에 있으면 더 좋겠지만, 떨어져 있는 동안에도 이렇게 같이 놀 수 있으면 좋겠어.',
      '아직 부족한 게 있으면 같이 하면서 고쳐갈게.',
      '사랑해, mami.',
    ],
    letterSignature: '— Your Papi, Yeonseok ♡',
```

## ES · 문서 lang es-DO

```ts
    letterAddress: 'For my Mami ♡',
    letterTitle: 'Baby, surprise!',
    letterBody: [
      'Mientras hacía esto, no dejaba de pensar en qué cara pondrías al verlo.',
      'Quería jugar contigo al dominó, que juegas tanto con tu familia, y pensé que los otros juegos también serían divertidos para nosotros dos.',
      'Me encantaría estar a tu lado, pero ojalá podamos divertirnos así mientras estamos lejos.',
      'Si algo todavía necesita mejorar, lo iremos arreglando mientras jugamos.',
      'Te amo, mami.',
    ],
    letterSignature: '— Your Papi, Yeonseok ♡',
```

## 재조사 근거 SHA-256

| 경로 | SHA-256 |
|---|---|
| `src/copy/home.ts` | `5d3fe4af041b78cd7f9a1e2949fdb934f6f1531cfd9f4184fa6d19456664dada` |
| `src/games/catalog.ts` | `f6bae54761bcda0f74f08e243fb3d1f6e697ce463a14e6395102140b8d07d8ef` |
| `public/images/yeonseok-lisbeth-portrait.jpg` | `da80ce25c2993ff8a01e74d2b715c2a678df1565edc88313ee9206c14ceb9178` |
| `public/images/yeonseok-lisbeth-cutout.webp` | `72a0010ae5960d33e62b4678715bfd1df71e3d8f743248c69eeb4c5c1c55b318` |
| `public/images/lisbeth-letter-envelope.webp` | `1e11290218524e62f64ff06106ae3a10033af28117888ca26ad97f8f689d06f1` |
| `public/images/our-universe-scene.webp` | `29747b92c13babd57938f064c9e5a6a94339594e6adafe342e18d0e25a3114e9` |
