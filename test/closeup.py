import sys,json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1440,'height':900});errs=[];pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/');pg.wait_for_function('window.T3&&T3.ready',timeout=60000);pg.wait_for_timeout(1500)
    pg.evaluate(sys.argv[1] if len(sys.argv)>1 else "(()=>{const c=T3.controls;T3.cam.zoom=2.6;T3.cam.updateProjectionMatrix();const dx=4-c.target.x,dz=8-c.target.z;c.target.x+=dx;c.target.z+=dz;T3.cam.position.x+=dx;T3.cam.position.z+=dz;c.update();})()")
    pg.wait_for_timeout(3000);pg.screenshot(path=sys.argv[2] if len(sys.argv)>2 else '/tmp/t3c.png');print(errs)
    b.close()
