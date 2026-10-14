import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitial,validateState,safeUrl,timerElapsed,pauseTimer,percentages,readState,writeState,STORAGE_KEY,dictionarySnapshot,makeDiscovery,discoveryConnections,timestampUrl,inspectPdf,decodePdfBackup,MAX_PDF_BYTES} from '../data.js';

test('primeiro acesso permite estudar sem horários, metas ou status de leitura impostos',()=>{
  const s=createInitial();assert.doesNotThrow(()=>validateState(s));
  assert.equal(s.timer.running,false);assert.equal(s.timer.targetMinutes,'');assert.equal(s.tasks.length,0);assert.equal(s.sessions.length,0);
  assert.ok(s.books.every(b=>b.status===''&&b.page===''&&b.total===''));
  assert.ok(s.areas.some(a=>a.name==='Filosofia'));assert.ok(s.areas.some(a=>a.name==='Espiritualidade'));
});
test('cronômetro preserva tempo no reload e exclui pausas',()=>{
  const timer={running:true,startedAt:1000,elapsedMs:4000};
  assert.equal(timerElapsed(timer,6000),9000);
  const paused=pauseTimer(timer,6000);assert.equal(timerElapsed(paused,100000),9000);
  const resumed={...paused,running:true,startedAt:100000};assert.equal(timerElapsed(resumed,103000),12000);
  assert.equal(timerElapsed({...timer,startedAt:10000},6000),4000);
});
test('porcentagens usam todo o tempo e não confundem ausência de dados com zero aprendizado',()=>{
  assert.deepEqual(percentages([]),[]);
  const p=percentages([{areaId:'a',minutes:30},{areaId:'a',minutes:10},{areaId:'b',minutes:20},{areaId:'',minutes:20}]);
  assert.equal(p.find(x=>x.areaId==='a').percent,50);assert.equal(p.reduce((s,x)=>s+x.percent,0),100);
});
test('conteúdos permitem HTTP(S) e bloqueiam URLs executáveis ou credenciais embutidas',()=>{
  for(const value of ['javascript:alert(1)','data:text/html,hello','file:///C:/data','https://user:pass@example.com','texto'])assert.equal(safeUrl(value),'');
  assert.equal(safeUrl('https://dev.java/learn/'),'https://dev.java/learn/');
});
test('backup preserva livros e notas; cópia validada não altera o original',()=>{
  const s=createInitial();const area=s.areas[0].id,book=s.books[0].id;
  s.notes.push({id:'nota',title:'Reflexão',kind:'text',category:'Reflexão',body:'Texto pessoal <script>literal</script>',areaId:area,bookId:book,materialId:'',page:'12',stickies:[],updatedAt:new Date().toISOString()});
  const memory=new Map(),storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
  writeState(storage,s);const loaded=readState(storage);assert.deepEqual(loaded.notes,s.notes);loaded.books[0].title='Outra';assert.notEqual(s.books[0].title,'Outra');
});
test('importação rejeita referências quebradas, IDs duplicados e durações inválidas sem sobrescrever dados',()=>{
  const s=createInitial();let stored=JSON.stringify(s);const storage={getItem:()=>stored,setItem:(k,v)=>stored=v};
  for(const mutate of [x=>x.books[0].areaId='inexistente',x=>x.books[1].id=x.books[0].id,x=>x.timer.elapsedMs=-1,x=>x.books[0].total='0',x=>x.materials[0].url='javascript:alert(1)',x=>x.schemaVersion=2]){
    const changed=structuredClone(s);mutate(changed);assert.throws(()=>writeState(storage,changed));assert.deepEqual(JSON.parse(stored),s);
  }
  assert.equal(typeof STORAGE_KEY,'string');
});
test('leitura de registros corrompidos falha preservando o arquivo original',()=>{
  const raw='{quebrado';let writes=0;assert.throws(()=>readState({getItem:()=>raw,setItem:()=>writes++}));assert.equal(writes,0);
});

