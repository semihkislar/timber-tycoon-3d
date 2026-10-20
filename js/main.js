/* Timber Tycoon 3D — Three.js rendering prototype.
   Game logic = the real v2.22 simulation (legacy/, headless iframe, see sim-bridge.js). This file only RENDERS its state. */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {SimBridge} from './sim-bridge.js';
import {makeBuilding,ghost} from './buildings.js';
import {buildWorld} from './world.js';
import {Logistics} from './logistics.js';
import {SLOTS,slotPos,COL,ROW,LANE,TOP_ROAD,DOCK_Z,YARD} from './layout.js';
import {MAT} from './kit.js';

const $=id=>document.getElementById(id);
const Q=new URLSearchParams(location.search);
const MOBILE=matchMedia('(pointer:coarse)').matches||Math.min(innerWidth,innerHeight)<600;
const T3=window.T3={frames:0,fpsNow:0,ready:false,errors:[]};

/* ---------------- renderer / scene / camera ---------------- */
/* quality: phones with dpr≥2 skip MSAA (the pixels are already tiny) and use a 1024 shadow map; ?q=low|high overrides */
const QL=Q.get('q')||(MOBILE?'mid':'high');
const renderer=new THREE.WebGLRenderer({canvas:$('gl'),antialias:QL==='high'||(QL==='mid'&&(devicePixelRatio||1)<2),powerPreference:'high-performance'});
let PR=Math.min(devicePixelRatio||1,QL==='low'?1:2);renderer.setPixelRatio(PR);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x7fae4e);
const VH=60;   // world units visible vertically at zoom 1
const cam=new THREE.OrthographicCamera(-1,1,1,-1,-400,800);
const AZ0=.2,POL0=.84;   // camera azimuth (from +z) and polar angle: a 3/4 view where the tier columns read top→bottom
const controls=new OrbitControls(cam,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.12;controls.screenSpacePanning=false;controls.zoomToCursor=true;
controls.minZoom=.45;controls.maxZoom=4.5;controls.minPolarAngle=.62;controls.maxPolarAngle=1.02;
controls.minAzimuthAngle=AZ0-.75;controls.maxAzimuthAngle=AZ0+.75;controls.rotateSpeed=.5;
controls.mouseButtons={LEFT:THREE.MOUSE.PAN,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};
controls.touches={ONE:THREE.TOUCH.PAN,TWO:THREE.TOUCH.DOLLY_PAN};
function placeCam(target,az=AZ0,pol=POL0){const r=200;controls.target.copy(target);
  cam.position.set(target.x+r*Math.sin(pol)*Math.sin(az),target.y+r*Math.cos(pol),target.z+r*Math.sin(pol)*Math.cos(az));cam.lookAt(target);controls.update();}

/* lights */
const hemi=new THREE.HemisphereLight(0xdbeeff,0x6b5a40,1.25);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,2.7);sun.castShadow=true;
sun.shadow.mapSize.setScalar(QL==='high'?2048:QL==='mid'?1536:1024);if(QL==='low') renderer.shadowMap.type=THREE.PCFShadowMap;const sc=sun.shadow.camera;sc.left=-70;sc.right=70;sc.top=62;sc.bottom=-62;sc.near=1;sc.far=320;
sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;sun.shadow.radius=3;
const CENTER=new THREE.Vector3(18,0,28);sun.target.position.copy(CENTER);scene.add(sun,sun.target);

/* ---------------- world ---------------- */
const world=buildWorld(scene);
const logi=new Logistics(scene);

/* ---------------- sim ---------------- */
const sim=new SimBridge();
const boot=$('boot');
function fail(e){$('bootT').textContent='Could not start: '+(e&&e.message||e);console.error(e);}
const HELPERS={power:s=>s.power,fire:s=>s.station,builders:s=>s.builders,lab:s=>s.b.lab.lvl,staffhq:s=>s.staff};
const TIERCOL={0:'trb',1:'t1b',2:'t2b',3:'t3b'};

/* buildings: one entry per slot, swapped between a real model and a ghost plot as the sim changes */
const B={};const tmpV=new THREE.Vector3();
function slotInfo(id,S){const helper=id in HELPERS;const lvl=helper?HELPERS[id](S):(S.b[id]?S.b[id].lvl:0);
  const tier=helper?4:(S.b[id]?S.b[id].tier:0);const ms=helper?Math.min(6,Math.floor(lvl/2)):(S.b[id]?S.b[id].ms:0);return {helper,lvl,tier:id==='lab'?4:tier,ms};}
