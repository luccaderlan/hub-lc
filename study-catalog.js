import {divisionFor,subgroupFor,discoveryConnections} from './data.js';
import {spaceText} from './spaces.js';

export const studySearchText=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
// Only stored links establish membership. Suggestions stay explicitly separate.
export function noteStudyAreaIds(state,n){
  const ids=[n.areaId,state.materials.find(m=>m.id===n.materialId)?.areaId,state.documents.find(d=>d.id===n.documentId)?.areaId,...(state.discoveries.find(d=>d.id===n.discoveryId)?.areaIds||[])];
  return [...new Set(ids.filter(id=>state.areas.some(a=>a.id===id)))];
}
function studyEntries(state,{suggestions=true,terms=[]}={}){
  const entries=[];
  const add=(kind,item,areaIds,text,suggestedAreaIds=[])=>entries.push({kind,item,areaIds,suggestedAreaIds,text});
  for(const m of state.materials)add('references',m,[m.areaId],m.title+' '+m.description);
  for(const d of state.documents)add('documents',d,[d.areaId],d.title+' '+d.fileName+' '+d.description);
  for(const d of state.discoveries)add('discoveries',d,d.areaIds,[d.title,d.description,...d.tags,...d.points.map(p=>p.text),...state.notes.filter(n=>!n.bookId&&n.discoveryId===d.id).map(n=>n.title+' '+n.body)].join(' '),suggestions?discoveryConnections(d,state.areas,state.notes,terms).suggested.map(s=>s.area.id):[]);
  for(const n of state.notes)if(!n.bookId)add('notes',n,noteStudyAreaIds(state,n),n.title+' '+n.body+' '+spaceText(n)+' '+(n.stickies||[]).map(p=>p.text).join(' '));
  return entries;
}
export function studyRecords(state,{scope='all',id='',query='',suggestions=true,terms=[]}={}){
  const ids=new Set(scope==='area'?[id]:scope==='division'?state.areas.filter(a=>divisionFor(a)===id).map(a=>a.id):state.areas.map(a=>a.id));
  const matches=areaIds=>scope==='all'||(scope==='unassigned'?!areaIds.some(a=>ids.has(a)):areaIds.some(a=>ids.has(a)));
  const q=studySearchText(query),rows=[];
  for(const entry of studyEntries(state,{suggestions:suggestions&&['area','division'].includes(scope),terms})){
    const suggested=!matches(entry.areaIds)&&entry.suggestedAreaIds.some(a=>ids.has(a));
    if((suggested||matches(entry.areaIds))&&studySearchText(entry.text).includes(q))rows.push({kind:entry.kind,item:entry.item,suggested});
  }
  return rows;
}
export function studySubjectCounts(state,options={}){
  const counts=new Map(state.areas.map(a=>[a.id,0]));
  for(const entry of studyEntries(state,options))for(const id of new Set([...entry.areaIds,...entry.suggestedAreaIds]))if(counts.has(id))counts.set(id,counts.get(id)+1);
  return counts;
}
export function studySubjects(state,query=''){
  const q=studySearchText(query);
  return state.areas.filter(a=>studySearchText([a.name,divisionFor(a),subgroupFor(a)].join(' ')).includes(q));
}
