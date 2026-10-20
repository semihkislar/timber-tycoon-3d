/* Low-poly building models, generated in code (no asset files). Each builder works in local space:
   footprint ≈ 7.6 × 7.6 centred on the origin, door on +x, front (camera side) on +z.
   Returns {grp, h (label height), anim:[fn(dt,run,t)], smoke:[Vector3 local], belt:{y}}. */
import * as THREE from 'three';
import {Kit,MAT} from './kit.js';

export const RCOL={logs:0x8b5a2b,planks:0xd6a466,veneer:0xeed6a6,bark:0x6b4428,chips:0xc8904f,charcoal:0x2b2b2e,chairs:0x9a6232,pellets:0x6b4a2a,paper:0xf4efe2,
  furniture:0x7a4a28,plywood:0xdc9c52,glue:0xe8e0a0,giftbox:0xc0392b,flooring:0xb07a42,stationery:0x3a4a8a,cabinets:0x5a3a2a,luxfurn:0xd4af37,toys:0xe0a030,boats:0x3a6aaa,rp:0x7dd3fc};
const PAD=0xa9a294, PAD2=0x8f897c, DARK=0x3a2c20, STEEL=0x9aa3ad, TRIM=0xf3ead8;
const TIER_HEX=[0x8a6a48,0xc8742e,0x3f86c8,0xa8508a,0x5f7d3a];

function pad(k,tier,w=7.8,d=7.8){k.box(w,.22,d,PAD,0,0,0);k.box(w+.3,.12,d+.3,PAD2,0,0,0);
  k.box(w,.06,.35,TIER_HEX[tier],0,.22,d/2-.18);}   // tier-coloured kerb at the front
function roller(k,x,z,w,h,face='x'){if(face==='x'){k.box(.14,h+.25,w+.3,0x4a4f55,x,0,z);k.box(.16,h,w,0x9da4ab,x+.02,0,z);for(let i=1;i<6;i++) k.box(.18,.05,w,0x7f868d,x+.03,i*h/6,z);}
  else{k.box(w+.3,h+.25,.14,0x4a4f55,x,0,z);k.box(w,h,.16,0x9da4ab,x,0,z+.02);for(let i=1;i<6;i++) k.box(w,.05,.18,0x7f868d,x,i*h/6,z+.03);}}
function pallet(k,x,z,col,n=2,s=1){k.box(1.1*s,.14,1.1*s,0x9b7247,x,0,z);for(let i=0;i<n;i++) k.box(1*s,.32*s,1*s,col,x,.14+i*.34*s,z);}
function logPile(k,x,z,n=3,l=2.4,axis='x'){let y=.32;for(let row=n;row>0;row--){for(let i=0;i<row;i++){const o=(i-(row-1)/2)*.62;
  axis==='x'?k.log(.31,l,0x8b5a2b,x,y,z+o,'x'):k.log(.31,l,0x8b5a2b,x+o,y,z,'z');}y+=.54;}}
function chimney(k,x,z,y0,h,r=.32,col=0x6b5a52){k.cyl(r*1.25,.3,0x4a3d36,x,y0,z);k.cyl(r,h,col,x,y0,z);k.cyl(r*1.18,.28,0x3b302a,x,y0+h-.28,z);return new THREE.Vector3(x,y0+h+.2,z);}
function sign(k,x,y,z,w,col){k.box(w,.55,.1,col,x,y,z);k.box(w-.2,.12,.12,0xffffff,x,y+.22,z);}   // a painted fascia board

function spinner(build,update){const k=new Kit();build(k);const g=k.build();return {g,update};}