function ensure(id,S){const inf=slotInfo(id,S);const key=inf.lvl>0?'b'+inf.ms:'g';const cur=B[id];if(cur&&cur.key===key){cur.inf=inf;return;}
  if(cur){scene.remove(cur.grp);}
  const p=slotPos(id);let r;
  if(inf.lvl>0) r=makeBuilding(id,inf.ms);else r=ghost(inf.tier===4?4:inf.tier);
  const g=r.grp;g.position.set(p.x,0,p.z);if(p.d<0) g.scale.x=-1;g.traverse(o=>{o.userData.bid=id;});scene.add(g);
  const born=cur&&cur.key==='g'&&key!=='g';
  B[id]={id,key,grp:g,r,inf,born:born?0:1,label:cur?cur.label:mkLabel(id)};
  g.updateMatrixWorld(true);B[id].smokeW=(r.smoke||[]).map(v=>v.clone().applyMatrix4(g.matrixWorld));rebuildSmoke();}
function rebuildSmoke(){const em=[];for(const id in B){const b=B[id];if(b.key==='g') continue;for(const p of b.smokeW) em.push({p,rate:0,big:!!b.r.smokeBig||!!b.r.steam,id});}logi.smoke.setEmitters(em);}

/* ---------------- labels (DOM overlay, projected each frame) ---------------- */
const LBL=$('labels');
function nameOf(id){const s=SLOTS[id];if(s.helper) return s.name;const b=sim.BMAP[id];return b?b.name:id;}
function mkLabel(id){const e=document.createElement('div');e.className='wl';LBL.appendChild(e);return e;}
const heads=[{t:'PHASE I · PRIMARY',c:'t1b',p:new THREE.Vector3(COL.I-3.5,0,TOP_ROAD-3)},{t:'PHASE II · SECONDARY',c:'t2b',p:new THREE.Vector3(COL.II,0,TOP_ROAD-5.5)},
  {t:'PHASE III · PREMIUM',c:'t3b',p:new THREE.Vector3(COL.III,0,TOP_ROAD-5.5)},{t:'HELPERS',c:'thb',p:new THREE.Vector3(COL.H,0,TOP_ROAD-5.5)},
  {t:'LOG YARD',c:'trb',p:new THREE.Vector3(YARD.x-2,3.4,YARD.z-3)},{t:'EXPORT DOCK',c:'thb',p:new THREE.Vector3(8,1,DOCK_Z+3)}];
for(const h of heads){h.e=document.createElement('div');h.e.className='wh '+h.c;h.e.textContent=h.t;LBL.appendChild(h.e);}
let W=innerWidth,H=innerHeight;
function proj(v){tmpV.copy(v).project(cam);return [(tmpV.x*.5+.5)*W,(-tmpV.y*.5+.5)*H,tmpV.z];}
function labelText(b){const S=sim.snap,id=b.id,inf=b.inf;
  if(b.key==='g') return {cls:'wl ghost',html:`${nameOf(id)} · <span>${inf.helper||sim.unlocked(id)?'build':'locked'}</span>`};
  let st='';if(!inf.helper){const q=S.b[id];st=!q.on?' off':q.f<.5?' idle':'';}
  const tc=TIERCOL[inf.tier]||'thb',tl=inf.helper?'':`<span class="tb ${tc}">${['','I','II','III'][inf.tier]||''}</span>`;
  return {cls:'wl'+st+(sel===id?' sel':''),html:`<span class="dot"></span>${tl}${nameOf(id)} <span class="lv">${inf.helper&&id==='staffhq'?inf.lvl+' staff':'Lv '+inf.lvl}</span>`};}
function updateLabels(){const ppu=H*cam.zoom/VH;const show=ppu>6;
  for(const id in B){const b=B[id],e=b.label;if(!show){e.style.display='none';continue;}
    const [x,y,z]=proj(tmpV.set(b.grp.position.x-.4*(b.grp.scale.x<0?-1:1),.3,b.grp.position.z+4.3));
    if(z>1||x<-80||x>W+80||y<-40||y>H+40){e.style.display='none';continue;}
    e.style.display='';e.style.transform=`translate(${x|0}px,${y|0}px) translate(-50%,-35%)`;
    if(b._t!==sim._tick){b._t=sim._tick;const L=labelText(b);if(e._h!==L.html){e.innerHTML=L.html;e._h=L.html;}if(e.className!==L.cls) e.className=L.cls;}}
  for(const h of heads){const [x,y]=proj(h.p);h.e.style.display=show?'':'none';h.e.style.transform=`translate(${x|0}px,${y|0}px) translate(-50%,-50%)`;}}