test('backups anteriores recebem divisões sem perder IDs, vínculos ou dados pessoais',()=>{
  const old=createInitial();
  old.areas.forEach(a=>delete a.division);
  old.areas.push({id:'history',name:'História',description:'Minhas descobertas'});
  const original=structuredClone(old);
  const migrated=validateState(old);
  assert.deepEqual(old,original);
  assert.equal(migrated.areas.find(a=>a.name==='Java').division,'TI');
  assert.equal(migrated.areas.find(a=>a.name==='Filosofia').division,'Filosofia');
  assert.equal(migrated.areas.find(a=>a.name==='Neurociência').division,'Neurociência');
  assert.equal(migrated.areas.find(a=>a.id==='history').division,'Outros');
  assert.deepEqual(migrated.materials,old.materials);
  assert.deepEqual(migrated.books,old.books);
  migrated.areas[0].division='Minha divisão';
  assert.equal(validateState(migrated).areas[0].division,'Minha divisão');
  for(const value of ['', '   ', 42, 'x'.repeat(101)]){
    const invalid=structuredClone(migrated);invalid.areas[0].division=value;
    assert.throws(()=>validateState(invalid));
  }
});

test('cópia do Notion preserva termos distintos e links válidos sem preencher campos ausentes',()=>{
  const terms=dictionarySnapshot.terms;
  assert.equal(terms.length,330);
  assert.equal(new Set(terms.map(t=>t.url)).size,terms.length);
  assert.ok(terms.every(t=>safeUrl(t.url)&&['word','category','meaning','comparison','example'].every(key=>typeof t[key]==='string')));
  assert.ok(terms.some(t=>t.word==='API'));
  assert.ok(terms.some(t=>t.word==='API (Application Programming Interface)'));
  assert.ok(terms.some(t=>t.word===''));
});

test('captura permite só um link, identifica plataformas de vídeo e não aceita URLs executáveis',()=>{
  const d=makeDiscovery(' https://youtu.be/example ');
  assert.equal(d.title,'youtu.be');assert.equal(d.kind,'Vídeo');assert.equal(d.url,'https://youtu.be/example');
  assert.deepEqual(d.areaIds,[]);assert.deepEqual(d.points,[]);
  assert.equal(makeDiscovery('https://notyoutube.com/example').kind,'Outro');
  assert.equal(makeDiscovery('https://example.org',' Meu artigo ').title,'Meu artigo');
  for(const url of ['javascript:alert(1)','file:///tmp/test','https://user:pass@example.org'])assert.throws(()=>makeDiscovery(url));
});

test('ligações indiretas usam palavras completas do texto, pontos e notas, sem confirmar temas sozinhas',()=>{
  const s=createInitial(),d=makeDiscovery('https://example.org','Aprendizado e MEMÓRIA');
  d.points.push({id:'point',position:'08:42',text:'Relacionar com API e PostgreSQL.'});
  const c=discoveryConnections(d,s.areas);
  assert.ok(c.suggested.some(x=>x.area.name==='Neurociência'));
  assert.ok(c.suggested.some(x=>x.area.name==='APIs'));
  assert.ok(c.suggested.some(x=>x.area.name==='PostgreSQL'));
  assert.ok(c.terms.some(t=>t.word==='API'));
  assert.deepEqual(d.areaIds,[]);assert.deepEqual(c.confirmed,[]);
  d.areaIds.push(s.areas.find(a=>a.name==='Neurociência').id);
  const linked=discoveryConnections(d,s.areas);
  assert.equal(linked.confirmed[0].name,'Neurociência');assert.ok(!linked.suggested.some(x=>x.area.name==='Neurociência'));
  const indirect=makeDiscovery('https://example.org','Capilaridade');
  assert.ok(!discoveryConnections(indirect,s.areas).terms.some(t=>t.word==='API'));
  const note={discoveryId:indirect.id,title:'Uma ideia',body:'O cérebro e a memória',bookId:''};
  assert.ok(discoveryConnections(indirect,s.areas,[note]).suggested.some(x=>x.area.name==='Neurociência'));
  assert.equal(discoveryConnections(indirect,s.areas,[{...note,bookId:'book'}]).suggested.length,0);
});

