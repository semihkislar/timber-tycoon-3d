# Round trip: tap a ghost plot → sheet → Build → the REAL sim's level changes → the 3D model swaps in. Also tap-to-select via a real click.
import sys,json
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8765/'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':1280,'height':800});errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)));pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(URL+'?fresh&nofallback');pg.wait_for_function('window.T3&&T3.ready',timeout=60000);pg.wait_for_timeout(800)
    before=pg.evaluate("({lvl:T3.sim.TT.S.buildings.parquet.lvl,key:T3.B.parquet.key,coins:T3.sim.TT.S.coins})")
    # real click on the ghost plot's projected screen position
    xy=pg.evaluate("(()=>{const g=T3.B.parquet.grp;const v=g.position.clone();v.y=1.5;v.project(T3.cam);return [(v.x*.5+.5)*innerWidth,(-v.y*.5+.5)*innerHeight];})()")
    pg.mouse.click(xy[0],xy[1]);pg.wait_for_timeout(400)
    opened=pg.evaluate("!document.getElementById('sheet').classList.contains('hidden')&&document.getElementById('shName').textContent")
    pg.click('#shBuy');pg.wait_for_timeout(1500)
    after=pg.evaluate("({lvl:T3.sim.TT.S.buildings.parquet.lvl,key:T3.B.parquet.key,coins:T3.sim.TT.S.coins,drones:T3.logi.counts()})")
    real=pg.evaluate("localStorage.getItem('timberTycoon_save_v1')")
    print(json.dumps({'before':before,'sheet':opened,'after':after,'realSaveTouched':real is not None}))
    ok=before['lvl']==0 and after['lvl']==1 and after['key']!='g' and opened=='Parquet Workshop' and not errs and real is None
    print('PASS' if ok else 'FAIL',errs[:5]);b.close();sys.exit(0 if ok else 1)
