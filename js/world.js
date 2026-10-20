/* Static world: ground, roads, the forest (instanced), log yard, dock, water, ship. */
import * as THREE from 'three';
import {Kit,MAT} from './kit.js';
import {COL,LANE,ROW,TOP_ROAD,BOTTOM_ROAD,DOCK_Z,WATER_Z,YARD,FOREST} from './layout.js';

function rng(seed){let a=seed|0;return ()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

export function buildWorld(scene){
  const out={anim:[],trees:null};const R=rng(7);
  // ground
  const grass=new THREE.Mesh(new THREE.PlaneGeometry(600,WATER_Z+300),new THREE.MeshStandardMaterial({color:0x7fae4e,roughness:1}));
  grass.rotation.x=-Math.PI/2;grass.position.z=(WATER_Z-300)/2;grass.receiveShadow=true;scene.add(grass);
  const k=new Kit();
  // factory concrete apron behind the columns
  k.box(64,.04,ROW*5+8,0xc9c1ae,(COL.I+COL.H)/2+1,0,ROW*2.2);
  // roads (asphalt + dashed centre line)
  const road=(x0,z0,x1,z1,w)=>{const horiz=Math.abs(x1-x0)>Math.abs(z1-z0);const L=horiz?Math.abs(x1-x0):Math.abs(z1-z0);const cx=(x0+x1)/2,cz=(z0+z1)/2;
    if(horiz){k.box(L,.06,w,0x5b5e63,cx,.02,cz);k.box(L,.065,.18,0xd8d2c0,cx,.02,cz-w/2+.12);k.box(L,.065,.18,0xd8d2c0,cx,.02,cz+w/2-.12);for(let x=Math.min(x0,x1)+1;x<Math.max(x0,x1)-1;x+=3) k.box(1.4,.07,.14,0xf3d36b,x,.02,cz);}
    else{k.box(w,.06,L,0x5b5e63,cx,.02,cz);k.box(.18,.065,L,0xd8d2c0,cx-w/2+.12,.02,cz);k.box(.18,.065,L,0xd8d2c0,cx+w/2-.12,.02,cz);for(let z=Math.min(z0,z1)+1;z<Math.max(z0,z1)-1;z+=3) k.box(.14,.07,1.4,0xf3d36b,cx,.02,z);}};
  road(-22,TOP_ROAD,54,TOP_ROAD,4.4); road(-22,BOTTOM_ROAD,54,BOTTOM_ROAD,4.4);
  road(LANE.I_II,TOP_ROAD,LANE.I_II,BOTTOM_ROAD,5.2); road(LANE.II_III,TOP_ROAD,LANE.II_III,BOTTOM_ROAD,4); road(LANE.III_H,TOP_ROAD,LANE.III_H,BOTTOM_ROAD,4);
  road(-17,-30,-17,BOTTOM_ROAD,4);   // forest haul road
  // lane markings: pedestrian crossings at each row
  for(let r=0;r<5;r++) for(let i=0;i<5;i++) k.box(.5,.075,1.8,0xf0ece0,LANE.II_III-1.6+i*.8,.02,r*ROW+6);
  // street lamps along the lane (heads glow at night)
  for(let r=0;r<5;r++) for(const x of [LANE.I_II-3,LANE.III_H+2.3]){const z=r*ROW+6;k.box(.14,3.6,.14,0x4a4f55,x,0,z);k.box(.7,.12,.24,0x4a4f55,x+(x<10?.3:-.3),3.6,z);k.box(.4,.1,.22,0xfff2c0,x+(x<10?.5:-.5),3.52,z,{glass:true});}
  // light pools under the lamps (additive discs, faded in at night: cheaper than real point lights)
  const lampPts=[];for(let r=0;r<5;r++) for(const x of [LANE.I_II-3,LANE.III_H+2.3]) lampPts.push([x+(x<10?.9:-.9),r*ROW+6]);
  for(let x=-14;x<=50;x+=12) lampPts.push([x,TOP_ROAD]),lampPts.push([x,BOTTOM_ROAD]);
  const poolMat=new THREE.MeshBasicMaterial({color:0xffc977,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,map:poolTex()});
  const pools=new THREE.InstancedMesh(new THREE.PlaneGeometry(9,9),poolMat,lampPts.length);const pm=new THREE.Matrix4();
  lampPts.forEach(([x,z],i)=>{pm.makeRotationX(-Math.PI/2);pm.setPosition(x,.09,z);pools.setMatrixAt(i,pm);});scene.add(pools);
  out.setNight=n=>{poolMat.opacity=n*.55;pools.visible=n>.02;};
  for(let x=-14;x<=50;x+=12) for(const z of [TOP_ROAD,BOTTOM_ROAD]){const zz=z-2.6;k.box(.14,3.6,.14,0x4a4f55,x,0,zz);k.box(.24,.12,.9,0x4a4f55,x,3.6,zz+.4);k.box(.22,.1,.4,0xfff2c0,x,3.52,zz+.7,{glass:true});}
  // log yard
  k.box(11,.12,8,0x9c8f78,YARD.x,0,YARD.z);k.box(11.4,.6,.3,0x6b4a2a,YARD.x,0,YARD.z-4);
  for(let s=0;s<3;s++){const x=YARD.x-3.4+s*3.4;for(let row=4;row>0;row--) for(let i=0;i<row;i++){k.log(.36,2.8,i%2?0x8b5a2b:0x7d4f25,x+(i-(row-1)/2)*.74,.45+(4-row)*.63,YARD.z-1.2,'z',7);}}
  k.box(1.6,1.6,1.4,0xe0a020,YARD.x+4,.12,YARD.z+2.4);k.box(1.2,.8,1,0x3b5874,YARD.x+4,1.72,YARD.z+2.4,{glass:true});
  // fences around the forest edge
  for(let z=FOREST.z0+30;z<BOTTOM_ROAD-3;z+=2.2){k.box(.12,.9,.12,0x8b6a45,-19.5,0,z);k.box(.06,.1,2.2,0xa07a50,-19.5,.7,z+1.1);}
  // dock
  k.box(34,.5,7,0x8b6a45,3,0,DOCK_Z+1.5);for(let x=-13.5;x<=19.5;x+=1.1) k.box(.06,.52,7,0x6e5233,x,0,DOCK_Z+1.5);
  for(let x=-12;x<=18;x+=4) k.cyl(.5,1.8,0x5a4028,x,-1.2,DOCK_Z+5,{seg:7}),k.cyl(.2,.4,0x2a2a2a,x,.5,DOCK_Z+4.6,{seg:6});
  const CC=[0xc0392b,0x2f6fb0,0x27ae60,0xe0a020,0x8e44ad,0xd35400];
  for(let i=0;i<12;i++){const x=-10+(i%6)*2.9,y=Math.floor(i/7)*1.25;k.box(2.6,1.2,1.2,CC[(i*5)%6],x,.5+y,DOCK_Z-.2);}
  // gantry crane
  for(const x of [10,16]) for(const z of [DOCK_Z-1,DOCK_Z+3.6]) k.box(.5,9,.5,0x2f6fb0,x,.5,z);
  k.box(7,.6,.6,0x2f6fb0,13,9.5,DOCK_Z-1);k.box(7,.6,.6,0x2f6fb0,13,9.5,DOCK_Z+3.6);k.box(1.2,.6,14,0x2f6fb0,13,10.1,DOCK_Z+5);k.box(1.6,1,1.6,0xf5c84c,13,8.8,DOCK_Z+6);
  // shoreline + water
  k.box(220,.2,2.2,0xd9c793,10,-.15,WATER_Z-.6);
  scene.add(k.build('world'));
  const water=new THREE.Mesh(new THREE.PlaneGeometry(400,120),new THREE.MeshStandardMaterial({color:0x2f86c0,roughness:.25,metalness:.15,transparent:true,opacity:.92}));
  water.rotation.x=-Math.PI/2;water.position.set(10,-.25,WATER_Z+60);water.receiveShadow=true;scene.add(water);
  // wave glints (instanced) drifting on the water
  const wg=new THREE.InstancedMesh(new THREE.BoxGeometry(1.4,.04,.12),new THREE.MeshBasicMaterial({color:0xcfeeff,transparent:true,opacity:.7}),90);
  const wv=[];const m4=new THREE.Matrix4();for(let i=0;i<90;i++){wv.push({x:-60+R()*140,z:WATER_Z+1.5+R()*40,p:R()*6});}
  out.anim.push((dt,t)=>{for(let i=0;i<wv.length;i++){const w=wv[i];const s=.6+.4*Math.sin(t*1.3+w.p);m4.makeScale(s,1,1);m4.setPosition(w.x+Math.sin(t*.25+w.p)*1.2,-.2,w.z);wg.setMatrixAt(i,m4);}wg.instanceMatrix.needsUpdate=true;});
  scene.add(wg);
  // cargo ship (bobs gently)
  const sk=new Kit();sk.add(new THREE.CylinderGeometry(1,1,1,6,1),0x2c3e50,{p:[0,.6,0],s:[4.6,26,1.8],r:[0,0,Math.PI/2]});sk.box(25,.3,4.2,0xb03a2e,0,-.2,0);sk.box(24,.25,4,0x7f8c8d,0,1.45,0);
  for(let i=0;i<12;i++) sk.box(2.5,1.2,1.7,CC[(i*7)%6],-9+(i%6)*2.7,1.7+Math.floor(i/6)*1.25,i%2?.95:-.95);
  sk.box(3,3.6,3.6,0xf2f2f2,10,1.7,0);sk.box(3.2,.3,3.8,0x2c3e50,10,5.3,0);sk.box(.08,1,3,0x3b5874,8.45,4.2,0,{glass:true});sk.cyl(.35,1.6,0xe0a020,11,5.6,0);
  const ship=sk.build('ship');ship.position.set(8,0,DOCK_Z+9.5);scene.add(ship);
  out.anim.push((dt,t)=>{ship.position.y=Math.sin(t*.7)*.12-.1;ship.rotation.z=Math.sin(t*.5)*.012;});
  out.ship=ship;
  // forest: two instanced tree species + stumps; coverage follows the sim's forest state
  out.trees=makeForest(scene,R);
  // scattered bushes / decor on the grass (instanced)
  const bush=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.7,0),new THREE.MeshStandardMaterial({color:0x5f9a3a,flatShading:true,roughness:1}),70);bush.castShadow=true;
  const c=new THREE.Color();let n=0;
  for(let i=0;i<200&&n<70;i++){const x=-18+R()*76,z=-30+R()*20;if(Math.abs(x-YARD.x)<7&&z>-20) continue;m4.compose(new THREE.Vector3(x,.3,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,R()*6,0)),new THREE.Vector3(1+R(),.7+R()*.6,1+R()));bush.setMatrixAt(n,m4);c.setHSL(.25+R()*.08,.45,.32+R()*.12);bush.setColorAt(n++,c);}
  for(let i=0;i<40&&n<70;i++){const x=56+R()*20,z=-20+R()*80;m4.compose(new THREE.Vector3(x,.3,z),new THREE.Quaternion(),new THREE.Vector3(1+R(),.7+R()*.6,1+R()));bush.setMatrixAt(n,m4);c.setHSL(.25+R()*.08,.45,.32+R()*.12);bush.setColorAt(n++,c);}
  bush.count=n;scene.add(bush);
  return out;
}

