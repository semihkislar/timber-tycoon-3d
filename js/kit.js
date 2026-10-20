/* Procedural low-poly kit: every static building is baked from primitives into ONE merged, vertex-coloured,
   flat-shaded mesh (+ one merged "glass" mesh whose emissive glows at night) → ~2 draw calls per building. */
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_c=new THREE.Color(),_p=new THREE.Vector3(),_s=new THREE.Vector3();

export const MAT={
  solid:new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.82,metalness:.02}),
  glass:new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.25,metalness:.1,emissive:new THREE.Color(0xffc477),emissiveIntensity:0}),
  ghost:new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:.28,roughness:1,depthWrite:false}),
};

/* triangular / saw-tooth roof prism: ridge along x, cross-section in z∈[-w/2,w/2], y∈[0,h], ridge at z=-w/2+peak·w */
export function prism(l,w,h,peak=.5){
  const z0=-w/2,z1=w/2,zp=z0+peak*w,x0=-l/2,x1=l/2;
  const A=[x0,0,z0],B=[x0,0,z1],C=[x0,h,zp],D=[x1,0,z0],E=[x1,0,z1],F=[x1,h,zp];
  const T=[[A,B,C],[D,F,E],[A,C,F],[A,F,D],[B,E,F],[B,F,C],[A,E,B],[A,D,E]];
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(T.flat(2),3));g.computeVertexNormals();return g;
}
const G={box:new THREE.BoxGeometry(1,1,1)};
function cyl(seg){const k='c'+seg;return G[k]||(G[k]=new THREE.CylinderGeometry(.5,.5,1,seg));}
function cone(seg){const k='k'+seg;return G[k]||(G[k]=new THREE.ConeGeometry(.5,1,seg));}

export class Kit{
  constructor(){this.solid=[];this.glass=[];}
  add(geo,color,o={}){
    let g=geo.index?geo.toNonIndexed():geo.clone();
    for(const k of Object.keys(g.attributes)) if(k!=='position'&&k!=='normal') g.deleteAttribute(k);
    if(!g.attributes.normal) g.computeVertexNormals();
    const p=o.p||[0,0,0],r=o.r||[0,0,0],s=o.s||[1,1,1];
    _e.set(r[0],r[1],r[2],'YXZ');_q.setFromEuler(_e);_m.compose(_p.set(p[0],p[1],p[2]),_q,_s.set(s[0],s[1],s[2]));g.applyMatrix4(_m);
    const n=g.attributes.position.count,col=new Float32Array(n*3);_c.set(color);
    for(let i=0;i<n;i++){col[i*3]=_c.r;col[i*3+1]=_c.g;col[i*3+2]=_c.b;}
    g.setAttribute('color',new THREE.BufferAttribute(col,3));(o.glass?this.glass:this.solid).push(g);return this;}
  /* box with its BASE at y */
  box(w,h,d,color,x=0,y=0,z=0,o={}){return this.add(G.box,color,{...o,p:[x,y+h/2,z],s:[w,h,d]});}
  cyl(r,h,color,x=0,y=0,z=0,o={}){const r2=o.r2??r;const geo=r2===r?cyl(o.seg||10):new THREE.CylinderGeometry(r2/r*.5,.5,1,o.seg||10);
    return this.add(geo,color,{...o,p:[x,y+h/2,z],s:[r*2,h,r*2],r:o.rot||[0,0,0]});}
  /* cylinder lying along x (rx) or z (rz), centred at (x,y,z) */
  log(r,l,color,x,y,z,axis='x',seg=7){return this.add(cyl(seg),color,{p:[x,y,z],s:[r*2,l,r*2],r:axis==='x'?[0,0,Math.PI/2]:[Math.PI/2,0,0]});}
  cone(r,h,color,x=0,y=0,z=0,o={}){return this.add(cone(o.seg||8),color,{...o,p:[x,y+h/2,z],s:[r*2,h,r*2],r:o.rot||[0,0,0]});}
  /* gable roof: ridge along 'x' or 'z' */
  gable(l,w,h,color,x,y,z,axis='x',peak=.5){return this.add(prism(l,w,h,peak),color,{p:[x,y,z],r:axis==='x'?[0,0,0]:[0,Math.PI/2,0]});}
  sphere(r,color,x,y,z,o={}){return this.add(new THREE.SphereGeometry(1,o.ws||10,o.hs||6,0,Math.PI*2,0,o.half?Math.PI/2:Math.PI),color,{...o,p:[x,y,z],s:[r,o.sy?r*o.sy:r,r]});}
  /* windows: thin glass panes on a wall face. face: 'x+','x-','z+','z-' at coordinate c; along: list of centres on the other axis */
  win(face,c,y,along,w,h,frame=0x3a2a1a){const ax=face[0]==='x',sg=face[1]==='+'?1:-1;
    for(const a of along){if(ax){this.box(.08,h+.16,w+.16,frame,c+sg*.03,y-.08,a);this.box(.08,h,w,0x3b5874,c+sg*.07,y,a,{glass:true});}
      else{this.box(w+.16,h+.16,.08,frame,a,y-.08,c+sg*.03);this.box(w,h,.08,0x3b5874,a,y,c+sg*.07,{glass:true});}}return this;}
  build(name){const grp=new THREE.Group();grp.name=name||'';
    if(this.solid.length){const m=new THREE.Mesh(mergeGeometries(this.solid),MAT.solid);m.castShadow=true;m.receiveShadow=true;grp.add(m);grp.userData.solid=m;}
    if(this.glass.length){const m=new THREE.Mesh(mergeGeometries(this.glass),MAT.glass);m.receiveShadow=true;grp.add(m);}
    this.solid.forEach(g=>g.dispose());this.glass.forEach(g=>g.dispose());this.solid=[];this.glass=[];return grp;}
}
export {G};
