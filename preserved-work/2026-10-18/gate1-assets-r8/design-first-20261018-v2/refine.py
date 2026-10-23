from pathlib import Path
import re
p=Path('/workspace/gate1-assets-r8/design-first-20261018-v2')
s=Path('/workspace/gate1-assets-r8/design-first-20261018/compare.html').read_text()
s=re.sub(r'<img src="[^"]+" style="position:absolute;inset:0;width:1920px;height:1080px;clip-path:path\([^>]+>', '',s,count=1)
css='''
@font-face{font-family:Gowun;src:url(file:///workspace/yl-folded-playhouse-r8/public/fonts/gowun-batang-display.woff2)}
.sky{background-position:58% 50%}.shade{background:linear-gradient(90deg,#100a13ed 0%,#130a13eb 24%,#160b17b0 37%,#160b1715 62%,transparent 78%),linear-gradient(0deg,#29101e77,transparent 54%)}
.glow{background:radial-gradient(ellipse 29% 40% at 66% 39%,#d79b7d31,transparent 85%),radial-gradient(ellipse 43% 40% at 95% 70%,#a0365b38,transparent)}
.portrait{filter:drop-shadow(9px -2px 18px #e2a38117)}
.editorial{position:absolute;left:125px;top:242px;width:630px;color:#f0e4dc}.dedication{display:flex;align-items:center;gap:12px;font:10px DM;letter-spacing:.18em;color:#d6b9b6;margin:0 0 35px}.dedication b{font-size:16px;font-weight:400;color:#dda49f}.dedication i{margin-left:24px;font-size:9px;font-style:normal;letter-spacing:.1em}
h1{margin:0;font:500 116px/1.13 DM,'Malgun Gothic',sans-serif;letter-spacing:-.065em}h1 span{display:block}h1 .baby{font:italic 400 174px/.93 Gowun,Georgia,serif;color:#e9bfab;letter-spacing:-.075em;padding-bottom:25px;margin-left:-4px}.copy{margin:29px 0 28px;font:21px/1.65 DM,sans-serif;color:#d7c8c5;letter-spacing:-.025em}.actions{display:flex;gap:27px;align-items:center}.actions a{color:#e3c8c4;text-decoration:none;font-size:12px}.actions .play{display:flex;align-items:center;gap:48px;background:#e4bbab;color:#271820;font-size:14px;font-weight:700;padding:17px 25px 17px 28px;border-radius:2px}.play span{font-size:24px;font-weight:400}.letter{border-bottom:1px solid #cca3a13b;padding:10px 0}.letter span{margin-left:19px;color:#dba995;font-size:18px}
.nav{left:125px;width:1670px}.nav .brand{word-spacing:8px}.nav .links{gap:28px}.bottom{display:flex}.floor-tint{position:absolute;inset:0;background:radial-gradient(ellipse 32% 9% at 63% 85%,#39132154,transparent 80%);pointer-events:none}.skyline-soften{position:absolute;inset:0;background:linear-gradient(0deg,#24101b80 15%,transparent 38%);pointer-events:none}
'''
s=s.replace('</style>',css+'</style>')
# Keep the original camera projection and foreground surface crop. No face recoloring.
s=s.replace('<img class="portrait"','<div class="skyline-soften"></div><img class="portrait"')
s=s.replace('<div class="nav"><div class="links">','<div class="floor-tint"></div><div class="editorial"><p class="dedication">YEONSEOK <b>♡</b> LISBETH <i>04.04.2025</i></p><h1><span class="baby">Baby,</span><span>이거 내가</span><span>만들었어!</span></h1><p class="copy">멀리 있어도,<br>우리 둘이 같이 놀 수 있게.</p><div class="actions"><a class="play" href="#games">같이 놀자 <span>↗</span></a><a class="letter" href="#papi-letter">Papi의 편지 <span>↗</span></a></div></div><div class="nav"><span class="brand">Yeonseok ♡ Lisbeth</span><div class="links">')
# Foreground crop already contains bottom labels; retain these rather than duplicate.
s=s.replace('<title>Gate1 first-screen composition study</title>','<title>Gate1 cosmic composition refinement — unapproved static study</title>')
(p/'compare.html').write_text(s)
c=Path('/workspace/gate1-assets-r8/design-first-20261018/capture.mjs').read_text().replace("const out='/workspace/gate1-assets-r8/design-first-20261018';","const out='/workspace/gate1-assets-r8/design-first-20261018-v2';")
(p/'capture.mjs').write_text(c)
print('V2 static composition prepared; project source untouched')