function poolTex(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,1,32,32,31);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.5,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c);}
function treeGeo(kind){const k=new Kit();
  if(kind==='pine'){k.cyl(.18,1.1,0x6b4226,0,0,0,{seg:5});k.cone(1.25,1.9,0x2f6b2a,0,.9,0,{seg:7});k.cone(.95,1.6,0x377a30,0,1.9,0,{seg:7});k.cone(.6,1.2,0x3f8636,0,2.9,0,{seg:7});}
  else{k.cyl(.2,1.4,0x6b4226,0,0,0,{seg:5});k.add(new THREE.IcosahedronGeometry(1.25,0),0x4f8a2f,{p:[0,2.3,0],s:[1,.95,1]});k.add(new THREE.IcosahedronGeometry(.8,0),0x5c9a36,{p:[.5,2.9,.3]});}
  const g=k.build();return g.children[0].geometry;}
function makeForest(scene,R){
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.9});
  const pts=[];
  // dense forest on the left, a thinner belt framing the top and right edges
  for(let i=0;i<1400&&pts.length<620;i++){const x=FOREST.x0+R()*(FOREST.x1-FOREST.x0),z=FOREST.z0+R()*(FOREST.z1-FOREST.z0);if(z>WATER_Z-2) continue;pts.push([x,z,1]);}
  for(let i=0;i<500;i++){const x=-18+R()*80,z=-48+R()*18;if(z>-22) continue;pts.push([x,z,0]);}
  for(let i=0;i<260;i++){const x=58+R()*30,z=-30+R()*95;if(z>WATER_Z-2) continue;pts.push([x,z,0]);}
  // sort so the harvest front (closest to the haul road) is the first to be cut
  pts.sort((a,b)=>(b[2]-a[2])||(b[0]-a[0]));
  const kinds=['pine','oak'],meshes=[];const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color();
  const stump=new THREE.InstancedMesh(new THREE.CylinderGeometry(.22,.26,.35,6),new THREE.MeshStandardMaterial({color:0x8b6a45,flatShading:true}),pts.length);stump.count=0;stump.receiveShadow=true;
  const list=kinds.map(()=>[]);pts.forEach((p,i)=>list[R()<.72?0:1].push({p,i,s:.8+R()*.65,rot:R()*6,h:R()}));
  kinds.forEach((kd,ki)=>{const im=new THREE.InstancedMesh(treeGeo(kd),mat,list[ki].length);im.castShadow=true;im.receiveShadow=true;
    list[ki].forEach((t,n)=>{q.setFromEuler(new THREE.Euler(0,t.rot,0));m4.compose(new THREE.Vector3(t.p[0],0,t.p[1]),q,new THREE.Vector3(t.s,t.s*(.9+t.h*.3),t.s));im.setMatrixAt(n,m4);
      c.setRGB(.78+t.h*.3,.82+t.h*.22,.72+t.h*.2);if(kd==='oak'&&t.h>.8) c.setRGB(1.25,.95,.55);im.setColorAt(n,c);});
    scene.add(im);meshes.push({im,list:list[ki]});});
  scene.add(stump);
  /* coverage: hide the harvest-front trees (and show stumps) in proportion to the sim's felled share */
  let last=-1;
  function setCoverage(cov){const cut=Math.round((1-Math.max(0,Math.min(1,cov)))*pts.length*.55);if(cut===last) return;last=cut;let sn=0;
    for(const {im,list} of meshes){list.forEach((t,n)=>{const gone=t.i<cut&&t.p[2]===1;q.setFromEuler(new THREE.Euler(0,t.rot,0));
      m4.compose(new THREE.Vector3(t.p[0],0,t.p[1]),q,gone?new THREE.Vector3(0,0,0):new THREE.Vector3(t.s,t.s*(.9+t.h*.3),t.s));im.setMatrixAt(n,m4);
      if(gone){m4.makeTranslation(t.p[0],.17,t.p[1]);stump.setMatrixAt(sn++,m4);}});im.instanceMatrix.needsUpdate=true;}
    stump.count=sn;stump.instanceMatrix.needsUpdate=true;}
  return {setCoverage,count:pts.length};
}
