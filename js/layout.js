/* World layout (metres, x = right, z = down the screen). Columns grow DOWNWARD (+z):
   forest | log yard + Phase I | lane (forklifts, belts) | Phase II | road | Phase III | road | helpers; dock at the bottom.
   This mirrors the layout Semih asked for on 20 Oct (vertical tier columns, helper buildings on the right). */
export const ROW=12;
export const COL={I:-8,II:8,III:26,H:44};
export const LANE={I_II:0,II_III:17,III_H:35};
export const TOP_ROAD=-7, BOTTOM_ROAD=ROW*5-4;   // z
export const DOCK_Z=ROW*5+4;                      // pier front
export const WATER_Z=DOCK_Z+3.5;
export const YARD={x:-9,z:-17};
export const FOREST={x0:-62,x1:-19,z0:-48,z1:96};
/* building slots: col, row, door side (+1: door faces +x, -1: faces -x) */
export const SLOTS={
  sawmill:{c:'I',r:0,d:1}, peeler:{c:'I',r:1,d:1}, chipper:{c:'I',r:2,d:1}, kiln:{c:'I',r:3,d:1},
  carpentry:{c:'II',r:0,d:-1}, plymill:{c:'II',r:1,d:-1}, pellet:{c:'II',r:2,d:-1}, paper:{c:'II',r:3,d:-1}, furniture:{c:'II',r:4,d:-1},
  atelier:{c:'III',r:0,d:-1}, parquet:{c:'III',r:1,d:-1}, stationer:{c:'III',r:2,d:-1}, cabinetry:{c:'III',r:3,d:-1}, showroom:{c:'III',r:4,d:-1},
  toyshop:{c:'III',r:5,d:-1,dz:2}, boatyard:{c:'H',r:5,d:-1,dz:2},
  power:{c:'H',r:0,d:-1,helper:true,name:'Power Plant',icon:'⚡'}, fire:{c:'H',r:1,d:-1,helper:true,name:'Fire Station',icon:'🚒'},
  builders:{c:'H',r:2,d:-1,helper:true,name:"Builders' Yard",icon:'🏗️'}, lab:{c:'H',r:3,d:-1}, staffhq:{c:'H',r:4,d:-1,helper:true,name:'Staff HQ',icon:'👷'},
};
export function slotPos(id){const s=SLOTS[id];return {x:COL[s.c]+(s.dx||0),z:s.r*ROW+(s.dz||0),d:s.d};}
/* the point in front of a building's door, at ground level (forklift docking point) */
export function doorPt(id,off=0){const p=slotPos(id);return {x:p.x+p.d*4.4,z:p.z+1.6+off};}