/* ---------------- HUD ---------------- */
function hud(){const S=sim.snap;$('hCoins').textContent=sim.fmt(S.coins);$('hIncome').textContent='+'+sim.fr(S.coinRate)+'/s';
  $('hLogs').textContent=sim.fr(S.logRate)+'/s';$('hClock').textContent=S.clock;$('hDayIco').textContent=lightF().day>.5?'☀️':'🌙';
  const c=logi.counts();$('nFork').textContent=c.fork;$('nBelt').textContent=c.belt;$('nDrone').textContent=c.drone;if(sel) fillSheet(sel);}
let toastT=0;function toast(msg){let t=document.querySelector('.toast3');if(!t){t=document.createElement('div');t.className='toast3';document.body.appendChild(t);}t.innerHTML=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2200);}

/* ---------------- bottom sheet ---------------- */
let sel=null;const ring=new THREE.Mesh(new THREE.RingGeometry(4.6,5.1,48),new THREE.MeshBasicMaterial({color:0xf5c84c,transparent:true,opacity:.9,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);
function helperBuy(id){const T=sim.TT;if(id==='power') return {cost:T.pwCost(),ok:T.pwUnlocked()&&T.pwLvl()<T.PW_MAX,go:()=>T.buyPower()};
  if(id==='fire') return {cost:T.stationCost(),ok:T.stationLvl()<sim.g('STATION_MAX'),go:()=>T.buyStation()};
  if(id==='builders') return {cost:T.byCost(),ok:T.byUnlocked()&&T.byLvl()<T.BY_MAX,go:()=>T.buyBuilders()};return null;}
function linkText(id){const L=sim.links();const S=sim.snap;const into=L.filter(l=>l.dst===id&&l.built),outof=L.filter(l=>l.src===id&&l.built);
  const mode=l=>l.tier===3?'🛸 drone':(l.src==='sawmill'&&l.dst==='carpentry')||(l.src==='chipper'&&l.dst==='pellet')?'⟿ belt':'🚜 forklift';
  const p=[...into.map(l=>`${mode(l)} ← ${nameOf(l.src)}`),...outof.map(l=>`${mode(l)} → ${nameOf(l.dst)}`)];return p.length?p.slice(0,3).join('<br>'):'—';}
function fillSheet(id){const S=sim.snap,b=B[id];if(!b) return;const inf=b.inf,bm=sim.BMAP[id],T=sim.TT;
  $('shName').textContent=nameOf(id);const tier=inf.helper?'HELPER':(['RAW','I','II','III'][inf.tier]||'');const tc=inf.helper?'#5f7d3a':sim.TIER_C[inf.tier];
  $('shTier').textContent=tier;$('shTier').style.background=tc;
  $('shIcon').innerHTML=bm?sim.svgIcon(bm.svg,36):`<span style="font-size:28px">${SLOTS[id].icon}</span>`;
  $('shSub').textContent=bm?bm.desc:{power:'Burns fuel for a factory-wide speed boost.',fire:'Fire crews put out building fires faster.',builders:'Builder crews auto-upgrade your buildings.',staffhq:'Your hired team: roles, wages, training.'}[id]||'';
  $('shLvl').innerHTML=inf.lvl>0?(id==='staffhq'?`${inf.lvl} staff`:`Lv ${inf.lvl}`+(inf.ms?` · ${'★'.repeat(inf.ms)}`:'')):'Not built';
  let f=0,st='—';if(!inf.helper&&S.b[id]){const q=S.b[id];f=q.lvl?q.f:0;st=!q.lvl?'Not built':q.fire?'🔥 On fire':!q.on?'Switched off':q.f>.98?'Running':q.lim?`Needs ${sim.RMAP[q.lim]?sim.RMAP[q.lim].name.toLowerCase():q.lim}`:'Output full';}
  else if(inf.lvl>0){f=1;st='Active';}
  $('shBar').style.width=Math.round(f*100)+'%';$('shStat').textContent=st+(f>0&&f<.98?` · ${Math.round(f*100)}%`:'');
  if(bm){const r=o=>Object.entries(o).map(([k,v])=>`<span class="r">${v}${sim.RMAP[k]?sim.svgIcon(sim.RMAP[k].svg,22)||sim.RMAP[k].icon:k}</span>`).join('');
    $('shRecipe').innerHTML=`${r(bm.inp)}<span class="arr">➜</span>${Object.keys(bm.out).length?r(bm.out):'<span class="r">🔬 RP</span>'}`;$('shRecipe').style.display='';}
  else $('shRecipe').style.display='none';
  $('shLink').innerHTML=bm?linkText(id):'—';
  const btn=$('shBuy');let cost,ok;
  if(inf.helper&&id!=='lab'){const h=helperBuy(id);if(h){cost=h.cost;ok=h.ok&&S.coins>=cost;$('shBuyT').textContent=!h.ok&&inf.lvl?'Max level':inf.lvl?'Upgrade':'Build';if(!h.ok&&inf.lvl) cost=null;}else{cost=null;ok=false;$('shBuyT').textContent='Manage in 2D UI';}}
  else{cost=sim.nextCost(id);ok=sim.unlocked(id)&&S.coins>=cost;$('shBuyT').textContent=!sim.unlocked(id)?'Locked':inf.lvl?'Upgrade':'Build';}
  $('shCost').textContent=cost==null?'':'🪙 '+sim.fmt(cost);$('shCost').style.display=cost==null?'none':'';btn.disabled=!ok;}
function openSheet(id){sel=id;$('sheet').classList.remove('hidden');fillSheet(id);const b=B[id];ring.visible=true;ring.position.set(b.grp.position.x-.4,.08,b.grp.position.z);sim._tick++;}
function closeSheet(){sel=null;$('sheet').classList.add('hidden');ring.visible=false;sim._tick++;}
$('shClose').onclick=closeSheet;
$('shBuy').onclick=()=>{if(!sel) return;const id=sel;let ok;const S=sim.snap;
  if(id in HELPERS&&id!=='lab'){const h=helperBuy(id);ok=h&&h.go();try{sim.TT.save(true);}catch(e){}}else ok=sim.buy(id);
  sim.read();sim._tick++;ensure(id,sim.snap);logi.sync(sim);fillSheet(id);toast(ok?`✅ ${nameOf(id)} → Lv ${slotInfo(id,sim.snap).lvl}`:'Not enough coins');};

/* ---------------- picking ---------------- */
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,t:performance.now()};});
renderer.domElement.addEventListener('pointerup',e=>{if(!down) return;const d=Math.hypot(e.clientX-down.x,e.clientY-down.y),dt=performance.now()-down.t;down=null;if(d>8||dt>450) return;
  ndc.set(e.clientX/W*2-1,-(e.clientY/H)*2+1);ray.setFromCamera(ndc,cam);const objs=Object.values(B).map(b=>b.grp);const hit=ray.intersectObjects(objs,true)[0];
  if(hit&&hit.object.userData.bid){openSheet(hit.object.userData.bid);}else if(sel) closeSheet();});

