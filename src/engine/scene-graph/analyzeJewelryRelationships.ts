import { Box3, Vector3 } from 'three'
import type { JewelryComponentNode, JewelryComponentSceneGraph } from './extractComponentNodes'

export type StructuralRegion = 'SHANK' | 'CROWN_HEAD' | 'CROWN_CANDIDATE' | 'OTHER'
export interface JewelrySpatialNode { id:string; center:readonly[number,number,number]; size:number; radialDistance:number; axialPosition:number; crownScore:number; centrality:number; neighbors:number; region:StructuralRegion; structuralScore:number }
export interface JewelryRelationshipAnalysis { center:readonly[number,number,number]; ringAxis:readonly[number,number,number]; crownDirection:readonly[number,number,number]; nodes:JewelrySpatialNode[]; shankNodes:JewelrySpatialNode[]; crownHeadNodes:JewelrySpatialNode[]; centerStoneCandidates:JewelrySpatialNode[] }

function nodeBounds(node: JewelryComponentNode): Box3 { const box=node.geometry.boundingBox?.clone()??new Box3().setFromBufferAttribute(node.geometry.getAttribute('position')); return box.applyMatrix4(node.worldMatrix) }
const median=(values:number[])=>{const s=[...values].sort((a,b)=>a-b);return s[Math.floor(s.length/2)]||1}

export function analyzeJewelryRelationships(graph: JewelryComponentSceneGraph): JewelryRelationshipAnalysis {
 const records=graph.nodes.map(node=>{const box=nodeBounds(node),center=box.getCenter(new Vector3()),dimensions=box.getSize(new Vector3());return{node,box,center,dimensions,size:Math.max(dimensions.x,dimensions.y,dimensions.z)}})
 if(!records.length)return{center:[0,0,0],ringAxis:[0,1,0],crownDirection:[0,1,0],nodes:[],shankNodes:[],crownHeadNodes:[],centerStoneCandidates:[]}
 const globalBox=new Box3();globalBox.makeEmpty();records.forEach(r=>globalBox.union(r.box));const globalCenter=globalBox.getCenter(new Vector3()),globalSize=globalBox.getSize(new Vector3()),maxExtent=Math.max(globalSize.x,globalSize.y,globalSize.z,1e-6)
 const ringAxis=[{axis:new Vector3(1,0,0),span:globalSize.x},{axis:new Vector3(0,1,0),span:globalSize.y},{axis:new Vector3(0,0,1),span:globalSize.z}].sort((a,b)=>a.span-b.span)[0].axis
 const triangleMedian=median(records.map(r=>r.node.triangleCount));const sizeMedian=median(records.map(r=>r.size).filter(Boolean))
 // Estimate the crown from compact components near the outermost region, explicitly avoiding giant shank arcs.
 const crownPool=records.filter(r=>r.size<sizeMedian*8&&r.node.triangleCount>=Math.max(2,triangleMedian*.5));const seed=(crownPool.length?crownPool:records).sort((a,b)=>b.center.distanceTo(globalCenter)-a.center.distanceTo(globalCenter))[0]
 const crownDirection=seed.center.clone().sub(globalCenter);crownDirection.addScaledVector(ringAxis,-crownDirection.dot(ringAxis)).normalize();if(crownDirection.lengthSq()<.01)crownDirection.set(0,1,0)
 const prelim=records.map(r=>{const relative=r.center.clone().sub(globalCenter),axialPosition=relative.dot(ringAxis)/maxExtent,planar=relative.clone().addScaledVector(ringAxis,-relative.dot(ringAxis)),radialDistance=planar.length()/maxExtent,crownScore=planar.dot(crownDirection)/maxExtent,centrality=1-Math.min(1,r.center.distanceTo(globalCenter)/maxExtent);return{r,axialPosition,radialDistance,crownScore,centrality}})
 // Local density uses a fixed asset-relative radius so large objects cannot declare the whole scene their neighborhood.
 const localRadius=maxExtent*.045
 const nodes:JewelrySpatialNode[]=prelim.map(p=>{const neighbors=records.reduce((n,o)=>n+(o!==p.r&&o.center.distanceTo(p.r.center)<=localRadius?1:0),0);const giant=p.r.size>sizeMedian*10;const elongated=Math.max(p.r.dimensions.x,p.r.dimensions.y,p.r.dimensions.z)/Math.max(Math.min(...[p.r.dimensions.x,p.r.dimensions.y,p.r.dimensions.z].filter(v=>v>1e-6)),1e-6)>8;const structuralScore=(giant?1:0)+(elongated?.7:0)+(p.crownScore<.18?.35:0);let region:StructuralRegion='OTHER';if(giant||elongated)region='SHANK';else if(p.crownScore>.22)region='CROWN_HEAD';return{id:p.r.node.id,center:[p.r.center.x,p.r.center.y,p.r.center.z],size:p.r.size,radialDistance:p.radialDistance,axialPosition:p.axialPosition,crownScore:p.crownScore,centrality:p.centrality,neighbors,region,structuralScore}})
 const shankNodes=nodes.filter(n=>n.region==='SHANK');const crownHeadNodes=nodes.filter(n=>n.region==='CROWN_HEAD');const crownSizes=crownHeadNodes.map(n=>n.size).filter(Boolean);const crownMedian=median(crownSizes)
 const centerStoneCandidates=crownHeadNodes.map(node=>{const source=graph.nodes.find(n=>n.id===node.id)!;const sizeFit=Math.min(1,node.size/Math.max(crownMedian*2,1e-6));const detail=Math.min(1,source.triangleCount/Math.max(triangleMedian*6,1));const density=Math.min(1,node.neighbors/18);const compactPenalty=node.structuralScore*.35;return{node,score:node.crownScore*.42+sizeFit*.28+detail*.2+density*.1-compactPenalty}}).filter(x=>x.node.size>=crownMedian*.8&&x.node.structuralScore<.8).sort((a,b)=>b.score-a.score).slice(0,12).map(x=>({...x.node,region:'CROWN_CANDIDATE' as StructuralRegion}))
 return{center:[globalCenter.x,globalCenter.y,globalCenter.z],ringAxis:[ringAxis.x,ringAxis.y,ringAxis.z],crownDirection:[crownDirection.x,crownDirection.y,crownDirection.z],nodes,shankNodes,crownHeadNodes,centerStoneCandidates}
}
