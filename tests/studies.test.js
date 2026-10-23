import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitial,validateState,makeDiscovery,decodePdfBackup} from '../data.js';
import {inspectDocument,documentFormat,DOCUMENT_ACCEPT} from '../documents.js';
import {studyMarkdown} from '../study-export.js';
const note=(overrides={})=>({id:'note-a',title:'Minha reflexão',kind:'text',category:'Anotação',areaId:'',bookId:'',materialId:'',page:'',body:'Aprendi sobre escopo e variáveis.',stickies:[],updatedAt:'2026-10-23T12:00:00Z',...overrides});

test('novos formatos validam assinatura, UTF-8, limite e hash sem perder o original',async()=>{
  assert.match(DOCUMENT_ACCEPT,/\.docx/);assert.match(DOCUMENT_ACCEPT,/\.md/);
  for(const name of ['ideias.md','ideias.txt','tabela.csv']){
    const f=new File(['# Minha ideia\nAção e reflexão'],name),checked=await inspectDocument(f);
    assert.equal(checked.format,name.split('.').pop());assert.equal(checked.size,f.size);assert.match(checked.sha256,/^[a-f0-9]{64}$/);
  }
  const zip=new Uint8Array([80,75,3,4,0,0]);
  for(const name of ['curso.docx','aula.pptx','dados.xlsx','livro.epub','ideias.odt'])assert.equal((await inspectDocument(new File([zip],name))).format,name.split('.').pop());
  await assert.rejects(inspectDocument(new File(['conteúdo'], 'falso.pdf')),/corresponde/);
  await assert.rejects(inspectDocument(new File(['conteúdo'], 'falso.docx')),/corresponde/);
  await assert.rejects(inspectDocument(new File([new Uint8Array([0xff,0x00])],'binario.txt')),/UTF-8/);
  await assert.rejects(inspectDocument(new File(['<script>alert(1)</script>'],'pagina.html')),/Formato/);
  await assert.rejects(inspectDocument(new File([],'vazio.md')),/não vazio/);
  await assert.rejects(inspectDocument(new File([new Uint8Array(25*1024*1024+1)],'grande.txt')),/25 MB/);
  assert.equal(documentFormat({fileName:'antigo.pdf'}).preview,'pdf');
});

test('backup restaura bytes, formato e vínculos de arquivos novos e mantém PDFs antigos',async()=>{
  const s=createInitial(),file=new File(['# Resumo\nEstudo com acentos: ação.'],'meu-estudo.md'),checked=await inspectDocument(file);
  s.documents.push({id:'document-a',title:'Resumo',fileName:file.name,size:checked.size,sha256:checked.sha256,format:checked.format,areaId:'',description:'Uma pergunta',page:'',createdAt:'2026-10-23'});
  s.notes.push(note({documentId:'document-a',videoUrl:'https://youtu.be/abc',videoPosition:'08:42'}));
  assert.equal(validateState(s).notes[0].videoPosition,'08:42');
  const decoded=await decodePdfBackup(s.documents,[{sha256:checked.sha256,data:Buffer.from(await file.arrayBuffer()).toString('base64')}]);
  assert.equal(await decoded[0].blob.text(),await file.text());assert.equal(decoded[0].blob.type,'text/markdown');
  await assert.rejects(decodePdfBackup(s.documents,[{sha256:checked.sha256,data:Buffer.from('# diferente').toString('base64')}]),/corresponde/);
  const bad=structuredClone(s);bad.documents[0].format='html';assert.throws(()=>validateState(bad));
  const unsafe=structuredClone(s);unsafe.notes[0].videoUrl='javascript:alert(1)';assert.throws(()=>validateState(unsafe));
});

test('Markdown por assunto inclui notas vinculadas indiretamente, vídeo com momento e fontes',()=>{
  const s=createInitial(),area=s.areas[0];s.notes.push(note({materialId:s.materials[0].id,videoUrl:'https://youtu.be/abc',videoPosition:'08:42'}));
  s.notes.push(note({id:'other-note',title:'Outro assunto',areaId:s.areas.at(-1).id}));
  const md=studyMarkdown(s,{scope:'area',id:area.id});
  assert.match(md,/Minha reflexão/);assert.match(md,/Aprendi sobre escopo/);assert.match(md,/t=522/);assert.match(md,/https:/);assert.doesNotMatch(md,/Outro assunto/);
  assert.match(studyMarkdown(s,{scope:'note',id:'note-a'}),/Aprender Java/);
});

test('Markdown geral, recorte por fonte, período, síntese e mural preservam o contexto',()=>{
  const s=createInitial(),d=makeDiscovery('https://youtube.com/watch?v=abc','Aula de memória','Reflexão da aula');
  d.id='discovery-a';d.points.push({id:'point-a',text:'Repetir com intervalos',position:'01:02'});s.discoveries.push(d);
  s.notes.push(note({discoveryId:d.id}));s.notes.push(note({id:'old-note',title:'Reflexão antiga',updatedAt:'2025-01-02'}));
  s.notes.push(note({id:'canvas-a',title:'Mapa',kind:'canvas',body:'',stickies:[{id:'sticky-a',text:'Ideia um',x:0,y:0,tone:'paper'},{id:'sticky-b',text:'Ideia dois',x:20,y:20,tone:'jade'}],connections:[{from:'sticky-a',to:'sticky-b'}]}));
  const md=studyMarkdown(s,{scope:'discovery',id:d.id});assert.match(md,/Aula de memória/);assert.match(md,/Minha reflexão/);assert.match(md,/t=62/);assert.doesNotMatch(md,/Reflexão antiga/);
  const period=studyMarkdown(s,{from:'2026-10-01',to:'2026-10-23'});assert.doesNotMatch(period,/Reflexão antiga/);
  assert.match(studyMarkdown(s),/Conexão: ideia 1 ↔ ideia 2/);
  s.notes[0].body='Uma ideia longa. '.repeat(200);const summary=studyMarkdown(s,{scope:'note',id:'note-a',detail:'summary'});assert.match(summary,/Texto abreviado/);assert.ok(summary.length<2000);
  assert.doesNotMatch(studyMarkdown(s,{recorded:true}),/Guias do Maven/);
  assert.match(studyMarkdown(s,{scope:'area',id:'ausente',recorded:true}),/Nenhum registro/);
});