/* ---------------- Phase I ---------------- */
function sawmill(k,ms){const A=[],S=[];pad(k,1);const H=3.7+ms*.12;
  k.box(5.4,H,6.4,0xc79358,-.6,.22,0);k.box(5.5,.5,6.5,0x7a5230,-.6,.22,0);
  for(let i=-2;i<=2;i++) k.box(.08,H-.6,.08,0x9a6a3a,-.6+i*1.1,.7,3.21);   // board-and-batten
  k.gable(7.2,6.2,2.1,0x8f3b24,-.6,H+.22,0,'z');k.box(.3,.3,7.3,0x6a2a18,-.6,H+2.1,0);
  k.box(.12,2.8,2.8,0x2a1d12,2.16,.22,1.5);k.box(.2,.25,3.2,0x7a5230,2.2,3.0,1.5);   // open sawing bay
  k.win('z+',3.2,1.6,[-2.3,-.6,1.1],.8,.9);k.win('x-',-3.3,1.6,[-1.6,1.6],.8,.9);
  S.push(chimney(k,-2.4,-2,H+.6,2.4,.28));
  logPile(k,-1.2,4.6-.6,3,3.2,'x');
  const blade=spinner(b=>{b.add(new THREE.CylinderGeometry(1.05,1.05,.07,16),0xd5dbe2,{r:[Math.PI/2,0,0]});b.add(new THREE.CylinderGeometry(.3,.3,.12,8),0x444a50,{r:[Math.PI/2,0,0]});
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;b.box(.12,.22,.06,0x9aa3ad,Math.cos(a)*1.05,Math.sin(a)*1.05-.11,0);}});
  blade.g.position.set(2.5,1.5,1.5);A.push((dt,run)=>{blade.g.rotation.z-=dt*9*run;});
  sign(k,-.6,H-.45,3.25,3.2,0x8f3b24);
  return {h:H+2.6,anim:A,smoke:S,parts:[blade.g],belt:{y:2.6}};}

function peeler(k,ms){const A=[],S=[];pad(k,1);const H=3.3+ms*.12;
  k.box(5.2,H,6,0xa9b08a,-.7,.22,-.2);k.box(5.3,.45,6.1,0x6a7050,-.7,.22,-.2);
  k.gable(6,6.6,1.9,0x4f7a52,-.7,H+.22,-.2,'x');
  k.box(.12,2.5,2.6,0x26301e,1.92,.22,1.2);k.win('z+',2.8,1.5,[-2.4,-.5,1.3],.9,.9);
  sign(k,-.7,H-.4,2.85,3,0x2f4a30);
  for(let i=0;i<4;i++) k.box(1.6,.12,1.2,i%2?0xe2c48c:0xeed6a6,-1.6,.22+i*.13,4.1);   // veneer sheet stack
  pallet(k,2.9,-2.4,0xeed6a6,3);
  const lathe=spinner(b=>{b.log(.62,2.2,0xb07a42,0,0,0,'z',12);b.log(.2,2.5,0x6b4226,0,0,0,'z',6);});
  lathe.g.position.set(2.45,1.15,1.2);A.push((dt,run)=>{lathe.g.rotation.z+=dt*5*run;});
  S.push(chimney(k,-2.6,-2.4,H+.4,1.8,.22,0x7d8070));
  return {h:H+2.4,anim:A,smoke:S,parts:[lathe.g]};}

function chipper(k,ms){const A=[],S=[];pad(k,1);const H=3+ms*.1;
  k.box(4.4,H,4.6,0x5d6d7d,-.9,.22,-.8);k.box(4.5,.4,4.7,0x3e4a56,-.9,.22,-.8);
  k.add(new THREE.CylinderGeometry(1.75,.7,1.8,4),0x7f8f9f,{p:[-.9,H+.22+.9,-.8],r:[0,Math.PI/4,0]});
  k.box(2.8,.25,.9,0x4a5560,-.9,H+1.6,-.8,{});
  k.box(3.6,.28,.8,0x3a3f45,1.4,1.2,-2.2,{r:[0,0,-.42]});   // infeed chute
  k.box(1.2,2.2,1.2,0xe0a020,1.9,.22,1.1);k.box(1.3,.3,1.3,0x2a2a2a,1.9,2.4,1.1);   // yellow drive house
  k.win('z+',1.5,1.3,[-2.2,.4],.8,.8);
  k.cone(1.5,1.2,RCOL.chips,-1.4,.22,3.2,{seg:9});k.cone(.9,.8,0xa87542,-.2,.22,3.6,{seg:8});
  sign(k,-.9,H-.4,1.55,2.6,0x2f3d4c);
  const fan=spinner(b=>{for(let i=0;i<3;i++) b.box(1.3,.12,.3,0x2a2f35,0,0,0,{r:[0,0,i*Math.PI/3*2]});b.cyl(.18,.2,0x2a2f35,0,-.1,0,{rot:[Math.PI/2,0,0]});});
  fan.g.position.set(-.9,1.9,1.62);A.push((dt,run)=>{fan.g.rotation.z+=dt*14*run;});
  return {h:H+3,anim:A,smoke:S,parts:[fan.g],belt:{y:2.6}};}