/* ---------------- day / night (driven by the sim clock) ---------------- */
let lightMode=0;   // 0 auto, 1 day, 2 night
function lightF(){const p=lightMode===1?.5:lightMode===2?.95:(sim.snap?sim.snap.phase:.5);const ss=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  const day=ss(.17,.3,p)*(1-ss(.72,.84,p));return {p,day,warm:Math.sin(day*Math.PI)*(day<1?1:0)};}
const C=(h)=>new THREE.Color(h);const cHemiD=C(0xdbeeff),cHemiN=C(0x5a6aa0),cSunD=C(0xfff0d8),cSunN=C(0x9fb4ff),cWarm=C(0xffa860),cBgD=C(0x7fae4e),cBgN=C(0x1d2a1a);
function applyLight(){const {p,day,warm}=lightF();hemi.color.copy(cHemiN).lerp(cHemiD,day);hemi.intensity=.9+.35*day;world.setNight&&world.setNight(1-day);
  sun.color.copy(cSunN).lerp(cSunD,day).lerp(cWarm,warm*.55);sun.intensity=.8+1.9*day;
  const a=(p-.5)*1.6;sun.position.set(CENTER.x+Math.sin(a)*70+20,95,CENTER.z+38+Math.cos(a)*10);
  MAT.glass.emissiveIntensity=(1-day)*1.7;renderer.toneMappingExposure=.95+.12*day;scene.background.copy(cBgN).lerp(cBgD,day);
  document.body.classList.toggle('night',day<.4);}
