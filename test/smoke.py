# Loads the prototype, collects console errors, prints stats, saves a screenshot.  python3 test/smoke.py [url] [w h] [out]
import sys,json
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8765/'
W,H=(int(sys.argv[2]),int(sys.argv[3])) if len(sys.argv)>3 else (1440,900)
OUT=sys.argv[4] if len(sys.argv)>4 else '/tmp/t3.png'
mob=W<700
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx=b.new_context(viewport={'width':W,'height':H},device_scale_factor=3 if mob else 1,is_mobile=mob,has_touch=mob)
    pg=ctx.new_page();errs=[];net=[]
    pg.on('pageerror',lambda e: errs.append('pageerror: '+str(e)))
    pg.on('console',lambda m: errs.append(m.type+': '+m.text) if m.type in('error','warning') else None)
    pg.on('response',lambda r: net.append((r.status,r.url)) if r.status>=400 else None)
    pg.goto(URL+('&' if '?' in URL else '?')+'nofallback');pg.wait_for_function('window.T3&&T3.ready',timeout=60000);pg.wait_for_timeout(4000)
    print(json.dumps(pg.evaluate('T3.stats()')),'zoom',pg.evaluate('T3.cam.zoom'))
    pg.screenshot(path=OUT);print('shot',OUT)
    print('errors',errs[:10]);print('http>=400',net[:10])
    b.close()