function kiln(k,ms){const A=[],S=[];pad(k,1);
  for(let i=0;i<3;i++){const z=-2.4+i*2.3;k.cyl(1.25,.5,0x8a4a2a,-1.2,.22,z,{seg:12});k.sphere(1.25,0xa0522d,-1.2,.7,z,{half:true,ws:12,hs:5});
    k.box(.3,.9,.8,0x2a1a10,.05,.22,z);k.box(.12,.5,.6,0xff9a3a,.12,.3,z,{glass:true});}
  S.push(chimney(k,1.6,-2.6,.22,6.2+ms*.3,.42,0x7a4030));
  for(let i=0;i<3;i++) k.box(.6,.7,.5,0x2b2b2e,2.2+i*.2,.22,1.6+i*.7);
  pallet(k,2.6,3.4,RCOL.charcoal,2);
  k.box(1.6,1.8,1.4,0xb0a090,-1.2,.22,3.6);k.gable(1.8,1.6,.6,0x6a3a2a,-1.2,2.02,3.6,'x');
  return {h:7.2+ms*.3,anim:A,smoke:S,smokeBig:true,parts:[]};}

/* ---------------- Phase II ---------------- */
function sawtooth(k,x,y,z,len,w,n,col,glassSide=true){const step=w/n;for(let i=0;i<n;i++){const zc=z-w/2+step*(i+.5);
  k.gable(len,step,1.2,col,x,y,zc,'x',.82);if(glassSide) k.box(len-.2,1.05,.06,0x3b5874,x,y+.05,zc+step*.32,{glass:true,r:[-.35,0,0]});}}
function carpentry(k,ms){const S=[];pad(k,2);const H=3.5+ms*.12;
  k.box(5.6,H,6.2,0xe6cfa3,-.5,.22,0);k.box(5.7,.45,6.3,0xa07850,-.5,.22,0);
  sawtooth(k,-.5,H+.22,0,5.8,6.4,3,0xb5763a);
  roller(k,2.32,1.6,2.2,2.4);k.win('z+',3.1,1.5,[-2.4,-.6,1.2],.9,1);
  sign(k,-.5,H-.45,3.15,3,0x7a4a28);
  for(let i=0;i<3;i++){const x=-2.6+i*.9;k.box(.55,.08,.55,RCOL.chairs,x,.62,4.3);k.box(.55,.62,.08,RCOL.chairs,x,.62,4.05);for(const[a,b] of [[-.22,-.22],[.22,-.22],[-.22,.22],[.22,.22]]) k.box(.07,.42,.07,0x6b4226,x+a,.22,4.3+b);}
  pallet(k,1.8,4.2,RCOL.planks,2);
  S.push(chimney(k,-2.6,-2.3,H+1.3,1.4,.2,0x8a8a8a));
  return {h:H+2.4,anim:[],smoke:S,parts:[],belt:{y:2.6}};}

function plymill(k,ms){const S=[];pad(k,2);const H=4+ms*.12;
  k.box(6,H,6.6,0xd8cfb8,-.5,.22,0);k.box(6.1,.5,6.7,0x8f8478,-.5,.22,0);k.box(6.2,.3,6.8,0x6f665c,-.5,H+.22,0);
  for(let i=0;i<3;i++) k.cyl(.35,.6,STEEL,-2+i*1.6,H+.52,-1.2,{seg:8});
  k.box(2.2,.9,1.8,0x7d6a55,-1.4,H+.52,1.2);
  roller(k,2.52,1.4,2.4,2.8);k.win('z+',3.3,2.2,[-2.6,-.9,.8],1,1.1);
  sign(k,-.5,H-.5,3.35,3.2,0xa0601e);
  for(let i=0;i<5;i++) k.box(1.8,.14,1.3,i%2?0xdc9c52:0xc88a44,-1.9,.22+i*.15,4.3);
  k.cyl(.7,2.2,0xe8e0a0,1.9,.22,4.0,{seg:10});k.cyl(.75,.15,0x8a7a40,1.9,2.42,4.0,{seg:10});
  return {h:H+1.6,anim:[],smoke:S,parts:[]};}