$('bDay').onclick=()=>{lightMode=(lightMode+1)%3;$('bDay').textContent=['🌗','☀️','🌙'][lightMode];$('bDay').classList.toggle('on',lightMode>0);toast(['Light follows the in-game clock','Daylight','Night'][lightMode]);};

/* ---------------- camera fit / rotate ---------------- */
function resize(){W=innerWidth;H=innerHeight;renderer.setSize(W,H,false);const a=W/H;cam.left=-VH*a/2;cam.right=VH*a/2;cam.top=VH/2;cam.bottom=-VH/2;cam.updateProjectionMatrix();}
function fit(anim){const tb=$('hud').offsetHeight+6,bb=MOBILE?54:46;
  const box=MOBILE?new THREE.Box3(new THREE.Vector3(-14,0,-14),new THREE.Vector3(24,6,30)):new THREE.Box3(new THREE.Vector3(-26,0,-20),new THREE.Vector3(52,7,70));
  const ctr=box.getCenter(new THREE.Vector3());placeCam(ctr,controls.getAzimuthalAngle?controls.getAzimuthalAngle():AZ0,POL0);cam.updateMatrixWorld();
  const inv=cam.matrixWorldInverse;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(let i=0;i<8;i++){const v=new THREE.Vector3(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z).applyMatrix4(inv);x0=Math.min(x0,v.x);x1=Math.max(x1,v.x);y0=Math.min(y0,v.y);y1=Math.max(y1,v.y);}
  const availH=H-tb-bb,a=W/H;const zw=(VH*a)/(x1-x0)*(W-16)/W,zh=VH/(y1-y0)*availH/H;const z=MOBILE&&H>W?zw:Math.min(zw,zh);cam.zoom=THREE.MathUtils.clamp(z,controls.minZoom,controls.maxZoom);cam.updateProjectionMatrix();
  // shift so the box is centred in the free area between the HUD and the legend (move the target along the ground 'forward')
  const sh=((tb-bb)/2)*VH/cam.zoom/H;const fwd=new THREE.Vector3();cam.getWorldDirection(fwd);fwd.y=0;fwd.normalize();const pol=controls.getPolarAngle();
  placeCam(ctr.clone().addScaledVector(fwd,sh/Math.max(.3,Math.cos(pol))).setY(0),controls.getAzimuthalAngle(),POL0);}
let rotAnim=null;function rotate(d){const az=controls.getAzimuthalAngle();const to=THREE.MathUtils.clamp(az+d,controls.minAzimuthAngle,controls.maxAzimuthAngle);rotAnim={from:az,to,t:0};}
$('bRotL').onclick=()=>rotate(-.4);$('bRotR').onclick=()=>rotate(.4);$('bFit').onclick=()=>fit(true);
function clampTarget(){const t=controls.target;const cx=THREE.MathUtils.clamp(t.x,-40,64),cz=THREE.MathUtils.clamp(t.z,-30,86);if(cx!==t.x||cz!==t.z){const dx=cx-t.x,dz=cz-t.z;t.x=cx;t.z=cz;cam.position.x+=dx;cam.position.z+=dz;}}

/* ---------------- menu ---------------- */
$('bMenu').onclick=()=>$('menu').classList.toggle('hidden');
$('mImport').onclick=()=>{if(!sim.hasRealSave()){toast('No 2D save found in this browser (open the 2D game here first).');return;}toast('Loading a copy of your 2D save…');sim.importRealSave();};
$('mDemo').onclick=()=>{toast('Resetting to the demo factory…');sim.resetDemo();};
$('mFps').onclick=()=>{$('fps').classList.toggle('hidden');$('menu').classList.add('hidden');};
if(Q.has('fps')) $('fps').classList.remove('hidden');

