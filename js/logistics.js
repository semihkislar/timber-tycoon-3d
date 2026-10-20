/* Logistics demo: calm forklifts (accel/decel + rate-limited turning), conveyor belts with visible items,
   cargo drones (hover, bank, rotor spin, ground shadow), log trucks, chimney smoke. All moving bits are instanced
   or tiny meshes; counts follow the live sim (links run only while the consuming line is actually working). */
import * as THREE from 'three';
import {Kit} from './kit.js';
import {RCOL} from './buildings.js';
import {LANE,ROW,TOP_ROAD,BOTTOM_ROAD,YARD,DOCK_Z,slotPos,doorPt} from './layout.js';

const V=(x,z,y=0)=>new THREE.Vector3(x,y,z);
/* road path with rounded corners: lines + quadratic fillets, arc-length parameterised */
export function roadPath(pts,r=1.6){const P=pts.map(p=>p.isVector3?p:V(p[0],p[1]));const cp=new THREE.CurvePath();let cur=P[0].clone();
  for(let i=1;i<P.length;i++){const a=P[i],nx=P[i+1];
    if(nx){const d1=cur.distanceTo(a),d2=a.distanceTo(nx),rr=Math.min(r,d1*.45,d2*.45);const q1=a.clone().add(cur.clone().sub(a).setLength(rr)),q2=a.clone().add(nx.clone().sub(a).setLength(rr));
      if(cur.distanceTo(q1)>1e-3) cp.add(new THREE.LineCurve3(cur,q1));cp.add(new THREE.QuadraticBezierCurve3(q1,a.clone(),q2));cur=q2;}
    else cp.add(new THREE.LineCurve3(cur,a.clone()));}
  cp.L=cp.getLength();return cp;}
