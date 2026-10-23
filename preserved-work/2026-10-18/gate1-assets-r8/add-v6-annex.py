from pathlib import Path
P=Path('/workspace/gate1-assets-r8');p=P/'author-space-v6.py';s=p.read_text();needle="# No separate plaque, frame or pedestal: the actual continuous floor carries the portrait."
addition='''# A real lit continuation beyond the corridor, rather than an empty black endpoint.
annex_mat=material('Quiet rose mineral continuation',(.33,.20,.20),.76,0,True)
annex=[]
annex.append(grid('Continuation common floor',lambda u,v:(-38+48*u,-3.41,-216-92*v),64,80,graphite,.18))
annex.append(grid('Continuation left return',lambda u,v:(-38-2*math.sin(v*math.pi/2),-3.41+24*v,-216-92*u),64,48,annex_mat,.20))
annex.append(grid('Continuation right return',lambda u,v:(10+2*math.sin(v*math.pi/2),-3.41+24*v,-216-92*u),64,48,annex_mat,.20))
annex.append(grid('Continuation vaulted roof',lambda u,v:(-40+52*u,20.5+5*math.sin(u*math.pi),-216-92*v),64,80,ivory,.20))
# Two offset returns preserve a visible passage beyond the illuminated chamber.
annex.append(grid('Continuation rear left pier',lambda u,v:(-40+15*u,-3.41+29*v,-306),32,48,annex_mat,.20))
annex.append(grid('Continuation rear right pier',lambda u,v:(-18+30*u,-3.41+29*v,-306),48,48,annex_mat,.20))
annex.append(grid('Continuation rear lintel',lambda u,v:(-25+7*u,9+17*v,-306),20,32,annex_mat,.20))
annex.append(grid('Continuation beyond floor',lambda u,v:(-25+7*u,-3.41,-306-65*v),24,48,graphite,.18))
annex.append(grid('Continuation beyond left',lambda u,v:(-25,-3.41+13*v,-306-65*u),48,24,ivory,.18))
annex.append(grid('Continuation beyond right',lambda u,v:(-18,-3.41+13*v,-306-65*u),48,24,annex_mat,.18))
for o in annex:o['runtime']=True;o['previewUnbaked']=True;o['lightmapStem']='destination-preview';uv(o)
card('Continuation high indirect source',(-18,18,-264),(-16,2,-304),18,(18,8),(1,.70,.57))
card('Continuation side indirect source',(-35,9,-285),(-12,6,-304),12,(6,12),(.56,.68,.88))
card('Continuation beyond indirect source',(-21,8,-354),(-21,2,-308),20,(5,5),(1,.66,.54))
'''
assert needle in s;s=s.replace(needle,addition+'\n'+needle);p.write_text(s)
