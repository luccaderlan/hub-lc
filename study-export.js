import {divisionFor,safeUrl,timestampUrl} from './data.js';

const heading=value=>String(value||'').replace(/[\r\n]+/g,' ').replace(/([\\`*_[\]<>#])/g,'\\$1');
const link=(title,url)=>safeUrl(url)?`[${heading(title)}](${safeUrl(url).replace(/\(/g,'%28').replace(/\)/g,'%29')})`:heading(title);
// This export compiles the learner's own records. It never invents a source summary.
export function studyMarkdown(state,{scope='all',id='',detail='full',from='',to='',recorded=false,date=new Date().toISOString().slice(0,10)}={}){
  const get=(collection,key)=>state[collection].find(x=>x.id===key);
  const inDate=(value)=>!from&&!to||!!value&&(!from||value.slice(0,10)>=from)&&(!to||value.slice(0,10)<=to);
  const areaIds=new Set(scope==='area'?[id]:scope==='division'?state.areas.filter(a=>divisionFor(a)===id).map(a=>a.id):state.areas.map(a=>a.id));
  const scopedArea=['area','division'].includes(scope);
  const related=(n)=>areaIds.has(n.areaId)||areaIds.has(get('materials',n.materialId)?.areaId)||areaIds.has(get('documents',n.documentId)?.areaId)||get('discoveries',n.discoveryId)?.areaIds.some(a=>areaIds.has(a));
  let notes=state.notes.filter(n=>inDate(n.updatedAt)&&(scopedArea?related(n):scope==='note'?n.id===id:scope==='document'?n.documentId===id:scope==='discovery'?n.discoveryId===id:scope==='book'?n.bookId===id:true));
  const sessions=state.sessions.filter(s=>inDate(s.date)&&(scopedArea?areaIds.has(s.areaId):scope==='book'?s.bookId===id:scope==='all'));
  const matching=(collection,key,match)=>state[collection].filter(x=>scopedArea?match(x):scope===key?x.id===id:scope==='all'?true:notes.some(n=>n[key+'Id']===x.id));
  let materials=matching('materials','material',m=>areaIds.has(m.areaId));
  let documents=matching('documents','document',d=>areaIds.has(d.areaId));
  let discoveries=matching('discoveries','discovery',d=>d.areaIds.some(a=>areaIds.has(a)));
  let books=state.books.filter(b=>scope==='book'?b.id===id:scopedArea?areaIds.has(b.areaId):scope==='all'||notes.some(n=>n.bookId===b.id));
  if(recorded||from||to){
    materials=materials.filter(m=>notes.some(n=>n.materialId===m.id));
    documents=documents.filter(d=>notes.some(n=>n.documentId===d.id)||!from&&!to&&d.description.trim());
    discoveries=discoveries.filter(d=>notes.some(n=>n.discoveryId===d.id)||inDate(d.updatedAt)&&(d.description.trim()||d.points.length));
    books=books.filter(b=>notes.some(n=>n.bookId===b.id)||sessions.some(s=>s.bookId===b.id));
  }
  const title=scope==='area'?get('areas',id)?.name:scope==='division'?id:scope==='note'?get('notes',id)?.title:scope==='document'?get('documents',id)?.title:scope==='discovery'?get('discoveries',id)?.title:scope==='book'?get('books',id)?.title:'Meu percurso de estudos';
  const out=[`# ${heading(title||'Estudos')}`,'',`Exportado em ${date}.`, '',detail==='summary'?'Síntese dos registros pessoais, organizada por fonte.':'Compilação dos registros pessoais, organizada por fonte.','Vídeos e arquivos originais não são transcritos. Links e referências permitem consultar as fontes.'];
  if(from||to)out.push('',`Período dos registros: ${from||'início'} a ${to||date}.`);
  out.push('',`Recorte: ${recorded?'somente materiais com registros de estudo':'acervo e registros'}. ${notes.length} anotações · ${sessions.length} sessões.`);
  const text=value=>{if(!value?.trim())return '';if(detail!=='summary')return value;const lines=value.split(/\r?\n/).filter(l=>l.trim()).slice(0,4).join('\n');return lines.length>900?lines.slice(0,900)+'…\n\n[Texto abreviado; exporte a versão completa para consultar o restante.]':lines!==value?' '+lines+'\n\n[Texto abreviado; exporte a versão completa para consultar o restante.]':lines;};
  const context=x=>{const a=get('areas',x.areaId);if(a)out.push(`Assunto: ${heading(a.name)} · Coleção: ${heading(divisionFor(a))}`);};
  if(materials.length){out.push('','## Referências');for(const m of materials){out.push('',`### ${link(m.title,m.url)}`,`Formato: ${heading(m.kind)}`);context(m);if(m.description)out.push('',text(m.description));}}
  if(documents.length){out.push('','## Documentos');for(const d of documents){out.push('',`### ${heading(d.title)}`,`Arquivo original: ${heading(d.fileName)}${d.page?' · Retomada: '+heading(d.page):''}`);context(d);if(d.description)out.push('',text(d.description));}}
  if(discoveries.length){out.push('','## Links e vídeos');for(const d of discoveries){out.push('',`### ${link(d.title,d.url)}`,`Formato: ${heading(d.kind)} · Situação: ${heading(d.status)}`);if(d.tags.length)out.push(`Palavras-chave: ${d.tags.map(heading).join(', ')}`);if(d.description)out.push('',text(d.description));for(const p of d.points)out.push('',`- ${p.position?link(p.position,timestampUrl(d.url,p.position))+': ':''}${p.text.replace(/\n/g,'\n  ')}`);}}
  if(books.length){out.push('','## Livros');for(const b of books)out.push('',`### ${heading(b.title)}`,`Autor: ${heading(b.author||'Não informado')}${b.status?' · '+heading(b.status):''}${b.page?' · Página '+heading(b.page):''}${b.chapter?' · '+heading(b.chapter):''}`);}
  if(notes.length){out.push('','## Anotações');for(const n of notes){out.push('',`### ${heading(n.title)}`,`${heading(n.kind==='canvas'?'Mural':n.category)} · Atualização: ${heading(n.updatedAt.slice(0,10))}`);context(n);for(const [key,collection] of [['material','materials'],['document','documents'],['discovery','discoveries'],['book','books']]){const source=get(collection,n[key+'Id']);if(source)out.push(`Fonte: ${link(source.title,source.url)}${key==='document'?' ('+heading(source.fileName)+')':''}`);}if(n.page)out.push(`Página / referência: ${heading(n.page)}`);if(n.videoUrl)out.push(`Vídeo: ${link(n.videoPosition||'Abrir vídeo',timestampUrl(n.videoUrl,n.videoPosition||''))}`);if(n.body)out.push('',text(n.body));if(n.kind==='canvas'){for(const [i,p] of n.stickies.entries())out.push('',`#### Ideia ${i+1}`,text(p.text));for(const c of n.connections||[])out.push(`Conexão: ideia ${n.stickies.findIndex(p=>p.id===c.from)+1} ↔ ideia ${n.stickies.findIndex(p=>p.id===c.to)+1}.`);}}}
  if(sessions.length){out.push('','## Sessões de estudo');for(const s of sessions){out.push('',`### ${heading(s.date)} · ${s.minutes} min`);context(s);if(s.summary)out.push('',text(s.summary));if(s.next)out.push('',`Próximo passo: ${text(s.next)}`);}}
  if(!notes.length&&!sessions.length&&!materials.length&&!documents.length&&!discoveries.length&&!books.length)out.push('','Nenhum registro encontrado neste recorte.');
  return out.join('\n')+'\n';
}