function pellet(k,ms){const S=[];pad(k,2);const H=3.2+ms*.1;
  k.box(4,H,5,0x8a8478,.2,.22,-.6);k.box(4.1,.4,5.1,0x5e5a52,.2,.22,-.6);k.box(4.2,.25,5.2,0x5a4a3a,.2,H+.22,-.6);k.box(4.05,.5,5.05,0xc8742e,.2,H-.5,-.6);
  for(const z of [-2.2,.2]){k.cyl(1.05,5.4+ms*.2,0xc6cacf,-2.4,.22,z,{seg:12});k.cone(1.1,.9,0xa8aeb5,-2.4,5.62+ms*.2,z,{seg:12});for(let i=1;i<4;i++) k.cyl(1.09,.08,0x8f969d,-2.4,.22+i*1.4,z,{seg:12});}
  k.box(1.4,.35,.35,0x8f969d,-1.4,4.6,-1);roller(k,2.27,1.2,2,2.2);k.win('z+',1.95,1.4,[-.6,1.1],.8,.8);
  for(let i=0;i<4;i++) k.box(.7,.5,.5,0x7a5a3a,1.2+(i%2)*.75,.22+Math.floor(i/2)*.5,3.2);
  S.push(chimney(k,1.2,-2.4,H+.4,1.6,.22,0x707078));
  return {h:H+3,anim:[],smoke:S,parts:[],belt:{y:2.6}};}

function paper(k,ms){const S=[];pad(k,2);const H=3.8+ms*.12;
  k.box(5.4,H,6.2,0x7f8f9f,-.4,.22,0);k.box(5.5,.45,6.3,0x55616d,-.4,.22,0);k.gable(5.6,6.4,1.3,0x55616d,-.4,H+.22,0,'x');
  for(const [x,z] of [[-2.2,-2],[-.8,-2.4]]) S.push(chimney(k,x,z,H+.6,4+ms*.3,.38,0xd8d8d8)),k.cyl(.41,.3,0xc0392b,x,H+3.2,z);
  roller(k,2.32,1.4,2.4,2.6);k.win('z+',3.1,1.7,[-2.5,-.4,1.6],.9,1);sign(k,-.4,H-.45,3.15,3,0x34495e);
  for(let i=0;i<3;i++) k.log(.42,1.2,0xf4efe2,-2.2+i*.95,.64,4.3,'z',10);k.log(.42,1.2,0xf4efe2,-1.7,1.36,4.3,'z',10);
  return {h:H+5,anim:[],smoke:S,parts:[]};}

function furniture(k,ms){const S=[];pad(k,2,8.4,8.2);const H=4.2+ms*.12;
  k.box(6.6,H,6.8,0x6f7f8f,-.5,.22,-.1);k.box(6.7,.5,6.9,0x4f5b66,-.5,.22,-.1);
  sawtooth(k,-.5,H+.22,-.1,6.8,7,4,0x4f5b66);
  roller(k,2.82,1.2,2.6,2.8);k.box(1.4,.9,3.2,0x5a5a5a,3.5,.22,1.2);   // loading dock
  k.win('z+',3.3,1.8,[-3.2,-1.6,0,1.6],1,1.1);sign(k,-.5,H-.5,3.35,3.6,0x2c3e50);
  for(let i=0;i<3;i++) k.box(1.1,1,1.1,0xb08a5a,-2.8+i*1.3,.22,4.5),k.box(1.12,.12,1.12,0x7a4a28,-2.8+i*1.3,1.22,4.5);
  S.push(chimney(k,-3,-2.6,H+1.4,1.8,.24,0x8a8a8a));
  return {h:H+3,anim:[],smoke:S,parts:[]};}

/* ---------------- Phase III (premium) ---------------- */
const PW=0xf1e7d6,PR=0x8e4a7a,GOLD=0xd4af37;
function premiumBase(k,H,roof,col=PW,w=5.4,d=5.8){k.box(w,H,d,col,-.5,.22,0);k.box(w+.1,.45,d+.1,0x9a8a7a,-.5,.22,0);k.box(w+.3,.2,d+.3,GOLD,-.5,H+.22,0);
  if(roof==='gable') k.gable(w+.2,d+.4,1.7,PR,-.5,H+.42,0,'x');else if(roof==='hip') k.add(new THREE.ConeGeometry(.5,1,4),PR,{p:[-.5,H+.42+1.1,0],s:[w*1.3,2.2,d*1.3],r:[0,Math.PI/4,0]});
  else k.box(w-.2,.3,d-.2,0x7a6a5a,-.5,H+.42,0);}