function angLerp(a,b,m){let d=((b-a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;return a+Math.max(-m,Math.min(m,d));}

/* ---------- vehicle models ---------- */
function forkliftModel(){const k=new Kit();
  k.box(1.1,.55,1.5,0xe0a020,0,.25,0);k.box(1.12,.5,.5,0x3a3a3a,0,.35,-.62);   // body + counterweight
  k.box(.9,.08,.9,0x2a2a2a,0,1.85,-.05);for(const[x,z] of [[-.42,.3],[.42,.3],[-.42,-.4],[.42,-.4]]) k.box(.07,1.05,.07,0x2a2a2a,x,.8,z);   // cab cage
  k.box(.45,.45,.45,0x3a6aaa,0,.8,-.1);k.box(.36,.4,.36,0xf0c8a0,0,1.25,-.1);k.box(.38,.12,.38,0xf5c84c,0,1.62,-.1);   // driver + hard hat
  for(const[x,z] of [[-.58,.45],[.58,.45],[-.58,-.48],[.58,-.48]]) k.log(.24,.2,0x1e1e1e,x,.24,z,'x',8);
  k.box(.8,1.9,.1,0x555b62,0,.2,.82);   // mast
  const body=k.build('forklift');
  const fk=new Kit();fk.box(.12,.05,.9,0x8a9097,-.25,0,.45);fk.box(.12,.05,.9,0x8a9097,.25,0,.45);fk.box(.8,.4,.06,0x8a9097,0,0,.02);
  const forks=fk.build('forks');forks.position.set(0,.18,.86);body.add(forks);
  const lk=new Kit();lk.box(1,.12,1,0x9b7247,0,0,0);lk.box(.92,.5,.92,0xffffff,0,.12,0);const load=lk.build('load');load.position.set(0,.06,.45);forks.add(load);
  // tint the load per resource: second mesh material is shared, so swap a per-vehicle material
  const lm=load.userData.solid;lm.material=lm.material.clone();lm.material.vertexColors=true;
  return {g:body,forks,load,lm};}
function truckModel(){const k=new Kit();k.box(1.5,1.2,1.4,0xc45a2a,0,.45,1.9);k.box(1.4,.5,.08,0x3b5874,0,1.05,2.62,{glass:true});k.box(1.5,.25,4.4,0x3a3a3a,0,.35,-.4);
  for(const z of [2,-.9,-2]) for(const x of [-.72,.72]) k.log(.34,.3,0x1e1e1e,x,.34,z,'x',8);
  for(const x of [-.75,.75]) k.box(.1,.9,3.4,0x555,x,.6,-.9);
  const g=k.build('truck');const lk=new Kit();for(let i=0;i<3;i++) lk.log(.33,3.3,0x8b5a2b,-.4+i*.4,0,0,'z',7);lk.log(.33,3.3,0x7d4f25,-.2,.5,0,'z',7);lk.log(.33,3.3,0x8b5a2b,.2,.5,0,'z',7);
  const load=lk.build('logs');load.position.set(0,.95,-.9);g.add(load);return {g,load};}
function droneModel(){const k=new Kit();k.box(1.1,.32,1.1,0x34495e,0,0,0);k.box(.6,.2,.6,0xf5c84c,0,.32,0);k.box(.14,.14,.14,0x7dfcff,0,.12,.58,{glass:true});
  for(const a of [Math.PI/4,-Math.PI/4]) k.box(2.4,.1,.16,0x2c3e50,0,.14,0,{r:[0,a,0]});
  for(const[x,z] of [[.85,.85],[-.85,.85],[.85,-.85],[-.85,-.85]]) k.cyl(.12,.22,0x2c3e50,x,.12,z,{seg:6});
  for(const[x,z] of [[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]]) k.box(.05,.5,.05,0x2c3e50,x,-.5,z);
  const g=k.build('drone');const rotors=[];
  for(const[x,z] of [[.85,.85],[-.85,.85],[.85,-.85],[-.85,-.85]]){const rk=new Kit();rk.box(1.1,.03,.12,0xdfe6ec,0,0,0);rk.box(.12,.03,1.1,0xdfe6ec,0,0,0);const r=rk.build();r.position.set(x,.36,z);r.children[0].castShadow=false;g.add(r);rotors.push(r);}
  const ck=new Kit();ck.box(.8,.62,.8,0xffffff,0,0,0);ck.box(.84,.1,.84,0x6b4a2a,0,.62,0);const crate=ck.build('crate');crate.position.y=-1.1;g.add(crate);
  const cm=crate.userData.solid;cm.material=cm.material.clone();
  return {g,rotors,crate,cm};}

/* ---------- movers ---------- */
class Mover{
  /* path: CurvePath; speeds in m/s; waits in s. Drives out, waits (load), drives back, waits (unload) – forever. */
  constructor(model,path,o={}){Object.assign(this,{model,path,vmax:o.vmax||2.4,acc:o.acc||1.1,wait:o.wait||[1.8,1.6],s:o.s0||0,v:0,dir:1,state:'go',tw:0,yaw:0,run:1,turn:o.turn||1.6});
    model.g.rotation.order='YXZ';const p=path.getPointAt(Math.min(1,this.s/path.L));const t=path.getTangentAt(Math.min(.999,this.s/path.L));this.yaw=Math.atan2(t.x,t.z);model.g.position.copy(p);}
  update(dt,run){const L=this.path.L;this.run=run;
    if(this.state==='wait'){this.tw-=dt*(run>0?1:0);if(this.tw<=0){this.state='go';this.dir*=-1;}}
    else{const remain=this.dir>0?L-this.s:this.s;const vt=run>0?this.vmax*Math.min(1,.45+run*.55):0;
      const vStop=Math.sqrt(Math.max(0,2*this.acc*.9*remain));const target=vt>0?Math.min(vt,Math.max(.3,vStop)):0;
      const a=Math.max(-this.acc*1.6,Math.min(this.acc,(target-this.v)/Math.max(dt,1e-3)));this.v=Math.max(0,this.v+a*dt);this.a=a;
      this.s+=this.dir*this.v*dt;if(remain<.02||(this.dir>0?this.s>=L:this.s<=0)){this.s=this.dir>0?L:0;this.v=0;this.state='wait';this.tw=this.wait[this.dir>0?0:1];this.onArrive&&this.onArrive(this.dir);}}
    const u=Math.max(0,Math.min(1,this.s/L));const p=this.path.getPointAt(u);const tg=this.path.getTangentAt(Math.min(.999,Math.max(.001,u)));
    // forklifts drive forks-first both ways: at each end they turn around on the spot (rate-limited, so it reads as a calm 3-point turn)
    const want=Math.atan2(tg.x*this.dir,tg.z*this.dir);this.yaw=angLerp(this.yaw,want,this.turn*dt*(this.state==='wait'?1:2.2));
    const g=this.model.g;g.position.set(p.x,0,p.z);g.rotation.y=this.yaw;g.rotation.x=-(this.a||0)*.018;}
}

export class Logistics{
  constructor(scene){this.scene=scene;this.forks=[];this.trucks=[];this.drones=[];this.belts=[];this.links={};this.t=0;
    this.shadowTex=blobTex();this.smoke=new Smoke(scene);}
  /* rebuild vehicle sets when the link signature changes (buildings built/unbuilt) */
  sync(sim,bmeta){const L=sim.links();const sig=L.filter(l=>l.built).map(l=>l.src+'>'+l.dst).join(',')+'|'+(sim.snap.prem>0);if(sig===this._sig){this._L=L;return;}this._sig=sig;this._L=L;
    for(const f of this.forks) this.scene.remove(f.model.g);for(const d of this.drones){this.scene.remove(d.m.g);this.scene.remove(d.sh);}for(const b of this.belts) this.scene.remove(b.g);
    this.forks=[];this.drones=[];this.belts=[];
    const BELT_PAIRS={'sawmill>carpentry':1,'chipper>pellet':1};   // adjacent buildings in the same row: conveyor (transport tier 2)
    let lane=0;
    for(const l of L){if(!l.built) continue;const key=l.src+'>'+l.dst;
      if(l.tier===2&&BELT_PAIRS[key]){this.belts.push(new Belt(this.scene,l,bmeta));continue;}
      if(l.tier===2){// forklift (transport tier 1): src door → lane → dst door, own sub-lane offset
        const a=doorPt(l.src),b=doorPt(l.dst),off=((lane++%3)-1)*1.2;const lx=LANE.I_II+off;
        const path=roadPath([[a.x,a.z],[lx,a.z],[lx,b.z],[b.x,b.z]],1.4);
        const m=forkliftModel();m.lm.material.color.setHex(RCOL[l.k]||0xffffff);this.scene.add(m.g);
        const mv=new Mover(m,path,{vmax:2.3,acc:.9,s0:Math.random()*path.L*.6});mv.link=l;mv.onArrive=dir=>{mv.loaded=dir<0;};mv.loaded=true;this.forks.push(mv);}
      else if(l.tier===3&&sim.snap.prem>0){this.drones.push(new Drone(this.scene,l,this.shadowTex,this.drones.length));}}
    // a log loader shuttling from the log yard to the first Phase I door, and an export forklift at the dock
    for(const [src,dst,res] of [['yard','sawmill','logs'],['yard','peeler','logs'],['furniture','dock','furniture'],['paper','dock','paper']]){
      if(src!=='yard'&&!sim.snap.b[src].lvl) continue;if(dst!=='dock'&&!sim.snap.b[dst].lvl) continue;
      const a=src==='yard'?{x:YARD.x+3.8,z:YARD.z+3.6}:doorPt(src),b=dst==='dock'?{x:src==='paper'?6:2,z:DOCK_Z-1.8}:doorPt(dst);
      const lx=src==='yard'?LANE.I_II-2.2:LANE.I_II+1.6+(src==='paper'?1:0);
      const pts=src==='yard'?[[a.x,a.z],[a.x,TOP_ROAD],[lx,TOP_ROAD],[lx,b.z],[b.x,b.z]]:[[a.x,a.z],[lx,a.z],[lx,BOTTOM_ROAD],[b.x,BOTTOM_ROAD],[b.x,b.z]];
      const path=roadPath(pts,1.6);const m=forkliftModel();m.lm.material.color.setHex(RCOL[res]);this.scene.add(m.g);
      const mv=new Mover(m,path,{vmax:2.4,acc:.9,s0:Math.random()*path.L*.5});mv.link={src,dst,k:res,yard:src==='yard'};mv.onArrive=dir=>{mv.loaded=dir<0;};mv.loaded=true;this.forks.push(mv);}
    if(!this.trucks.length) this.initTrucks();}
  initTrucks(){for(let i=0;i<2;i++){const m=truckModel();this.scene.add(m.g);
    const path=roadPath([[-17,64-i*8],[-17,TOP_ROAD],[YARD.x-2.5,TOP_ROAD],[YARD.x-2.5,YARD.z+5.6]],2.2);
    const mv=new Mover(m,path,{vmax:4.2,acc:1.2,wait:[3,2.5],s0:i*path.L*.55,turn:1.1});mv.onArrive=dir=>{m.load.visible=dir<0;};this.trucks.push(mv);}}
  update(dt,t,sim){this.t=t;const S=sim.snap;
    const runOf=l=>{if(!l) return 1;if(l.yard) return S.b.sawmill.lvl?Math.max(.15,S.b.sawmill.f):0;if(l.dst==='dock') return S.b[l.src]?Math.max(.2,S.b[l.src].f):0;const b=S.b[l.dst];return b&&b.lvl&&b.on?b.f:0;};
    for(const f of this.forks){const run=runOf(f.link)>.02?1:0;f.update(dt,run);
      const m=f.model;const lift=f.state==='wait'?(f.dir>0?1-Math.min(1,f.tw/f.wait[0]):Math.min(1,f.tw/f.wait[1])):(f.loaded?1:0);
      m.forks.position.y=.18+lift*.5;m.load.visible=!!f.loaded;}
    const logRun=S.logRate>0?1:0;for(const tr of this.trucks) tr.update(dt,logRun);
    for(const b of this.belts){const l=this._L.find(x=>x.src===b.link.src&&x.dst===b.link.dst);const bd=S.b[b.link.dst];b.update(dt,bd&&bd.lvl&&bd.on?Math.max(0,Math.min(1,bd.f)):0);}
    for(const d of this.drones){const bd=S.b[d.link.dst];d.update(dt,t,bd&&bd.lvl&&bd.on&&bd.f>.02?1:.0);}
    this.smoke.update(dt);}
  counts(){return {fork:this.forks.length,belt:this.belts.length,drone:this.drones.length};}
}

/* ---------- conveyor belt (transport tier 2) ---------- */
function stripeTex(){const c=document.createElement('canvas');c.width=64;c.height=16;const x=c.getContext('2d');x.fillStyle='#2b2d30';x.fillRect(0,0,64,16);x.fillStyle='#3d4045';for(let i=0;i<64;i+=8) x.fillRect(i,0,3,16);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t;}
class Belt{
  constructor(scene,link,bmeta){this.link=link;const a=slotPos(link.src),b=slotPos(link.dst);const y=2.6,z=a.z;const x0=a.x+2.9,x1=b.x-2.9;this.x0=x0;this.x1=x1;this.y=y;this.z=z;this.L=x1-x0;
    const k=new Kit();k.box(this.L,.22,.18,0x8a9097,(x0+x1)/2,y-.05,z-.62);k.box(this.L,.22,.18,0x8a9097,(x0+x1)/2,y-.05,z+.62);k.box(this.L,.12,1.2,0x55595e,(x0+x1)/2,y-.2,z);
    for(let x=x0+.8;x<x1;x+=2.6){k.box(.16,y-.2,.16,0x6a7077,x,0,z-.55);k.box(.16,y-.2,.16,0x6a7077,x,0,z+.55);k.box(.14,.14,1.2,0x6a7077,x,y*.5,z);}
    k.box(.5,1.4,1.5,0x4a4f55,x0-.05,y-.5,z);k.box(.5,1.4,1.5,0x4a4f55,x1+.05,y-.5,z);   // wall hatches
    for(const x of [x0+1.2,x1-1.2]) k.box(.08,.9,1.6,0xf5c84c,x,y+.3,z,{});   // hi-vis guard frames
    this.g=k.build('belt');
    this.tex=stripeTex();this.tex.repeat.set(this.L/1.2,1);
    const surf=new THREE.Mesh(new THREE.PlaneGeometry(this.L,1.05),new THREE.MeshStandardMaterial({map:this.tex,roughness:.7}));surf.rotation.x=-Math.PI/2;surf.position.set((x0+x1)/2,y+.07,z);surf.receiveShadow=true;this.g.add(surf);
    const res=link.k;const geo=res==='chips'?new THREE.ConeGeometry(.32,.28,6):new THREE.BoxGeometry(.85,.26,.55);
    this.N=Math.ceil(this.L/1.15);this.items=new THREE.InstancedMesh(geo,new THREE.MeshStandardMaterial({color:RCOL[res]||0xffffff,flatShading:true,roughness:.8}),this.N);this.items.castShadow=true;this.g.add(this.items);
    this.off=0;this.m=new THREE.Matrix4();scene.add(this.g);this.update(0,0);}
  update(dt,run){const sp=.95*run;this.off=(this.off+dt*sp)%1.15;this.tex.offset.x-=dt*sp/1.2;const m=this.m;let n=0;
    for(let i=0;i<this.N;i++){const x=this.x0+.35+((i*1.15+this.off)%(this.N*1.15));if(x>this.x1-.3) continue;const h=this.link.k==='chips'?.2:.2;
      m.makeRotationY(this.link.k==='chips'?i:0);m.setPosition(x,this.y+h,this.z);this.items.setMatrixAt(n++,m);}
    this.items.count=n;this.items.instanceMatrix.needsUpdate=true;}
}

/* ---------- cargo drones (transport tier 3) ---------- */
function blobTex(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,2,32,32,30);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
class Drone{
  constructor(scene,link,shTex,i){this.link=link;const a=slotPos(link.src),b=slotPos(link.dst);
    this.A=V(a.x-.6,a.z-.8,6.2);this.B=V(b.x-.6,b.z+.4,5.4);this.cruise=11+(i%3)*1.4;this.m=droneModel();this.m.cm.material.color.setHex(RCOL[link.k]||0xffffff);
    this.m.g.rotation.order='YXZ';scene.add(this.m.g);this.sh=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6),new THREE.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false}));this.sh.rotation.x=-Math.PI/2;scene.add(this.sh);
    this.u=(i*.37)%1;this.dir=1;this.hold=0;this.prev=this.A.clone();this.vel=new THREE.Vector3();this.yaw=0;}
  pos(u){// takeoff → cruise → land, eased; u∈[0,1]
    const e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;const p=new THREE.Vector3().lerpVectors(this.A,this.B,e);const lift=Math.sin(Math.min(1,u*3.2)*Math.PI/2)*Math.sin(Math.min(1,(1-u)*3.2)*Math.PI/2);
    p.y=THREE.MathUtils.lerp(this.A.y,this.B.y,e)+lift*(this.cruise-6);return p;}
  update(dt,t,run){const g=this.m.g;
    if(this.hold>0){this.hold-=dt*(run>0?1:.3);if(this.hold<=0){this.dir*=-1;}}
    else{const L=this.A.distanceTo(this.B);this.u+=this.dir*dt*(run>0?1:.35)*2.4/L;if(this.u>=1||this.u<=0){this.u=Math.max(0,Math.min(1,this.u));this.hold=1.6;}}
    const p=this.pos(this.u);p.y+=Math.sin(t*2.2+this.u*9)*.12;const v=p.clone().sub(this.prev).divideScalar(Math.max(dt,1e-3));const acc=v.clone().sub(this.vel);this.vel.lerp(v,.2);this.prev.copy(p);
    g.position.copy(p);if(this.vel.lengthSq()>.05) this.yaw=angLerp(this.yaw,Math.atan2(this.vel.x,this.vel.z),dt*2);g.rotation.y=this.yaw;
    g.rotation.x=THREE.MathUtils.clamp(this.vel.length()*.05,0,.22);g.rotation.z=0;
    for(const r of this.m.rotors) r.rotation.y+=dt*40;
    this.m.crate.visible=this.hold>0?(this.u>=1?this.hold>.8:this.hold<.8):this.dir>0;
    this.sh.position.set(p.x,.06,p.z);const s=1.2-Math.min(.7,p.y*.04);this.sh.scale.set(s,s,s);this.sh.material.opacity=.9-Math.min(.6,p.y*.035);}
}