test('marcação de momentos abre o YouTube no tempo correto e preserva outras fontes',()=>{
  assert.equal(new URL(timestampUrl('https://www.youtube.com/watch?v=abc','08:42')).searchParams.get('t'),'522s');
  assert.equal(new URL(timestampUrl('https://youtu.be/abc','1:02:10')).searchParams.get('t'),'3730s');
  assert.equal(timestampUrl('https://example.org/video','08:42'),'https://example.org/video');
  for(const position of ['08:99','final','javascript:alert(1)'])assert.equal(timestampUrl('https://youtu.be/abc',position),'https://youtu.be/abc');
  assert.equal(timestampUrl('javascript:alert(1)','08:42'),'');
});

test('backup de descobertas preserva múltiplos temas, pontos e notas; vínculos inválidos não sobrescrevem dados',()=>{
  const s=createInitial(),d=makeDiscovery('https://youtu.be/example','Minha descoberta');
  d.areaIds=s.areas.slice(0,2).map(a=>a.id);d.tags=['Java','Maven'];d.points=[{id:'point',position:'08:42',text:'Uma ideia importante'}];s.discoveries.push(d);
  s.notes.push({id:'discovery-note',title:'Minha reflexão',body:'Escrito por mim',kind:'text',category:'Reflexão',areaId:'',bookId:'',materialId:'',discoveryId:d.id,page:'',stickies:[],updatedAt:new Date().toISOString()});
  let stored='';const storage={getItem:()=>stored,setItem:(key,value)=>stored=value};
  writeState(storage,s);assert.deepEqual(readState(storage),s);
  const original=stored;
  for(const mutate of [x=>x.discoveries[0].areaIds.push('missing'),x=>x.notes[0].discoveryId='missing',x=>x.discoveries[0].points.push({...x.discoveries[0].points[0]}),x=>x.discoveries[0].url='javascript:alert(1)',x=>x.discoveries[0].status='???']){
    const invalid=structuredClone(s);mutate(invalid);assert.throws(()=>writeState(storage,invalid));assert.equal(stored,original);
  }
  const old=createInitial();delete old.discoveries;
  assert.deepEqual(validateState(old).discoveries,[]);assert.equal(old.discoveries,undefined);
});

test('identidade nova migra cores antigas preservando tema e cadastros',()=>{
  for(const accent of ['petroleum','jade','plum']){
    const old=createInitial();old.prefs.accent=accent;old.prefs.theme='dark';
    const migrated=validateState(old);
    assert.equal(migrated.prefs.accent,'lc');assert.equal(migrated.prefs.theme,'dark');
    assert.deepEqual(migrated.books,old.books);assert.deepEqual(migrated.materials,old.materials);
    assert.equal(old.prefs.accent,accent);
  }
});

test('PDFs usam impressão do conteúdo e rejeitam arquivos inválidos ou grandes',async()=>{
  const blob=new Blob(['%PDF-1.4\nfixture\n%%EOF'],{type:'application/pdf'}),a=await inspectPdf(blob),b=await inspectPdf(blob);
  assert.equal(a.sha256,b.sha256);assert.equal(a.sha256.length,64);assert.equal(a.size,blob.size);
  await assert.rejects(()=>inspectPdf(new Blob(['not a pdf'])));
  await assert.rejects(()=>inspectPdf({size:MAX_PDF_BYTES+1}));
  const s=createInitial(),d={id:'pdf',title:'Artigo',fileName:'artigo.pdf',size:a.size,sha256:a.sha256,areaId:s.areas[0].id,description:'Objetivo pessoal',page:'2',createdAt:new Date().toISOString()};s.documents.push(d);
  const files=[{sha256:d.sha256,data:Buffer.from(await blob.arrayBuffer()).toString('base64')}];
  const restored=await decodePdfBackup(s.documents,files);assert.equal(await restored[0].blob.text(),await blob.text());
  assert.doesNotThrow(()=>validateState(s));
  const corrupt=structuredClone(files);corrupt[0].data=Buffer.from('%PDF-1.4\nchanged').toString('base64');await assert.rejects(()=>decodePdfBackup(s.documents,corrupt));
  for(const mutate of [x=>x.documents[0].areaId='missing',x=>x.documents[0].page='-1',x=>x.documents[0].sha256='bad',x=>x.documents[0].size=MAX_PDF_BYTES+1]){const invalid=structuredClone(s);mutate(invalid);assert.throws(()=>validateState(invalid));}
  const old=createInitial();delete old.documents;assert.deepEqual(validateState(old).documents,[]);assert.equal(old.documents,undefined);
});
