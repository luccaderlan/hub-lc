import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitial,validateState,decodePdfBackup} from '../data.js';
import {spaceFiles,newVisual,spaceText} from '../spaces.js';
import {studyMarkdown} from '../study-export.js';
const image={id:'image-one',fileName:'print.png',format:'png',sha256:'a'.repeat(64),size:120,title:'Diagrama',caption:'Trecho da fonte',alt:'Fluxo de ideias',source:'p. 10',comment:'Minha interpretação',group:'Capítulo 1'};
const note=()=>({id:'note-one',title:'Minha ideia',body:'Escrita [[imagem:image-two]]',kind:'text',category:'Reflexão',areaId:'',bookId:'',materialId:'',page:'',updatedAt:'2026-10-28',stickies:[],highlights:[{start:0,end:7,color:'yellow'}]});
test('migração aditiva conserva livros, texto, destaques e murais sem preencher conteúdos',()=>{
 const s=createInitial();s.notes.push(note());const before=structuredClone(s);const restored=validateState(s);
 assert.deepEqual(restored.books,before.books);assert.deepEqual(restored.notes,before.notes);assert.equal(restored.notes[0].space,undefined);assert.equal(restored.books[0].space,undefined);
});
test('espaços preservam identidade, galerias, arquivos compartilhados, tópicos e quadro próprio',()=>{
 const s=createInitial(),b=s.books[0],n=note();s.notes.push(n);b.cover={...image};b.space={images:[image],materials:[{id:'file-one',...image,id:'file-one',title:'Fonte'}]};n.space={images:[{...image,id:'image-two'}],topics:[{id:'topic-one',title:'Uma pergunta',body:'Meu desdobramento'}],materials:[{id:'url-one',title:'Vídeo',url:'https://example.org/video',comment:'Contexto'}]};n.visual=newVisual(n);n.visual.stickies.push({id:'card-one',text:'Comentário',imageId:'image-two',x:3,y:4,tone:'paper'});
 const restored=validateState(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored.notes,s.notes);assert.equal(spaceFiles(restored).length,4);assert.match(spaceText(b),/Minha interpretação/);
 const md=studyMarkdown(restored,{scope:'book',id:b.id});assert.match(md,/Legenda da fonte: Trecho da fonte/);assert.match(md,/não estão incorporados/);assert.doesNotMatch(md,/Meu desdobramento/);
 const noteMd=studyMarkdown(restored,{scope:'note',id:n.id});assert.match(noteMd,/Meu desdobramento/);assert.match(noteMd,/Quadro visual/);assert.match(noteMd,/imagem:image-two/);
});
test('validação rejeita anexos inválidos, URLs inseguras, recursão e relações quebradas',()=>{
 const s=createInitial();s.notes.push(note());s.notes[0].space={images:[image],topics:[],materials:[]};
 for(const mutate of [x=>x.notes[0].space.images[0].sha256='bad',x=>x.notes[0].space.images[0].size=13*1024*1024,x=>x.notes[0].space.images.push({...image}),x=>x.notes[0].space.topics.push({id:'t',title:'T',body:'',topics:[]}),x=>x.notes[0].space.materials.push({id:'m',title:'M',url:'javascript:alert(1)'}),x=>x.notes[0].space.materials.push({id:'m',title:'M',documentId:'missing'}),x=>{x.notes[0].visual=newVisual(x.notes[0]);x.notes[0].visual.stickies.push({id:'s',text:'',imageId:'missing',x:0,y:0,tone:'paper'});},x=>x.books[0].cover={...image,size:121}]){
  const invalid=structuredClone(s);mutate(invalid);assert.throws(()=>validateState(invalid));assert.equal(s.notes[0].space.images.length,1);
 }
});
test('backup de arquivos rejeita bytes adulterados antes de substituir registros',async()=>{
 const s=createInitial();s.books[0].space={images:[image]};await assert.rejects(()=>decodePdfBackup(spaceFiles(s),[{sha256:image.sha256,data:btoa('wrong bytes!')}]))
});