function awning(k,x,y,z,w,cols){const n=6;for(let i=0;i<n;i++) k.box(w/n,.12,.9,cols[i%2],x-w/2+w/n*(i+.5),y,z+.45,{r:[.35,0,0]});}
function atelier(k,ms){pad(k,3);const H=4+ms*.1;premiumBase(k,H,'gable');k.win('z+',2.95,.9,[-2,-.5,1],.9,1.3);k.win('z+',2.95,2.8,[-2,-.5,1],.8,.8);
  awning(k,-.5,2.4,2.9,4.6,[0xc0392b,0xf6efe0]);k.box(.12,2.2,1.4,0x5a3a2a,2.24,.22,1.4);
  for(let i=0;i<3;i++) k.box(.6,.5,.6,0xc0392b,1.8+i*.2,.22+i*.5*(i%2),3.7),k.box(.62,.1,.62,GOLD,1.8+i*.2,.72+i*.5*(i%2),3.7);
  return {h:H+2.6,anim:[],smoke:[],parts:[],pad:true};}
function parquet(k,ms){pad(k,3);const H=3.6+ms*.1;premiumBase(k,H,'gable',0xe9dcc8);roller(k,2.27,1.2,2,2.4);k.win('z+',2.95,1.6,[-2.4,-.8,.8],.9,1);
  for(let i=0;i<5;i++) k.box(1.6,.1,1.1,i%2?0xb07a42:0x9a6a3a,-1.6,.22+i*.11,4.1);return {h:H+2.4,anim:[],smoke:[],parts:[]};}
function stationer(k,ms){pad(k,3);const H=5.6+ms*.15;premiumBase(k,H,'hip',PW,4.4,4.6);for(const y of [1.2,2.9,4.4]) k.win('z+',2.35,y,[-1.7,-.5,.7],.7,.9);
  k.cyl(.55,.12,0xffffff,-.5,H-.6,2.36,{rot:[Math.PI/2,0,0],seg:16});return {h:H+3,anim:[],smoke:[],parts:[]};}
function cabinetry(k,ms){pad(k,3);const H=3.8+ms*.1;premiumBase(k,H,'flat');for(let i=0;i<4;i++) k.box(1.1,2.7,.08,0x3b5874,-2.6+i*1.4,.6,2.96,{glass:true});
  k.box(5.5,.25,.5,GOLD,-.5,3.4,3.05);return {h:H+1.6,anim:[],smoke:[],parts:[]};}
function showroom(k,ms){pad(k,3);const H=4.2+ms*.1;k.box(5.4,.4,5.8,0x9a8a7a,-.5,.22,0);
  for(const [x,z,w,d] of [[-.5,2.85,5.4,.1],[-.5,-2.85,5.4,.1],[-3.15,0,.1,5.8],[2.15,0,.1,5.8]]) k.box(w,H-.4,d,0x7fa6c0,x,.62,z,{glass:true});
  for(const [x,z] of [[-3.15,2.85],[2.15,2.85],[-3.15,-2.85],[2.15,-2.85]]) k.box(.22,H,.22,GOLD,x,.22,z);
  k.box(5.7,.35,6.1,0xf1e7d6,-.5,H+.22,0);k.box(5.8,.12,6.2,GOLD,-.5,H+.57,0);k.box(1.8,1,1.2,0x7a4a28,-.5,.62,0);k.box(1.8,.2,1.2,GOLD,-.5,1.62,0);
  return {h:H+1.6,anim:[],smoke:[],parts:[]};}
function toyshop(k,ms){pad(k,3);const H=3.6+ms*.1;premiumBase(k,H,'flat',0xf6efe0);const C=[0xe74c3c,0xf1c40f,0x3498db,0x2ecc71];
  for(let i=0;i<4;i++) k.box(1.2,.9,1.2,C[i],-2.3+i*1.2,H+.42,-.6);k.win('z+',2.95,1.4,[-2.2,-.5,1.2],1,1.1);return {h:H+2.4,anim:[],smoke:[],parts:[]};}
function boatyard(k,ms){pad(k,3,8.4,8);k.box(7,.3,3.2,0x8b6a45,-.4,.22,0);for(let i=0;i<6;i++) k.box(.25,.3,3.4,0x5a3a20,-3.4+i*1.2,.52,0);
  k.add(new THREE.CylinderGeometry(1.2,.5,5.2,6,1),0x3a6aaa,{p:[-.4,1.6,0],r:[0,0,Math.PI/2],s:[1,1,.9]});k.box(4.2,.15,1.6,0xe8dcc0,-.6,2.6,0);
  return {h:5,anim:[],smoke:[],parts:[]};}