/* ---------- chimney smoke (one instanced mesh for the whole factory) ---------- */
class Smoke{
  constructor(scene){this.N=260;this.mesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.5,0),new THREE.MeshStandardMaterial({color:0xe9e6e0,flatShading:true,roughness:1,transparent:true,opacity:.78,depthWrite:false}),this.N);
    this.mesh.frustumCulled=false;this.p=[];this.em=[];this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.v=new THREE.Vector3();this.s=new THREE.Vector3();scene.add(this.mesh);this.wind=new THREE.Vector3(.55,0,-.25);}
  setEmitters(list){this.em=list;}   // [{p:Vector3 world, rate, big, white}]
  update(dt){for(const e of this.em){e.acc=(e.acc||0)+dt*e.rate;while(e.acc>1&&this.p.length<this.N){e.acc-=1;this.p.push({x:e.p.x+(Math.random()-.5)*.2,y:e.p.y,z:e.p.z+(Math.random()-.5)*.2,age:0,life:(e.big?4.5:3.2)*(.8+Math.random()*.4),s:e.big?1.2:.75,r:Math.random()*6});}if(e.acc>1) e.acc=1;}
    let n=0;for(let i=this.p.length-1;i>=0;i--){const q=this.p[i];q.age+=dt;if(q.age>q.life){this.p.splice(i,1);continue;}
      q.x+=this.wind.x*dt*(.3+q.age*.3);q.z+=this.wind.z*dt*(.3+q.age*.3);q.y+=dt*(1.1-q.age*.12);const k=q.age/q.life;const sc=q.s*(.45+k*1.5)*(k>.75?(1-k)*4:1);
      this.q.setFromAxisAngle(this.v.set(0,1,0),q.r+q.age*.4);this.m.compose(this.v.set(q.x,q.y,q.z),this.q,this.s.set(sc,sc,sc));this.mesh.setMatrixAt(n++,this.m);}
    this.mesh.count=n;this.mesh.instanceMatrix.needsUpdate=true;}
}
