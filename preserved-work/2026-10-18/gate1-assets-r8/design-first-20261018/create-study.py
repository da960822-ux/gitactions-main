from pathlib import Path
import numpy as np
p=Path('/workspace/gate1-assets-r8/design-first-20261018')
root=Path('/workspace/yl-folded-playhouse-r8/public')
baseline=Path('/workspace/gate1-assets-r8/review-packet-v8-20261018/screenshots/stable-hero.png')
quad=[(769.857481393853,128.4978393353298),(1563.9900478509958,133.21505422278926),(1555.0088317036634,919.0720904666995),(772.7213659536822,924.5714151110801)]
A=[];b=[]
for (x,y),(u,v) in zip([(0,0),(1254,0),(1254,1254),(0,1254)],quad):
 A += [[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]];b += [u,v]
h=np.linalg.solve(A,b);H=np.append(h,1).reshape(3,3)
for (x,y),(u,v) in zip([(0,0),(1254,0),(1254,1254),(0,1254)],quad):
 q=H@np.array([x,y,1]); assert np.max(np.abs(q[:2]/q[2]-[u,v]))<1e-6
m=[h[0],h[3],0,h[6],h[1],h[4],0,h[7],0,0,1,0,h[2],h[5],0,1]
uri=lambda x:x.as_uri()
html='''<!doctype html><html lang="ko"><meta charset="utf-8"><title>Gate1 first-screen composition study</title><style>
@font-face{font-family:DM;src:url(FONT)}*{box-sizing:border-box}body{margin:0;background:#08070b;font-family:DM,sans-serif}#art{position:relative;width:1920px;height:1080px;overflow:hidden;background:#0d070e}.sky{position:absolute;inset:0;background:url(SKY) center center/cover no-repeat}.shade{position:absolute;inset:0;background:linear-gradient(90deg,#090407 1%,#10070edb 23%,transparent 57%),linear-gradient(0deg,#1c101b8c,transparent 50%)}.glow{position:absolute;inset:0;background:radial-gradient(ellipse 33% 45% at 66% 43%,#d79b7d28,transparent 85%),radial-gradient(ellipse 45% 40% at 95% 80%,#882b4c44,transparent)}.portrait{position:absolute;left:0;top:0;width:1254px;height:1254px;transform-origin:0 0;transform:matrix3d(MATRIX)}svg{position:absolute;inset:0;width:1920px;height:1080px}.nav{position:absolute;top:26px;left:290px;width:1340px;height:70px;display:flex;align-items:flex-start;border-bottom:1px solid #ddbea226;color:#f2e4dc;font-size:19px;padding-top:10px}.nav .links{margin-left:auto;font-size:12px;padding-top:6px;color:#ead8d2;display:flex;gap:28px}.nav .ko{background:#efd5c9;color:#23151d;border-radius:30px;padding:12px 16px;margin-top:-11px}.nav .brand{word-spacing:9px}.side{position:absolute;right:75px;top:432px;writing-mode:vertical-rl;font-size:9px;letter-spacing:.12em;color:#d7b0ad}.bottom{position:absolute;left:125px;right:125px;bottom:40px;color:#ba9caa;font-size:9px;letter-spacing:.12em;display:flex;justify-content:space-between;border-top:1px solid #cba5a127;padding-top:34px}.bottom span:nth-child(2){font-size:11px}.caption{position:fixed;top:8px;left:8px;z-index:8;background:#170a15cf;color:#e6c8c6;padding:5px 9px;font:12px DM;display:none}
</style><div id="art"><div class="sky"></div><div class="shade"></div><div class="glow"></div>
<img src="BASE" style="position:absolute;inset:0;width:1920px;height:1080px;clip-path:path('M0 0 H579 L720 153 Q855 265 850 325 L850 696 Q838 812 771 887 L425 1080 H0Z')">
<img class="portrait" src="PORTRAIT" alt="승인된 원본 커플 캐리커처">
<svg viewBox="0 0 1920 1080"><defs><clipPath id="floor"><path d="M425 1080 Q438 994 548 964 Q690 899 905 872 Q1188 827 1361 875 L1444 828 L1531 841 L1920 828 V1080Z"/></clipPath><linearGradient id="wash"><stop stop-color="#311124" stop-opacity=".27"/><stop offset="1" stop-color="#8c3756" stop-opacity=".12"/></linearGradient></defs><image href="BASE" width="1920" height="1080" clip-path="url(#floor)"/><path d="M425 1080 Q438 994 548 964 Q690 899 905 872 Q1188 827 1361 875 L1444 828 L1531 841 L1920 828 V1080Z" fill="url(#wash)"/></svg>
<div class="nav"><div class="links"><span>게임</span><span>Papi의 편지</span><span>Mami의 아이디어</span><span class="ko">KO</span><span>ES · RD</span></div></div><div class="side">한국 ───────── República Dominicana</div></div>
<script>if(location.search.includes('baseline'))document.querySelector('#art').innerHTML='<img src="BASE" width="1920" height="1080" alt="현재 실제 브라우저 화면">';</script></html>'''
for key,val in [('FONT',uri(root/'fonts/dm-sans-regular.ttf')),('SKY',uri(root/'images/midnight-rose-sky.png')),('MATRIX',','.join(map(str,m))),('BASE',uri(baseline)),('PORTRAIT',uri(root/'images/yeonseok-lisbeth-cutout.webp'))]: html=html.replace(key,val)
(p/'compare.html').write_text(html)
(p/'README.ko.md').write_text('''# 첫 화면 디자인 비교 — 정적 구도 검토\n\n현재 실제 브라우저 stable-hero.png와 동일한 캐리커처 투영 위치에 기존 midnight-rose-sky.png를 통합한 HTML 구도 연구다. 원화 얼굴/배경 파일은 변경하지 않았다. 기존 카피 영역과 바닥은 현재 실제 화면의 클립을 재사용했다. 새 조명/반사/깊이/모션이 구현됐다는 증거가 아니다.\n\n- current.png: 기존 실제 브라우저 캡처 표시\n- cosmic-study.png: 원본 우주 배경을 통합한 정적 HTML 미리보기\n- compare.html: file:// 로 열고 ?baseline으로 기존 화면 전환 가능\n- 이번 변경: 프로젝트 소스 수정 없음. 정적 미리보기와 자산 목록만 생성. 신규 렌더/베이크/긴 녹화/성능 측정 없음.\n''')
print(p/'compare.html')