/* ---------------- main loop ---------------- */
let last=performance.now(),acc=0,fpsN=0,fpsT=0,lastRead=0,lastSync=0,slowFor=0,simT=0;
function frame(now){requestAnimationFrame(frame);const now0=performance.now();const dt=Math.min(.05,(now-last)/1000);last=now;simT+=dt;
  if(sim.TT&&now-lastRead>200){lastRead=now;sim.read();sim._tick=(sim._tick||0)+1;for(const id in SLOTS) ensure(id,sim.snap);hud();world.trees.setCoverage(sim.snap.forest);
    for(const e of logi.smoke.em){const b=B[e.id];const q=b&&!b.inf.helper?sim.snap.b[e.id]:null;e.rate=q?(q.f>.02&&q.on?(e.big?3.2:2.4)*Math.min(1,.4+q.f):0):(b&&b.inf.lvl>0?2.6:0);}}
  if(sim.TT&&now-lastSync>1000){lastSync=now;logi.sync(sim);}
  if(rotAnim){rotAnim.t=Math.min(1,rotAnim.t+dt/.45);const e=1-Math.pow(1-rotAnim.t,3);const az=rotAnim.from+(rotAnim.to-rotAnim.from)*e;const t=controls.target,r=cam.position.distanceTo(t),pol=controls.getPolarAngle();
    cam.position.set(t.x+r*Math.sin(pol)*Math.sin(az),t.y+r*Math.cos(pol),t.z+r*Math.sin(pol)*Math.cos(az));cam.lookAt(t);if(rotAnim.t>=1) rotAnim=null;}
  controls.update();clampTarget();
  if(sim.snap){applyLight();
    for(const id in B){const b=B[id];if(b.born<1){b.born=Math.min(1,b.born+dt*1.8);const e=1-Math.pow(1-b.born,3),s=.4+.6*e;b.grp.scale.set((b.grp.scale.x<0?-1:1)*s,s*(1+Math.sin(b.born*Math.PI)*.08),s);}
      if(b.key!=='g'&&b.r.anim){const q=sim.snap.b[id];const run=q?(q.on&&q.f>.02?1:0):1;for(const f of b.r.anim) f(dt,run,simT);}}
    logi.update(dt,simT,sim);}
  for(const f of world.anim) f(dt,simT);
  if(ring.visible) ring.material.opacity=.55+.35*Math.sin(simT*4);
  const tr=performance.now();renderer.render(scene,cam);const te=performance.now();updateLabels();
  T3.updMs=(T3.updMs||0)*.95+(tr-now0)*.05;T3.renMs=(T3.renMs||0)*.95+(te-tr)*.05;
  // fps meter + adaptive resolution (phones): drop the pixel ratio if we stay under ~40 fps
  fpsN++;T3.frames++;if(now-fpsT>1000){T3.fpsNow=fpsN*1000/(now-fpsT);fpsN=0;fpsT=now;const i=renderer.info.render;
    $('fps').textContent=`${T3.fpsNow.toFixed(0)} fps · ${i.calls} calls · ${(i.triangles/1000).toFixed(0)}k tris · pr ${PR}`;
    if(T3.ready&&!Q.has('nofallback')){slowFor=T3.fpsNow<40?slowFor+1:0;if(slowFor>=3&&PR>1){PR=Math.max(1,PR-.5);renderer.setPixelRatio(PR);resize();slowFor=0;}}}}

window.addEventListener('resize',()=>{resize();});
resize();placeCam(CENTER);
requestAnimationFrame(frame);
sim.boot(t=>{$('bootT').textContent=t;}).then(()=>{sim._tick=0;sim.read();for(const id in SLOTS) ensure(id,sim.snap);for(const id in B) B[id].born=1;
  logi.sync(sim);world.trees.setCoverage(sim.snap.forest);hud();fit(false);boot.classList.add('out');setTimeout(()=>boot.remove(),600);T3.ready=true;
  T3.sim=sim;T3.renderer=renderer;T3.cam=cam;T3.controls=controls;T3.openSheet=openSheet;T3.closeSheet=closeSheet;T3.fit=fit;T3.setLight=m=>{lightMode=m;};T3.logi=logi;T3.B=B;
  T3.stats=()=>({q:QL,fps:T3.fpsNow,updMs:+T3.updMs.toFixed(2),renderCallMs:+T3.renMs.toFixed(2),calls:renderer.info.render.calls,tris:renderer.info.render.triangles,geos:renderer.info.memory.geometries,pr:PR});}).catch(fail);
