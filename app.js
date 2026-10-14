import {STORAGE_KEY,uid,today,createInitial,safeUrl,timerElapsed,pauseTimer,percentages,readState,writeState,validateState,DEFAULT_DIVISIONS,divisionFor,dictionarySnapshot,DISCOVERY_STATUSES,DISCOVERY_KINDS,makeDiscovery,discoveryConnections,timestampUrl,inspectPdf,pdfFileStore,pdfBackupFiles,decodePdfBackup} from './data.js';

const $=s=>document.querySelector(s);
const root=$('#app'),dialog=$('#editor');
const brandLogo=$('#brand-logo').innerHTML;
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nav=[['home','Meu espaço','⌂'],['areas','Áreas & conteúdos','◈'],['documents','Documentos','▧'],['discoveries','Descobertas','◇'],['board','Quadro','▤'],['books','Biblioteca','▥'],['notes','Anotações','✎'],['sessions','Sessões','◷'],['evolution','Evolução','↗'],['dictionary','Dicionário','Aa']];
let selectedDiscovery='',discoveryStatus='',noteDiscoveryFilter='';
let selectedDocument='',noteDocumentFilter='',pdfPreviewUrl='',pdfPreviewToken=0,pdfBusy=false,pendingPdfFiles=[];
let state,recovery=false,unsaved=false,view='home',selectedNote='',areaFilter='',divisionFilter='',bookFilter='',noteFilter='',query='',dictionaryCategory='',dictionaryLimit=24,evolutionPeriod='all',toastTimeout,saveCallback=null,deleteCallback=null,dragTask='',pendingImport=null;
try {state=readState(localStorage);} catch {state=createInitial();recovery=true;}
try{
  const ui=JSON.parse(sessionStorage.getItem('hub-lc:workspace')||'{}');
  if(typeof ui.selectedDocument==='string')selectedDocument=ui.selectedDocument;
  if(typeof ui.noteDocumentFilter==='string')noteDocumentFilter=ui.noteDocumentFilter;
  for(const key of ['selectedDiscovery','discoveryStatus','noteDiscoveryFilter'])if(typeof ui[key]==='string'){if(key==='selectedDiscovery')selectedDiscovery=ui[key];if(key==='discoveryStatus')discoveryStatus=ui[key];if(key==='noteDiscoveryFilter')noteDiscoveryFilter=ui[key];}
  if([...nav.map(n=>n[0]),'settings'].includes(ui.view))view=ui.view;
  for(const [key,assign] of [['selectedNote',v=>selectedNote=v],['areaFilter',v=>areaFilter=v],['divisionFilter',v=>divisionFilter=v],['bookFilter',v=>bookFilter=v],['noteFilter',v=>noteFilter=v],['query',v=>query=v],['dictionaryCategory',v=>dictionaryCategory=v]])if(typeof ui[key]==='string')assign(ui[key]);
}catch{/* A navegação pode recomeçar sem afetar os registros. */}
if(nav.some(n=>n[0]===location.hash.slice(1)))view=location.hash.slice(1);
const areaName=id=>state.areas.find(a=>a.id===id)?.name||'Sem área';
const divisionNames=()=>[...new Set([...DEFAULT_DIVISIONS,...state.areas.map(divisionFor)])];
const areaOptions=(selected='',none='Sem vínculo')=>`<option value="">${e(none)}</option>`+divisionNames().map(name=>`<optgroup label="${e(name)}">${state.areas.filter(a=>divisionFor(a)===name).map(a=>`<option value="${a.id}" ${a.id===selected?'selected':''}>${e(a.name)}</option>`).join('')}</optgroup>`).join('');
const bookName=id=>state.books.find(b=>b.id===id)?.title||'';
const materialName=id=>state.materials.find(m=>m.id===id)?.title||'';
const discoveryName=id=>state.discoveries.find(d=>d.id===id)?.title||'';
const documentName=id=>state.documents.find(d=>d.id===id)?.title||'';
const dateLabel=d=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(`${d}T12:00:00`));
const minutesLabel=m=>m>=60?`${Math.floor(m/60)}h ${Math.round(m%60)}min`:`${Math.round(m*10)/10} min`;
const clock=m=>{const s=Math.floor(m/1000);return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const button=(text,action,extra='',cls='')=>`<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;
const go=(text,to,cls='')=>`<button type="button" class="btn ${cls}" data-view="${to}">${text}</button>`;
const badge=(text,neutral=false,tone='')=>`<span class="badge ${neutral?'neutral':''} ${tone?'state-'+tone:''}">${e(text)}</span>`;
const options=(list,value,placeholder='Sem vínculo')=>`<option value="">${e(placeholder)}</option>`+list.map(x=>`<option value="${e(x.id)}" ${x.id===value?'selected':''}>${e(x.name||x.title)}</option>`).join('');
const choices=(list,value)=>list.map(x=>`<option value="${e(x)}" ${x===value?'selected':''}>${e(x||'Definir depois')}</option>`).join('');
const field=(label,name,value='',type='text',extra='')=>`<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${e(value)}" ${extra}></label>`;
const select=(label,name,content)=>`<label class="field"><span>${label}</span><select name="${name}">${content}</select></label>`;
const textfield=(label,name,value='',extra='')=>`<label class="field"><span>${label}</span><textarea name="${name}" ${extra}>${e(value)}</textarea></label>`;
const pageHead=(title,subtitle,action='',eyebrow='Seu ritmo. Seu espaço.')=>`<header class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="tagline">${subtitle}</p></div>${action}</header>`;
const empty=(title,text,action='')=>`<div class="empty"><h3>${title}</h3><p>${text}</p>${action}</div>`;
const includesQuery=text=>text.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'));

function toast(text,tone='info'){const el=$('#toast');el.textContent=text;el.dataset.tone=tone;el.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('visible'),3500);}
function save(){
  if(recovery) return false;
  state.updatedAt=new Date().toISOString();
  try{writeState(localStorage,state);unsaved=false;}
  catch{unsaved=true;toast('Não foi possível salvar no navegador. Exporte um backup para preservar suas alterações.','error');}
  updateSaveStatus();return !unsaved;
}
function updateSaveStatus(){const el=$('[data-save-status]');if(el){el.textContent=unsaved?'Alterações ainda não salvas':'Salvo neste navegador';el.dataset.state=unsaved?'warning':'success';}const warning=$('[data-storage-warning]');if(warning)warning.hidden=!unsaved;}
function appearance(){document.documentElement.dataset.theme=state.prefs.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):state.prefs.theme;document.documentElement.dataset.accent='lc';}
function render(){
  pdfPreviewToken++;
  if(pdfPreviewUrl){URL.revokeObjectURL(pdfPreviewUrl);pdfPreviewUrl='';}
  appearance();
  if(!recovery)history.replaceState(null,'','#'+view);
  try{sessionStorage.setItem('hub-lc:workspace',JSON.stringify({view,selectedNote,areaFilter,divisionFilter,bookFilter,noteFilter,query,dictionaryCategory,selectedDiscovery,discoveryStatus,noteDiscoveryFilter,selectedDocument,noteDocumentFilter}));}catch{}
  if(recovery){root.innerHTML=`<main class="recovery card"><p class="eyebrow">Seus registros primeiro</p><h1>Vamos recuperar seu espaço</h1><p>Os dados salvos não puderam ser lidos. Você pode guardar o arquivo original ou importar um backup válido.</p><div class="button-row section-gap">${button('Baixar dados originais','raw-export')}${button('Importar backup','import','','primary')}</div><input type="file" id="import-file" accept="application/json,.json" hidden><p class="note-status">Nenhum dado existente foi substituído.</p></main>`;return;}
  const title=nav.find(n=>n[0]===view)?.[1]||'Preferências';
  document.title=`Hub LC · ${title}`;
  root.innerHTML=`<div class="shell"><aside class="sidebar"><a href="#home" class="brand" data-view="home">${brandLogo}<span class="brand-tagline">UM ESPAÇO PARA DESCOBRIR</span></a><nav class="nav-group" aria-label="Navegação principal">${nav.map(([key,label,symbol])=>`<button type="button" data-view="${key}" class="${view===key?'active':''}" ${view===key?'aria-current="page"':''}><span class="nav-symbol" aria-hidden="true">${symbol}</span>${label}</button>`).join('')}</nav><div class="sidebar-footer"><nav class="nav-group" aria-label="Preferências"><button type="button" data-view="settings" class="${view==='settings'?'active':''}"><span class="nav-symbol" aria-hidden="true">⚙</span>Preferências & backup</button></nav><p>Você escolhe o caminho.<br>O hub guarda o ponto de partida.</p></div></aside><div class="workspace"><div class="topbar"><span class="crumb">Meu hub &nbsp;/&nbsp; <b>${e(title)}</b></span><span class="local-state" data-save-status></span>${view==='settings'?'':go('Preferências','settings','quiet')}${button('+ Anotação','new-note')}</div><div class="data-warning" data-storage-warning hidden><span>Há alterações ainda não salvas no navegador.</span>${button('Exportar backup','export')}</div><main id="main">${({home:home,areas:areas,documents:documents,discoveries:discoveries,board:board,books:books,notes:notes,sessions:sessions,evolution:evolution,dictionary:dictionary,settings:settings}[view]||home)()}</main></div></div><input type="file" id="import-file" accept="application/json,.json" hidden><input type="file" id="pdf-file" accept="application/pdf,.pdf" multiple hidden><input type="file" id="pdf-replace-file" accept="application/pdf,.pdf" hidden>`;
  updateSaveStatus();tick();fitCanvas();loadDocumentPreview();
}
function documentCard(d){return `<article class="card document-card"><div class="badge-row">${badge('PDF')}${d.areaId?badge(areaName(d.areaId),true):''}</div><h3>${e(d.title)}</h3><p class="muted document-filename">${e(d.fileName)} · ${(d.size/1024/1024).toFixed(1)} MB</p>${d.description?`<p class="muted discovery-excerpt">${e(d.description)}</p>`:''}<p class="note-status">${d.page?'Retomar na página '+e(d.page):'Ponto de retomada livre'} · ${state.notes.filter(n=>n.documentId===d.id&&!n.bookId).length} anotação(ões)</p><div class="card-footer">${button('Abrir documento','open-document',`data-id="${d.id}"`)}</div></article>`;}
function documents(){
  const d=state.documents.find(d=>d.id===selectedDocument);
  if(d){
    const notes=state.notes.filter(n=>n.documentId===d.id&&!n.bookId),tasks=state.tasks.filter(t=>t.documentId===d.id);
    return pageHead(e(d.title),'Leia, investigue e guarde suas próprias ideias.',button('Editar detalhes','edit-document',`data-id="${d.id}"`))+
      `<div class="row wrap document-toolbar">${button('← Todos os documentos','all-documents','','quiet')}<div class="button-row"><a class="btn" data-open-pdf target="_blank" rel="noopener noreferrer" hidden>Abrir PDF em outra aba ↗</a><a class="btn" data-document-download hidden>Baixar PDF</a></div></div><div class="document-layout"><section class="card pdf-reader"><div class="row wrap"><h2>Leitura</h2><form id="pdf-page-form" class="pdf-page-form">${field('Página de retomada','page',d.page,'number','min="1" max="1000000" step="1" placeholder="Livre"')}<button type="submit" class="btn">Guardar ponto</button></form></div><p data-pdf-status class="note-status" role="status">Abrindo arquivo…</p><iframe id="pdf-viewer" title="PDF: ${e(d.title)}" hidden></iframe><p class="note-status">Use os controles do leitor para buscar e navegar. Se a prévia não funcionar no seu navegador, abra em outra aba ou baixe o arquivo.</p><div data-pdf-repair hidden>${button('Selecionar o PDF novamente','replace-pdf',`data-id="${d.id}"`)}</div></section><aside class="document-study"><section class="card"><div class="badge-row">${badge('PDF')}${d.areaId?badge(areaName(d.areaId),true):''}</div><h2>Meu estudo</h2><p class="muted document-filename">${e(d.fileName)}</p><label class="field section-gap"><span>Objetivo, perguntas e ideias</span><textarea data-document-body="${d.id}" maxlength="200000" placeholder="O que quero entender? Que pontos merecem atenção?">${e(d.description)}</textarea></label><p class="note-status" data-document-save>Suas ideias são salvas enquanto você escreve.</p>${d.areaId?button('Ver área relacionada','filter-area',`data-id="${d.areaId}"`,'quiet'):''}</section><section class="card"><div class="row wrap"><h2>Anotações</h2>${button('+ Nota','document-note',`data-id="${d.id}"`)}</div><p class="note-status">Registre um trecho, uma dúvida ou uma reflexão com a página de referência.</p><div class="connection-list">${notes.map(n=>`<div class="connection-item"><div><strong>${e(n.title)}</strong><small>${e(n.category)}${n.page?' · Página '+e(n.page):''}</small></div>${button('Abrir','open-note',`data-id="${n.id}"`,'quiet')}</div>`).join('')}</div><div class="button-row section-gap">${button('+ Mural','document-canvas',`data-id="${d.id}"`,'quiet')}${button('Criar atividade','document-task',`data-id="${d.id}"`,'quiet')}</div>${tasks.length?`<div class="card-footer"><p class="eyebrow">No quadro</p>${tasks.map(t=>`<div class="connection-item"><strong>${e(t.title)}</strong>${button('Abrir','edit-task',`data-id="${t.id}"`,'quiet')}</div>`).join('')}</div>`:''}</section></aside></div>`;
  }
  selectedDocument='';
  const list=state.documents.filter(d=>(!areaFilter||d.areaId===areaFilter)&&includesQuery(d.title+' '+d.fileName+' '+d.description+' '+areaName(d.areaId))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  return pageHead('Documentos','Seus PDFs para estudar, analisar e retomar. Organize por assunto quando quiser.',button('+ Adicionar PDF','upload-pdf','','primary'))+
    `<section class="info-box"><p>Adicione PDFs de até 25 MB por arquivo. Eles ficam neste navegador e entram no backup completo, junto dos seus registros.</p></section><p class="note-status" id="pdf-upload-status" role="status">${pdfBusy?'Guardando PDFs…':''}</p><div class="filters section-gap"><label class="sr-only" for="query">Buscar documentos</label><input id="query" data-query value="${e(query)}" placeholder="Buscar título, arquivo ou ideia"><label class="sr-only" for="area-filter">Filtrar documentos por assunto</label><select id="area-filter" data-filter="area">${areaOptions(areaFilter,'Todos os assuntos')}</select></div>`+
    (list.length?`<div class="grid">${list.map(documentCard).join('')}</div>`:empty(state.documents.length?'Nenhum documento neste filtro':'Um lugar para seus materiais de estudo','Guarde artigos, apostilas, relatórios e outros documentos em PDF.',button('Adicionar meu primeiro PDF','upload-pdf')));
}
async function loadDocumentPreview(){
  if(view!=='documents'||!selectedDocument)return;
  const d=state.documents.find(d=>d.id===selectedDocument),token=pdfPreviewToken;
  if(!d)return;
  try{
    const blob=await pdfFileStore('get',d.sha256);if(token!==pdfPreviewToken)return;
    if(!blob)throw new Error('O arquivo não está disponível neste navegador. Selecione o PDF original para recuperá-lo.');
    pdfPreviewUrl=URL.createObjectURL(blob);
    const src=pdfPreviewUrl+'#page='+(d.page||1);
    const frame=$('#pdf-viewer');frame.src=src;frame.hidden=false;
    $('[data-pdf-status]').textContent='';
    const link=$('[data-open-pdf]');link.href=src;link.hidden=false;
    const download=$('[data-document-download]');download.href=pdfPreviewUrl;download.download=d.fileName;download.hidden=false;
  }catch(err){if(token===pdfPreviewToken){$('[data-pdf-status]').textContent=err.message;$('[data-pdf-repair]').hidden=false;}}
}
async function uploadPdfs(files,replaceId=''){
  if(pdfBusy)return;pdfBusy=true;const failures=[];let added=0,lastId='';
  const status=$('#pdf-upload-status');if(status)status.textContent='Guardando PDFs…';
  try{
    for(const file of files){
      try{
        const checked=await inspectPdf(file),existing=state.documents.find(d=>d.sha256===checked.sha256);
        if(replaceId){const d=state.documents.find(d=>d.id===replaceId);if(checked.sha256!==d.sha256)throw new Error('Selecione o PDF original deste documento para preservar a referência das páginas.');await pdfFileStore('put',d.sha256,new Blob([file],{type:'application/pdf'}));lastId=d.id;continue;}
        if(existing){await pdfFileStore('put',existing.sha256,new Blob([file],{type:'application/pdf'}));lastId=existing.id;continue;}
        const d={id:uid(),title:file.name.replace(/\.pdf$/i,'').slice(0,500)||'Documento',fileName:file.name.slice(0,500),size:checked.size,sha256:checked.sha256,areaId:areaFilter||'',description:'',page:'',createdAt:new Date().toISOString()};
        await pdfFileStore('put',d.sha256,new Blob([file],{type:'application/pdf'}));state.documents.push(d);added++;lastId=d.id;
      }catch(err){failures.push(file.name+': '+err.message);}
    }
    if(added)save();
    if(lastId){selectedDocument=lastId;view='documents';query='';}
  }finally{pdfBusy=false;render();}
  if(failures.length)toast(failures.join(' · '),'error');else if(lastId)toast(added?'PDF guardado.':'Arquivo disponível no seu acervo.','success');
}
function documentForm(id){
  const d=state.documents.find(d=>d.id===id);
  openForm('Detalhes do documento',field('Título','title',d.title,'text','required maxlength="500"')+select('Área (opcional)','areaId',areaOptions(d.areaId))+`<p class="note-status">Arquivo: ${e(d.fileName)}. Excluir o documento preserva suas notas e atividades.</p>`,f=>{d.title=f.title.trim();d.areaId=f.areaId;save();render();return true;},()=>deleteRecord('documents',id));
}
function navigate(to){selectedDocument='';noteDocumentFilter='';selectedDiscovery='';discoveryStatus='';noteDiscoveryFilter='';view=to;query='';areaFilter='';divisionFilter='';bookFilter='';noteFilter='';dictionaryCategory='';dictionaryLimit=24;render();window.scrollTo({top:0});}
function home(){
  const recentNotes=state.notes.filter(n=>!n.bookId).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,3);
  const activeColumn=state.columns[1]?.id;
  const activeTasks=state.tasks.filter(t=>t.columnId===activeColumn).slice(0,3);
  const last=state.sessions.filter(s=>!s.bookId).at(-1);
  return pageHead('O que te move hoje?','Continue uma descoberta, explore um assunto ou dê espaço a uma ideia.')+
  `<div class="hero"><section class="hero-card"><p class="eyebrow">Liberdade para começar</p><h2>Um próximo passo.<br>Do seu jeito.</h2><p>Seu espaço reúne estudos, descobertas e reflexões. Escolha o que faz sentido agora.</p><div class="button-row">${go('Explorar minhas áreas','areas')}${go('Abrir meu quadro','board','quiet')}</div></section><section class="card"><div class="row"><h2>Seu ponto de retomada</h2>${badge('Pessoal',true)}</div>${last?.next?`<p class="text-block">${e(last.next)}</p><p class="muted">${e(areaName(last.areaId))} · ${dateLabel(last.date)}</p>${go('Ver minhas sessões','sessions','quiet')}`:!state.timer.bookId&&(state.timer.running||state.timer.elapsedMs)?`<p>Você tem uma sessão ${state.timer.running?'em andamento':'pausada'}.</p><div class="metric" data-clock>${clock(timerElapsed(state.timer))}</div>${go('Voltar à sessão','sessions','quiet')}`:`<p class="muted">Ao registrar um próximo passo em uma sessão de estudo, ele aparece aqui para facilitar sua volta.</p><div class="section-gap">${go('Começar uma sessão','sessions','quiet')}</div>`}<div class="card-footer"><small>Planejamento e tempo ficam sob sua escolha.</small></div></section></div>`+
  `<section class="card"><div class="row"><h2>Ideias recentes</h2>${go('Anotações →','notes','quiet')}</div>${recentNotes.length?`<div class="list">${recentNotes.map(n=>`<div class="list-item"><div><strong>${e(n.title)}</strong><span class="muted">${n.kind==='canvas'?'Mural de ideias':e(n.category)}</span></div>${button('Abrir','open-note',`data-id="${n.id}"`,'quiet')}</div>`).join('')}</div>`:`<p class="muted">Uma pergunta ou uma reflexão. Guarde uma ideia antes que ela passe.</p>${button('Escrever uma nota','new-note','','quiet')}`}</section>`+
  `<div class="section-title"><h2>Atividades em andamento</h2>${go('Ver quadro →','board','quiet')}</div>${activeTasks.length?`<div class="grid three">${activeTasks.map(t=>`<article class="card">${badge(areaName(t.areaId))}<h3 style="margin-top:12px">${e(t.title)}</h3><p class="muted">${e(t.kind)}</p><div class="section-gap">${button('Abrir atividade','edit-task',`data-id="${t.id}"`,'quiet')}</div></article>`).join('')}</div>`:empty('Seu próximo passo pode ser pequeno','Adicione uma atividade ou comece explorando um dos seus interesses.',button('+ Nova atividade','new-task'))}`;
}
function areas(){
  const selectedArea=state.areas.find(a=>a.id===areaFilter);
  if(selectedArea)divisionFilter=divisionFor(selectedArea);
  const names=divisionNames();
  const divisionOfMaterial=m=>m.areaId?divisionFor(state.areas.find(a=>a.id===m.areaId)):'Outros';
  const matches=m=>includesQuery(m.title+' '+m.description+' '+areaName(m.areaId)+' '+divisionOfMaterial(m));
  const card=m=>`<article class="card material-card"><div class="badge-row">${badge(areaName(m.areaId))}${badge(m.kind,true)}</div><h3>${m.url?`<a class="material-link" href="${e(safeUrl(m.url))}" target="_blank" rel="noopener noreferrer">${e(m.title)} ↗</a>`:e(m.title)}</h3>${m.description?`<p class="muted text-block">${e(m.description)}</p>`:''}<div class="card-footer button-row">${button('Anotar','material-note',`data-id="${m.id}"`,'quiet')}${button('Editar','edit-material',`data-id="${m.id}"`,'quiet')}</div></article>`;
  const group=(name)=>{
    const allAreas=state.areas.filter(a=>divisionFor(a)===name&&(!areaFilter||a.id===areaFilter));
    const pdfs=state.documents.filter(d=>allAreas.some(a=>a.id===d.areaId)&&(!query||includesQuery(d.title+' '+d.description+' '+d.fileName+' '+name+' '+areaName(d.areaId))));
    const related=state.discoveries.filter(d=>[...connectionsFor(d).confirmed,...connectionsFor(d).suggested.map(s=>s.area)].some(a=>allAreas.some(x=>x.id===a.id))&&(!query||includesQuery(discoveryText(d)+' '+name+' '+allAreas.map(a=>a.name).join(' '))));
    const materials=state.materials.filter(m=>divisionOfMaterial(m)===name&&(!areaFilter||m.areaId===areaFilter)&&matches(m));
    const visibleAreas=allAreas.filter(a=>includesQuery(a.name+' '+a.description+' '+name)||materials.some(m=>m.areaId===a.id));
    if(query&&!visibleAreas.length&&!materials.length&&!related.length&&!pdfs.length)return '';
    return `<section class="division-section" aria-label="${e(name)}"><div class="section-title"><h2>${e(name)}</h2><span class="count">${materials.length} conteúdo(s)</span></div>${visibleAreas.length?`<div class="grid three">${visibleAreas.map(a=>`<section class="card area-card"><p class="eyebrow">${e(name)} · Área</p><h3>${e(a.name)}</h3>${a.description?`<p class="muted">${e(a.description)}</p>`:''}<span class="count">${state.materials.filter(m=>m.areaId===a.id).length} conteúdo(s)</span><div class="button-row">${button('Explorar','filter-area',`data-id="${a.id}"`,'quiet')}${button('Editar','edit-area',`data-id="${a.id}"`,'quiet')}</div></section>`).join('')}</div>`:''}${[...visibleAreas.map(a=>({id:a.id,name:a.name})),...(!areaFilter&&materials.some(m=>!m.areaId)?[{id:'',name:'Sem área'}]:[])].map(a=>{const list=materials.filter(m=>m.areaId===a.id);return list.length?`<div class="section-title"><h3>${e(a.name)} · conteúdos</h3></div><div class="grid">${list.map(card).join('')}</div>`:'';}).join('')}${!query&&!materials.length?empty('Seu espaço para '+e(name),'Adicione uma referência para começar a organizar os conteúdos desta divisão.',button('Adicionar conteúdo','new-material')):''}${pdfs.length?`<div class="section-title"><h3>Documentos para estudo</h3></div><div class="grid">${pdfs.map(documentCard).join('')}</div>`:''}${related.length?`<div class="section-title"><h3>Descobertas relacionadas</h3></div><p class="note-status">Links do seu acervo. As possíveis conexões são sugestões pelo que você registrou.</p><div class="grid section-gap">${related.map(d=>discoveryCard(d,allAreas.map(a=>a.id))).join('')}</div>`:''}</section>`;
  };
  const groups=(divisionFilter?[divisionFilter]:names).map(group).join('');
  const overview=!divisionFilter&&!query;
  return pageHead('Áreas & conteúdos','Escolha uma divisão e explore seus assuntos, com cada conteúdo no seu lugar.',`<div class="button-row">${button('+ Nova área','new-area')}${button('+ Conteúdo','new-material','','primary')}</div>`)+
    `<div class="filters"><label class="sr-only" for="query">Buscar áreas ou conteúdos</label><input id="query" data-query placeholder="Buscar áreas ou conteúdos" value="${e(query)}"><label class="sr-only" for="division-filter">Filtrar por divisão</label><select id="division-filter" data-filter="division"><option value="">Todas as divisões</option>${choices(names,divisionFilter)}</select>${divisionFilter?`<label class="sr-only" for="area-filter">Filtrar por área</label><select id="area-filter" data-filter="area">${options(state.areas.filter(a=>divisionFor(a)===divisionFilter),areaFilter,'Todas as áreas')}</select>`:''}</div>`+
    (overview?`<div class="grid division-grid">${names.filter(name=>name!=='Outros'||state.areas.some(a=>divisionFor(a)===name)||state.materials.some(m=>!m.areaId)).map(name=>{const list=state.areas.filter(a=>divisionFor(a)===name);return `<section class="card division-card"><p class="eyebrow">Divisão</p><h2>${e(name)}</h2><p class="muted">${e(list.map(a=>a.name).join(' · ')||'Um espaço aberto para novos assuntos.')}</p><span class="count">${list.length} área(s) · ${state.materials.filter(m=>divisionOfMaterial(m)===name).length} conteúdo(s)</span><div class="card-footer">${button('Abrir divisão','open-division',`data-division="${e(name)}"`,'primary')}</div></section>`;}).join('')}</div>`:`${divisionFilter?button('← Todas as divisões','all-divisions','','quiet'):''}${groups||empty('Nenhum resultado encontrado','Tente outra busca ou escolha uma divisão diferente.')}`);
}
const discoveryText=d=>[d.title,d.description,...d.tags,...d.points.map(p=>p.text),...state.notes.filter(n=>n.discoveryId===d.id&&!n.bookId).map(n=>n.title+' '+n.body)].join(' ');
const connectionsFor=d=>discoveryConnections(d,state.areas,state.notes);
function discoveryCard(d,contextAreaIds=[]){
  const c=connectionsFor(d),indirect=contextAreaIds.length&&!c.confirmed.some(a=>contextAreaIds.includes(a.id));
  return `<article class="card discovery-card"><div class="badge-row">${badge(d.kind)}${badge(d.status,true)}${indirect?badge('Possível conexão',false,'info'):''}</div><h3>${e(d.title)}</h3><p class="discovery-source">${e(new URL(d.url).hostname.replace(/^www\./,''))}</p>${d.description?`<p class="muted discovery-excerpt">${e(d.description)}</p>`:''}<div class="badge-row section-gap">${c.confirmed.map(a=>badge(a.name)).join('')}${!c.confirmed.length&&c.suggested.length?badge('Sugestão: '+c.suggested[0].area.name,true):''}${d.tags.slice(0,4).map(t=>badge('#'+t,true)).join('')}</div><p class="count">${d.points.length} ponto(s) importante(s) · ${state.notes.filter(n=>n.discoveryId===d.id&&!n.bookId).length} anotação(ões)</p><div class="card-footer button-row">${button('Abrir descoberta','open-discovery',`data-id="${d.id}"`)}<a class="btn quiet" href="${e(d.url)}" target="_blank" rel="noopener noreferrer">Abrir fonte ↗</a></div></article>`;
}
function discoveryConnectionsPanel(d){
  const c=connectionsFor(d);
  return `<section class="card"><div class="row wrap"><h2>Conexões com temas</h2>${button('Organizar','edit-discovery',`data-id="${d.id}"`,'quiet')}</div><p class="muted">Uma descoberta pode conversar com mais de um assunto.</p>${c.confirmed.length?`<div class="connection-list">${c.confirmed.map(a=>`<div class="connection-item"><div><small>${e(divisionFor(a))}</small><strong>${e(a.name)}</strong></div>${button('Ver área','filter-area',`data-id="${a.id}"`,'quiet')}</div>`).join('')}</div>`:'<p class="note-status">Você ainda não vinculou temas. Pode organizar depois.</p>'}${c.suggested.length?`<div class="card-footer"><p class="eyebrow">Pode ter relação</p><p class="note-status">Sugestões pelo título, palavras-chave e suas anotações. Confirme as que fazem sentido.</p><div class="connection-list">${c.suggested.slice(0,6).map(({area,reason})=>`<div class="connection-item"><div><strong>${e(area.name)}</strong><small>${e(reason)}</small></div>${button('Vincular','link-discovery-area',`data-id="${d.id}" data-area="${area.id}"`,'quiet')}</div>`).join('')}</div></div>`:''}</section><section class="card"><h2>No seu dicionário</h2><p class="muted">Termos encontrados no que você registrou.</p>${c.terms.length?`<div class="connection-list">${c.terms.slice(0,8).map(t=>`<div class="connection-item"><div><strong>${e(t.word)}</strong><small>${e(t.category)}</small></div>${button('Consultar','discovery-term',`data-word="${e(t.word)}"`,'quiet')}</div>`).join('')}</div>`:'<p class="note-status">Quando aparecer um termo do Dicionário DEV no seu texto, ele será listado aqui.</p>'}</section>`;
}
function discoveryDetail(d){
  const linkedNotes=state.notes.filter(n=>n.discoveryId===d.id&&!n.bookId),linkedTasks=state.tasks.filter(t=>t.discoveryId===d.id);
  return pageHead(e(d.title),'Guarde o que chamou sua atenção e conecte suas ideias.',`<div class="button-row"><a class="btn primary" href="${e(d.url)}" target="_blank" rel="noopener noreferrer">Abrir fonte ↗</a>${button('Editar','edit-discovery',`data-id="${d.id}"`)}</div>`)+
    `<div class="row wrap discovery-meta">${button('← Todas as descobertas','all-discoveries','','quiet')}<div class="badge-row">${badge(d.kind)}${badge(d.status,true)}${d.tags.map(t=>badge('#'+t,true)).join('')}</div></div>`+
    `<div class="discovery-layout"><div class="discovery-main"><section class="card"><h2>O que chamou minha atenção</h2><label class="sr-only" for="discovery-body">Ideias sobre ${e(d.title)}</label><textarea id="discovery-body" data-discovery-body="${d.id}" maxlength="200000" placeholder="Uma ideia, uma pergunta, algo que quero experimentar…">${e(d.description)}</textarea><p class="note-status" data-discovery-save>${unsaved?'Alterações ainda não salvas':'Seu texto é salvo enquanto você escreve.'}</p></section><section class="card"><div class="row wrap"><h2>Pontos importantes</h2>${button('+ Ponto','new-discovery-point',`data-id="${d.id}"`)}</div><p class="muted">Guarde trechos, ideias e o momento em que aparecem.</p>${d.points.length?`<div class="point-list">${d.points.map(p=>`<article class="discovery-point"><div class="row wrap">${badge(p.position||'Sem marcação',true)}${button('Editar ponto','edit-discovery-point',`data-id="${d.id}" data-point="${p.id}"`,'quiet')}</div><p class="text-block">${e(p.text)}</p>${p.position?`<a class="point-source" href="${e(timestampUrl(d.url,p.position))}" target="_blank" rel="noopener noreferrer">${timestampUrl(d.url,p.position)!==safeUrl(d.url)?'Abrir nesse momento':'Abrir fonte'} ↗</a>`:''}</article>`).join('')}</div>`:'<p class="note-status">Ex.: 08:42 — uma explicação que quero revisitar. No YouTube, o link abre nesse momento.</p>'}</section><section class="card"><div class="row wrap"><h2>Desenvolver a ideia</h2>${button('+ Anotação','discovery-note',`data-id="${d.id}"`)}</div><p class="muted">Escreva uma reflexão, uma dúvida ou crie um mural ligado a esta descoberta.</p>${linkedNotes.length?`<div class="connection-list">${linkedNotes.map(n=>`<div class="connection-item"><div><strong>${e(n.title)}</strong><small>${e(n.kind==='canvas'?'Mural':n.category)}</small></div>${button('Abrir','open-note',`data-id="${n.id}"`,'quiet')}</div>`).join('')}</div>`:''}<div class="button-row section-gap">${button('+ Mural','discovery-canvas',`data-id="${d.id}"`,'quiet')}${button('Criar atividade','discovery-task',`data-id="${d.id}"`,'quiet')}</div>${linkedTasks.length?`<div class="card-footer"><p class="eyebrow">No seu quadro</p><div class="connection-list">${linkedTasks.map(t=>`<div class="connection-item"><strong>${e(t.title)}</strong>${button('Abrir atividade','edit-task',`data-id="${t.id}"`,'quiet')}</div>`).join('')}</div></div>`:''}</section></div><aside class="discovery-side" id="discovery-connections">${discoveryConnectionsPanel(d)}</aside></div>`;
}
function discoveries(){
  const d=state.discoveries.find(d=>d.id===selectedDiscovery);
  if(d)return discoveryDetail(d);
  selectedDiscovery='';
  const list=state.discoveries.filter(d=>(!discoveryStatus||d.status===discoveryStatus)&&includesQuery(discoveryText(d))&&(!areaFilter||[...connectionsFor(d).confirmed,...connectionsFor(d).suggested.map(s=>s.area)].some(a=>a.id===areaFilter))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  return pageHead('Descobertas','Links que despertaram sua curiosidade. Salve agora, conecte as ideias aos poucos.','', 'Seu acervo de ideias')+
    `<section class="card capture-card"><div><h2>Encontrei algo interessante</h2><p class="muted">Comece pelo link. O resto pode vir depois.</p></div><form id="capture-form"><div class="capture-fields">${field('Link do conteúdo','url','','url','required maxlength="4000" placeholder="https://…"')}${field('Título (opcional)','title','','text','maxlength="500" placeholder="Como quero lembrar deste conteúdo"')}</div><details class="capture-extra"><summary>Registrar uma primeira ideia</summary>${textfield('O que chamou sua atenção?','description','','maxlength="200000" placeholder="Uma ideia que quero guardar…"')}</details><div class="row wrap"><p class="error" data-capture-error role="alert"></p><button class="btn primary" type="submit">Salvar link</button></div></form></section>`+
    `<div class="section-title"><h2>Meu acervo</h2><span class="count">${list.length} descoberta(s)</span></div><div class="filters"><label class="sr-only" for="query">Buscar descobertas</label><input id="query" data-query placeholder="Buscar título, ideia ou palavra-chave" value="${e(query)}"><label class="sr-only" for="discovery-status">Filtrar por situação</label><select id="discovery-status" data-filter="discovery-status"><option value="">Todas as situações</option>${choices(DISCOVERY_STATUSES,discoveryStatus)}</select><label class="sr-only" for="area-filter">Filtrar por tema</label><select id="area-filter" data-filter="area">${areaOptions(areaFilter,'Todos os temas')}</select></div>`+
    (list.length?`<div class="grid">${list.map(d=>discoveryCard(d)).join('')}</div>`:empty(state.discoveries.length?'Nenhuma descoberta nesse filtro':'Uma boa ideia merece um lugar','Salve um vídeo, artigo ou podcast. Depois registre o que ele despertou e conecte aos seus assuntos.'));
}
function discoveryForm(id){
  const d=state.discoveries.find(d=>d.id===id);
  openForm('Editar descoberta',field('Título','title',d.title,'text','required maxlength="500"')+field('Link','url',d.url,'url','required maxlength="4000"')+`<div class="form-grid">${select('Formato','kind',choices(DISCOVERY_KINDS,d.kind))}${select('Situação','status',choices(DISCOVERY_STATUSES,d.status))}</div>`+field('Palavras-chave (separadas por vírgula)','tags',d.tags.join(', '),'text','maxlength="3000" placeholder="memória, aprendizado, hábitos"')+`<fieldset class="theme-picker"><legend>Temas relacionados (opcional)</legend><p class="note-status">Selecione quantos fizerem sentido. O conteúdo continua no seu acervo.</p>${divisionNames().map(name=>{const list=state.areas.filter(a=>divisionFor(a)===name);return list.length?`<div class="theme-group"><strong>${e(name)}</strong>${list.map(a=>`<label class="checkbox"><input type="checkbox" name="area-${a.id}" ${d.areaIds.includes(a.id)?'checked':''}> ${e(a.name)}</label>`).join('')}</div>`:'';}).join('')}</fieldset>`,f=>{
    const url=safeUrl(f.url);if(!url)throw new Error('Use um endereço HTTP ou HTTPS válido.');
    if(state.discoveries.some(x=>x.id!==id&&x.url===url))throw new Error('Este link já está salvo em outra descoberta.');
    const tags=[...new Set(f.tags.split(',').map(t=>t.trim()).filter(Boolean))];
    if(tags.length>30||tags.some(t=>t.length>100))throw new Error('Use até 30 palavras-chave, com até 100 caracteres cada.');
    Object.assign(d,{title:f.title.trim(),url,kind:f.kind,status:f.status,tags,areaIds:state.areas.filter(a=>f['area-'+a.id]).map(a=>a.id),updatedAt:new Date().toISOString()});save();render();return true;
  },()=>deleteRecord('discoveries',id));
}
function discoveryPointForm(discoveryId,pointId){
  const d=state.discoveries.find(d=>d.id===discoveryId),p=d.points.find(p=>p.id===pointId)||{id:uid(),position:'',text:''};
  if(!pointId&&d.points.length>=200){toast('Esta descoberta já tem 200 pontos registrados.');return;}
  openForm(pointId?'Editar ponto importante':'Novo ponto importante',field('Momento ou referência (opcional)','position',p.position,'text','maxlength="50" placeholder="08:42, 1:02:10 ou final do vídeo"')+textfield('O que quero guardar','text',p.text,'required maxlength="20000"'),f=>{
    if(!f.text.trim())throw new Error('Escreva o ponto que quer guardar.');
    const next={id:p.id,position:f.position.trim(),text:f.text.trim()},index=d.points.findIndex(x=>x.id===p.id);
    if(index<0)d.points.push(next);else d.points[index]=next;
    d.updatedAt=new Date().toISOString();save();render();return true;
  },pointId?()=>confirmAction('Excluir ponto?',`Excluir este ponto de “${e(d.title)}”?`,()=>{d.points=d.points.filter(x=>x.id!==pointId);d.updatedAt=new Date().toISOString();save();render();},'Excluir'):null);
}
function board(){
  return pageHead('Seu quadro de estudos','Transforme interesses em ações. Mova, ajuste e retome quando quiser.',`<div class="button-row">${button('Organizar colunas','columns')}${button('+ Atividade','new-task','','primary')}</div>`)+
  `<div class="filters"><label class="sr-only" for="query">Buscar atividades</label><input id="query" data-query placeholder="Buscar atividades" value="${e(query)}"><label class="sr-only" for="area-filter">Filtrar atividades por área</label><select id="area-filter" data-filter="area">${options(state.areas,areaFilter,'Todas as áreas')}</select></div><div class="board">${state.columns.map(c=>{const tasks=state.tasks.filter(t=>t.columnId===c.id&&(!areaFilter||t.areaId===areaFilter)&&includesQuery(t.title+' '+t.details));return `<section class="column ${/^conclu[ií]d[oa]s?$/i.test(c.name.trim())?'completed-column':''}" data-column="${c.id}" aria-label="${e(c.name)}"><div class="column-head"><span>${e(c.name)}</span><span class="count">${tasks.length}</span></div>${tasks.map(t=>`<article class="task" draggable="true" data-task="${t.id}">${badge(areaName(t.areaId))}<button type="button" class="task-edit" data-action="edit-task" data-id="${t.id}"><h3>${e(t.title)}</h3></button>${t.documentId?button('Ver documento','open-document',`data-id="${t.documentId}"`,'quiet'):''}${t.discoveryId?button('Ver descoberta','open-discovery',`data-id="${t.discoveryId}"`,'quiet'):''}<small>${e(t.kind)}${t.duration?` · ${e(t.duration)} min desejados`:''}</small>${t.due?`<small>Prazo escolhido: ${dateLabel(t.due)}</small>`:''}<select data-task-column="${t.id}" aria-label="Mover ${e(t.title)}">${state.columns.map(x=>`<option value="${x.id}" ${x.id===t.columnId?'selected':''}>${e(x.name)}</option>`).join('')}</select></article>`).join('')}${tasks.length?'':`<small>Espaço para um próximo passo.</small>`}</section>`;}).join('')}</div><p class="note-status">Arraste os cartões ou use o seletor de coluna em cada atividade.</p>`;
}
function books(){
  const list=state.books.filter(b=>(!bookFilter||b.status===bookFilter)&&includesQuery(b.title+' '+b.author));
  return pageHead('Sua biblioteca','Livros físicos, ideias que ficam. Guarde o ponto e volte quando quiser.',button('+ Livro','new-book','','primary'))+
  `<div class="filters"><label class="sr-only" for="query">Buscar livros</label><input id="query" data-query placeholder="Buscar título ou autor" value="${e(query)}"><label class="sr-only" for="book-filter">Filtrar por leitura</label><select id="book-filter" data-filter="book"><option value="">Todas as leituras</option>${choices(['Quero ler','Lendo','Pausado','Lido'],bookFilter)}</select></div>`+
  `${list.length?`<div class="grid">${list.map(b=>{const noteCount=state.notes.filter(n=>n.bookId===b.id).length;return `<article class="card book"><div class="book-spine" aria-hidden="true">${e(b.title[0])}</div><div class="book-body"><div class="badge-row">${badge(b.status||'Status livre',!b.status,b.status==='Lido'?'success':b.status==='Pausado'?'warning':b.status==='Lendo'?'info':'')}${b.areaId?badge(areaName(b.areaId),true):''}</div><h2>${e(b.title)}</h2><p>${e(b.author||'Autor não informado')}</p><div class="muted">${b.page!==''?`Retomar na página <strong>${e(b.page)}</strong>`:b.chapter?`Retomar em ${e(b.chapter)}`:'Ponto de retomada a definir'}${b.page!==''&&b.chapter?` · ${e(b.chapter)}`:''}</div>${b.total!==''&&b.page!==''?`<progress class="book-progress" max="${e(b.total)}" value="${e(b.page)}" aria-label="Progresso de leitura de ${e(b.title)}"></progress><small>${Math.round(Number(b.page)/Number(b.total)*100)}% das páginas · ${e(b.page)} de ${e(b.total)}</small>`:''}<div class="card-footer button-row">${button('Ajustar leitura','edit-book',`data-id="${b.id}"`)}${button('+ Registro','book-note',`data-id="${b.id}"`,'quiet')}${noteCount?button(`${noteCount} registro(s)`,'book-notes',`data-id="${b.id}"`,'quiet'):''}</div></div></article>`;}).join('')}</div>`:empty('Uma leitura pode abrir um caminho','Cadastre um livro que esteja lendo ou que queira conhecer.',button('Adicionar livro','new-book'))}`;
}
function notes(){
  const list=state.notes.filter(n=>(!noteFilter||n.bookId===noteFilter)&&(!noteDocumentFilter||n.documentId===noteDocumentFilter)&&(!noteDiscoveryFilter||n.discoveryId===noteDiscoveryFilter)&&includesQuery(n.title+' '+n.body)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  let n=list.find(x=>x.id===selectedNote);if(!n){n=list[0];selectedNote=n?.id||'';}
  const content=n?`<article class="card note-editor"><div class="editor-top"><div><div class="badge-row">${badge(n.kind==='canvas'?'Mural de ideias':n.category)}${n.areaId?badge(areaName(n.areaId),true):''}</div><h2>${e(n.title)}</h2></div>${button('Detalhes','edit-note',`data-id="${n.id}"`)}</div>${n.bookId||n.materialId||n.page?`<div class="note-meta">${e(bookName(n.bookId)||materialName(n.materialId))}${n.page?' · Página '+e(n.page):''}</div>`:''}${n.discoveryId?`<div class="note-meta">Origem: ${button(discoveryName(n.discoveryId),'open-discovery',`data-id="${n.discoveryId}"`,'quiet')}</div>`:''}${n.documentId?`<div class="note-meta">Documento: ${button(documentName(n.documentId),'open-document',`data-id="${n.documentId}"`,'quiet')}</div>`:''}${n.kind==='text'?`<label class="sr-only" for="note-body">Texto de ${e(n.title)}</label><textarea id="note-body" class="document" data-note-body="${n.id}" maxlength="200000" placeholder="Escreva do seu jeito. Uma ideia, uma pergunta, uma reflexão…">${e(n.body)}</textarea>`:`<div class="row wrap section-gap"><small>Arraste pelo topo. Use as setas para mover pelo teclado.</small>${button('+ Post-it','new-sticky',`data-id="${n.id}"`)}</div><div class="canvas" data-canvas="${n.id}" aria-label="Mural de ${e(n.title)}">${n.stickies.map(p=>`<article class="sticky" data-sticky="${p.id}" data-tone="${p.tone}" style="left:${p.x}%;top:${p.y}%"><header data-drag-sticky="${p.id}"><span>Ideia</span><div class="sticky-controls"><button type="button" data-action="tone-sticky" data-id="${p.id}" aria-label="Mudar cor do post-it">◐</button><button type="button" data-action="remove-sticky" data-id="${p.id}" aria-label="Remover post-it">×</button></div></header><textarea data-sticky-text="${p.id}" aria-label="Texto do post-it" maxlength="20000" placeholder="Uma ideia…">${e(p.text)}</textarea><div class="sticky-controls">${[['←',-1,0],['→',1,0],['↑',0,-1],['↓',0,1]].map(([label,x,y])=>`<button type="button" data-action="move-sticky" data-id="${p.id}" data-x="${x}" data-y="${y}" aria-label="Mover post-it ${label}">${label}</button>`).join('')}</div></article>`).join('')}</div>`}<p class="note-status" data-note-status>${unsaved?'Alterações ainda não salvas':'Suas palavras estão salvas neste navegador.'}</p></article>`:empty('Dê espaço às suas ideias','Escreva uma nota ou espalhe pensamentos em um mural.',`<div class="button-row" style="justify-content:center">${button('+ Nota','new-note')}${button('+ Mural','new-canvas')}</div>`);
  return pageHead('Seu espaço de anotações','Escreva em sequência ou pense fora das linhas.',`<div class="button-row">${button('+ Mural','new-canvas')}${button('+ Nota','new-note','','primary')}</div>`)+
  `<div class="filters"><label class="sr-only" for="query">Buscar anotações</label><input id="query" data-query placeholder="Buscar anotações" value="${e(query)}"><label class="sr-only" for="note-filter">Filtrar por livro</label><select id="note-filter" data-filter="note">${options(state.books,noteFilter,'Todas as anotações')}</select><label class="sr-only" for="note-discovery-filter">Filtrar por descoberta</label><select id="note-discovery-filter" data-filter="note-discovery">${options(state.discoveries,noteDiscoveryFilter,'Todas as descobertas')}</select><label class="sr-only" for="note-document-filter">Filtrar por documento</label><select id="note-document-filter" data-filter="note-document">${options(state.documents,noteDocumentFilter,'Todos os documentos')}</select></div><div class="note-workspace"><aside class="note-list" aria-label="Suas anotações">${list.map(x=>`<button type="button" data-action="open-note" data-id="${x.id}" class="${x.id===selectedNote?'active':''}" ${x.id===selectedNote?'aria-current="true"':''}><strong>${e(x.title)}</strong><small>${x.kind==='canvas'?'Mural':e(x.category)}${x.bookId?' · '+e(bookName(x.bookId)):''}</small></button>`).join('')}</aside>${content}</div>`;
}
function sessions(){
  const t=state.timer;
  return pageHead('Um espaço para se dedicar','Estude livremente. Se quiser registrar o tempo, o cronômetro está aqui.',button('Registrar manualmente','new-session'))+
  `<div class="timer-layout"><section class="card timer-card"><h2>Sua sessão</h2><p class="muted">Tempo e duração são escolhas suas.</p><div class="section-gap">${select('Área (opcional)','timer-area',areaOptions(t.areaId))}${select('Livro (opcional)','timer-book',options(state.books,t.bookId))}${field('Duração desejada em minutos (opcional)','timer-target',t.targetMinutes,'number','min="1" max="1000000" placeholder="Sem duração definida"')}</div><div class="timer-clock" data-clock aria-label="Tempo registrado">${clock(timerElapsed(t))}</div><p class="timer-hint" data-timer-hint>${t.running?'Sessão em andamento':t.elapsedMs?'Sessão pausada':'O cronômetro começa só quando você quiser.'}</p><div class="button-row">${t.running?button('Pausar','pause-timer'):button(t.elapsedMs?'Continuar':'Iniciar','start-timer','','primary')}${button('Encerrar e registrar','finish-timer','',t.running||t.elapsedMs?'':'quiet')}${t.running||t.elapsedMs?button('Descartar tempo','discard-timer','','quiet'):''}</div><p class="note-status">Pausas não entram no tempo registrado. A duração escolhida não encerra sua sessão.</p></section><section><div class="row" style="margin-bottom:16px"><h2>Seu histórico</h2><small>${state.sessions.length} registro(s)</small></div>${state.sessions.length?`<div class="list">${[...state.sessions].reverse().map(s=>`<article class="card" style="margin-bottom:14px"><div class="row wrap"><div class="badge-row">${badge(areaName(s.areaId))}${s.bookId?badge(bookName(s.bookId),true):''}</div>${button('Editar','edit-session',`data-id="${s.id}"`,'quiet')}</div><h3>${minutesLabel(s.minutes)} · ${dateLabel(s.date)}</h3>${s.summary?`<p class="text-block">${e(s.summary)}</p>`:''}${s.next?`<div class="card-footer"><small>Próximo passo</small><p class="text-block">${e(s.next)}</p></div>`:''}</article>`).join('')}</div>`:empty('O histórico começa quando fizer sentido','Você pode usar todas as outras áreas sem registrar uma sessão.')}</section></div>`;
}
function evolution(){
  const cutoff=new Date();cutoff.setHours(0,0,0,0);if(evolutionPeriod!=='all')cutoff.setDate(cutoff.getDate()-Number(evolutionPeriod)+1);
  const filtered=state.sessions.filter(s=>!s.bookId&&(evolutionPeriod==='all'||new Date(`${s.date}T12:00:00`)>=cutoff));
  const total=filtered.reduce((sum,s)=>sum+s.minutes,0),parts=percentages(filtered);
  const studyNotes=state.notes.filter(n=>!n.bookId);
  return pageHead('Veja o caminho percorrido','Acompanhe a dedicação aos seus assuntos de estudo e suas descobertas.',button(state.prefs.showMetrics?'Ocultar métricas':'Mostrar métricas','toggle-metrics'))+
  `<div class="filters"><label for="period">Período</label><select id="period" data-period>${[['all','Todo o histórico'],['7','Últimos 7 dias'],['30','Últimos 30 dias']].map(([v,label])=>`<option value="${v}" ${evolutionPeriod===v?'selected':''}>${label}</option>`).join('')}</select></div>`+
  `${state.prefs.showMetrics?filtered.length?`<div class="grid"><section class="card"><small>Dedicação registrada</small><div class="metric">${minutesLabel(total)}</div><p class="muted">Em ${filtered.length} sessão(ões), no período escolhido.</p></section><section class="card"><h2>Tempo por área</h2>${parts.map(p=>`<div class="bar-row"><span>${e(areaName(p.areaId))}</span><div class="bar-track"><div class="bar-fill" style="width:${p.percent}%"></div></div><span>${Math.round(p.percent*10)/10}%</span></div>`).join('')}<small>Distribuição do seu histórico, sem proporções esperadas.</small></section></div>`:empty('Ainda não há tempo registrado neste período','Se quiser acompanhar dedicação, registre uma sessão. Suas anotações já podem contar seu percurso.'):`<div class="info-box">Métricas ocultas por sua escolha. Seus registros continuam disponíveis.</div>`}`+
  `<div class="section-title"><h2>Registros do seu percurso</h2></div><div class="grid"><section class="card"><h2>Ideias guardadas</h2><p class="muted">${studyNotes.length?`${studyNotes.length} anotação(ões) de estudo, entre perguntas, reflexões e murais.`:'Notas, dúvidas e reflexões podem mostrar como suas ideias mudam.'}</p>${go('Revisitar minhas notas','notes','quiet')}</section><section class="card"><h2>Atividades</h2><p class="muted">${state.tasks.filter(t=>t.columnId===state.columns.at(-1)?.id).length} atividade(s) na última coluna do quadro.</p>${go('Meu quadro','board','quiet')}</section></div>`;
}
function dictionary(){
  const linkedDiscoveries=state.discoveries.map(d=>({discovery:d,terms:connectionsFor(d).terms}));
  const categories=[...new Set(dictionarySnapshot.terms.map(t=>t.category))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const terms=dictionarySnapshot.terms.filter(t=>(!dictionaryCategory||t.category===dictionaryCategory)&&includesQuery([t.word,t.category,t.meaning,t.comparison,t.example].join(' '))).sort((a,b)=>a.word.localeCompare(b.word,'pt-BR'));
  const plain=value=>e(value.replace(/\\([\[\]*_`])/g,'$1').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'$1 ($2)'));
  return pageHead('Seu dicionário DEV','Palavras, significados e conexões da sua base pessoal no Notion.',`<a class="btn" href="${e(safeUrl(dictionarySnapshot.sourceUrl))}" target="_blank" rel="noopener noreferrer">Abrir no Notion ↗</a>`)+
    `<div class="info-box"><p>${dictionarySnapshot.terms.length} registros importados do Dicionário DEV em ${dateLabel(dictionarySnapshot.importedOn)} de ${dictionarySnapshot.importedOn.slice(0,4)}. Esta é uma cópia para consulta; alterações no Notion precisam de uma nova atualização.</p></div>`+
    `<div class="filters section-gap"><label class="sr-only" for="query">Buscar no dicionário</label><input id="query" data-query placeholder="Buscar palavra, significado ou exemplo" value="${e(query)}"><label class="sr-only" for="dictionary-category">Filtrar por categoria</label><select id="dictionary-category" data-filter="dictionary"><option value="">Todas as categorias</option>${choices(categories,dictionaryCategory)}</select></div><p class="note-status dictionary-count" role="status">${terms.length} resultado(s)${terms.length>dictionaryLimit?` · exibindo ${dictionaryLimit}`:''}</p>`+
    (terms.length?`<div class="grid dictionary-grid">${terms.slice(0,dictionaryLimit).map(t=>`<article class="card term-card">${badge(t.category)}<h2>${e(t.word||'Termo sem título')}</h2><p class="text-block">${plain(t.meaning||'Significado ainda não preenchido no Notion.')}</p>${t.comparison||t.example?`<details class="term-details"><summary>Comparação e exemplo</summary>${t.comparison?`<h3>Comparação</h3><p class="text-block">${plain(t.comparison)}</p>`:''}${t.example?`<h3>Exemplo</h3><p class="text-block">${plain(t.example)}</p>`:''}</details>`:''}${linkedDiscoveries.some(item=>item.terms.some(term=>term.url===t.url))?`<div class="card-footer"><p class="eyebrow">Nas suas descobertas</p><div class="connection-list">${linkedDiscoveries.filter(item=>item.terms.some(term=>term.url===t.url)).slice(0,3).map(item=>button(item.discovery.title,'open-discovery',`data-id="${item.discovery.id}"`,'quiet')).join('')}</div></div>`:''}<div class="card-footer"><a href="${e(safeUrl(t.url))}" target="_blank" rel="noopener noreferrer">Ver termo no Notion ↗</a></div></article>`).join('')}</div>${terms.length>dictionaryLimit?`<div class="section-gap">${button('Mostrar mais termos','more-terms')}</div>`:''}`:empty('Nenhum termo encontrado','Tente outra palavra ou categoria.'));
}
function settings(){return pageHead('Um espaço com a sua cara','Ajuste o ambiente e cuide dos registros que você construiu.')+`<div class="grid"><section class="card"><h2>Aparência</h2><div class="section-gap">${select('Tema','pref-theme',choices(['light','dark','system'],state.prefs.theme).replace('>light<','>Claro<').replace('>dark<','>Escuro<').replace('>system<','>Seguir o computador<'))}<div class="palette-preview"><span class="toolbar-label">Identidade Hub LC</span><div class="button-row"><span class="palette-chip violet">Violeta</span><span class="palette-chip turquoise">Turquesa</span><span class="palette-chip coral">Coral</span></div></div><label class="checkbox"><input type="checkbox" name="pref-metrics" ${state.prefs.showMetrics?'checked':''}> Mostrar métricas na evolução</label></div><div class="card-footer"><small>Horários, metas e proporções permanecem opcionais e sem valores iniciais.</small></div></section><section class="card"><h2>Seus dados</h2><p class="muted">Registros e PDFs ficam neste navegador e endereço. O backup completo inclui os arquivos disponíveis. Para acervos grandes, exporte só os registros e baixe cada PDF.</p><div class="button-row section-gap">${button('Exportar backup','export','','primary')}${button('Importar backup','import')}${button('Só registros, sem PDFs','export-metadata','','quiet')}</div><div class="card-footer"><small>A importação substitui os registros atuais após sua confirmação. Limpar os dados do navegador também remove o salvamento local.</small></div></section><section class="card"><h2>Dicionário no Notion</h2><form id="dictionary-form" class="section-gap">${field('Endereço do seu dicionário','dictionaryUrl',state.dictionaryUrl,'url','maxlength="4000" placeholder="https://…"')}<p class="error" data-inline-error role="alert"></p><button class="btn" type="submit">Salvar endereço</button></form></section><section class="card"><h2>Seu jeito de estudar</h2><p class="muted">Divisões, áreas, conteúdos e colunas podem ser editados. Você pode estudar e escrever sem ligar o cronômetro.</p><div class="button-row section-gap">${go('Áreas & conteúdos','areas','quiet')}${button('Organizar colunas','columns','','quiet')}</div></section></div>`;}

function openForm(title,body,onSave,onDelete=null,label='Salvar'){
  saveCallback=onSave;deleteCallback=onDelete;
  dialog.innerHTML=`<form id="editor-form"><header class="dialog-head"><h2 id="dialog-title">${e(title)}</h2><button type="button" data-action="close-dialog" aria-label="Fechar">×</button></header><div class="dialog-body">${body}<p class="error" id="form-error" role="alert"></p><footer class="dialog-footer">${onDelete?button('Excluir','delete-record','','danger'):''}<div class="button-row">${button('Cancelar','close-dialog')}<button type="submit" class="btn primary">${e(label)}</button></div></footer></div></form>`;
  dialog.showModal();
}
function confirmAction(title,text,onConfirm,label='Confirmar'){openForm(title,`<p>${text}</p>`,async()=>{await onConfirm();return true;},null,label);}
function replaceRecord(collection,record){const i=state[collection].findIndex(x=>x.id===record.id);if(i<0)state[collection].push(record);else state[collection][i]=record;}
function deleteRecord(collection,id){
  const item=state[collection].find(x=>x.id===id);
  confirmAction('Excluir registro?',`Excluir “${e(item?.title||item?.name||'esta sessão')}”? As anotações vinculadas serão preservadas.`,()=>{
    state[collection]=state[collection].filter(x=>x.id!==id);
    if(collection==='areas'){for(const d of state.documents)if(d.areaId===id)d.areaId='';
      for(const d of state.discoveries)d.areaIds=d.areaIds.filter(areaId=>areaId!==id);
      for(const list of ['materials','tasks','books','notes','sessions'])for(const x of state[list])if(x.areaId===id)x.areaId='';
      if(state.timer.areaId===id)state.timer.areaId='';areaFilter='';
    }
    if(collection==='books'){
      for(const list of ['notes','sessions'])for(const x of state[list])if(x.bookId===id)x.bookId='';
      if(state.timer.bookId===id)state.timer.bookId='';noteFilter='';
    }
    if(collection==='materials')for(const n of state.notes)if(n.materialId===id)n.materialId='';
    if(collection==='discoveries'){
      for(const list of ['notes','tasks'])for(const x of state[list])if(x.discoveryId===id)x.discoveryId='';
      if(selectedDiscovery===id)selectedDiscovery='';
      if(noteDiscoveryFilter===id)noteDiscoveryFilter='';
    }
    if(collection==='documents'){for(const list of ['notes','tasks'])for(const x of state[list])if(x.documentId===id)x.documentId='';if(selectedDocument===id)selectedDocument='';if(noteDocumentFilter===id)noteDocumentFilter='';}
    if(collection==='notes'&&selectedNote===id)selectedNote='';
    const persisted=save();if(persisted&&collection==='documents'&&!state.documents.some(d=>d.sha256===item.sha256))pdfFileStore('delete',item.sha256).catch(err=>toast(err.message,'error'));render();toast('Registro excluído.','success');
  },'Excluir');
}
function areaForm(id){
  const a=state.areas.find(x=>x.id===id)||{id:uid(),name:'',division:divisionFilter||'Outros',description:''};
  openForm(id?'Editar área':'Nova área',field('Nome','name',a.name,'text','required maxlength="500"')+field('Divisão','division',divisionFor(a),'text','required maxlength="100" list="division-names" placeholder="TI, Filosofia, Neurociência…"')+`<datalist id="division-names">${divisionNames().map(name=>`<option value="${e(name)}"></option>`).join('')}</datalist><p class="note-status">Escolha uma divisão existente ou escreva o nome de uma nova.</p>`+textfield('Descrição (opcional)','description',a.description,'maxlength="200000"'),f=>{if(!f.division.trim())throw new Error('Informe a divisão desta área.');replaceRecord('areas',{id:a.id,name:f.name.trim(),division:f.division.trim(),description:f.description});divisionFilter=f.division.trim();areaFilter='';save();render();return true;},id?()=>deleteRecord('areas',id):null);
}
function materialForm(id){
  const divisionAreas=state.areas.filter(a=>divisionFor(a)===divisionFilter);
  const m=state.materials.find(x=>x.id===id)||{id:uid(),title:'',areaId:areaFilter||(divisionAreas.length===1?divisionAreas[0].id:''),url:'',kind:'Leitura',description:''};
  openForm(id?'Editar conteúdo':'Novo conteúdo',field('Título','title',m.title,'text','required maxlength="500"')+select('Área (opcional)','areaId',areaOptions(m.areaId,'Sem área — Outros'))+select('Formato','kind',choices(['Documentação','Videoaula','Leitura','Artigo','Exercício','Projeto','Outro'],m.kind))+field('Link (opcional)','url',m.url,'url','maxlength="4000" placeholder="https://…"')+textfield('Objetivo, origem ou observações (opcional)','description',m.description,'maxlength="200000"'),f=>{if(f.url&&!safeUrl(f.url))throw new Error('Use um endereço HTTP ou HTTPS válido.');replaceRecord('materials',{id:m.id,...f,title:f.title.trim(),url:safeUrl(f.url)});divisionFilter=f.areaId?divisionFor(state.areas.find(a=>a.id===f.areaId)):'Outros';areaFilter=f.areaId;query='';save();render();return true;},id?()=>deleteRecord('materials',id):null);
}
function taskForm(id,link={}){
  const t=state.tasks.find(x=>x.id===id)||{id:uid(),title:link.title||'',discoveryId:link.discoveryId||'',documentId:link.documentId||'',areaId:link.areaId||areaFilter,columnId:state.columns[0].id,kind:'Estudo',details:link.details||'',duration:'',due:''};
  openForm(id?'Editar atividade':'Nova atividade',field('O que você quer fazer?','title',t.title,'text','required maxlength="500"')+`<div class="form-grid">${select('Área (opcional)','areaId',areaOptions(t.areaId))}${select('Coluna','columnId',state.columns.map(c=>`<option value="${c.id}" ${t.columnId===c.id?'selected':''}>${e(c.name)}</option>`).join(''))}${select('Tipo','kind',choices(['Estudo','Aula','Leitura','Exercício','Projeto','Revisão','Reflexão'],t.kind))}${field('Duração desejada em minutos (opcional)','duration',t.duration,'number','min="1" max="1000000" placeholder="Sem duração definida"')}${field('Prazo (opcional)','due',t.due,'date')}</div>`+select('Documento de origem (opcional)','documentId',options(state.documents,t.documentId||''))+select('Descoberta de origem (opcional)','discoveryId',options(state.discoveries,t.discoveryId||''))+textfield('Objetivo, materiais ou critério de conclusão (opcional)','details',t.details,'maxlength="200000"'),f=>{replaceRecord('tasks',{id:t.id,...f,title:f.title.trim()});save();render();return true;},id?()=>deleteRecord('tasks',id):null);
}
function bookForm(id){
  const b=state.books.find(x=>x.id===id)||{id:uid(),title:'',author:'',status:'',page:'',total:'',chapter:'',areaId:''};
  openForm(id?'Ajustar leitura':'Novo livro',field('Título','title',b.title,'text','required maxlength="500"')+field('Autor (opcional)','author',b.author,'text','maxlength="500"')+`<div class="form-grid">${select('Status','status',choices(['','Quero ler','Lendo','Pausado','Lido'],b.status))}${select('Área (opcional)','areaId',areaOptions(b.areaId))}${field('Página de retomada (opcional)','page',b.page,'number','min="0" step="1"')}${field('Total de páginas (opcional)','total',b.total,'number','min="1" step="1"')}</div>`+field('Capítulo ou ponto de retomada (opcional)','chapter',b.chapter,'text','maxlength="500"'),f=>{if(f.page!==''&&f.total!==''&&Number(f.page)>Number(f.total))throw new Error('A página de retomada não pode ser maior que o total de páginas.');replaceRecord('books',{id:b.id,...f,title:f.title.trim()});save();render();return true;},id?()=>deleteRecord('books',id):null);
}
function noteForm(id,kind='text',link={}){
  const n=state.notes.find(x=>x.id===id)||{id:uid(),title:'',body:'',discoveryId:link.discoveryId||'',documentId:link.documentId||'',kind,category:'Anotação',areaId:link.areaId||'',bookId:link.bookId||'',materialId:link.materialId||'',page:link.page||'',stickies:[],updatedAt:new Date().toISOString()};
  openForm(id?'Detalhes da anotação':kind==='canvas'?'Novo mural':'Nova anotação',field('Título','title',n.title,'text','required maxlength="500"')+`<div class="form-grid">${select('Tipo de registro','category',choices(['Anotação','Trecho','Reflexão','Dúvida'],n.category))}${select('Área (opcional)','areaId',areaOptions(n.areaId))}${select('Livro (opcional)','bookId',options(state.books,n.bookId))}${field('Página do trecho ou referência (opcional)','page',n.page,'text','maxlength="50"')}${select('Conteúdo (opcional)','materialId',options(state.materials,n.materialId))}${select('Descoberta (opcional)','discoveryId',options(state.discoveries,n.discoveryId||''))}${select('Documento PDF (opcional)','documentId',options(state.documents,n.documentId||''))}</div>`,f=>{replaceRecord('notes',{...n,...f,title:f.title.trim(),updatedAt:new Date().toISOString()});selectedNote=n.id;view='notes';query='';noteFilter='';noteDiscoveryFilter='';noteDocumentFilter='';save();render();return true;},id?()=>deleteRecord('notes',id):null,id?'Salvar detalhes':'Criar');
}
function sessionForm(id,fromTimer=false){
  const s=state.sessions.find(x=>x.id===id)||{id:uid(),areaId:fromTimer?state.timer.areaId:'',bookId:fromTimer?state.timer.bookId:'',minutes:fromTimer?Math.max(.01,Math.round(timerElapsed(state.timer)/600)/100):'',date:today(),summary:'',next:''};
  openForm(id?'Editar sessão':'Registrar sessão',`<div class="form-grid">${select('Área (opcional)','areaId',areaOptions(s.areaId))}${select('Livro (opcional)','bookId',options(state.books,s.bookId))}${field('Tempo estudado em minutos','minutes',s.minutes,'number','required min="0.01" max="1000000" step="0.01"')}${field('Data','date',s.date,'date','required')}</div>`+textfield('O que você fez ou descobriu? (opcional)','summary',s.summary,'maxlength="200000"')+textfield('Por onde quer retomar? (opcional)','next',s.next,'maxlength="200000"'),f=>{replaceRecord('sessions',{id:s.id,...f,minutes:Number(f.minutes)});if(fromTimer)state.timer={...state.timer,running:false,startedAt:null,elapsedMs:0};save();render();return true;},id?()=>deleteRecord('sessions',id):null);
}
function columnsForm(){
  const cols=structuredClone(state.columns);
  openForm('Organizar colunas',`<p class="muted" style="margin-bottom:18px">Altere os nomes ou adicione uma coluna. Colunas vazias podem ser removidas.</p><div id="column-fields">${cols.map(c=>`<div class="row" style="margin-bottom:10px"><label style="flex:1"><span class="sr-only">Nome da coluna</span><input name="column-${c.id}" value="${e(c.name)}" required maxlength="500"></label>${button('Remover','remove-column',`data-id="${c.id}" ${state.tasks.some(t=>t.columnId===c.id)?'disabled':''}`,'quiet')}</div>`).join('')}</div>${button('+ Coluna','add-column','','quiet')}`,f=>{
    const next=Object.entries(f).filter(([name])=>name.startsWith('column-')).map(([name,value])=>({id:name.slice(7),name:value.trim()}));
    if(!next.length)throw new Error('Mantenha pelo menos uma coluna.');
    if(next.some(c=>!c.name))throw new Error('Dê um nome para cada coluna.');
    if(state.tasks.some(t=>!next.some(c=>c.id===t.columnId)))throw new Error('Mova as atividades antes de remover sua coluna.');
    state.columns=next;save();render();return true;
  });
}
async function exportData(raw=false,metadataOnly=false){
  try{
    let content,missing=[];
    if(raw)content=localStorage.getItem(STORAGE_KEY)||'';
    else if(metadataOnly)content=JSON.stringify(state,null,2);
    else{
      toast('Preparando backup completo…');
      const snapshot=structuredClone(state),result=await pdfBackupFiles(snapshot.documents);missing=result.missing;
      content=JSON.stringify({...snapshot,documentFiles:result.files,missingDocumentFiles:missing},null,2);
    }
    const blob=new Blob([content],{type:'application/json'});
    if(!metadataOnly&&blob.size>256*1024*1024)throw new Error('Este backup supera 256 MB. Exporte os registros sem PDFs e baixe os documentos individualmente.');
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`hub-lc-${raw?'recuperacao-':metadataOnly?'registros-':''}${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast(missing.length?`Backup preparado, mas ${missing.length} PDF(s) sem arquivo disponível não foram incluídos.`:metadataOnly?'Registros exportados sem os arquivos PDF.':'Backup completo preparado.',missing.length?'warning':'success');
  }catch(err){toast(err.message,'error');}
}
let importVersion=0;
async function importData(file){
  if(!file)return;
  const version=++importVersion;
  try{
    if(file.size>256*1024*1024)throw new Error('Use um backup de até 256 MB.');
    const parsed=JSON.parse(await file.text()),{documentFiles=[],missingDocumentFiles,...records}=parsed;
    const candidate=validateState(records),decoded=await decodePdfBackup(candidate.documents,documentFiles);
    if(version!==importVersion)return;
    pendingImport=candidate;pendingPdfFiles=decoded;
    pendingImport.timer=pauseTimer(pendingImport.timer);
    confirmAction('Importar este backup?',`O arquivo contém ${pendingImport.notes.length} anotação(ões), ${pendingImport.sessions.length} sessão(ões) e ${pendingImport.documents.length} documento(s), com ${decoded.length} arquivo(s) PDF incluído(s). A importação substituirá os registros atuais deste navegador. Exporte uma cópia antes, se quiser preservá-los.`,async()=>{
      for(const item of decoded)await pdfFileStore('put',item.sha256,item.blob);
      try{writeState(localStorage,candidate);}catch{throw new Error('Não foi possível guardar o backup no navegador. Seus registros atuais foram preservados.');}
      state=candidate;pendingImport=null;pendingPdfFiles=[];recovery=false;unsaved=false;selectedNote='';selectedDocument='';noteDocumentFilter='';view='home';render();toast('Backup importado.','success');
    },'Substituir e importar');
  }catch(err){toast(err.message==='Unexpected end of JSON input'?'O arquivo não contém um backup válido.':err.message,'error');}
}
function tick(){
  if(recovery)return;
  const elapsed=timerElapsed(state.timer);
  document.querySelectorAll('[data-clock]').forEach(el=>el.textContent=clock(elapsed));
  const hint=$('[data-timer-hint]');
  if(hint&&state.timer.targetMinutes&&elapsed>=Number(state.timer.targetMinutes)*60000)hint.textContent='Você alcançou a duração que escolheu. Pode continuar ou encerrar quando quiser.';
}
function moveTask(id,columnId){const t=state.tasks.find(t=>t.id===id);if(!t||!state.columns.some(c=>c.id===columnId))return;t.columnId=columnId;save();render();toast('Atividade movida.');}
function currentNote(){return state.notes.find(n=>n.id===selectedNote);}
function clampSticky(el,p,x,y){const canvas=el.closest('.canvas');const maxX=Math.max(0,100-el.offsetWidth/canvas.clientWidth*100),maxY=Math.max(0,100-el.offsetHeight/canvas.clientHeight*100);p.x=Math.min(maxX,Math.max(0,x));p.y=Math.min(maxY,Math.max(0,y));el.style.left=`${p.x}%`;el.style.top=`${p.y}%`;}
function fitCanvas(){const n=currentNote();if(!n||view!=='notes'||n.kind!=='canvas')return;document.querySelectorAll('[data-sticky]').forEach(el=>{const p=n.stickies.find(p=>p.id===el.dataset.sticky);if(p)clampSticky(el,p,p.x,p.y);});}
function raiseSticky(el){document.querySelectorAll('.sticky').forEach(p=>p.style.zIndex='1');el.style.zIndex='2';}
document.addEventListener('focusin',event=>{const el=event.target.closest('.sticky');if(el)raiseSticky(el);});
window.addEventListener('resize',fitCanvas);

document.addEventListener('click',event=>{
  const to=event.target.closest('[data-view]');
  if(to){event.preventDefault();navigate(to.dataset.view);return;}
  const el=event.target.closest('[data-action]');if(!el)return;
  const {action,id}=el.dataset;
  if(action==='close-dialog'){dialog.close();return;}
  if(action==='delete-record'){dialog.close();deleteCallback?.();return;}
  if(action==='export'){exportData();return;}
  if(action==='export-metadata'){exportData(false,true);return;}
  if(action==='raw-export'){exportData(true);return;}
  if(action==='import'){$('#import-file').click();return;}
  if(recovery)return;
  const actions={
    'upload-pdf':()=>{if(!pdfBusy)$('#pdf-file').click();},
    'replace-pdf':()=>{const input=$('#pdf-replace-file');input.dataset.document=id;input.click();},
    'open-document':()=>{selectedDocument=id;view='documents';query='';render();window.scrollTo({top:0});},
    'all-documents':()=>{selectedDocument='';query='';render();},
    'edit-document':()=>documentForm(id),
    'document-note':()=>{const d=state.documents.find(d=>d.id===id);noteForm(null,'text',{documentId:id,areaId:d.areaId,page:d.page});},
    'document-canvas':()=>{const d=state.documents.find(d=>d.id===id);noteForm(null,'canvas',{documentId:id,areaId:d.areaId});},
    'document-task':()=>{const d=state.documents.find(d=>d.id===id);taskForm(null,{documentId:id,areaId:d.areaId,title:('Estudar: '+d.title).slice(0,500),details:'Documento: '+d.fileName});},
    'open-discovery':()=>{selectedDiscovery=id;view='discoveries';query='';render();window.scrollTo({top:0});},
    'all-discoveries':()=>{selectedDiscovery='';query='';render();},
    'edit-discovery':()=>discoveryForm(id),
    'new-discovery-point':()=>discoveryPointForm(id),
    'edit-discovery-point':()=>discoveryPointForm(id,el.dataset.point),
    'link-discovery-area':()=>{const d=state.discoveries.find(d=>d.id===id);if(!d.areaIds.includes(el.dataset.area))d.areaIds.push(el.dataset.area);d.updatedAt=new Date().toISOString();save();render();},
    'discovery-note':()=>{const d=state.discoveries.find(d=>d.id===id);noteForm(null,'text',{discoveryId:id,areaId:d.areaIds[0]||''});},
    'discovery-canvas':()=>{const d=state.discoveries.find(d=>d.id===id);noteForm(null,'canvas',{discoveryId:id,areaId:d.areaIds[0]||''});},
    'discovery-task':()=>{const d=state.discoveries.find(d=>d.id===id);taskForm(null,{discoveryId:id,areaId:d.areaIds[0]||'',title:'Explorar: '+d.title,details:d.url});},
    'discovery-term':()=>{view='dictionary';query=el.dataset.word;dictionaryCategory='';dictionaryLimit=24;render();window.scrollTo({top:0});},
    'new-area':()=>areaForm(),'edit-area':()=>areaForm(id),'filter-area':()=>{areaFilter=id;divisionFilter=divisionFor(state.areas.find(a=>a.id===id));query='';view='areas';render();},
    'open-division':()=>{divisionFilter=el.dataset.division;areaFilter='';query='';render();},'all-divisions':()=>{divisionFilter='';areaFilter='';query='';render();},
    'more-terms':()=>{dictionaryLimit+=24;render();},
    'new-material':()=>materialForm(),'edit-material':()=>materialForm(id),'material-note':()=>{const m=state.materials.find(x=>x.id===id);noteForm(null,'text',{areaId:m.areaId,materialId:id});},
    'new-task':()=>taskForm(),'edit-task':()=>taskForm(id),'columns':()=>columnsForm(),
    'new-book':()=>bookForm(),'edit-book':()=>bookForm(id),'book-note':()=>{const b=state.books.find(x=>x.id===id);noteForm(null,'text',{bookId:id,areaId:b.areaId});},'book-notes':()=>{view='notes';noteFilter=id;noteDiscoveryFilter='';noteDocumentFilter='';query='';selectedNote='';render();},
    'new-note':()=>noteForm(),'new-canvas':()=>noteForm(null,'canvas'),'edit-note':()=>noteForm(id),'open-note':()=>{if(view!=='notes'){query='';noteFilter='';noteDiscoveryFilter='';noteDocumentFilter='';}view='notes';selectedNote=id;render();},
    'new-session':()=>sessionForm(),'edit-session':()=>sessionForm(id),
    'start-timer':()=>{if(!state.timer.running){state.timer.running=true;state.timer.startedAt=Date.now();save();render();}},
    'pause-timer':()=>{state.timer=pauseTimer(state.timer);save();render();},
    'finish-timer':()=>{if(timerElapsed(state.timer)<600){toast('Inicie o cronômetro ou registre uma sessão manualmente.');return;}state.timer=pauseTimer(state.timer);save();render();sessionForm(null,true);},
    'discard-timer':()=>confirmAction('Descartar este tempo?','O cronômetro será zerado. Nenhum registro será criado.',()=>{state.timer={...state.timer,running:false,startedAt:null,elapsedMs:0};save();render();},'Descartar'),
    'toggle-metrics':()=>{state.prefs.showMetrics=!state.prefs.showMetrics;save();render();},
    'add-column':()=>{const row=document.createElement('div');row.className='row';row.style.marginBottom='10px';const newId=uid();row.innerHTML=`<label style="flex:1"><span class="sr-only">Nome da coluna</span><input name="column-${newId}" required maxlength="500" placeholder="Nome da coluna"></label>${button('Remover','remove-column',`data-id="${newId}"`,'quiet')}`;$('#column-fields').append(row);row.querySelector('input').focus();},
    'remove-column':()=>el.closest('.row').remove(),
    'new-sticky':()=>{const n=currentNote();if(n.stickies.length>=200){toast('Este mural já tem 200 post-its. Crie outro mural para continuar.');return;}n.stickies.push({id:uid(),text:'',x:5+(n.stickies.length%3)*24,y:5+(Math.floor(n.stickies.length/3)%4)*20,tone:'paper'});n.updatedAt=new Date().toISOString();save();render();},
    'remove-sticky':()=>{const n=currentNote();n.stickies=n.stickies.filter(p=>p.id!==id);n.updatedAt=new Date().toISOString();save();render();},
    'tone-sticky':()=>{const n=currentNote(),p=n.stickies.find(p=>p.id===id);p.tone=['paper','jade','rose'][(['paper','jade','rose'].indexOf(p.tone)+1)%3];save();el.closest('.sticky').dataset.tone=p.tone;},
    'move-sticky':()=>{const n=currentNote(),p=n.stickies.find(p=>p.id===id);clampSticky(el.closest('.sticky'),p,p.x+Number(el.dataset.x)*4,p.y+Number(el.dataset.y)*4);n.updatedAt=new Date().toISOString();save();}
  };
  actions[action]?.();
});
document.addEventListener('submit',async event=>{
  event.preventDefault();
  if(event.target.id==='pdf-page-form'){
    const value=new FormData(event.target).get('page'),d=state.documents.find(d=>d.id===selectedDocument);d.page=value;save();render();return;
  }
  if(event.target.id==='capture-form'){
    const f=Object.fromEntries(new FormData(event.target));
    try{
      const d=makeDiscovery(f.url,f.title,f.description),existing=state.discoveries.find(x=>x.url===d.url);
      if(existing){selectedDiscovery=existing.id;query='';render();toast('Este link já estava salvo. Abrimos a descoberta existente.');return;}
      state.discoveries.push(d);selectedDiscovery=d.id;query='';save();render();
    }catch(err){event.target.querySelector('[data-capture-error]').textContent=err.message;}
    return;
  }
  if(event.target.id==='editor-form'){
    const form=event.target;if(form.dataset.busy==='true')return;form.dataset.busy='true';
    const submit=form.querySelector('[type=submit]');submit.disabled=true;
    const f=Object.fromEntries(new FormData(event.target));
    try{if(['title','name'].some(key=>key in f&&!f[key].trim()))throw new Error('Preencha o nome ou título do registro.');if(await saveCallback?.(f)!==false)dialog.close();}
    catch(err){$('#form-error').textContent=err.message;}
    finally{form.dataset.busy='false';submit.disabled=false;}
  }
  if(event.target.id==='dictionary-form'){
    const url=new FormData(event.target).get('dictionaryUrl');if(url&&!safeUrl(url)){event.target.querySelector('[data-inline-error]').textContent='Use um endereço HTTP ou HTTPS válido.';return;}state.dictionaryUrl=safeUrl(url);if(save())toast('Endereço salvo.');
  }
});
document.addEventListener('input',event=>{
  const el=event.target;
  if(el.matches('[data-document-body]')){const d=state.documents.find(d=>d.id===el.dataset.documentBody);d.description=el.value;save();$('[data-document-save]').textContent=unsaved?'Alterações ainda não salvas':'Suas ideias estão salvas neste navegador.';}
  if(el.matches('[data-discovery-body]')){
    const d=state.discoveries.find(d=>d.id===el.dataset.discoveryBody);d.description=el.value;d.updatedAt=new Date().toISOString();save();
    $('[data-discovery-save]').textContent=unsaved?'Alterações ainda não salvas':'Suas ideias estão salvas neste navegador.';
    $('#discovery-connections').innerHTML=discoveryConnectionsPanel(d);
  }
  if(el.matches('[data-query]')){const start=el.selectionStart;query=el.value;dictionaryLimit=24;render();const input=$('#query');input.focus();input.setSelectionRange(start,start);}
  if(el.matches('[data-note-body]')){const n=state.notes.find(n=>n.id===el.dataset.noteBody);n.body=el.value;n.updatedAt=new Date().toISOString();save();$('[data-note-status]').textContent=unsaved?'Alterações ainda não salvas':'Suas palavras estão salvas neste navegador.';}
  if(el.matches('[data-sticky-text]')){const n=currentNote(),p=n.stickies.find(p=>p.id===el.dataset.stickyText);p.text=el.value;n.updatedAt=new Date().toISOString();save();}
});
document.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='pdf-file'||el.id==='pdf-replace-file'){uploadPdfs([...el.files],el.dataset.document||'');el.value='';return;}
  if(el.dataset.filter==='note-document'){noteDocumentFilter=el.value;selectedNote='';}
  if(el.dataset.filter==='discovery-status')discoveryStatus=el.value;
  if(el.dataset.filter==='note-discovery'){noteDiscoveryFilter=el.value;selectedNote='';}
  if(el.id==='import-file'){importData(el.files[0]);el.value='';return;}
  if(el.matches('[data-filter]')){if(el.dataset.filter==='division'){divisionFilter=el.value;areaFilter='';}if(el.dataset.filter==='dictionary'){dictionaryCategory=el.value;dictionaryLimit=24;}if(el.dataset.filter==='area')areaFilter=el.value;if(el.dataset.filter==='book')bookFilter=el.value;if(el.dataset.filter==='note'){noteFilter=el.value;selectedNote='';}render();}
  if(el.matches('[data-task-column]'))moveTask(el.dataset.taskColumn,el.value);
  if(el.matches('[data-period]')){evolutionPeriod=el.value;render();}
  if(el.name?.startsWith('pref-')){if(el.name==='pref-theme')state.prefs.theme=el.value;if(el.name==='pref-accent')state.prefs.accent=el.value;if(el.name==='pref-metrics')state.prefs.showMetrics=el.checked;save();render();}
  if(el.name?.startsWith('timer-')){
    if(el.name==='timer-target'&&!el.checkValidity()){el.reportValidity();el.value=state.timer.targetMinutes;return;}
    if(el.name==='timer-area')state.timer.areaId=el.value;if(el.name==='timer-book')state.timer.bookId=el.value;if(el.name==='timer-target')state.timer.targetMinutes=el.value;save();tick();
  }
});
document.addEventListener('dragstart',event=>{const task=event.target.closest('[data-task]');if(task){dragTask=task.dataset.task;event.dataTransfer.setData('text/plain',dragTask);event.dataTransfer.effectAllowed='move';}});
document.addEventListener('dragover',event=>{const col=event.target.closest('[data-column]');if(col&&dragTask){event.preventDefault();col.classList.add('drop-over');}});
document.addEventListener('dragleave',event=>{const col=event.target.closest('[data-column]');if(col&&!col.contains(event.relatedTarget))col.classList.remove('drop-over');});
document.addEventListener('drop',event=>{const col=event.target.closest('[data-column]');if(col&&dragTask){event.preventDefault();moveTask(dragTask,col.dataset.column);dragTask='';}});
document.addEventListener('dragend',()=>{dragTask='';document.querySelectorAll('.drop-over').forEach(el=>el.classList.remove('drop-over'));});
let stickyDrag=null;
document.addEventListener('pointerdown',event=>{
  const activeSticky=event.target.closest('.sticky');if(activeSticky)raiseSticky(activeSticky);
  const handle=event.target.closest('[data-drag-sticky]');if(!handle||event.target.closest('button'))return;
  const n=currentNote(),p=n.stickies.find(p=>p.id===handle.dataset.dragSticky),el=handle.closest('.sticky'),canvas=el.closest('.canvas');
  event.preventDefault();handle.setPointerCapture(event.pointerId);stickyDrag={el,p,n,handle,startX:event.clientX,startY:event.clientY,x:p.x,y:p.y,width:canvas.clientWidth,height:canvas.clientHeight};
});
document.addEventListener('pointermove',event=>{if(!stickyDrag)return;const d=stickyDrag;clampSticky(d.el,d.p,d.x+(event.clientX-d.startX)/d.width*100,d.y+(event.clientY-d.startY)/d.height*100);});
function endSticky(){if(!stickyDrag)return;stickyDrag.n.updatedAt=new Date().toISOString();stickyDrag=null;save();}
document.addEventListener('pointerup',endSticky);document.addEventListener('pointercancel',endSticky);
window.addEventListener('storage',event=>{if(event.key!==STORAGE_KEY)return;try{state=readState(localStorage);recovery=false;unsaved=false;dialog.close();render();toast('Registros atualizados por outra aba.');}catch{recovery=true;dialog.close();render();}});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(state.prefs.theme==='system')appearance();});
setInterval(tick,1000);
render();
