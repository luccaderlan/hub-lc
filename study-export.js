import {divisionFor,safeUrl,timestampUrl} from './data.js';
import {noteStudyAreaIds} from './study-catalog.js';

const heading=value=>String(value||'').replace(/[\r\n]+/g,' ').replace(/([\\`*_[\]<>#])/g,'\\$1');
const link=(title,url)=>safeUrl(url)?`[${heading(title)}](${safeUrl(url).replace(/\(/g,'%28').replace(/\)/g,'%29')})`:heading(title);
// This export compiles the learner's own records. It never invents a source summary.
export function studyMarkdown(state,{scope='all',id='',detail='full',from='',to='',recorded=false,date=new Date().toISOString().slice(0,10)}={}){
  const get=(collection,key)=>state[collection].find(x=>x.id===key);
  const inDate=(value)=>!from&&!to||!!value&&(!from||value.slice(0,10)>=from)&&(!to||value.slice(0,10)<=to);
  const areaIds=new Set(scope==='area'?[id]:scope==='division'?state.areas.filter(a=>divisionFor(a)===id).map(a=>a.id):state.areas.map(a=>a.id));
  const scopedArea=['area','division'].includes(scope),unassigned=scope==='unassigned';
  const related=n=>noteStudyAreaIds(state,n).some(id=>areaIds.has(id));
  let notes=state.notes.filter(n=>inDate(n.updatedAt)&&(scopedArea?!n.bookId&&related(n):unassigned?!n.bookId&&!noteStudyAreaIds(state,n).length:scope==='note'?n.id===id:scope==='document'?n.documentId===id:scope==='discovery'?n.discoveryId===id:scope==='book'?n.bookId===id:true));
  const sessions=state.sessions.filter(s=>inDate(s.date)&&(scopedArea?areaIds.has(s.areaId):unassigned?!areaIds.has(s.areaId):scope==='book'?s.bookId===id:scope==='all'));
  const matching=(collection,key,match)=>state[collection].filter(x=>scopedArea?match(x):unassigned?key==='discovery'?!x.areaIds.some(a=>areaIds.has(a)):!areaIds.has(x.areaId):scope===key?x.id===id:scope==='all'?true:notes.some(n=>n[key+'Id']===x.id));
  let materials=matching('materials','material',m=>areaIds.has(m.areaId));
  let documents=matching('documents','document',d=>areaIds.has(d.areaId));
  let discoveries=matching('discoveries','discovery',d=>d.areaIds.some(a=>areaIds.has(a)));
  let books=state.books.filter(b=>scope==='book'?b.id===id:scopedArea||unassigned?false:scope==='all'||notes.some(n=>n.bookId===b.id));
  if(recorded||from||to){
    materials=materials.filter(m=>notes.some(n=>n.materialId===m.id));
    documents=documents.filter(d=>notes.some(n=>n.documentId===d.id)||!from&&!to&&d.description.trim());
    discoveries=discoveries.filter(d=>notes.some(n=>n.discoveryId===d.id)||inDate(d.updatedAt)&&(d.description.trim()||d.points.length));
    books=books.filter(b=>!from&&!to&&!!b.journal?.trim()||notes.some(n=>n.bookId===b.id)||sessions.some(s=>s.bookId===b.id));
  }
  const title=scope==='area'?get('areas',id)?.name:scope==='division'?id:scope==='note'?get('notes',id)?.title:scope==='document'?get('documents',id)?.title:scope==='discovery'?get('discoveries',id)?.title:scope==='book'?get('books',id)?.title:unassigned?'Sem assunto':'Meu percurso de estudos';
  const out=[`# ${heading(title||'Estudos')}`,'',`Exportado em ${date}.`, '',detail==='summary'?'Síntese dos registros pessoais, organizada por fonte.':'Compilação dos registros pessoais, organizada por fonte.','Vídeos e arquivos originais não são transcritos. Links e referências permitem consultar as fontes.'];
  if(from||to)out.push('',`Período dos registros: ${from||'início'} a ${to||date}.`);
  out.push('',`Recorte: ${recorded?'somente materiais com registros de estudo':'acervo e registros'}. ${notes.length} anotações · ${sessions.length} sessões.`);
  const text=value=>{if(!value?.trim())return '';if(detail!=='summary')return value;const lines=value.split(/\r?\n/).filter(l=>l.trim()).slice(0,4).join('\n');return lines.length>900?lines.slice(0,900)+'…\n\n[Texto abreviado; exporte a versão completa para consultar o restante.]':lines!==value?' '+lines+'\n\n[Texto abreviado; exporte a versão completa para consultar o restante.]':lines;};
  const context=x=>{const a=get('areas',x.areaId);if(a)out.push(`Assunto: ${heading(a.name)} · Área: ${heading(divisionFor(a))}`);};
  if(materials.length){out.push('','## Referências');for(const m of materials){out.push('',`### ${link(m.title,m.url)}`,`Formato: ${heading(m.kind)}`);context(m);if(m.description)out.push('',text(m.description));}}
  if(documents.length){out.push('','## Documentos');for(const d of documents){out.push('',`### ${heading(d.title)}`,`Arquivo original: ${heading(d.fileName)}${d.page?' · Retomada: '+heading(d.page):''}`);context(d);if(d.description)out.push('',text(d.description));}}
  if(discoveries.length){out.push('','## Links e vídeos');for(const d of discoveries){out.push('',`### ${link(d.title,d.url)}`,`Formato: ${heading(d.kind)} · Situação: ${heading(d.status)}`);if(d.tags.length)out.push(`Palavras-chave: ${d.tags.map(heading).join(', ')}`);if(d.description)out.push('',text(d.description));for(const p of d.points)out.push('',`- ${p.position?link(p.position,timestampUrl(d.url,p.position))+': ':''}${p.text.replace(/\n/g,'\n  ')}`);}}
  if(books.length){out.push('','## Livros');for(const b of books){out.push('',`### ${heading(b.title)}`,`Autor: ${heading(b.author||'Não informado')}${b.status?' · '+heading(b.status):''}${b.page?' · Página '+heading(b.page):''}${b.chapter?' · '+heading(b.chapter):''}`);if(b.nextStep)out.push('',`Próxima leitura: ${text(b.nextStep)}`);if(b.journal)out.push('','#### Caderno livre',text(b.journal));}}
  if(notes.length){out.push('','## Anotações');for(const n of notes){out.push('',`### ${heading(n.title)}`,`${heading(n.kind==='canvas'?'Mural':n.category)} · Atualização: ${heading(n.updatedAt.slice(0,10))}`);context(n);for(const [key,collection] of [['material','materials'],['document','documents'],['discovery','discoveries'],['book','books']]){const source=get(collection,n[key+'Id']);if(source)out.push(`Fonte: ${link(source.title,source.url)}${key==='document'?' ('+heading(source.fileName)+')':''}`);}if(n.page)out.push(`Página / referência: ${heading(n.page)}`);if(n.sourceUrl)out.push(`Fonte: ${link(n.sourceTitle||'Artigo ou site',n.sourceUrl)}`);if(n.videoUrl)out.push(`Vídeo: ${link(n.videoPosition||'Abrir vídeo',timestampUrl(n.videoUrl,n.videoPosition||''))}`);if(n.body)out.push('',text(n.body));if(n.kind==='canvas'){for(const [i,p] of n.stickies.entries())out.push('',`#### Ideia ${i+1}`,text((p.imageId?'[[imagem:'+p.imageId+']] ':'')+p.text));for(const c of n.connections||[])out.push(`Conexão: ideia ${n.stickies.findIndex(p=>p.id===c.from)+1} ↔ ideia ${n.stickies.findIndex(p=>p.id===c.to)+1}.`);}}}
  const workspace=(item)=>{
    const sp=item.space;if(!sp&&!item.visual&&!item.cover)return;
    out.push('',`### Espaço de ${heading(item.title)}`);
    if(sp?.description)out.push('',text(sp.description));
    if(item.cover)out.push(`Capa: ${heading(item.cover.fileName)} · SHA-256: ${item.cover.sha256}`);
    for(const t of sp?.topics||[])out.push('',`#### Tópico: ${heading(t.title)}`,text(t.body));
    for(const img of sp?.images||[]){out.push('',`#### Imagem: ${heading(img.title||img.fileName)}`,`Referência: [[imagem:${img.id}]] · Arquivo: ${heading(img.fileName)} · SHA-256: ${img.sha256}`);for(const [k,label] of [['group','Grupo'],['caption','Legenda da fonte'],['alt','Descrição acessível'],['source','Origem / página'],['comment','Meu comentário']])if(img[k])out.push(`${label}: ${text(img[k])}`);}
    for(const m of sp?.materials||[]){const ref=m.documentId?get('documents',m.documentId):m.discoveryId?get('discoveries',m.discoveryId):null;out.push('',`#### Material: ${link(m.title,m.url||ref?.url)}`);if(m.sha256||ref?.sha256)out.push(`Arquivo: ${heading(m.fileName||ref.fileName)} · SHA-256: ${m.sha256||ref.sha256}`);if(m.comment)out.push(text(m.comment));}
    if(item.visual){out.push('','#### Quadro visual');for(const p of item.visual.stickies)out.push('',`- ${p.imageId?'[[imagem:'+p.imageId+']] ':''}${text(p.text)}`);for(const c of item.visual.connections||[])out.push(`Conexão: ${c.from} ↔ ${c.to}`);}
  };
  for(const item of [...books,...notes])workspace(item);
  if([...books,...notes].some(i=>i.cover||i.space?.images?.length||i.space?.materials?.some(m=>m.sha256)))out.push('','Arquivos locais não estão incorporados neste Markdown. Use o backup completo para transferir os originais, ou baixe cada arquivo na galeria / materiais. Referências e SHA-256 identificam os arquivos correspondentes.');
  if(sessions.length){out.push('','## Sessões de estudo');for(const s of sessions){out.push('',`### ${heading(s.date)} · ${s.minutes} min`);context(s);if(s.summary)out.push('',text(s.summary));if(s.next)out.push('',`Próximo passo: ${text(s.next)}`);}}
  if(!notes.length&&!sessions.length&&!materials.length&&!documents.length&&!discoveries.length&&!books.length)out.push('','Nenhum registro encontrado neste recorte.');
  return out.join('\n')+'\n';
}
