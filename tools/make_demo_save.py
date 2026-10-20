# Generates demo-save.json: a real v2.22 save produced by the legacy balance bot (greedy player), so the 3D prototype opens on a mid/late-game factory.
import json,sys,time
from playwright.sync_api import sync_playwright
SEC=int(sys.argv[1]) if len(sys.argv)>1 else 7200
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page()
    errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://localhost:8765/legacy/sim.html'); pg.wait_for_timeout(500)
    pg.add_script_tag(path='tools/bot.js')
    t=time.time()
    pg.evaluate(f'''(()=>{{let a=4242;Math.random=()=>{{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}};
      runBot({SEC},3,300);TT.S.events=[];}})()''')
    s=pg.evaluate('JSON.stringify(TT.S)')
    lv=pg.evaluate('Object.fromEntries(Object.entries(TT.S.buildings).map(([k,v])=>[k,v.lvl]))')
    print('secs',round(time.time()-t,1),'coins',pg.evaluate('TT.S.coins'),lv)
    print('power',pg.evaluate('TT.pwLvl()'),'station',pg.evaluate('TT.stationLvl()'),'by',pg.evaluate('TT.byLvl()'),'prem',pg.evaluate('TT.S.premium.lvl'),'harbor',pg.evaluate('TT.harborLvl()'),'staff',pg.evaluate('TT.S.staff.team.length'))
    open('demo-save.json','w').write(s); print('errors',errs[:5])
