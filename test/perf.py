# Indicative FPS (headless Chromium, NO GPU: SwiftShader software WebGL). Real phones/desktops use the GPU and are far faster.
# Also measures the same box running the current 2D game for a like-for-like reference.
import json,sys
from playwright.sync_api import sync_playwright
BASE='http://localhost:8765/'
L2D=sys.argv[1] if len(sys.argv)>1 else None
ARGS=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
def run(b,w,h,dsf,mob,url,js_ready,js_fps,secs=8):
    ctx=b.new_context(viewport={'width':w,'height':h},device_scale_factor=dsf,is_mobile=mob,has_touch=mob);pg=ctx.new_page();errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)));pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(url);pg.wait_for_function(js_ready,timeout=60000);pg.wait_for_timeout(2000)
    f0=pg.evaluate(js_fps);pg.wait_for_timeout(secs*1000);f1=pg.evaluate(js_fps)
    st=pg.evaluate('window.T3&&T3.stats?T3.stats():null');ctx.close()
    return {'fps':round((f1['n']-f0['n'])*1000/(f1['t']-f0['t']),1),'stats':st,'errors':errs[:3]}
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS);R={}
    F3='({n:T3.frames,t:performance.now()})'
    R['3d desktop 1440x900 pr1']=run(b,1440,900,1,False,BASE+'?nofallback','window.T3&&T3.ready',F3)
    R['3d mobile 390x844 pr2 (fixed)']=run(b,390,844,3,True,BASE+'?nofallback','window.T3&&T3.ready',F3)
    R['3d mobile 390x844 adaptive']=run(b,390,844,3,True,BASE,'window.T3&&T3.ready',F3,12)
    if L2D:
        F2="(()=>{if(!window.__n){window.__n=0;const f=()=>{window.__n++;requestAnimationFrame(f)};requestAnimationFrame(f);}return {n:window.__n,t:performance.now()}})()"
        R['2d v2.22 desktop 1440x900']=run(b,1440,900,1,False,L2D,'window.TT&&TT.S',F2)
        R['2d v2.22 mobile 390x844']=run(b,390,844,3,True,L2D,'window.TT&&TT.S',F2)
    b.close();print(json.dumps(R,indent=1))