/* ---------------- helpers (right column) ---------------- */
function power(k,ms){const A=[],S=[];pad(k,4,8.2,8.2);
  const prof=[];for(let i=0;i<=8;i++){const t=i/8,r=2.25-1.7*Math.sin(t*Math.PI*.62)+.9*t*t;prof.push(new THREE.Vector2(Math.max(1.2,r),t*6.4));}
  k.add(new THREE.LatheGeometry(prof,16),0xdcd6cc,{p:[-1.4,.22,-1.4]});k.cyl(1.55,.18,0xb0a89a,-1.4,6.5,-1.4,{seg:16});
  S.push(new THREE.Vector3(-1.4,6.9,-1.4));
  k.box(3.6,3,3.4,0xb8a48a,1.2,.22,1.6);k.box(3.7,.3,3.5,0x6a5a4a,1.2,3.22,1.6);k.win('z+',3.32,1.6,[.4,2],.8,.9);
  S.push(chimney(k,2.2,-2.4,.22,7.4,.4,0xe8e2d8));k.cyl(.43,.4,0xc0392b,2.2,6.6,-2.4);k.cyl(.43,.4,0xc0392b,2.2,5.6,-2.4);
  for(let i=0;i<3;i++){k.box(.8,1,.8,0x5f6a5a,-3.2+i*1.1,.22,2.9);k.box(.15,.4,.15,0xffd84a,-3.2+i*1.1,1.22,2.9,{glass:true});}
  k.box(.12,3,.12,0x555,-3.4,.22,-3.4);k.box(.12,3,.12,0x555,3.4,.22,3.6);
  return {h:7.6,anim:A,smoke:S,steam:true,parts:[]};}
function fire(k,ms){const A=[],S=[];pad(k,4);const H=3.2;
  k.box(6,H,5.2,0xb23a2e,-.3,.22,-.6);k.box(6.1,.45,5.3,0x7a2018,-.3,.22,-.6);k.box(6.2,.3,5.4,0xe8e0d0,-.3,H+.22,-.6);
  for(let i=0;i<3;i++) roller(k,-2.2+i*1.9,1.96,1.5,2.2,'z');
  k.box(1.6,6.8,1.6,0xa0342a,-2.6,.22,-2.6);k.box(1.9,.3,1.9,0xe8e0d0,-2.6,7,-2.6);k.win('z+',-1.78,5,[-2.6],.6,.9);
  k.box(.35,.35,.35,0xff3b2f,.6,H+.55,1.6,{glass:true});
  // fire engine parked out front
  k.box(1.3,1.1,3,0xd23a2a,.8,.45,3.9);k.box(1.3,.6,1,0xd23a2a,.8,1.55,4.85);k.box(1.2,.5,.08,0x3b5874,.8,1.5,5.36,{glass:true});k.box(1,.2,2.2,0xc0c4c8,.8,1.55,3.5);
  for(const z of [3,4.8]) for(const x of [.12,1.48]) k.log(.3,.25,0x222,x,.45,z,'x',8);
  return {h:7.6,anim:A,smoke:S,parts:[]};}
function builders(k,ms){const A=[],S=[];pad(k,4,8.2,8.2);
  k.box(2.6,1.4,1.2,0xf0b030,1.6,.22,2.6);k.box(2.6,1.4,1.2,0x3a7ac0,1.6,1.62,2.6);k.win('z+',3.22,.7,[1,2.2],.6,.5);
  for(let i=0;i<3;i++) k.box(1.8,.25,.8,0xd6a466,-2,.22+i*.27,2.8),k.box(1.8,.25,.8,0xb0b4b8,-2,.22+i*.27,1.6);
  k.box(.7,9,.7,0xf2b200,-1.6,.22,-1.6);for(let y=1;y<9;y+=1) k.box(.75,.08,.75,0xb88a00,-1.6,.22+y,-1.6);k.box(1.2,.8,1.2,0x404040,-1.6,.22,-1.6);
  const jib=spinner(b=>{b.box(9,.45,.5,0xf2b200,1.8,0,0);b.box(3,.45,.5,0xf2b200,-2.6,0,0);b.box(1.4,1,1,0x777777,-3.6,-.5,0);b.box(1,.9,.9,0x3b5874,0,-.9,.75);b.box(.08,2.2,.08,0x333,5,-2.2,0);b.box(.7,.4,.7,0xd6a466,5,-2.6,0);});
  jib.g.position.set(-1.6,9.5,-1.6);A.push((dt,run,t)=>{jib.g.rotation.y=Math.sin(t*.18)*1.3+.6;});
  return {h:10.2,anim:A,smoke:S,parts:[jib.g]};}
