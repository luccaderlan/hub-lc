import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitial,makeDiscovery} from '../data.js';
import {noteStudyAreaIds,studyRecords,studySubjectCounts,studySubjects} from '../study-catalog.js';
import {studyMarkdown} from '../study-export.js';

test('o mesmo registro indireto conta uma vez; notas de livro permanecem na Biblioteca',()=>{
 const s=createInitial(),area=s.areas[0],material=s.materials.find(m=>m.areaId===area.id);
 s.documents.push({id:'file',title:'Arquivo',fileName:'arquivo.md',areaId:area.id,description:''});
 const d=makeDiscovery('https://example.org/','Fonte','');d.areaIds=[area.id];s.discoveries.push(d);
 const n={id:'note',title:'Ideia única',areaId:area.id,materialId:material.id,documentId:'file',discoveryId:d.id,bookId:'',body:'Reflexão',updatedAt:'2026-10-28',kind:'text',category:'Anotação',stickies:[]};s.notes.push(n,{...n,id:'book-note',title:'Somente na Biblioteca',bookId:s.books[0].id});
 assert.deepEqual(noteStudyAreaIds(s,n),[area.id]);
 const records=studyRecords(s,{scope:'area',id:area.id,suggestions:false});
 assert.equal(records.filter(r=>r.kind==='notes').length,1);
 assert.equal(records.filter(r=>r.item.id==='note').length,1);
 const exported=studyMarkdown(s,{scope:'area',id:area.id});assert.match(exported,/Ideia única/);assert.doesNotMatch(exported,/Somente na Biblioteca/);
 n.areaId='';assert.deepEqual(noteStudyAreaIds(s,n),[area.id]);assert.equal(studyRecords(s,{scope:'unassigned'}).some(r=>r.item.id==='note'),false);
});

test('Sem assunto não inclui notas que têm vínculo indireto confirmado',()=>{
 const s=createInitial(),area=s.areas[0];
 s.materials.push({id:'loose-material',title:'Referência sem assunto',areaId:'',description:''});
 s.notes.push({id:'loose-note',title:'Nota livre',body:'ideia',bookId:'',areaId:'',stickies:[]});
 const d=makeDiscovery('https://example.org/video','Vídeo Java','');s.discoveries.push(d);
 const original=structuredClone(s);
 const loose=studyRecords(s,{scope:'unassigned'});assert.ok(loose.some(r=>r.item.id==='loose-material'));assert.ok(loose.some(r=>r.item.id==='loose-note'));assert.ok(loose.some(r=>r.item.id===d.id));
 const suggestions=studyRecords(s,{scope:'area',id:area.id});assert.equal(suggestions.find(r=>r.item.id===d.id)?.suggested,true);
 assert.equal(studyRecords(s,{scope:'area',id:area.id,suggestions:false}).some(r=>r.item.id===d.id),false);
 assert.deepEqual(s,original);
});

test('busca por assunto, área e grupo ignora acentos e busca de materiais é independente',()=>{
 const s=createInitial();s.areas.push({id:'long',name:'Análise de sistemas',division:'Pesquisa',subgroup:'Métodos',description:''});
 for(const query of ['analise','PESQUISA','metodos'])assert.ok(studySubjects(s,query).some(a=>a.id==='long'));
 assert.equal(studySubjects(s,'ausente').length,0);
 assert.equal(studyRecords(s,{scope:'all',query:'POSTGRESQL'}).length,1);
});

test('exportação Sem assunto usa vínculos confirmados, incluindo notas indiretas',()=>{
 const s=createInitial();s.materials.push({id:'loose',title:'Material livre',areaId:'',description:'',url:'',kind:'Leitura'});
 s.notes.push({id:'indirect',title:'Reflexão indireta',areaId:'',materialId:s.materials[0].id,bookId:'',body:'Texto',stickies:[],kind:'text',category:'Anotação',updatedAt:'2026-10-28'});
 const md=studyMarkdown(s,{scope:'unassigned'});assert.match(md,/Material livre/);assert.doesNotMatch(md,/Reflexão indireta|Aprender Java/);
});

test('contagens do catálogo e resultados usam a mesma seleção, inclusive sugestões',()=>{
 const s=createInitial(),d=makeDiscovery('https://example.org/java','Java e Maven','');s.discoveries.push(d);
 const counts=studySubjectCounts(s);for(const a of s.areas)assert.equal(counts.get(a.id),studyRecords(s,{scope:'area',id:a.id}).length,a.name);
});
