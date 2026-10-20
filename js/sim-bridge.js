/* Sim bridge: runs the REAL Timber Tycoon v2.22 simulation (legacy/js, unchanged game logic) headless in a hidden
   same-origin iframe and exposes a small read model + a few commands to the Three.js renderer.
   The legacy code keeps its own setInterval tick loop; only its Canvas 2D sceneLoop is switched off (window.TT_HEADLESS).
   Save isolation: the copy writes to 'timberTycoon3d_proto_v1'. The real game's 'timberTycoon_save_v1' is only ever READ (import). */
export const PROTO_KEY='timberTycoon3d_proto_v1';
export const REAL_KEY='timberTycoon_save_v1';

export class SimBridge{
  constructor(){this.win=null;this.TT=null;this.frame=null;this.snap=null;this._g={};}
  async boot(onStatus){
    const q=new URLSearchParams(location.search);
    if(q.has('fresh')) localStorage.removeItem(PROTO_KEY);
    if(!localStorage.getItem(PROTO_KEY)){
      onStatus&&onStatus('Loading the demo factory…');
      const s=await (await fetch('demo-save.json',{cache:'no-cache'})).json();
      s.lastSave=Date.now(); s.events=[]; localStorage.setItem(PROTO_KEY,JSON.stringify(s));
    }
    onStatus&&onStatus('Starting the v2.22 simulation…');
    const f=document.createElement('iframe'); f.id='simHost'; f.src='legacy/sim.html'; f.tabIndex=-1; f.setAttribute('aria-hidden','true'); f.title='simulation host';
    document.body.appendChild(f); this.frame=f;
    await new Promise((res,rej)=>{const t0=performance.now();const chk=()=>{try{if(f.contentWindow&&f.contentWindow.TT&&f.contentWindow.TT.S) return res();}catch(e){return rej(e);}
      if(performance.now()-t0>20000) return rej(new Error('simulation did not start'));setTimeout(chk,40);};chk();});
    this.win=f.contentWindow; this.TT=this.win.TT;
    // close any modal the legacy UI opened inside the hidden frame (welcome back etc.); it has no effect on the sim
    try{this.win.document.querySelectorAll('.modal-bg').forEach(m=>m.remove());}catch(e){}
    this.static();
    return this;
  }
  /* globals that are top-level consts in the classic legacy scripts (not on window) */
  g(name){if(!(name in this._g)) this._g[name]=this.win.eval(name);return this._g[name];}
  static(){const T=this.TT;
    this.BUILDINGS=T.BUILDINGS; this.BMAP=Object.fromEntries(T.BUILDINGS.map(b=>[b.id,b]));
    this.BTIER=this.g('BTIER'); this.TIER_N=this.g('TIER_N'); this.TIER_C=this.g('TIER_C'); this.RMAP=this.g('RMAP');
    this.fmt=this.g('fmt'); this.fr=this.g('fr'); this.svgIcon=this.g('svgIcon');}
  /* producer of a resource among built-or-not buildings (first match, like the 2D SRC_OF table) */
  producer(k){const b=this.BUILDINGS.find(b=>b.out&&b.out[k]&&!b.tech||b.out&&b.out[k]);return b?b.id:null;}
  /* read model, refreshed ~5×/s */
  read(){const T=this.TT,S=T.S,bs=T.bstat;
    const b={};for(const x of this.BUILDINGS){const st=S.buildings[x.id],q=bs[x.id]||{};b[x.id]={lvl:st.lvl,on:st.on!==false,f:q.f||0,lim:q.lim||null,speed:q.speed||0,fire:!!q.fire,
      ms:T.msCount(st.lvl),tier:this.BTIER[x.id]||0};}
    let logRate=0;try{logRate=T.logRate();}catch(e){}
    let forest=1;try{forest=Math.max(0,Math.min(1,1-S.forest.st/T.forestPlots()));}catch(e){}
    this.snap={t:performance.now(),coins:S.coins,coinRate:T.coinRate,logRate,logs:S.res.logs,res:S.res,b,
      phase:T.dayPhase(),night:T.isNight(),clock:T.clockStr(),weather:T.weatherId?T.weatherId():'clear',
      power:T.pwLvl(),station:T.stationLvl(),builders:T.byLvl(),lab:(S.buildings.lab||{}).lvl||0,staff:(S.staff&&S.staff.team||[]).length,
      prem:(S.premium||{}).lvl||0,harbor:T.harborLvl(),forest,ship:S.ship?{dock:S.ship.dock,fork:S.ship.fork}:null,collectors:S.collectors};
    return this.snap;}
  /* Phase I → Phase II input links (same rule as js/tiers.js tierLinks), plus Phase II → III links for drones */
  links(){const T=this.TT,S=T.S,out=[];
    for(const b of this.BUILDINGS){const t=this.BTIER[b.id];if(t<2) continue;
      for(const k in b.inp){const src=this.BUILDINGS.find(x=>x.out[k]&&(this.BTIER[x.id]===t-1));if(!src) continue;
        const ds=S.buildings[b.id],ss=S.buildings[src.id],bq=T.bstat[b.id]||{};
        out.push({src:src.id,dst:b.id,k,tier:t,built:ds.lvl>0&&ss.lvl>0,rate:b.inp[k]*(bq.speed||0)*(bq.f||0)});}}
    return out;}
  /* commands */
  nextCost(id){try{return this.TT.bldNextCost(id);}catch(e){return Infinity;}}
  unlocked(id){try{return this.TT.bldUnlocked(id);}catch(e){return true;}}
  buy(id){const T=this.TT;const ok=id==='sawmill'&&T.sawLogsOk&&T.sawLogsOk()?T.buyBuilding(id,1,{logsOnly:true}):T.buyBuilding(id,1);try{T.save(true);}catch(e){}return ok;}
  /* swap the save slot: stop the sim frame first so its pagehide save can't overwrite what we write */
  _swap(fn){if(this.frame){try{this.win.removeEventListener&&0;}catch(e){} this.frame.remove();this.frame=null;}
    setTimeout(()=>{fn();location.reload();},60);}
  hasRealSave(){try{return !!localStorage.getItem(REAL_KEY);}catch(e){return false;}}
  importRealSave(){const raw=localStorage.getItem(REAL_KEY);if(!raw) return false;   // read-only: REAL_KEY is never written
    this._swap(()=>localStorage.setItem(PROTO_KEY,raw));return true;}
  resetDemo(){this._swap(()=>localStorage.removeItem(PROTO_KEY));}
}