function lab(k,ms){const A=[],S=[];pad(k,4);const H=3.4;
  k.box(5.6,H,3.4,0xeef1f4,-.4,.22,-1.6);k.box(3,H,3,0xeef1f4,-1.7,.22,1.6);k.box(5.7,.3,3.5,0xb8c2cc,-.4,H+.22,-1.6);
  k.win('z+',3.12,1.5,[-2.4,-1],.9,1.2);k.win('z+',.12,1.5,[.6,1.9],.8,1);
  k.sphere(1.5,0x8fd3ff,1.2,H+.22,-1.6,{half:true,ws:12,hs:6,glass:true});k.cyl(1.55,.2,0xb8c2cc,1.2,H+.12,-1.6,{seg:12});
  k.box(.12,3,.12,0x8a8f96,-2.6,H+.5,-2.6);const dish=spinner(b=>{b.add(new THREE.SphereGeometry(.7,10,4,0,Math.PI*2,0,Math.PI/3),0xe0e4e8,{r:[Math.PI*.6,0,0]});});
  dish.g.position.set(-2.6,H+3.6,-2.6);A.push((dt,run,t)=>{dish.g.rotation.y=t*.4;});
  return {h:H+4,anim:A,smoke:S,parts:[dish.g]};}
function staffhq(k,ms){const A=[],S=[];pad(k,4);const H=6.6;
  k.box(5.4,H,4.6,0xd7dde3,-.4,.22,-1);k.box(5.6,.3,4.8,0x8a96a2,-.4,H+.22,-1);
  for(const y of [1,2.9,4.8]) k.win('z+',1.32,y,[-2.4,-1.2,0,1.2],.8,1.1);for(const y of [2.9,4.8]) k.win('x+',1.9,y,[-2.4,-1.2,.2],.8,1.1);
  k.box(2,.15,1.4,0x6a7682,-.4,2.4,2);k.box(.1,2.2,.1,0x6a7682,-1.3,.22,2.6);k.box(.1,2.2,.1,0x6a7682,.5,.22,2.6);
  k.box(.08,5,.08,0xdddddd,2.4,.22,2.8);k.box(1.2,.7,.04,0x3f8a3a,2.98,4.4,2.8);
  for(let i=0;i<3;i++) k.box(.08,.02,1.6,0xffffff,-2.6+i*1.4,.24,3.6);k.box(1.1,.7,1.9,0x3a6aaa,-1.9,.22,3.6);k.box(1,.45,1,0x3b5874,-1.9,.92,3.5,{glass:true});
  return {h:H+1.4,anim:A,smoke:S,parts:[]};}

export const BUILDERS={sawmill,peeler,chipper,kiln,carpentry,plymill,pellet,paper,furniture,atelier,parquet,stationer,cabinetry,showroom,toyshop,boatyard,power,fire,builders,lab,staffhq};

/* ghost plot for things not built yet: a dashed foundation, corner stakes and a translucent massing block */
export function ghost(tier){const k=new Kit();k.box(7.4,.12,7.4,0xcfc6b2,0,0,0);
  for(let i=0;i<8;i++){const a=-3.4+i*.97;k.box(.5,.05,.12,TIER_HEX[tier],a,.12,3.6);k.box(.5,.05,.12,TIER_HEX[tier],a,.12,-3.6);k.box(.12,.05,.5,TIER_HEX[tier],3.6,.12,a);k.box(.12,.05,.5,TIER_HEX[tier],-3.6,.12,a);}
  for(const [x,z] of [[-3.5,-3.5],[3.5,-3.5],[-3.5,3.5],[3.5,3.5]]) k.box(.12,.7,.12,0xd0a060,x,.12,z);
  const g=k.build('ghost');const m=new THREE.Mesh(new THREE.BoxGeometry(5.2,3,5.6),MAT.ghost);m.position.set(-.4,1.62,0);g.add(m);g.userData.solid=g.children[0];return {grp:g,h:4};}

export function makeBuilding(id,ms){const k=new Kit();const r=BUILDERS[id](k,ms||0);const grp=k.build(id);for(const p of r.parts) grp.add(p);r.grp=grp;return r;}
