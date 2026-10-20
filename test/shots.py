# Final screenshots → repo root.  python3 test/shots.py [baseurl]
import sys
from playwright.sync_api import sync_playwright
U=(sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8765/')+'?fresh&nofallback'
A=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
def go(b,w,h,dsf,mob):
    c=b.new_context(viewport={'width':w,'height':h},device_scale_factor=dsf,is_mobile=mob,has_touch=mob);pg=c.new_page();e=[]
    pg.on('pageerror',lambda x:e.append(str(x)));pg.on('console',lambda m:e.append(m.text) if m.type=='error' else None)
    pg.goto(U);pg.wait_for_function('window.T3&&T3.ready',timeout=60000);pg.evaluate('T3.setLight(1)');pg.wait_for_timeout(3500);return c,pg,e
FOCUS="(([x,z,zm])=>{const c=T3.controls;T3.cam.zoom=zm;T3.cam.updateProjectionMatrix();const dx=x-c.target.x,dz=z-c.target.z;c.target.x+=dx;c.target.z+=dz;T3.cam.position.x+=dx;T3.cam.position.z+=dz;c.update();})"
with sync_playwright() as p:
    b=p.chromium.launch(args=A);errs=[]
    c,pg,e=go(b,1440,900,1,False);pg.screenshot(path='screenshot-desktop.png')
    pg.evaluate(FOCUS,[3,10,2.4]);pg.wait_for_timeout(2500);pg.screenshot(path='screenshot-closeup.png')
    pg.evaluate(FOCUS,[16,20,1.25]);pg.evaluate('T3.setLight(2)');pg.evaluate("T3.openSheet('carpentry')");pg.wait_for_timeout(2500);pg.screenshot(path='screenshot-night.png');errs+=e;c.close()
    c,pg,e=go(b,390,844,3,True);pg.screenshot(path='screenshot-mobile.png')
    pg.evaluate("T3.openSheet('peeler')");pg.wait_for_timeout(1500);pg.screenshot(path='screenshot-mobile-sheet.png');errs+=e;c.close()
    b.close();print('errors',errs)
