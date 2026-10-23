import {DOCUMENT_ACCEPT,documentFormat,inspectDocument} from './documents.js';
import {studyMarkdown} from './study-export.js';
import {STORAGE_KEY,uid,today,createInitial,safeUrl,timerElapsed,pauseTimer,percentages,readState,writeState,validateState,DEFAULT_DIVISIONS,divisionFor,dictionarySnapshot,DISCOVERY_STATUSES,DISCOVERY_KINDS,makeDiscovery,discoveryConnections,timestampUrl,pdfFileStore,pdfBackupFiles,decodePdfBackup,adjustHighlights} from './data.js';

const $=s=>document.querySelector(s);
const root=$('#app'),dialog=$('#editor');
const brandLogo=$('#brand-logo').innerHTML;
const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Unified line icons keep navigation consistent across platforms (no font glyphs).
const iconPaths={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',areas:'<path d="M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H3V4Zm9 3a3 3 0 0 1 3-3h5v14h-5a3 3 0 0 0-3 3"/>',notes:'<path d="M12 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-7M16 3l5 5M10 14l2-5 7-7 5 5-7 7-5 2Z"/>',board:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16M15 4v16M5 8h2m4 4h2m4-4h2"/>',sessions:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6m-3 0v3m7-1 2 2"/>',settings:'<path d="m9 3-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',plus:'<path d="M12 5v14M5 12h14"/>',download:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>',leaf:'<path d="M19 3C8 2 3 8 5 14s10 7 13 0c2-4 1-8 1-11ZM4 21 15 9"/>',check:'<path d="m5 12 4 4L19 6"/>',grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>'};
const icon=(name,cls='')=>`<svg class="ui-icon ${cls}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name]||iconPaths.spark}</svg>`;
const nav=[['home','Meu espaço','⌂'],['areas','Estudos','◈'],['documents','Documentos','▧'],['discoveries','Descobertas','◇'],['board','Quadro','▤'],['books','Biblioteca','▥'],['notes','Anotações','✎'],['sessions','Sessões','◷'],['evolution','Evolução','↗'],['dictionary','Dicionário','Aa']];
const studyViews=['areas','discoveries','documents','books','dictionary'];
const primaryViews=['home','areas','notes','board','sessions'];
let studyKind='all';
function workspaceTabs(){
  const tabs=studyViews.includes(view)?[['areas','Assuntos'],['discoveries','Links e vídeos'],['documents','Documentos'],['books','Livros'],['dictionary','Dicionário']]:['sessions','evolution'].includes(view)?[['sessions','Sessão e histórico'],['evolution','Evolução']]:[];
  return tabs.length?`<nav class="workspace-tabs" aria-label="${studyViews.includes(view)?'Estudos':'Sessões'}">${tabs.map(([key,label])=>`<button type="button" class="${view===key?'active':''}" data-view="${key}" ${view===key?'aria-current="page"':''}>${label}</button>`).join('')}</nav>`:'';
}
let layoutObserver;
let renderedPage='',dialogOpener=null,dialogDraft='',resultAnnouncement;
function focusSnapshot(el=document.activeElement){
  if(!el||el===document.body)return null;
  const attributes=['id','name','data-action','data-id','data-view','data-filter','data-task-column','data-sticky-text','data-resize-sticky','data-from','data-to','data-area','data-word','data-division'];
  const selector=attributes.filter(name=>el.hasAttribute(name)).map(name=>`[${name}="${CSS.escape(el.getAttribute(name))}"]`).join('');
  return {el,selector,page:renderedPage,start:el.selectionStart,end:el.selectionEnd,direction:el.selectionDirection};
}
function focusContent(){const heading=$('.canvas-expanded [data-action=canvas-expand]')||$('#main h1')||$('main h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
function restoreFocus(snapshot){
  if(!snapshot||(snapshot.page!==renderedPage&&!snapshot.el.matches('[data-query],[data-filter]'))){focusContent();return;}
  const target=snapshot.el.isConnected?snapshot.el:snapshot.selector&&root.querySelector(snapshot.selector);
  if(!target||!target.getClientRects().length||target.disabled||target.closest('[inert]')){focusContent();return;}
  target.focus({preventScroll:true});
  if(typeof snapshot.start==='number'&&target.setSelectionRange&&['text','search','url','tel','password','textarea'].includes(target.type))target.setSelectionRange(snapshot.start,snapshot.end,snapshot.direction);
}
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
if([...nav.map(n=>n[0]),'settings'].includes(location.hash.slice(1)))view=location.hash.slice(1);
const areaName=id=>state.areas.find(a=>a.id===id)?.name||'Sem área';
const divisionNames=()=>[...new Set([...DEFAULT_DIVISIONS,...state.areas.map(divisionFor)])];
const areaOptions=(selected='',none='Sem vínculo')=>`<option value="">${e(none)}</option>`+divisionNames().map(name=>`<optgroup label="${e(name)}">${state.areas.filter(a=>divisionFor(a)===name).map(a=>`<option value="${a.id}" ${a.id===selected?'selected':''}>${e(a.name)}</option>`).join('')}</optgroup>`).join('');
const bookName=id=>state.books.find(b=>b.id===id)?.title||'';
const materialName=id=>state.materials.find(m=>m.id===id)?.title||'';
const discoveryName=id=>state.discoveries.find(d=>d.id===id)?.title||'';
const documentName=id=>state.documents.find(d=>d.id===id)?.title||'';
const dateLabel=d=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(`${d}T12:00:00`));
const quantity=(count,singular,plural=singular+'s')=>`${count} ${count===1?singular:plural}`;
const minutesLabel=m=>m>=60?`${Math.floor(m/60)}h ${Math.round(m%60)}min`:`${Math.round(m*10)/10} min`;
const clock=m=>{const s=Math.floor(m/1000);return `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const trashIcon='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg>';
const trash=(collection,id,label)=>`<button type="button" class="btn danger icon-button" data-action="quick-delete" data-collection="${collection}" data-id="${id}" aria-label="Excluir ${e(label)}" title="Excluir ${e(label)}">${trashIcon}</button>`;
const editCollections={'edit-area':'areas','edit-material':'materials','edit-book':'books','edit-note':'notes','edit-session':'sessions','edit-discovery':'discoveries','edit-document':'documents'};
const button=(text,action,extra='',cls='')=>{
  const html=`<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${text}</button>`;
  const collection=editCollections[action],id=extra.match(/data-id="([^"]+)"/)?.[1];
  const item=collection&&state[collection].find(x=>x.id===id);
  return html+(item?trash(collection,id,item.title||item.name||'sessão'):'');
};
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

function toast(text,tone='info'){const el=$('#toast');el.textContent=text;el.dataset.tone=tone;el.classList.add('visible');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('visible'),tone==='error'||tone==='warning'?9000:4500);}
function save(){
  if(recovery) return false;
  state.updatedAt=new Date().toISOString();
  try{writeState(localStorage,state);unsaved=false;}
  catch{unsaved=true;toast('Não foi possível salvar no navegador. Exporte um backup para preservar suas alterações.','error');}
  updateSaveStatus();return !unsaved;
}
function updateSaveStatus(){const el=$('[data-save-status]');if(el){el.textContent=unsaved?'Alterações ainda não salvas':'Salvo neste navegador';el.dataset.state=unsaved?'warning':'success';}const warning=$('[data-storage-warning]');if(warning)warning.hidden=!unsaved;if(unsaved)document.querySelectorAll('[data-note-status],[data-document-save],[data-discovery-save]').forEach(el=>el.textContent='Alterações ainda não salvas. Exporte um backup para preservá-las.');}
function appearance(){document.documentElement.dataset.theme=state.prefs.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):state.prefs.theme;document.documentElement.dataset.accent='lc';}
function render(){
  const focused=focusSnapshot();
  rememberCanvas();hideNoteTools();
  layoutObserver?.disconnect();layoutObserver=new ResizeObserver(()=>{if(view==='notes'&&currentNote()?.kind==='canvas')fitCanvas();else updateHighlightBackdrop();});
  pdfPreviewToken++;
  if(pdfPreviewUrl){URL.revokeObjectURL(pdfPreviewUrl);pdfPreviewUrl='';}
  appearance();
  if(!recovery&&location.hash!=='#'+view)history[renderedPage?'pushState':'replaceState'](null,'','#'+view);
  try{sessionStorage.setItem('hub-lc:workspace',JSON.stringify({view,selectedNote,areaFilter,divisionFilter,bookFilter,noteFilter,query,dictionaryCategory,selectedDiscovery,discoveryStatus,noteDiscoveryFilter,selectedDocument,noteDocumentFilter}));}catch{}
  if(recovery){document.body.classList.remove('canvas-is-expanded');renderedPage='recovery';document.title='Hub LC · Recuperação';root.innerHTML=`<main class="recovery card"><p class="eyebrow">Seus registros primeiro</p><h1>Vamos recuperar seu espaço</h1><p>Os dados salvos não puderam ser lidos. Você pode guardar o arquivo original ou importar um backup válido.</p><div class="button-row section-gap">${button('Baixar dados originais','raw-export')}${button('Importar backup','import','','primary')}</div><input type="file" id="import-file" accept="application/json,.json" hidden><p class="note-status">Nenhum dado existente foi substituído.</p></main>`;if(focused)focusContent();return;}
  const title=nav.find(n=>n[0]===view)?.[1]||'Preferências';
  document.title=`Hub LC · ${title}`;
  root.innerHTML=`<a class="skip-link" href="#main">Pular para o conteúdo</a><div class="shell"><aside class="sidebar"><a href="#home" class="brand" data-view="home">${brandLogo}<span class="brand-tagline">seu universo de ideias</span></a><span class="nav-label">ESPAÇO PESSOAL</span><nav class="nav-group" aria-label="Navegação principal">${nav.filter(([key])=>primaryViews.includes(key)).map(([key,label,symbol])=>`<button type="button" data-view="${key}" class="${(view===key||key==='areas'&&studyViews.includes(view)||key==='sessions'&&view==='evolution')?'active':''}" ${(view===key||key==='areas'&&studyViews.includes(view)||key==='sessions'&&view==='evolution')?'aria-current="page"':''}><span class="nav-symbol" aria-hidden="true">${icon(key)}</span>${label}</button>`).join('')}</nav><div class="sidebar-footer"><nav class="nav-group" aria-label="Preferências"><button type="button" data-view="settings" class="${view==='settings'?'active':''}" ${view==='settings'?'aria-current="page"':''}><span class="nav-symbol" aria-hidden="true">${icon('settings')}</span>Preferências & backup</button></nav><div class="sidebar-note">${icon('leaf')}<strong>Aprender é um caminho.</strong><p>Um passo de cada vez.<br>No seu próprio ritmo.</p><span class="sidebar-note-line" aria-hidden="true"></span></div><div class="workspace-profile"><span class="profile-avatar">LC</span><div><strong>Meu espaço pessoal</strong><small>Feito para suas ideias</small></div><span class="profile-dot" aria-hidden="true"></span></div></div></aside><div class="workspace"><div class="topbar"><span class="crumb">${icon('grid')}<span>Workspace <span class="crumb-divider">/</span> <b>${e(title)}</b></span></span><span class="local-state" data-save-status></span>${button(icon('download')+'<span>Exportar MD</span>','export-md','','quiet export-shortcut')}${view==='settings'?'':`<button type="button" class="btn quiet settings-shortcut" data-view="settings" aria-label="Preferências" title="Preferências">${icon('settings')}</button>`}${button(icon('plus')+'<span>Anotação</span>','new-note','','topbar-create')}</div><div class="data-warning" data-storage-warning role="alert" hidden><span>Há alterações ainda não salvas no navegador.</span>${button('Exportar backup','export')}</div><main id="main" data-page="${view}" tabindex="-1">${workspaceTabs()}${({home:home,areas:areas,documents:documents,discoveries:discoveries,board:board,books:books,notes:notes,sessions:sessions,evolution:evolution,dictionary:dictionary,settings:settings}[view]||home)()}</main></div></div><input type="file" id="import-file" accept="application/json,.json" hidden><input type="file" id="pdf-file" accept="${DOCUMENT_ACCEPT}" multiple hidden><input type="file" id="pdf-replace-file" accept="${DOCUMENT_ACCEPT}" hidden>`;
  renderedPage=[view,selectedDocument,selectedDiscovery,view==='notes'?selectedNote:'',view==='areas'?areaFilter+'|'+divisionFilter:''].join(':');
  enhanceFilters();updateSaveStatus();tick();fitCanvas();restoreCanvas();syncExpandedCanvas();loadDocumentPreview();if($('#note-body')){const editor=$('#note-body');editor.addEventListener('scroll',updateHighlightBackdrop);layoutObserver.observe(editor);}const canvas=$('.canvas');if(canvas){layoutObserver.observe(canvas);document.querySelectorAll('.sticky').forEach(el=>layoutObserver.observe(el));}
  if(!dialog.open&&focused)restoreFocus(focused);
  const subjects=$('.study-sidebar'),activeSubject=subjects?.querySelector('.subject-button.active');if(subjects&&activeSubject)subjects.scrollTop=Math.max(0,activeSubject.offsetTop-subjects.clientHeight/2);
  const activeNav=$('.sidebar [aria-current=page]');if(activeNav&&matchMedia('(max-width:780px)').matches)activeNav.parentElement.scrollLeft=Math.max(0,activeNav.offsetLeft-24);
}
function documentCard(d){return `<article class="card document-card"><div class="badge-row">${badge(documentFormat(d).extension.toUpperCase())}${d.areaId?badge(areaName(d.areaId),true):''}</div><h3>${e(d.title)}</h3><p class="muted document-filename">${e(d.fileName)} · ${(d.size/1024/1024).toFixed(1)} MB</p>${d.description?`<p class="muted discovery-excerpt">${e(d.description)}</p>`:''}<p class="note-status">${d.page?'Retomar na página '+e(d.page):'Ponto de retomada livre'} · ${quantity(state.notes.filter(n=>n.documentId===d.id&&!n.bookId).length,'anotação','anotações')}</p><div class="card-footer">${button('Abrir documento','open-document',`data-id="${d.id}"`)}${trash('documents',d.id,d.title)}</div></article>`;}
function documents(){
  const d=state.documents.find(d=>d.id===selectedDocument);
  if(d){
    const notes=state.notes.filter(n=>n.documentId===d.id&&!n.bookId),tasks=state.tasks.filter(t=>t.documentId===d.id);
    return pageHead(e(d.title),'Leia, investigue e guarde suas próprias ideias.',button('Editar detalhes','edit-document',`data-id="${d.id}"`))+
      `<div class="row wrap document-toolbar">${button('← Todos os documentos','all-documents','','quiet')}<div class="button-row"><a class="btn" data-open-pdf target="_blank" rel="noopener noreferrer" hidden>Abrir arquivo em outra aba ↗</a><a class="btn" data-document-download hidden>Baixar arquivo</a></div></div><div class="document-layout"><section class="card pdf-reader"><div class="row wrap"><h2>Leitura</h2><form id="pdf-page-form" class="pdf-page-form" ${documentFormat(d).preview!=='pdf'?'hidden':''}>${field('Página de retomada','page',d.page,'number','min="1" max="1000000" step="1" placeholder="Livre"')}<button type="submit" class="btn">Guardar ponto</button></form></div><p data-pdf-status class="note-status" role="status">Abrindo arquivo…</p><iframe id="pdf-viewer" title="PDF: ${e(d.title)}" hidden></iframe><pre class="document-text" data-document-text hidden></pre><img class="document-image" data-document-image alt="${e(d.title)}" hidden><p class="note-status">${documentFormat(d).preview==='download'?'Este formato é preservado no original. Baixe e abra no aplicativo compatível; suas anotações continuam aqui.':'Leia aqui ou abra o arquivo em outra aba. Textos são exibidos com segurança, sem executar formatação ou código.'}</p><div data-pdf-repair hidden>${button('Selecionar o arquivo novamente','replace-pdf',`data-id="${d.id}"`)}</div></section><aside class="document-study"><section class="card"><div class="badge-row">${badge(documentFormat(d).extension.toUpperCase())}${d.areaId?badge(areaName(d.areaId),true):''}</div><h2>Meu estudo</h2><p class="muted document-filename">${e(d.fileName)}</p><label class="field section-gap"><span>Objetivo, perguntas e ideias</span><textarea data-document-body="${d.id}" maxlength="200000" placeholder="O que quero entender? Que pontos merecem atenção?">${e(d.description)}</textarea></label><p class="note-status" data-document-save>Suas ideias são salvas enquanto você escreve.</p>${d.areaId?button('Ver área relacionada','filter-area',`data-id="${d.areaId}"`,'quiet'):''}</section><section class="card"><div class="row wrap"><h2>Anotações</h2>${button('+ Nota','document-note',`data-id="${d.id}"`)}</div><p class="note-status">Registre um trecho, uma dúvida ou uma reflexão com a página de referência.</p><div class="connection-list">${notes.map(n=>`<div class="connection-item"><div><strong>${e(n.title)}</strong><small>${e(n.category)}${n.page?' · Referência '+e(n.page):''}</small></div>${button('Abrir','open-note',`data-id="${n.id}"`,'quiet')}</div>`).join('')}</div><div class="button-row section-gap">${button('+ Mural','document-canvas',`data-id="${d.id}"`,'quiet')}${button('Criar atividade','document-task',`data-id="${d.id}"`,'quiet')}</div>${tasks.length?`<div class="card-footer"><p class="eyebrow">No quadro</p>${tasks.map(t=>`<div class="connection-item"><strong>${e(t.title)}</strong>${button('Abrir','edit-task',`data-id="${t.id}"`,'quiet')}</div>`).join('')}</div>`:''}</section></aside></div>`;
  }
  selectedDocument='';
  const list=state.documents.filter(d=>(!areaFilter||d.areaId===areaFilter)&&includesQuery(d.title+' '+d.fileName+' '+d.description+' '+areaName(d.areaId))).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  return pageHead('Documentos','Arquivos e ideias de estudo, em diferentes formatos.',button('+ Adicionar arquivos','upload-pdf','','primary'))+
    `<section class="info-box"><p>PDF, TXT, MD, CSV, Word, Excel, PowerPoint, ODT, RTF, EPUB e imagens (PNG, JPEG, WebP), até 25 MB por arquivo. Eles ficam neste navegador e entram no backup completo, junto dos seus registros.</p></section><p class="note-status" id="pdf-upload-status" role="status">${pdfBusy?'Guardando arquivos…':''}</p><div class="filters section-gap"><label class="sr-only" for="query">Buscar documentos</label><input id="query" data-query value="${e(query)}" placeholder="Buscar título, arquivo ou ideia"><label class="sr-only" for="area-filter">Filtrar documentos por assunto</label><select id="area-filter" data-filter="area">${areaOptions(areaFilter,'Todos os assuntos')}</select></div>`+
    (list.length?`<div class="grid">${list.map(documentCard).join('')}</div>`:empty(query||areaFilter?'Nenhum documento neste filtro':'Um lugar para seus materiais de estudo',query||areaFilter?'Tente outra busca ou limpe os filtros para rever seus documentos.':'Guarde textos, artigos, apresentações, planilhas e imagens.',query||areaFilter?'':button('Adicionar meu primeiro arquivo','upload-pdf')));
}
async function loadDocumentPreview(){
  if(view!=='documents'||!selectedDocument)return;
  const d=state.documents.find(d=>d.id===selectedDocument),token=pdfPreviewToken;
  if(!d)return;
  try{
    const blob=await pdfFileStore('get',d.sha256);if(token!==pdfPreviewToken)return;
    if(!blob)throw new Error('O arquivo não está disponível neste navegador. Selecione o arquivo original para recuperá-lo.');
    pdfPreviewUrl=URL.createObjectURL(blob);
    const format=documentFormat(d),src=pdfPreviewUrl+(format.preview==='pdf'?'#page='+(d.page||1):'');
    if(format.preview==='pdf'){const frame=$('#pdf-viewer');frame.src=src;frame.hidden=false;}
    if(format.preview==='text'){const text=await blob.text();if(token!==pdfPreviewToken)return;const el=$('[data-document-text]');el.textContent=text;el.hidden=false;}
    if(format.preview==='image'){const el=$('[data-document-image]');el.src=pdfPreviewUrl;el.hidden=false;}
    $('[data-pdf-status]').textContent=format.preview==='download'?'Arquivo pronto para baixar. A prévia deste formato não está disponível no navegador.':'';
    const link=$('[data-open-pdf]');link.href=src;link.hidden=format.preview==='download';
    const download=$('[data-document-download]');download.href=pdfPreviewUrl;download.download=d.fileName;download.hidden=false;
  }catch(err){if(token===pdfPreviewToken){$('[data-pdf-status]').textContent=err.message;$('[data-pdf-repair]').hidden=false;}}
}
async function uploadPdfs(files,replaceId=''){
  if(pdfBusy)return;pdfBusy=true;const failures=[];let added=0,lastId='';
  const status=$('#pdf-upload-status');if(status)status.textContent='Guardando arquivos…';
  try{
    for(const file of files){
      try{
        const checked=await inspectDocument(file),existing=state.documents.find(d=>d.sha256===checked.sha256);
        if(replaceId){const d=state.documents.find(d=>d.id===replaceId);if(checked.sha256!==d.sha256)throw new Error('Selecione o arquivo original deste documento para preservar a referência das páginas.');await pdfFileStore('put',d.sha256,new Blob([file],{type:checked.mime}));lastId=d.id;continue;}
        if(existing){await pdfFileStore('put',existing.sha256,new Blob([file],{type:checked.mime}));lastId=existing.id;continue;}
        const d={id:uid(),title:file.name.replace(/\.[^.]+$/,'').slice(0,500)||'Documento',fileName:file.name.slice(0,500),size:checked.size,format:checked.format,sha256:checked.sha256,areaId:areaFilter||'',description:'',page:'',createdAt:new Date().toISOString()};
        await pdfFileStore('put',d.sha256,new Blob([file],{type:checked.mime}));state.documents.push(d);added++;lastId=d.id;
      }catch(err){failures.push(file.name+': '+err.message);}
    }
    if(added)save();
    if(lastId){selectedDocument=lastId;view='documents';query='';}
  }finally{pdfBusy=false;render();}
  if(failures.length)toast(failures.join(' · '),'error');else if(lastId)toast(added?'Arquivo guardado.':'Arquivo disponível no seu acervo.','success');
}
function documentForm(id){
  const d=state.documents.find(d=>d.id===id);
  openForm('Detalhes do documento',field('Título','title',d.title,'text','required maxlength="500"')+select('Assunto (opcional)','areaId',areaOptions(d.areaId))+`<p class="note-status">Arquivo: ${e(d.fileName)}. Excluir o documento preserva suas notas e atividades.</p>`,f=>{d.title=f.title.trim();d.areaId=f.areaId;save();render();return true;},()=>deleteRecord('documents',id));
}
function navigate(to){studyKind='all';selectedDocument='';noteDocumentFilter='';selectedDiscovery='';discoveryStatus='';noteDiscoveryFilter='';view=to;query='';areaFilter='';divisionFilter='';bookFilter='';noteFilter='';dictionaryCategory='';dictionaryLimit=24;render();window.scrollTo({top:0});}
function home(){
  const recentNotes=state.notes.filter(n=>!n.bookId).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,3);
  const activeTasks=state.tasks.filter(t=>t.columnId===state.columns[1]?.id).slice(0,3);
  const last=state.sessions.filter(s=>!s.bookId).at(-1);
  const date=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
  return pageHead('O que te move hoje?','Continue uma descoberta, explore um assunto ou dê espaço a uma ideia.',`<span class="today-label"><span></span>${e(date)}</span>`,'CURIOSIDADE É O SEU PONTO DE PARTIDA')+
  `<div class="hero"><section class="hero-card" data-spotlight><div class="hero-copy"><p class="eyebrow"><span class="hero-label-dot"></span> UM ESPAÇO. INFINITAS POSSIBILIDADES.</p><h2>Um próximo passo.<br><span>Do seu jeito.</span></h2><p>Grandes ideias começam com curiosidade.<br>Conecte o que você aprende ao que te inspira.</p><div class="button-row">${go('Explorar meus estudos '+icon('arrow'),'areas')}${go('Abrir meu quadro','board','quiet')}</div></div><div class="orbit-art" aria-hidden="true"><div class="orbit-grid"></div><div class="orbit-ring ring-one"></div><div class="orbit-ring ring-two"></div><div class="orbit-ring ring-three"></div><div class="orbit-core">${icon('spark')}</div><span class="orbit-node node-one">${icon('areas')}</span><span class="orbit-node node-two">${icon('notes')}</span><span class="orbit-node node-three"></span><span class="orbit-caption">CONECTE SUAS IDEIAS</span></div><span class="hero-footnote">${icon('leaf')} Seu ritmo é o ritmo certo.</span></section><section class="card resume-card"><div class="row"><span class="tile-icon">${icon('sessions')}</span>${badge('SEU PERCURSO',true)}</div><h2>Seu ponto de retomada</h2>${last?.next?`<p class="text-block resume-next">${e(last.next)}</p><p class="muted">${e(areaName(last.areaId))} · ${dateLabel(last.date)}</p>${go('Ver minhas sessões '+icon('arrow'),'sessions','quiet')}`:!state.timer.bookId&&(state.timer.running||state.timer.elapsedMs)?`<p>Você tem uma sessão ${state.timer.running?'em andamento':'pausada'}.</p><div class="metric" data-clock>${clock(timerElapsed(state.timer))}</div>${go('Voltar à sessão '+icon('arrow'),'sessions','quiet')}`:`<p class="muted">Toda descoberta merece uma continuação. Registre um próximo passo e encontre seu caminho de volta aqui.</p>${go('Começar uma sessão '+icon('arrow'),'sessions','quiet')}`}<div class="card-footer"><span class="small-status-dot"></span><small>Sem pressa. Sem metas impostas.</small></div></section></div>`+
  `<div class="section-title shortcut-heading"><h2>Seu universo, organizado</h2><span class="count">ESCOLHA POR ONDE COMEÇAR</span></div><div class="quick-paths">${[['areas','areas','Explore seus assuntos','Referências que abrem novos caminhos','violet'],['notes','notes','Dê forma às suas ideias','Notas, reflexões e conexões','teal'],['board','board','Tire os planos do papel','Um lugar para cada próximo passo','peach']].map(([to,symbol,title,desc,tone])=>`<button type="button" class="quick-path ${tone}" data-view="${to}"><span class="tile-icon">${icon(symbol)}</span><span class="quick-path-copy"><strong>${title}</strong><small>${desc}</small></span>${icon('arrow','path-arrow')}</button>`).join('')}</div>`+
  `<div class="home-bottom"><section class="card recent-card"><div class="row"><div class="section-heading"><span class="section-kicker">PENSAMENTOS QUE FICAM</span><h2>Ideias recentes</h2></div>${go('Ver todas '+icon('arrow'),'notes','quiet')}</div>${recentNotes.length?`<div class="list">${recentNotes.map(n=>`<div class="list-item"><span class="note-entry-icon">${icon(n.kind==='canvas'?'grid':'notes')}</span><div><strong>${e(n.title)}</strong><span class="muted">${n.kind==='canvas'?'Mural de ideias':e(n.category)}</span></div>${button('Abrir','open-note',`data-id="${n.id}"`,'quiet')}</div>`).join('')}</div>`:`<div class="home-empty"><span class="empty-art" aria-hidden="true">${icon('notes')}</span><h3>Uma ideia merece espaço.</h3><p>Uma pergunta, uma reflexão, uma possibilidade.<br>Guarde antes que ela passe.</p>${button(icon('plus')+' Escrever uma nota','new-note','','quiet')}</div>`}</section><section class="card activity-card"><div class="row"><div class="section-heading"><span class="section-kicker">DO PENSAMENTO À AÇÃO</span><h2>Atividades em andamento</h2></div>${go(icon('arrow'),'board','quiet icon-button').replace('data-view="board"','data-view="board" aria-label="Ver quadro"')}</div>${activeTasks.length?`<div class="list">${activeTasks.map(t=>`<div class="list-item"><span class="activity-check" aria-hidden="true"></span><div><strong>${e(t.title)}</strong><span class="muted">${e(areaName(t.areaId))} · ${e(t.kind)}</span></div>${button('Abrir','edit-task',`data-id="${t.id}"`,'quiet')}</div>`).join('')}</div>`:`<div class="home-empty"><span class="empty-art" aria-hidden="true">${icon('board')}</span><h3>Comece com um pequeno passo.</h3><p>Organize o que você quer explorar.<br>O caminho se constrói aos poucos.</p>${button(icon('plus')+' Nova atividade','new-task','','quiet')}</div>`}</section></div><footer class="home-footer"><span>UM LUGAR PARA APRENDER, CRIAR E CONECTAR.</span><span>Feito de curiosidade ${icon('spark')}</span></footer>`;
}

function areas(){
  const selected=state.areas.find(a=>a.id===areaFilter);
  if(selected)divisionFilter=divisionFor(selected);
  const names=divisionNames().filter(name=>state.areas.some(a=>divisionFor(a)===name));
  const subjects=state.areas.filter(a=>(!divisionFilter||divisionFor(a)===divisionFilter));
  const matchArea=id=>(!areaFilter&&!divisionFilter)?true:areaFilter?id===areaFilter:subjects.some(a=>a.id===id);
  const collectionLabel=name=>name==='Outros'?'Sem coleção':name;
  const references=state.materials.filter(m=>matchArea(m.areaId)&&includesQuery(m.title+' '+m.description+' '+areaName(m.areaId)));
  const files=state.documents.filter(d=>matchArea(d.areaId)&&includesQuery(d.title+' '+d.fileName+' '+d.description+' '+areaName(d.areaId)));
  const links=state.discoveries.filter(d=>(!areaFilter&&!divisionFilter||[...connectionsFor(d).confirmed,...connectionsFor(d).suggested.map(s=>s.area)].some(a=>matchArea(a.id)))&&includesQuery(discoveryText(d)+' '+d.areaIds.map(areaName).join(' ')));
  const notes=state.notes.filter(n=>!n.bookId&&(matchArea(n.areaId)||state.materials.some(m=>m.id===n.materialId&&matchArea(m.areaId))||state.documents.some(d=>d.id===n.documentId&&matchArea(d.areaId))||state.discoveries.some(d=>d.id===n.discoveryId&&d.areaIds.some(matchArea)))&&includesQuery(n.title+' '+n.body));
  const card=m=>`<article class="card material-card"><div class="badge-row">${badge(m.kind,true)}${m.areaId?badge(areaName(m.areaId)):badge('Sem assunto',true)}</div><h3>${m.url?`<a class="material-link" href="${e(safeUrl(m.url))}" target="_blank" rel="noopener noreferrer">${e(m.title)} ↗</a>`:e(m.title)}</h3>${m.description?`<p class="muted discovery-excerpt">${e(m.description)}</p>`:''}<div class="card-footer button-row">${button('Anotar','material-note',`data-id="${m.id}"`,'quiet')}${button('Editar','edit-material',`data-id="${m.id}"`,'quiet')}</div></article>`;
  const kinds=[['all','Tudo',references.length+files.length+links.length+notes.length],['references','Referências',references.length],['documents','Documentos',files.length],['discoveries','Links',links.length],['notes','Anotações',notes.length]];
  const items=[...(['all','references'].includes(studyKind)?references.map(card):[]),...(['all','documents'].includes(studyKind)?files.map(documentCard):[]),...(['all','discoveries'].includes(studyKind)?links.map(d=>discoveryCard(d,areaFilter||divisionFilter?subjects.filter(a=>!areaFilter||a.id===areaFilter).map(a=>a.id):[])):[]),...(['all','notes'].includes(studyKind)?notes.map(n=>`<article class="card study-note"><div class="badge-row">${badge(n.kind==='canvas'?'Mural':n.category,true)}${n.areaId?badge(areaName(n.areaId)):''}</div><h3>${e(n.title)}</h3><p class="muted discovery-excerpt">${e(n.body||n.stickies.map(p=>p.text).join(' · '))}</p><div class="card-footer">${button('Abrir anotação','open-note',`data-id="${n.id}"`,'quiet')}</div></article>`):[])];
  return pageHead('Estudos','Seus assuntos, fontes e ideias. Um espaço para conectar o que você aprende.',`<div class="button-row"><details class="add-study"><summary class="btn primary">+ Adicionar</summary><div class="add-study-menu">${button('Novo assunto','new-area','','quiet')}${button('Referência ou conteúdo','new-material','','quiet')}${button('Arquivos','upload-pdf','','quiet')}${go('Link ou vídeo','discoveries','quiet')}${button('Anotação','new-note','','quiet')}</div></details></div>`)+
    `<div class="study-layout"><aside class="study-sidebar" aria-label="Organização dos estudos"><div class="study-sidebar-head"><h2>Assuntos</h2>${button('+','new-area','aria-label="Novo assunto"','quiet')}</div>${button('Todos os estudos','all-divisions',`aria-pressed="${!areaFilter&&!divisionFilter}"`,'subject-button '+(!areaFilter&&!divisionFilter?'active':''))}${names.map(name=>`<div class="subject-group"><div class="subject-group-head">${button(e(collectionLabel(name)),'open-division',`data-division="${e(name)}" aria-pressed="${divisionFilter===name&&!areaFilter}"`,'quiet '+(divisionFilter===name&&!areaFilter?'active':''))}${name!=='Outros'?button('⋯','rename-collection',`data-division="${e(name)}" aria-label="Renomear coleção ${e(name)}"`,'quiet'):''}</div>${state.areas.filter(a=>divisionFor(a)===name).map(a=>button(`<span class="subject-dot"></span>${e(a.name)}`,'filter-area',`data-id="${a.id}" aria-pressed="${a.id===areaFilter}"`,'subject-button '+(a.id===areaFilter?'active':''))).join('')}</div>`).join('')}<p class="note-status">Coleções são opcionais. Edite um assunto para movê-lo ou organizá-lo depois.</p></aside><section class="study-content" aria-label="Materiais de estudo"><div class="study-context"><div><p class="eyebrow">${selected?e(collectionLabel(divisionFor(selected))):divisionFilter?'Coleção':'Seu acervo'}</p><h2>${e(selected?.name||collectionLabel(divisionFilter)||'Todos os estudos')}</h2><p class="muted">${e(selected?.description||'Referências, arquivos, links e anotações reunidos.')}</p></div>${selected?`<div class="button-row">${button('Editar assunto','edit-area',`data-id="${selected.id}"`,'quiet')}</div>`:''}</div><div class="filters"><label class="sr-only" for="query">Buscar nos estudos</label><input id="query" data-query value="${e(query)}" placeholder="Buscar materiais e ideias neste espaço"><label class="sr-only" for="division-filter">Filtrar por coleção</label><select id="division-filter" data-filter="division"><option value="">Todas as coleções</option>${names.map(name=>`<option value="${e(name)}" ${name===divisionFilter?'selected':''}>${e(collectionLabel(name))}</option>`).join('')}</select></div><div class="study-kinds" role="group" aria-label="Tipo de material">${kinds.map(([kind,label,count])=>button(`${label} <span>${count}</span>`,'study-kind',`data-kind="${kind}" aria-pressed="${studyKind===kind}"`,studyKind===kind?'active':'quiet')).join('')}</div>${items.length?`<div class="grid study-grid">${items.join('')}</div>`:empty('Espaço aberto para aprender',query?'Nenhum registro nesta busca. Experimente outro termo ou limpe os filtros.':'Adicione uma referência, um arquivo ou uma anotação. Você pode organizar tudo aos poucos.',query?'':button('Adicionar referência','new-material'))}</section></div>`;
}
function collectionForm(name){
  openForm('Renomear coleção',field('Nome da coleção','name',name,'text','required maxlength="100"')+'<p class="note-status">Os assuntos e todos os vínculos serão preservados. Um nome já existente reúne os assuntos na mesma coleção.</p>',f=>{const next=f.name.trim();if(!next)throw new Error('Informe o nome da coleção.');for(const a of state.areas)if(divisionFor(a)===name)a.division=next;divisionFilter=next;save();render();return true;});
}
function markdownForm(scope='',id=''){
  if(!scope){scope=view==='areas'?(areaFilter?'area':divisionFilter?'division':'all'):view==='notes'&&selectedNote?'note':view==='documents'&&selectedDocument?'document':view==='discoveries'&&selectedDiscovery?'discovery':'all';id=scope==='area'?areaFilter:scope==='division'?divisionFilter:scope==='note'?selectedNote:scope==='document'?selectedDocument:scope==='discovery'?selectedDiscovery:'';}
  const groups=[['all','Todo o acervo',[{id:'',title:'Todos os estudos'}]],['area','Assunto',state.areas],['division','Coleção',divisionNames().map(name=>({id:name,title:name}))],['note','Anotação',state.notes],['document','Documento',state.documents],['discovery','Link ou vídeo',state.discoveries],['book','Livro',state.books]];
  const scopes=groups.map(([kind,label,list])=>`<optgroup label="${label}">${list.map(x=>`<option value="${e(JSON.stringify([kind,x.id]))}" ${scope===kind&&id===x.id?'selected':''}>${e(x.name||x.title)}</option>`).join('')}</optgroup>`).join('');
  openForm('Exportar estudos em Markdown',select('O que exportar','scope',scopes)+select('Conteúdo','detail',choices(['Completo','Síntese dos registros'],'Completo'))+select('Incluir','include',choices(['Acervo e registros','Somente materiais com registros de estudo'],'Acervo e registros'))+`<div class="form-grid">${field('Registros a partir de (opcional)','from','','date')}${field('Até (opcional)','to','','date')}</div><p class="note-status">A síntese reúne trechos dos seus registros e mantém as fontes. Vídeos e arquivos não são transcritos. O arquivo .md pode ser usado em uma IA ou na criação de conteúdos.</p>`,f=>{if(f.from&&f.to&&f.from>f.to)throw new Error('A data inicial deve ser anterior à final.');const [kind,key]=JSON.parse(f.scope),content=studyMarkdown(state,{scope:kind,id:key,detail:f.detail==='Completo'?'full':'summary',recorded:f.include!=='Acervo e registros',from:f.from,to:f.to,date:today()});const blob=new Blob([content],{type:'text/markdown;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`hub-lc-estudos-${today()}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Markdown preparado com seus registros e referências.','success');return true;},null,'Baixar .md');
}
const discoveryText=d=>[d.title,d.description,...d.tags,...d.points.map(p=>p.text),...state.notes.filter(n=>n.discoveryId===d.id&&!n.bookId).map(n=>n.title+' '+n.body)].join(' ');
const connectionsFor=d=>discoveryConnections(d,state.areas,state.notes);
function discoveryCard(d,contextAreaIds=[]){
  const c=connectionsFor(d),indirect=contextAreaIds.length&&!c.confirmed.some(a=>contextAreaIds.includes(a.id));
  return `<article class="card discovery-card"><div class="badge-row">${badge(d.kind)}${badge(d.status,true)}${indirect?badge('Possível conexão',false,'info'):''}</div><h3>${e(d.title)}</h3><p class="discovery-source">${e(new URL(d.url).hostname.replace(/^www\./,''))}</p>${d.description?`<p class="muted discovery-excerpt">${e(d.description)}</p>`:''}<div class="badge-row section-gap">${c.confirmed.map(a=>badge(a.name)).join('')}${!c.confirmed.length&&c.suggested.length?badge('Sugestão: '+c.suggested[0].area.name,true):''}${d.tags.slice(0,4).map(t=>badge('#'+t,true)).join('')}</div><p class="count">${quantity(d.points.length,'ponto importante','pontos importantes')} · ${quantity(state.notes.filter(n=>n.discoveryId===d.id&&!n.bookId).length,'anotação','anotações')}</p><div class="card-footer button-row">${button('Abrir descoberta','open-discovery',`data-id="${d.id}"`)}${trash('discoveries',d.id,d.title)}<a class="btn quiet" href="${e(d.url)}" target="_blank" rel="noopener noreferrer">Abrir fonte ↗</a></div></article>`;
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
    `<div class="section-title"><h2>Meu acervo</h2><span class="count">${quantity(list.length,'descoberta')}</span></div><div class="filters"><label class="sr-only" for="query">Buscar descobertas</label><input id="query" data-query placeholder="Buscar título, ideia ou palavra-chave" value="${e(query)}"><label class="sr-only" for="discovery-status">Filtrar por situação</label><select id="discovery-status" data-filter="discovery-status"><option value="">Todas as situações</option>${choices(DISCOVERY_STATUSES,discoveryStatus)}</select><label class="sr-only" for="area-filter">Filtrar por tema</label><select id="area-filter" data-filter="area">${areaOptions(areaFilter,'Todos os temas')}</select></div>`+
    (list.length?`<div class="grid">${list.map(d=>discoveryCard(d)).join('')}</div>`:empty(query||discoveryStatus||areaFilter?'Nenhuma descoberta nesse filtro':'Uma boa ideia merece um lugar',query||discoveryStatus||areaFilter?'Tente outra busca ou limpe os filtros para rever suas descobertas.':'Salve um vídeo, artigo ou podcast. Depois registre o que ele despertou e conecte aos seus assuntos.'));
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
  `<div class="filters"><label class="sr-only" for="query">Buscar atividades</label><input id="query" data-query placeholder="Buscar atividades" value="${e(query)}"><label class="sr-only" for="area-filter">Filtrar atividades por área</label><select id="area-filter" data-filter="area">${options(state.areas,areaFilter,'Todas as áreas')}</select></div><div class="board">${state.columns.map(c=>{const tasks=state.tasks.filter(t=>t.columnId===c.id&&(!areaFilter||t.areaId===areaFilter)&&includesQuery(t.title+' '+t.details));return `<section class="column ${/^conclu[ií]d[oa]s?$/i.test(c.name.trim())?'completed-column':''}" data-column="${c.id}" aria-label="${e(c.name)}"><div class="column-head"><span>${e(c.name)}</span><span class="count">${tasks.length}</span></div>${tasks.map(t=>`<article class="task" draggable="true" data-task="${t.id}">${trash('tasks',t.id,t.title)}${badge(areaName(t.areaId))}<button type="button" class="task-edit" data-action="edit-task" data-id="${t.id}"><h3>${e(t.title)}</h3></button>${t.documentId?button('Ver documento','open-document',`data-id="${t.documentId}"`,'quiet'):''}${t.discoveryId?button('Ver descoberta','open-discovery',`data-id="${t.discoveryId}"`,'quiet'):''}<small>${e(t.kind)}${t.duration?` · ${e(t.duration)} min desejados`:''}</small>${t.due?`<small>Prazo escolhido: ${dateLabel(t.due)}</small>`:''}<select data-task-column="${t.id}" aria-label="Mover ${e(t.title)}">${state.columns.map(x=>`<option value="${x.id}" ${x.id===t.columnId?'selected':''}>${e(x.name)}</option>`).join('')}</select></article>`).join('')}${tasks.length?'':`<small>Espaço para um próximo passo.</small>`}</section>`;}).join('')}</div><p class="note-status">Arraste os cartões ou use o seletor de coluna em cada atividade.</p>`;
}
function books(){
  const list=state.books.filter(b=>(!bookFilter||b.status===bookFilter)&&includesQuery(b.title+' '+b.author));
  return pageHead('Sua biblioteca','Livros físicos, ideias que ficam. Guarde o ponto e volte quando quiser.',button('+ Livro','new-book','','primary'))+
  `<div class="filters"><label class="sr-only" for="query">Buscar livros</label><input id="query" data-query placeholder="Buscar título ou autor" value="${e(query)}"><label class="sr-only" for="book-filter">Filtrar por leitura</label><select id="book-filter" data-filter="book"><option value="">Todas as leituras</option>${choices(['Quero ler','Lendo','Pausado','Lido'],bookFilter)}</select></div>`+
  `${list.length?`<div class="grid">${list.map(b=>{const noteCount=state.notes.filter(n=>n.bookId===b.id).length;return `<article class="card book"><div class="book-spine" aria-hidden="true">${e(b.title[0])}</div><div class="book-body"><div class="badge-row">${badge(b.status||'Status livre',!b.status,b.status==='Lido'?'success':b.status==='Pausado'?'warning':b.status==='Lendo'?'info':'')}${b.areaId?badge(areaName(b.areaId),true):''}</div><h2>${e(b.title)}</h2><p>${e(b.author||'Autor não informado')}</p><div class="muted">${b.page!==''?`Retomar na página <strong>${e(b.page)}</strong>`:b.chapter?`Retomar em ${e(b.chapter)}`:'Ponto de retomada a definir'}${b.page!==''&&b.chapter?` · ${e(b.chapter)}`:''}</div>${b.total!==''&&b.page!==''?`<progress class="book-progress" max="${e(b.total)}" value="${e(b.page)}" aria-label="Progresso de leitura de ${e(b.title)}"></progress><small>${Math.round(Number(b.page)/Number(b.total)*100)}% das páginas · ${e(b.page)} de ${e(b.total)}</small>`:''}<div class="card-footer button-row">${button('Ajustar leitura','edit-book',`data-id="${b.id}"`)}${button('+ Registro','book-note',`data-id="${b.id}"`,'quiet')}${noteCount?button(`${quantity(noteCount,'registro')}`,'book-notes',`data-id="${b.id}"`,'quiet'):''}</div></div></article>`;}).join('')}</div>`:empty(query||bookFilter?'Nenhum livro neste filtro':'Uma leitura pode abrir um caminho',query||bookFilter?'Tente outro título, autor ou situação de leitura.':'Cadastre um livro que esteja lendo ou que queira conhecer.',query||bookFilter?'':button('Adicionar livro','new-book'))}`;
}
function notes(){
  const list=state.notes.filter(n=>(!noteFilter||n.bookId===noteFilter)&&(!noteDocumentFilter||n.documentId===noteDocumentFilter)&&(!noteDiscoveryFilter||n.discoveryId===noteDiscoveryFilter)&&includesQuery(n.title+' '+n.body)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  let n=list.find(x=>x.id===selectedNote);if(!n){n=list[0];selectedNote=n?.id||'';}
  const content=n?`<article class="card note-editor ${expandedCanvasId===n.id?'canvas-expanded':''}" ${expandedCanvasId===n.id?'role="dialog" aria-modal="true" aria-label="Mural ampliado"':''}><div class="editor-top"><div><div class="badge-row">${badge(n.kind==='canvas'?'Mural de ideias':n.category)}${n.areaId?badge(areaName(n.areaId),true):''}</div><h2>${e(n.title)}</h2></div><div class="button-row">${button('MD','export-note-md',`data-id="${n.id}" aria-label="Exportar anotação em Markdown"`,'quiet')}${button('Detalhes','edit-note',`data-id="${n.id}"`)}</div></div>${n.bookId||n.materialId||n.page?`<div class="note-meta">${e(bookName(n.bookId)||materialName(n.materialId))}${n.page?' · Referência '+e(n.page):''}</div>`:''}${n.discoveryId?`<div class="note-meta">Origem: ${button(discoveryName(n.discoveryId),'open-discovery',`data-id="${n.discoveryId}"`,'quiet')}</div>`:''}${n.documentId?`<div class="note-meta">Documento: ${button(documentName(n.documentId),'open-document',`data-id="${n.documentId}"`,'quiet')}</div>`:''}${n.videoUrl?`<div class="note-meta video-reference">${badge('Vídeo',true)}<a class="btn quiet" href="${e(timestampUrl(n.videoUrl,n.videoPosition||''))}" target="_blank" rel="noopener noreferrer">${n.videoPosition?'Assistir em '+e(n.videoPosition):'Abrir vídeo'} ↗</a></div>`:''}${n.kind==='text'?textEditor(n):canvasEditor(n)}<p class="note-status" data-note-status>${unsaved?'Alterações ainda não salvas':'Suas palavras estão salvas neste navegador.'}</p></article>`:empty(query||noteFilter||noteDocumentFilter||noteDiscoveryFilter?'Nenhuma anotação neste filtro':'Dê espaço às suas ideias',query||noteFilter||noteDocumentFilter||noteDiscoveryFilter?'Tente outra busca ou limpe os filtros para rever suas anotações.':'Escreva uma nota ou espalhe pensamentos em um mural.',query||noteFilter||noteDocumentFilter||noteDiscoveryFilter?'':`<div class="button-row" style="justify-content:center">${button('+ Nota','new-note')}${button('+ Mural','new-canvas')}</div>`);
  return pageHead('Seu espaço de anotações','Escreva em sequência ou pense fora das linhas.',`<div class="button-row">${button('+ Mural','new-canvas')}${button('+ Nota','new-note','','primary')}</div>`)+
  `<div class="filters"><label class="sr-only" for="query">Buscar anotações</label><input id="query" data-query placeholder="Buscar anotações" value="${e(query)}"><label class="sr-only" for="note-filter">Filtrar por livro</label><select id="note-filter" data-filter="note">${options(state.books,noteFilter,'Todas as anotações')}</select><label class="sr-only" for="note-discovery-filter">Filtrar por descoberta</label><select id="note-discovery-filter" data-filter="note-discovery">${options(state.discoveries,noteDiscoveryFilter,'Todas as descobertas')}</select><label class="sr-only" for="note-document-filter">Filtrar por documento</label><select id="note-document-filter" data-filter="note-document">${options(state.documents,noteDocumentFilter,'Todos os documentos')}</select></div><div class="note-workspace"><aside class="note-list" aria-label="Suas anotações">${list.map(x=>`<div class="note-list-item"><button type="button" data-action="open-note" data-id="${x.id}" class="${x.id===selectedNote?'active':''}" ${x.id===selectedNote?'aria-current="true"':''}><strong>${e(x.title)}</strong><small>${x.kind==='canvas'?'Mural':e(x.category)}${x.bookId?' · '+e(bookName(x.bookId)):''}</small></button>${trash('notes',x.id,x.title)}</div>`).join('')}</aside>${content}</div>`;
}
function sessions(){
  const t=state.timer;
  return pageHead('Um espaço para se dedicar','Estude livremente. Se quiser registrar o tempo, o cronômetro está aqui.',button('Registrar manualmente','new-session'))+
  `<div class="timer-layout"><section class="card timer-card"><h2>Sua sessão</h2><p class="muted">Tempo e duração são escolhas suas.</p><div class="section-gap">${select('Assunto (opcional)','timer-area',areaOptions(t.areaId))}${select('Livro (opcional)','timer-book',options(state.books,t.bookId))}${field('Duração desejada em minutos (opcional)','timer-target',t.targetMinutes,'number','min="1" max="1000000" placeholder="Sem duração definida"')}</div></section><section class="session-right"><section class="card session-clock-panel" aria-label="Cronômetro"><div class="session-clock-face" aria-hidden="true"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="53"/><path class="clock-marks" d="M60 12v5M108 60h-5M60 108v-5M12 60h5"/><g data-clock-hour><path d="M60 60V33"/></g><g data-clock-minute><path d="M60 60V23"/></g><g data-clock-second><path d="M60 66V18"/></g><circle class="clock-center" cx="60" cy="60" r="3"/></svg></div><div class="timer-clock" data-clock aria-label="Tempo registrado">${clock(timerElapsed(t))}</div><p class="timer-hint" data-timer-hint>${t.running?'Sessão em andamento':t.elapsedMs?'Sessão pausada':'O cronômetro começa só quando você quiser.'}</p><div class="button-row">${t.running?button('Pausar','pause-timer'):button(t.elapsedMs?'Continuar':'Iniciar','start-timer','','primary')}${button('Encerrar e registrar','finish-timer','',t.running||t.elapsedMs?'':'quiet')}${t.running||t.elapsedMs?button('Descartar tempo','discard-timer','','quiet'):''}</div><p class="note-status">Pausas não entram no tempo registrado. A duração escolhida não encerra sua sessão.</p></section><section class="session-history"><div class="row" style="margin-bottom:16px"><h2>Seu histórico</h2><small>${quantity(state.sessions.length,'registro')}</small></div>${state.sessions.length?`<div class="list">${[...state.sessions].reverse().map(s=>`<article class="card" style="margin-bottom:14px"><div class="row wrap"><div class="badge-row">${badge(areaName(s.areaId))}${s.bookId?badge(bookName(s.bookId),true):''}</div>${button('Editar','edit-session',`data-id="${s.id}"`,'quiet')}</div><h3>${minutesLabel(s.minutes)} · ${dateLabel(s.date)}</h3>${s.summary?`<p class="text-block">${e(s.summary)}</p>`:''}${s.next?`<div class="card-footer"><small>Próximo passo</small><p class="text-block">${e(s.next)}</p></div>`:''}</article>`).join('')}</div>`:empty('O histórico começa quando fizer sentido','Você pode usar todas as outras áreas sem registrar uma sessão.')}</section></section></div>`;
}
function evolution(){
  const cutoff=new Date();cutoff.setHours(0,0,0,0);if(evolutionPeriod!=='all')cutoff.setDate(cutoff.getDate()-Number(evolutionPeriod)+1);
  const filtered=state.sessions.filter(s=>!s.bookId&&(evolutionPeriod==='all'||new Date(`${s.date}T12:00:00`)>=cutoff));
  const total=filtered.reduce((sum,s)=>sum+s.minutes,0),parts=percentages(filtered);
  const studyNotes=state.notes.filter(n=>!n.bookId);
  return pageHead('Veja o caminho percorrido','Acompanhe a dedicação aos seus assuntos de estudo e suas descobertas.',button(state.prefs.showMetrics?'Ocultar métricas':'Mostrar métricas','toggle-metrics'))+
  `<div class="filters"><label for="period">Período</label><select id="period" data-period>${[['all','Todo o histórico'],['7','Últimos 7 dias'],['30','Últimos 30 dias']].map(([v,label])=>`<option value="${v}" ${evolutionPeriod===v?'selected':''}>${label}</option>`).join('')}</select></div>`+
  `${state.prefs.showMetrics?filtered.length?`<div class="grid"><section class="card"><small>Dedicação registrada</small><div class="metric">${minutesLabel(total)}</div><p class="muted">Em ${quantity(filtered.length,'sessão','sessões')}, no período escolhido.</p></section><section class="card"><h2>Tempo por área</h2>${parts.map(p=>`<div class="bar-row"><span>${e(areaName(p.areaId))}</span><div class="bar-track"><div class="bar-fill" style="width:${p.percent}%"></div></div><span>${Math.round(p.percent*10)/10}%</span></div>`).join('')}<small>Distribuição do seu histórico, sem proporções esperadas.</small></section></div>`:empty('Ainda não há tempo registrado neste período','Se quiser acompanhar dedicação, registre uma sessão. Suas anotações já podem contar seu percurso.'):`<div class="info-box">Métricas ocultas por sua escolha. Seus registros continuam disponíveis.</div>`}`+
  `<div class="section-title"><h2>Registros do seu percurso</h2></div><div class="grid"><section class="card"><h2>Ideias guardadas</h2><p class="muted">${studyNotes.length?`${quantity(studyNotes.length,'anotação','anotações')} de estudo, entre perguntas, reflexões e murais.`:'Notas, dúvidas e reflexões podem mostrar como suas ideias mudam.'}</p>${go('Revisitar minhas notas','notes','quiet')}</section><section class="card"><h2>Atividades</h2><p class="muted">${quantity(state.tasks.filter(t=>t.columnId===state.columns.at(-1)?.id).length,'atividade')} na última coluna do quadro.</p>${go('Meu quadro','board','quiet')}</section></div>`;
}
function dictionary(){
  const linkedDiscoveries=state.discoveries.map(d=>({discovery:d,terms:connectionsFor(d).terms}));
  const categories=[...new Set(dictionarySnapshot.terms.map(t=>t.category))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  const terms=dictionarySnapshot.terms.filter(t=>(!dictionaryCategory||t.category===dictionaryCategory)&&includesQuery([t.word,t.category,t.meaning,t.comparison,t.example].join(' '))).sort((a,b)=>a.word.localeCompare(b.word,'pt-BR'));
  const plain=value=>e(value.replace(/\\([\[\]*_`])/g,'$1').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'$1 ($2)'));
  return pageHead('Seu dicionário DEV','Palavras, significados e conexões da sua base pessoal no Notion.',`<a class="btn" href="${e(safeUrl(dictionarySnapshot.sourceUrl))}" target="_blank" rel="noopener noreferrer">Abrir no Notion ↗</a>`)+
    `<div class="info-box"><p>${dictionarySnapshot.terms.length} registros importados do Dicionário DEV em ${dateLabel(dictionarySnapshot.importedOn)} de ${dictionarySnapshot.importedOn.slice(0,4)}. Esta é uma cópia para consulta; alterações no Notion precisam de uma nova atualização.</p></div>`+
    `<div class="filters section-gap"><label class="sr-only" for="query">Buscar no dicionário</label><input id="query" data-query placeholder="Buscar palavra, significado ou exemplo" value="${e(query)}"><label class="sr-only" for="dictionary-category">Filtrar por categoria</label><select id="dictionary-category" data-filter="dictionary"><option value="">Todas as categorias</option>${choices(categories,dictionaryCategory)}</select></div><p class="note-status dictionary-count" role="status">${quantity(terms.length,'resultado')}${terms.length>dictionaryLimit?` · exibindo ${dictionaryLimit}`:''}</p>`+
    (terms.length?`<div class="grid dictionary-grid">${terms.slice(0,dictionaryLimit).map(t=>`<article class="card term-card">${badge(t.category)}<h2>${e(t.word||'Termo sem título')}</h2><p class="text-block">${plain(t.meaning||'Significado ainda não preenchido no Notion.')}</p>${t.comparison||t.example?`<details class="term-details"><summary>Comparação e exemplo</summary>${t.comparison?`<h3>Comparação</h3><p class="text-block">${plain(t.comparison)}</p>`:''}${t.example?`<h3>Exemplo</h3><p class="text-block">${plain(t.example)}</p>`:''}</details>`:''}${linkedDiscoveries.some(item=>item.terms.some(term=>term.url===t.url))?`<div class="card-footer"><p class="eyebrow">Nas suas descobertas</p><div class="connection-list">${linkedDiscoveries.filter(item=>item.terms.some(term=>term.url===t.url)).slice(0,3).map(item=>button(item.discovery.title,'open-discovery',`data-id="${item.discovery.id}"`,'quiet')).join('')}</div></div>`:''}<div class="card-footer"><a href="${e(safeUrl(t.url))}" target="_blank" rel="noopener noreferrer">Ver termo no Notion ↗</a></div></article>`).join('')}</div>${terms.length>dictionaryLimit?`<div class="section-gap">${button('Mostrar mais termos','more-terms')}</div>`:''}`:empty('Nenhum termo encontrado','Tente outra palavra ou categoria.'));
}
function settings(){return pageHead('Um espaço com a sua cara','Ajuste o ambiente e cuide dos registros que você construiu.')+`<div class="grid"><section class="card"><h2>Aparência</h2><div class="section-gap">${select('Tema','pref-theme',choices(['light','dark','system'],state.prefs.theme).replace('>light<','>Claro<').replace('>dark<','>Escuro<').replace('>system<','>Seguir o computador<'))}<div class="palette-preview"><span class="toolbar-label">Identidade Hub LC</span><div class="button-row"><span class="palette-chip violet">Violeta</span><span class="palette-chip turquoise">Turquesa</span><span class="palette-chip coral">Coral</span></div></div><label class="checkbox"><input type="checkbox" name="pref-metrics" ${state.prefs.showMetrics?'checked':''}> Mostrar métricas na evolução</label></div><div class="card-footer"><small>Horários, metas e proporções permanecem opcionais e sem valores iniciais.</small></div></section><section class="card"><h2>Seus dados</h2><p class="muted">Registros e arquivos ficam neste navegador e endereço. O backup completo inclui os arquivos disponíveis. Para acervos grandes, exporte só os registros e baixe cada arquivo.</p><div class="button-row section-gap">${button('Exportar backup','export','','primary')}${button('Importar backup','import')}${button('Só registros, sem arquivos','export-metadata','','quiet')}</div><div class="card-footer"><small>A importação substitui os registros atuais após sua confirmação. Limpar os dados do navegador também remove o salvamento local.</small></div></section><section class="card"><h2>Dicionário no Notion</h2><form id="dictionary-form" class="section-gap">${field('Endereço do seu dicionário','dictionaryUrl',state.dictionaryUrl,'url','maxlength="4000" placeholder="https://…"')}<p class="error" data-inline-error role="alert"></p><button class="btn" type="submit">Salvar endereço</button></form></section><section class="card"><h2>Seu jeito de estudar</h2><p class="muted">Assuntos, coleções e colunas podem ser editados. As fontes ficam reunidas em Estudos. Você pode estudar e escrever sem ligar o cronômetro.</p><div class="button-row section-gap">${go('Organizar estudos','areas','quiet')}${button('Exportar estudos em MD','export-md','','quiet')}${button('Organizar colunas','columns','','quiet')}</div></section></div>`;}

function enhanceFilters(){
  const filters=$('#main .filters');if(!filters||![...filters.querySelectorAll('[data-query],[data-filter]')].length)return;
  const active=[...filters.querySelectorAll('input,select')].some(el=>el.value!=='');
  const selectors={areas:'.material-card,.document-card,.discovery-card,.study-note',documents:'.document-card',discoveries:'.discovery-card',board:'.task',books:'.book',notes:'.note-list-item',dictionary:'.term-card'};
  const count=document.querySelectorAll('#main '+(selectors[view]||'.card').split(',').join(',#main ')).length;
  const message=view==='dictionary'?$('.dictionary-count')?.textContent:`${count} ${count===1?'resultado':'resultados'}${active?' com os filtros atuais':''}`;
  const summary=document.createElement('div');summary.className='filter-summary';summary.innerHTML=`${view==='dictionary'?'':`<p class="count">${e(message)}</p>`}${active?button('Limpar filtros','clear-filters','','quiet'):''}`;
  filters.after(summary);
  clearTimeout(resultAnnouncement);resultAnnouncement=setTimeout(()=>{const status=$('#navigation-status');if(status)status.textContent=message;},300);
}
function applySearch(el){query=el.value;dictionaryLimit=24;render();}
document.addEventListener('compositionend',event=>{if(event.target.matches('[data-query]'))applySearch(event.target);});
function requestDialogClose(){
  const form=$('#editor-form');if(form?.dataset.busy==='true')return;
  if(form&&JSON.stringify([...new FormData(form)])!==dialogDraft){const prompt=dialog.querySelector('[data-discard-prompt]');prompt.hidden=false;prompt.querySelector('button').focus();return;}
  closeDialog();
}
dialog.addEventListener('cancel',event=>{event.preventDefault();requestDialogClose();});
function closeDialog(result=''){
  const wasOpen=dialog.open;dialog.close(result);if(!wasOpen)return;
  if(result==='saved'&&dialogOpener?.page!==renderedPage&&view==='notes')($('#note-body')||$('.sticky textarea')||$('#main h1'))?.focus();else restoreFocus(dialogOpener);
}
function openForm(title,body,onSave,onDelete=null,label='Salvar'){
  if(!dialog.open)dialogOpener=focusSnapshot();
  saveCallback=onSave;deleteCallback=onDelete;
  dialog.innerHTML=`<form id="editor-form"><header class="dialog-head"><h2 id="dialog-title">${e(title)}</h2><button type="button" data-action="close-dialog" aria-label="Fechar">×</button></header><div class="dialog-body">${body}<p class="error" id="form-error" role="alert" tabindex="-1"></p><section class="discard-prompt" data-discard-prompt hidden role="group" aria-label="Alterações não salvas"><p>Há alterações neste formulário. Deseja continuar editando ou descartá-las?</p><div class="button-row">${button('Continuar editando','continue-editing','','primary')}${button('Descartar alterações','discard-changes','','danger')}</div></section><footer class="dialog-footer">${onDelete?button('Excluir','delete-record','','danger'):''}<div class="button-row">${button('Cancelar','close-dialog')}<button type="submit" class="btn primary">${e(label)}</button></div></footer></div></form>`;
  dialogDraft=JSON.stringify([...new FormData($('#editor-form'))]);
  dialog.returnValue='';
  dialog.showModal();
  (dialog.querySelector('input:not([type=hidden]),select,textarea')||dialog.querySelector('.dialog-footer [data-action=close-dialog]')).focus();
}
function confirmAction(title,text,onConfirm,label='Confirmar'){openForm(title,`<p>${text}</p>`,async()=>{await onConfirm();return true;},null,label);dialog.querySelector('[type=submit]').classList.add('destructive');}
function replaceRecord(collection,record){const i=state[collection].findIndex(x=>x.id===record.id);if(i<0)state[collection].push(record);else state[collection][i]=record;}
function deleteRecord(collection,id){
  const item=state[collection].find(x=>x.id===id);
  confirmAction('Excluir registro?',`Excluir “${e(item?.title||item?.name||'esta sessão')}”? ${collection==='notes'?'O texto, as marcações e os post-its desta anotação serão excluídos.':'As anotações vinculadas serão preservadas.'}`,()=>{
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
    const persisted=save();if(persisted&&collection==='documents'&&!state.documents.some(d=>d.sha256===item.sha256))pdfFileStore('delete',item.sha256).catch(err=>toast(err.message,'error'));render();if(persisted)toast('Registro excluído.','success');
  },'Excluir');
}
function areaForm(id){
  const a=state.areas.find(x=>x.id===id)||{id:uid(),name:'',division:divisionFilter||'Outros',description:''};
  openForm(id?'Editar assunto':'Novo assunto',field('Nome','name',a.name,'text','required maxlength="500"')+field('Coleção (opcional)','division',divisionFor(a)==='Outros'?'':divisionFor(a),'text','maxlength="100" list="division-names" placeholder="TI, Filosofia, Neurociência…"')+`<datalist id="division-names">${divisionNames().map(name=>`<option value="${e(name)}"></option>`).join('')}</datalist><p class="note-status">Coleções agrupam assuntos. Escolha uma, crie outra ou deixe vazio para organizar depois.</p>`+textfield('Descrição (opcional)','description',a.description,'maxlength="200000"'),f=>{replaceRecord('areas',{id:a.id,name:f.name.trim(),division:f.division.trim()||'Outros',description:f.description});divisionFilter=f.division.trim()||'Outros';areaFilter=a.id;save();render();return true;},id?()=>deleteRecord('areas',id):null);
}
function materialForm(id){
  const divisionAreas=state.areas.filter(a=>divisionFor(a)===divisionFilter);
  const m=state.materials.find(x=>x.id===id)||{id:uid(),title:'',areaId:areaFilter||(divisionAreas.length===1?divisionAreas[0].id:''),url:'',kind:'Leitura',description:''};
  openForm(id?'Editar conteúdo':'Novo conteúdo',field('Título','title',m.title,'text','required maxlength="500"')+select('Assunto (opcional)','areaId',areaOptions(m.areaId,'Organizar depois'))+select('Formato','kind',choices(['Documentação','Videoaula','Leitura','Artigo','Exercício','Projeto','Outro'],m.kind))+field('Link (opcional)','url',m.url,'url','maxlength="4000" placeholder="https://…"')+textfield('Objetivo, origem ou observações (opcional)','description',m.description,'maxlength="200000"'),f=>{if(f.url&&!safeUrl(f.url))throw new Error('Use um endereço HTTP ou HTTPS válido.');replaceRecord('materials',{id:m.id,...f,title:f.title.trim(),url:safeUrl(f.url)});divisionFilter=f.areaId?divisionFor(state.areas.find(a=>a.id===f.areaId)):'Outros';areaFilter=f.areaId;query='';save();render();return true;},id?()=>deleteRecord('materials',id):null);
}
function taskForm(id,link={}){
  const t=state.tasks.find(x=>x.id===id)||{id:uid(),title:link.title||'',discoveryId:link.discoveryId||'',documentId:link.documentId||'',areaId:link.areaId||areaFilter,columnId:state.columns[0].id,kind:'Estudo',details:link.details||'',duration:'',due:''};
  openForm(id?'Editar atividade':'Nova atividade',field('O que você quer fazer?','title',t.title,'text','required maxlength="500"')+`<div class="form-grid">${select('Assunto (opcional)','areaId',areaOptions(t.areaId))}${select('Coluna','columnId',state.columns.map(c=>`<option value="${c.id}" ${t.columnId===c.id?'selected':''}>${e(c.name)}</option>`).join(''))}${select('Tipo','kind',choices(['Estudo','Aula','Leitura','Exercício','Projeto','Revisão','Reflexão'],t.kind))}${field('Duração desejada em minutos (opcional)','duration',t.duration,'number','min="1" max="1000000" placeholder="Sem duração definida"')}${field('Prazo (opcional)','due',t.due,'date')}</div>`+select('Documento de origem (opcional)','documentId',options(state.documents,t.documentId||''))+select('Descoberta de origem (opcional)','discoveryId',options(state.discoveries,t.discoveryId||''))+textfield('Objetivo, materiais ou critério de conclusão (opcional)','details',t.details,'maxlength="200000"'),f=>{replaceRecord('tasks',{id:t.id,...f,title:f.title.trim()});save();render();return true;},id?()=>deleteRecord('tasks',id):null);
}
function bookForm(id){
  const b=state.books.find(x=>x.id===id)||{id:uid(),title:'',author:'',status:'',page:'',total:'',chapter:'',areaId:''};
  openForm(id?'Ajustar leitura':'Novo livro',field('Título','title',b.title,'text','required maxlength="500"')+field('Autor (opcional)','author',b.author,'text','maxlength="500"')+`<div class="form-grid">${select('Status','status',choices(['','Quero ler','Lendo','Pausado','Lido'],b.status))}${select('Assunto (opcional)','areaId',areaOptions(b.areaId))}${field('Página de retomada (opcional)','page',b.page,'number','min="0" step="1"')}${field('Total de páginas (opcional)','total',b.total,'number','min="1" step="1"')}</div>`+field('Capítulo ou ponto de retomada (opcional)','chapter',b.chapter,'text','maxlength="500"'),f=>{if(f.page!==''&&f.total!==''&&Number(f.page)>Number(f.total))throw new Error('A página de retomada não pode ser maior que o total de páginas.');replaceRecord('books',{id:b.id,...f,title:f.title.trim()});save();render();return true;},id?()=>deleteRecord('books',id):null);
}
function noteForm(id,kind='text',link={}){
  const n=state.notes.find(x=>x.id===id)||{id:uid(),title:'',body:'',videoUrl:'',videoPosition:'',discoveryId:link.discoveryId||'',documentId:link.documentId||'',kind,category:'Anotação',areaId:link.areaId||areaFilter||'',bookId:link.bookId||'',materialId:link.materialId||'',page:link.page||'',stickies:[],updatedAt:new Date().toISOString()};
  openForm(id?'Detalhes da anotação':kind==='canvas'?'Novo mural':'Nova anotação',field('Título','title',n.title,'text','required maxlength="500"')+`<div class="form-grid">${select('Tipo de registro','category',choices(['Anotação','Trecho','Reflexão','Dúvida'],n.category))}${select('Assunto (opcional)','areaId',areaOptions(n.areaId))}${select('Livro (opcional)','bookId',options(state.books,n.bookId))}${field('Página do trecho ou referência (opcional)','page',n.page,'text','maxlength="50"')}${select('Conteúdo (opcional)','materialId',options(state.materials,n.materialId))}${select('Descoberta (opcional)','discoveryId',options(state.discoveries,n.discoveryId||''))}${select('Documento (opcional)','documentId',options(state.documents,n.documentId||''))}</div><details class="form-details" ${n.videoUrl?'open':''}><summary>Vincular vídeo diretamente</summary>${field('Link do vídeo (opcional)','videoUrl',n.videoUrl||'','url','maxlength="4000" placeholder="https://youtube.com/watch?v=…"')}${field('Momento do vídeo (opcional)','videoPosition',n.videoPosition||'','text','maxlength="50" placeholder="08:42 ou 1:02:10"')}<p class="note-status">No YouTube, a referência abre no momento escolhido. Você também pode vincular um vídeo salvo na aba Links e vídeos.</p></details>`,f=>{if(f.videoUrl&&!safeUrl(f.videoUrl))throw new Error('Use um endereço HTTP ou HTTPS válido para o vídeo.');if(f.videoPosition&&!f.videoUrl)throw new Error('Informe o link do vídeo para guardar o momento.');replaceRecord('notes',{...n,...f,videoUrl:safeUrl(f.videoUrl),title:f.title.trim(),updatedAt:new Date().toISOString()});selectedNote=n.id;view='notes';query='';noteFilter='';noteDiscoveryFilter='';noteDocumentFilter='';save();render();return true;},id?()=>deleteRecord('notes',id):null,id?'Salvar detalhes':'Criar');
}
function sessionForm(id,fromTimer=false){
  const s=state.sessions.find(x=>x.id===id)||{id:uid(),areaId:fromTimer?state.timer.areaId:'',bookId:fromTimer?state.timer.bookId:'',minutes:fromTimer?Math.max(.01,Math.round(timerElapsed(state.timer)/600)/100):'',date:today(),summary:'',next:''};
  openForm(id?'Editar sessão':'Registrar sessão',`<div class="form-grid">${select('Assunto (opcional)','areaId',areaOptions(s.areaId))}${select('Livro (opcional)','bookId',options(state.books,s.bookId))}${field('Tempo estudado em minutos','minutes',s.minutes,'number','required min="0.01" max="1000000" step="0.01"')}${field('Data','date',s.date,'date','required')}</div>`+textfield('O que você fez ou descobriu? (opcional)','summary',s.summary,'maxlength="200000"')+textfield('Por onde quer retomar? (opcional)','next',s.next,'maxlength="200000"'),f=>{replaceRecord('sessions',{id:s.id,...f,minutes:Number(f.minutes)});if(fromTimer)state.timer={...state.timer,running:false,startedAt:null,elapsedMs:0};save();render();return true;},id?()=>deleteRecord('sessions',id):null);
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
    if(!metadataOnly&&blob.size>256*1024*1024)throw new Error('Este backup supera 256 MB. Exporte os registros sem arquivos e baixe os documentos individualmente.');
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`hub-lc-${raw?'recuperacao-':metadataOnly?'registros-':''}${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast(missing.length?`Backup preparado, mas ${quantity(missing.length,'documento sem arquivo disponível não foi incluído','documentos sem arquivo disponível não foram incluídos')}.`:metadataOnly?'Registros exportados sem os arquivos originais.':'Backup completo preparado.',missing.length?'warning':'success');
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
    confirmAction('Importar este backup?',`O arquivo contém ${quantity(pendingImport.notes.length,'anotação','anotações')}, ${quantity(pendingImport.sessions.length,'sessão','sessões')} e ${quantity(pendingImport.documents.length,'documento')}, com ${quantity(decoded.length,'arquivo incluído','arquivos incluídos')}. A importação substituirá os registros atuais deste navegador. Exporte uma cópia antes, se quiser preservá-los.`,async()=>{
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
  const seconds=elapsed/1000;for(const [part,angle] of [['hour',seconds/120],['minute',seconds/10],['second',seconds*6]])$(`[data-clock-${part}]`)?.setAttribute('transform',`rotate(${angle%360} 60 60)`);
  const hint=$('[data-timer-hint]');
  if(hint&&state.timer.targetMinutes&&elapsed>=Number(state.timer.targetMinutes)*60000)hint.textContent='Você alcançou a duração que escolheu. Pode continuar ou encerrar quando quiser.';
}
function moveTask(id,columnId){const t=state.tasks.find(t=>t.id===id);if(!t||!state.columns.some(c=>c.id===columnId))return;t.columnId=columnId;save();render();toast('Atividade movida.');}
let noteSelection=null,selectingNote=false,selectionTimer;
const markerIcon='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m14 3 7 7-9 9H5v-7zM11 6l7 7M5 19l-2 3h8"/></svg>';
function textEditor(n){return `<div class="highlight-editor"><div class="highlight-backdrop" aria-hidden="true">${highlightMarkup(n)}</div><label class="sr-only" for="note-body">Texto de ${e(n.title)}</label><textarea id="note-body" class="document" data-note-body="${n.id}" maxlength="200000" placeholder="Escreva do seu jeito. Uma ideia, uma pergunta, uma reflexão…">${e(n.body)}</textarea></div><div class="selection-tools" hidden role="toolbar" aria-label="Ferramentas do trecho selecionado"><div class="selection-actions">${button(markerIcon,'marker-palette','aria-label="Marcador de texto" title="Marcador de texto" aria-expanded="false" aria-controls="marker-palette"')}${button('⌫','mark-selection','data-color="" aria-label="Remover marcação" title="Remover marcação"')}</div><div id="marker-palette" class="marker-palette" hidden role="group" aria-label="Cor do marcador">${[['yellow','Amarelo'],['green','Verde'],['pink','Rosa']].map(([color,label])=>button(`<span class="marker-dot marker-${color}"></span><span class="sr-only">${label}</span>`,'mark-selection',`data-color="${color}" aria-label="${label}" title="${label}"`,'marker-swatch')).join('')}</div></div>`;}
function hideNoteTools(){clearTimeout(selectionTimer);selectionTimer=null;const tools=$('.selection-tools');if(tools)tools.hidden=true;noteSelection=null;}
function positionNoteTools(x,y){const tools=$('.selection-tools');if(!tools)return;const width=tools.offsetWidth,height=tools.offsetHeight;tools.style.left=Math.max(8,Math.min(innerWidth-width-8,x-width/2))+'px';tools.style.top=Math.max(8,Math.min(innerHeight-height-8,y-height-14))+'px';}
function scheduleNoteTools(){clearTimeout(selectionTimer);selectionTimer=setTimeout(()=>{selectionTimer=null;if(document.activeElement?.id==='note-body')showNoteTools();},160);}
function showNoteTools(event){
  clearTimeout(selectionTimer);selectionTimer=null;
  const editor=$('#note-body'),tools=$('.selection-tools');if(!editor||!tools||selectingNote)return;
  const start=editor.selectionStart,end=editor.selectionEnd;if(start===end){hideNoteTools();return;}
  const rect=editor.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)return;
  noteSelection={noteId:editor.dataset.noteBody,start,end};tools.hidden=false;$('#marker-palette').hidden=true;$('[data-action=marker-palette]').setAttribute('aria-expanded','false');
  const x=event?.clientX??Math.min(rect.right-20,rect.left+140),y=event?.clientY??Math.max(90,rect.top+50);tools.dataset.x=x;tools.dataset.y=y;positionNoteTools(x,y);
}
function openMarkerPalette(){const tools=$('.selection-tools'),palette=$('#marker-palette');if(!tools||!noteSelection)return;palette.hidden=!palette.hidden;$('[data-action=marker-palette]').setAttribute('aria-expanded',String(!palette.hidden));positionNoteTools(Number(tools.dataset.x),Number(tools.dataset.y));if(!palette.hidden)palette.querySelector('button').focus();}
function highlightMarkup(n){let cursor=0,html='';for(const h of n.highlights||[]){html+=e(n.body.slice(cursor,h.start))+`<mark class="marker-${h.color}">${e(n.body.slice(h.start,h.end))}</mark>`;cursor=h.end;}return html+e(n.body.slice(cursor))+'\n';}
function updateHighlightBackdrop(){const editor=$('#note-body'),backdrop=$('.highlight-backdrop'),n=currentNote();if(!editor||!backdrop||!n)return;backdrop.innerHTML=highlightMarkup(n);backdrop.style.width=editor.clientWidth+'px';backdrop.style.height=editor.clientHeight+'px';backdrop.scrollTop=editor.scrollTop;backdrop.scrollLeft=editor.scrollLeft;}
function markSelection(color){
  const editor=$('#note-body'),n=currentNote(),selection=noteSelection;if(!editor||!n||!selection||selection.noteId!==n.id)return;
  const {start,end}=selection,ranges=[];for(const h of n.highlights||[]){if(h.end<=start||h.start>=end)ranges.push(h);else{if(h.start<start)ranges.push({...h,end:start});if(h.end>end)ranges.push({...h,start:end});}}
  if(color)ranges.push({start,end,color});n.highlights=ranges.sort((a,b)=>a.start-b.start);n.updatedAt=new Date().toISOString();save();updateHighlightBackdrop();hideNoteTools();editor.focus({preventScroll:true});editor.setSelectionRange(end,end);$('[data-note-status]').textContent=unsaved?'Alterações ainda não salvas':'Marcação salva neste navegador.';
}
document.addEventListener('pointerdown',event=>{if(event.target.closest('.selection-tools'))return;hideNoteTools();selectingNote=event.target.id==='note-body';});
document.addEventListener('pointerup',event=>{if(!selectingNote)return;selectingNote=false;requestAnimationFrame(()=>showNoteTools(event));});
document.addEventListener('pointercancel',()=>{selectingNote=false;hideNoteTools();});
document.addEventListener('select',event=>{if(event.target.id!=='note-body'||selectingNote)return;if(noteSelection?.start===event.target.selectionStart&&noteSelection?.end===event.target.selectionEnd)return;scheduleNoteTools();},true);
document.addEventListener('keyup',event=>{if(event.target.id==='note-body'&&(event.key.startsWith('Arrow')||event.key==='Shift'||event.key==='a'))scheduleNoteTools();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(noteSelection){hideNoteTools();$('#note-body')?.focus({preventScroll:true});}else if(expandedCanvasId&&!dialog.open)expandCanvas();}});
document.addEventListener('scroll',event=>{if(event.target.closest?.('.selection-tools'))return;const editor=$('#note-body'),resume=editor===document.activeElement&&(noteSelection||selectionTimer)&&editor.selectionStart!==editor.selectionEnd&&!selectingNote;hideNoteTools();if(resume)scheduleNoteTools();},true);
window.addEventListener('resize',hideNoteTools);

const canvasViews=new Map();
let expandedCanvasId='',canvasGesture=null,suppressedLinkClick=null;
const canvasSize=n=>n.canvas||{width:1200,height:800};
const stickySize=p=>({width:p.width||220,height:p.height||220});
function canvasView(n){if(!canvasViews.has(n.id))canvasViews.set(n.id,{zoom:1,left:0,top:0});return canvasViews.get(n.id);}
function canvasEditor(n){
  const size=canvasSize(n),ui=canvasView(n);
  return `<div class="canvas-toolbar" role="group" aria-label="Ferramentas do mural"><div class="button-row">${button('+ Post-it','new-sticky',`data-id="${n.id}"`,'primary')}${button('Tamanho do mural','canvas-size')}${button('⛶','canvas-expand',`aria-label="${expandedCanvasId===n.id?'Fechar mural ampliado':'Ampliar mural'}" title="${expandedCanvasId===n.id?'Fechar mural ampliado (Esc)':'Ampliar mural'}" aria-pressed="${expandedCanvasId===n.id}"`)}</div><div class="canvas-zoom" role="group" aria-label="Zoom do mural">${button('−','canvas-zoom-out','aria-label="Diminuir zoom"')}<output data-canvas-zoom>${Math.round(ui.zoom*100)}%</output>${button('+','canvas-zoom-in','aria-label="Aumentar zoom"')}${button('Enquadrar','canvas-fit')}</div></div><p class="canvas-hint" id="canvas-help">Arraste ↔ até outro post-it para vincular. Mova pelo topo e ajuste o tamanho pelo canto.</p><div class="canvas-viewport" tabindex="0" role="region" aria-label="Área de trabalho do mural" aria-describedby="canvas-help"><div class="canvas-space" style="width:${size.width*ui.zoom}px;height:${size.height*ui.zoom}px"><div class="canvas" data-canvas="${n.id}" style="width:${size.width}px;height:${size.height}px;transform:scale(${ui.zoom})" aria-label="Mural de ${e(n.title)}"><svg class="sticky-links" aria-hidden="true"></svg>${n.stickies.map((p,i)=>{const dims=stickySize(p);return `<article class="sticky" data-sticky="${p.id}" data-tone="${p.tone}" style="left:${p.x}%;top:${p.y}%;width:${dims.width}px;height:${dims.height}px"><header data-drag-sticky="${p.id}"><span>Ideia ${i+1}</span><div class="sticky-controls"><button type="button" data-action="tone-sticky" data-id="${p.id}" aria-label="Mudar cor do post-it" title="Mudar cor">◐</button><button type="button" class="sticky-connect" data-connect-sticky="${p.id}" data-action="link-sticky" data-id="${p.id}" aria-label="Vincular post-it" title="Arraste até outro post-it para vincular; clique para escolher">↔</button><button type="button" data-action="remove-sticky" data-id="${p.id}" aria-label="Excluir post-it" title="Excluir post-it">${trashIcon}</button></div></header><textarea data-sticky-text="${p.id}" aria-label="Texto da ideia ${i+1}" maxlength="20000" placeholder="Uma ideia…">${e(p.text)}</textarea><footer><div class="sticky-controls">${[['←',-1,0],['→',1,0],['↑',0,-1],['↓',0,1]].map(([label,x,y])=>`<button type="button" data-action="move-sticky" data-id="${p.id}" data-x="${x}" data-y="${y}" aria-label="Mover post-it ${label}">${label}</button>`).join('')}</div><button type="button" class="sticky-resize" data-resize-sticky="${p.id}" data-action="resize-sticky" data-id="${p.id}" aria-label="Redimensionar post-it" title="Arraste para redimensionar; clique para informar medidas">⌟</button></footer></article>`;}).join('')}<button type="button" class="canvas-resize" data-resize-canvas data-action="canvas-size" aria-label="Redimensionar mural" title="Arraste para redimensionar o mural">⌟</button></div></div></div><div class="canvas-bottom"><span data-canvas-size>${size.width} × ${size.height}</span><span>Arraste o fundo para navegar · Ctrl + rolagem para zoom</span></div>${connectionList(n)}`;
}
function rememberCanvas(){const viewport=$('.canvas-viewport'),n=state?.notes.find(n=>n.id===$('[data-canvas]')?.dataset.canvas);if(n?.kind==='canvas'&&viewport)Object.assign(canvasView(n),{left:viewport.scrollLeft,top:viewport.scrollTop});}
function restoreCanvas(){const n=currentNote(),viewport=$('.canvas-viewport');if(!viewport||!n)return;const ui=canvasView(n);viewport.scrollLeft=ui.left;viewport.scrollTop=ui.top;}
function zoomCanvas(value,anchor){
  const n=currentNote(),viewport=$('.canvas-viewport'),canvas=$('.canvas'),space=$('.canvas-space');if(!n||!viewport)return;
  const ui=canvasView(n),size=canvasSize(n),old=ui.zoom,zoom=Math.max(.15,Math.min(2.5,value));
  const x=anchor?.x??viewport.clientWidth/2,y=anchor?.y??viewport.clientHeight/2;
  const worldX=(viewport.scrollLeft+x)/old,worldY=(viewport.scrollTop+y)/old;
  ui.zoom=zoom;canvas.style.transform=`scale(${zoom})`;space.style.width=size.width*zoom+'px';space.style.height=size.height*zoom+'px';
  viewport.scrollLeft=worldX*zoom-x;viewport.scrollTop=worldY*zoom-y;$('[data-canvas-zoom]').textContent=Math.round(zoom*100)+'%';rememberCanvas();
}
function frameCanvas(){const viewport=$('.canvas-viewport'),n=currentNote();if(!viewport||!n)return;const size=canvasSize(n);zoomCanvas(Math.min((viewport.clientWidth-16)/size.width,(viewport.clientHeight-16)/size.height));viewport.scrollLeft=0;viewport.scrollTop=0;rememberCanvas();}
function resizeCanvas(width,height){
  const n=currentNote(),old=canvasSize(n);width=Math.round(Math.max(480,Math.min(8000,width)));height=Math.round(Math.max(360,Math.min(8000,height)));
  for(const p of n.stickies){p.x=p.x*old.width/width;p.y=p.y*old.height/height;const dims=stickySize(p);p.width=Math.min(dims.width,width);p.height=Math.min(dims.height,height);}
  n.canvas={width,height};const canvas=$('.canvas'),space=$('.canvas-space'),zoom=canvasView(n).zoom;
  canvas.style.width=width+'px';canvas.style.height=height+'px';space.style.width=width*zoom+'px';space.style.height=height*zoom+'px';
  document.querySelectorAll('[data-sticky]').forEach(el=>{const p=n.stickies.find(p=>p.id===el.dataset.sticky);el.style.width=p.width+'px';el.style.height=p.height+'px';});
  $('[data-canvas-size]').textContent=`${width} × ${height}`;fitCanvas();
}
function canvasSizeForm(){const size=canvasSize(currentNote());openForm('Tamanho do mural',`<div class="form-grid">${field('Largura','width',size.width,'number','required min="480" max="8000" step="1"')}${field('Altura','height',size.height,'number','required min="360" max="8000" step="1"')}</div><p class="muted">Ao diminuir, os post-its são acomodados dentro da área. Seus textos e vínculos são preservados.</p>`,f=>{resizeCanvas(Number(f.width),Number(f.height));currentNote().updatedAt=new Date().toISOString();save();return true;},null,'Aplicar');}
function resizeSticky(el,p,width,height){const canvas=el.closest('.canvas');p.width=Math.round(Math.max(180,Math.min(1000,canvas.clientWidth-el.offsetLeft,width)));p.height=Math.round(Math.max(160,Math.min(1000,canvas.clientHeight-el.offsetTop,height)));el.style.width=p.width+'px';el.style.height=p.height+'px';drawConnections();}
function stickySizeForm(id){const n=currentNote(),p=n.stickies.find(p=>p.id===id),size=stickySize(p);openForm('Tamanho do post-it',`<div class="form-grid">${field('Largura','width',size.width,'number','required min="180" max="1000" step="1"')}${field('Altura','height',size.height,'number','required min="160" max="1000" step="1"')}</div>`,f=>{resizeSticky(document.querySelector(`[data-sticky="${id}"]`),p,Number(f.width),Number(f.height));n.updatedAt=new Date().toISOString();save();return true;},null,'Aplicar');}
function syncExpandedCanvas(){const expanded=!!$('.canvas-expanded');document.body.classList.toggle('canvas-is-expanded',expanded);document.querySelectorAll('.skip-link,.sidebar,.topbar,.data-warning,.page-head,.filters,.filter-summary,.note-list').forEach(el=>el.inert=expanded);}
function expandCanvas(){const n=currentNote();expandedCanvasId=expandedCanvasId===n.id?'':n.id;$('.note-editor').classList.toggle('canvas-expanded',!!expandedCanvasId);document.body.classList.toggle('canvas-is-expanded',!!expandedCanvasId);const control=$('[data-action=canvas-expand]');control.setAttribute('aria-pressed',String(!!expandedCanvasId));control.setAttribute('aria-label',expandedCanvasId?'Fechar mural ampliado':'Ampliar mural');control.title=expandedCanvasId?'Fechar mural ampliado (Esc)':'Ampliar mural';const editor=$('.note-editor');if(expandedCanvasId){editor.setAttribute('role','dialog');editor.setAttribute('aria-modal','true');editor.setAttribute('aria-label','Mural ampliado');}else{editor.removeAttribute('role');editor.removeAttribute('aria-modal');editor.removeAttribute('aria-label');}syncExpandedCanvas();control.focus();}
function appendSticky(){
  const n=currentNote();if(n.stickies.length>=200){toast('Este mural já tem 200 post-its. Crie outro mural para continuar.');return;}
  rememberCanvas();const size=canvasSize(n),ui=canvasView(n),viewport=$('.canvas-viewport');
  const columns=Math.max(1,Math.floor((Math.min(size.width,viewport.clientWidth/ui.zoom)-48)/248));const x=Math.min(size.width-240,24+(n.stickies.length%columns)*248),y=Math.min(size.height-240,24+Math.floor(n.stickies.length/columns)*248);
  n.stickies.push({id:uid(),text:'',x:Math.max(0,x)/size.width*100,y:Math.max(0,y)/size.height*100,width:220,height:220,tone:'paper'});n.updatedAt=new Date().toISOString();save();render();
  const added=document.querySelector('.sticky:last-of-type');if(added){added.scrollIntoView({block:'nearest',inline:'nearest'});added.querySelector('textarea').focus({preventScroll:true});}rememberCanvas();
}
function refreshConnections(){const n=currentNote(),list=$('[data-sticky-connections]');if(list&&n){const open=list.open;list.outerHTML=connectionList(n);$('[data-sticky-connections]').open=open;}drawConnections();}
function addStickyConnection(n,from,to){if(!to||from===to)return false;if((n.connections||[]).some(c=>(c.from===from&&c.to===to)||(c.from===to&&c.to===from))){toast('Essas ideias já estão vinculadas.');return false;}n.connections=[...(n.connections||[]),{from,to}];n.updatedAt=new Date().toISOString();save();refreshConnections();toast('Ideias vinculadas.','success');return true;}
function stickyTarget(x,y,source){return document.elementsFromPoint(x,y).map(el=>el.closest('[data-sticky]')).find(el=>el&&el.dataset.sticky!==source);}
function showConnectionTarget(target){document.querySelectorAll('.connection-target').forEach(el=>el.classList.remove('connection-target'));target?.classList.add('connection-target');}
function drawLinkPreview(){const d=canvasGesture;if(!d||!['connect','move'].includes(d.type)||!d.moved)return;const svg=$('.sticky-links');if(!svg)return;svg.querySelector('.link-preview')?.remove();if(d.type==='move'&&!d.target)return;const canvas=$('.canvas'),box=canvas.getBoundingClientRect(),zoom=canvasView(d.n).zoom;const x=d.el.offsetLeft+d.el.offsetWidth/2,y=d.el.offsetTop+d.el.offsetHeight/2,tx=d.target?d.target.offsetLeft+d.target.offsetWidth/2:(d.clientX-box.left)/zoom,ty=d.target?d.target.offsetTop+d.target.offsetHeight/2:(d.clientY-box.top)/zoom;svg.insertAdjacentHTML('beforeend',`<path class="link-preview" d="M${x},${y} Q${x+70},${ty} ${tx},${ty}"/>`);}

function stickyLabel(n,id){const i=n.stickies.findIndex(p=>p.id===id);return `Ideia ${i+1}: ${n.stickies[i]?.text.slice(0,60)||'sem texto'}`;}
function linkSticky(id){const n=currentNote(),available=n.stickies.filter(p=>p.id!==id&&!(n.connections||[]).some(c=>(c.from===id&&c.to===p.id)||(c.to===id&&c.from===p.id)));if(!available.length){toast('Adicione outro post-it ou escolha uma ideia que ainda não esteja vinculada.');return;}openForm('Vincular post-its',`<p class="text-block">De: ${e(stickyLabel(n,id))}</p>`+select('Conectar com','target',available.map(p=>`<option value="${p.id}">${e(stickyLabel(n,p.id))}</option>`).join('')),f=>{if(!available.some(p=>p.id===f.target))throw new Error('Escolha um post-it válido.');addStickyConnection(n,id,f.target);return true;},null,'Vincular');}
function connectionList(n){return `<details class="connection-list" data-sticky-connections><summary>Vínculos (${(n.connections||[]).length})</summary>${(n.connections||[]).map(c=>`<div class="connection-item"><span>${e(stickyLabel(n,c.from))} ↔ ${e(stickyLabel(n,c.to))}</span>${button(trashIcon,'unlink-sticky',`data-from="${c.from}" data-to="${c.to}" aria-label="Excluir vínculo" title="Excluir vínculo"`,'danger icon-button')}</div>`).join('')}</details>`;}
function drawConnections(){const canvas=$('.canvas'),svg=$('.sticky-links'),n=currentNote();if(!canvas||!svg||!n)return;const elements=new Map([...canvas.querySelectorAll('[data-sticky]')].map(el=>[el.dataset.sticky,el]));svg.setAttribute('viewBox',`0 0 ${canvas.clientWidth} ${canvas.clientHeight}`);svg.innerHTML=(n.connections||[]).map(c=>{const a=elements.get(c.from),b=elements.get(c.to);if(!a||!b)return '';const ax=a.offsetLeft+a.offsetWidth/2,ay=a.offsetTop+a.offsetHeight/2,bx=b.offsetLeft+b.offsetWidth/2,by=b.offsetTop+b.offsetHeight/2,dx=bx-ax,dy=by-ay;const edge=(el,x,y,dir)=>{const scale=Math.min(dx?el.offsetWidth/2/Math.abs(dx):Infinity,dy?el.offsetHeight/2/Math.abs(dy):Infinity);return [x+dir*dx*scale,y+dir*dy*scale];};if(!dx&&!dy)return '';const [x1,y1]=edge(a,ax,ay,1),[x2,y2]=edge(b,bx,by,-1);const close=Math.abs(dx)<(a.offsetWidth+b.offsetWidth)/2+24&&Math.abs(dy)<(a.offsetHeight+b.offsetHeight)/2+24;
    if(close){const left=Math.min(a.offsetLeft,b.offsetLeft),right=Math.max(a.offsetLeft+a.offsetWidth,b.offsetLeft+b.offsetWidth),useLeft=left>canvas.clientWidth-right,side=useLeft?Math.max(5,left-16):Math.min(canvas.clientWidth-5,right+16),sx=useLeft?a.offsetLeft:a.offsetLeft+a.offsetWidth,tx=useLeft?b.offsetLeft:b.offsetLeft+b.offsetWidth;return `<path d="M${sx},${ay} C${side},${ay} ${side},${by} ${tx},${by}"/><circle cx="${sx}" cy="${ay}" r="4"/><circle cx="${tx}" cy="${by}" r="4"/>`;}
    return `<path d="M${x1},${y1} L${x2},${y2}"/><circle cx="${x1}" cy="${y1}" r="4"/><circle cx="${x2}" cy="${y2}" r="4"/>`;}).join('');drawLinkPreview();}

function currentNote(){return state.notes.find(n=>n.id===selectedNote);}
function clampSticky(el,p,x,y){const canvas=el.closest('.canvas');const maxX=Math.max(0,100-el.offsetWidth/canvas.clientWidth*100),maxY=Math.max(0,100-el.offsetHeight/canvas.clientHeight*100);p.x=Math.min(maxX,Math.max(0,x));p.y=Math.min(maxY,Math.max(0,y));el.style.left=`${p.x}%`;el.style.top=`${p.y}%`;drawConnections();}
function fitCanvas(){const n=currentNote();if(!n||view!=='notes'||n.kind!=='canvas')return;document.querySelectorAll('[data-sticky]').forEach(el=>{const p=n.stickies.find(p=>p.id===el.dataset.sticky);if(p)clampSticky(el,p,p.x,p.y);});}
function raiseSticky(el){document.querySelectorAll('.sticky').forEach(p=>p.style.zIndex='1');el.style.zIndex='2';}
document.addEventListener('focusin',event=>{const el=event.target.closest('.sticky');if(el)raiseSticky(el);});
window.addEventListener('resize',fitCanvas);

document.addEventListener('click',event=>{
  if(event.target.closest('.skip-link')){event.preventDefault();$('#main')?.focus();return;}
  if(dialog.open&&$('#editor-form')?.dataset.busy==='true'&&event.target.closest('dialog'))return;
  const to=event.target.closest('[data-view]');
  if(to){event.preventDefault();navigate(to.dataset.view);return;}
  const el=event.target.closest('[data-action]');if(!el)return;
  const {action,id}=el.dataset;
  if(action==='close-dialog'){requestDialogClose();return;}
  if(action==='discard-changes'){closeDialog();return;}
  if(action==='continue-editing'){dialog.querySelector('[data-discard-prompt]').hidden=true;(dialog.querySelector('input,select,textarea')||dialog.querySelector('[type=submit]')).focus();return;}
  if(action==='clear-filters'){studyKind='all';query='';areaFilter='';divisionFilter='';bookFilter='';noteFilter='';noteDocumentFilter='';noteDiscoveryFilter='';discoveryStatus='';dictionaryCategory='';dictionaryLimit=24;render();$('#query')?.focus({preventScroll:true});return;}
  if(action==='quick-delete'){deleteRecord(el.dataset.collection,id);return;}
  if(action==='marker-palette'){openMarkerPalette();return;}
  if(action==='canvas-size'){if(suppressedLinkClick?.id==='canvas'&&Date.now()<suppressedLinkClick.until)return;canvasSizeForm();return;}
  if(action==='canvas-zoom-in'){zoomCanvas(canvasView(currentNote()).zoom*1.2);return;}
  if(action==='canvas-zoom-out'){zoomCanvas(canvasView(currentNote()).zoom/1.2);return;}
  if(action==='canvas-fit'){frameCanvas();return;}
  if(action==='canvas-expand'){expandCanvas();return;}
  if(action==='resize-sticky'){if(suppressedLinkClick?.id===id&&Date.now()<suppressedLinkClick.until)return;stickySizeForm(id);return;}
  if(action==='mark-selection'){markSelection(el.dataset.color);return;}
  if(action==='link-sticky'){if(suppressedLinkClick?.id===id&&Date.now()<suppressedLinkClick.until)return;linkSticky(id);return;}
  if(action==='unlink-sticky'){const n=currentNote();confirmAction('Excluir vínculo?','Os dois post-its serão preservados.',()=>{n.connections=n.connections.filter(c=>!(c.from===el.dataset.from&&c.to===el.dataset.to));n.updatedAt=new Date().toISOString();save();refreshConnections();},'Excluir vínculo');return;}
  if(action==='delete-record'){closeDialog();deleteCallback?.();return;}
  if(action==='export-md'){markdownForm();return;}
  if(action==='export-note-md'){markdownForm('note',id);return;}
  if(action==='export-area-md'){markdownForm(areaFilter?'area':divisionFilter?'division':'all',areaFilter||divisionFilter);return;}
  if(action==='study-kind'){studyKind=el.dataset.kind;render();return;}
  if(action==='rename-collection'){collectionForm(el.dataset.division);return;}
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
    'new-area':()=>areaForm(),'edit-area':()=>areaForm(id),'filter-area':()=>{studyKind='all';areaFilter=id;divisionFilter=divisionFor(state.areas.find(a=>a.id===id));query='';view='areas';render();},
    'open-division':()=>{studyKind='all';divisionFilter=el.dataset.division;areaFilter='';query='';render();},'all-divisions':()=>{studyKind='all';divisionFilter='';areaFilter='';query='';render();},
    'more-terms':()=>{const firstNew=dictionaryLimit;dictionaryLimit+=24;render();const heading=document.querySelectorAll('.term-card h2')[firstNew];if(heading){heading.tabIndex=-1;heading.focus();}},
    'new-material':()=>materialForm(),'edit-material':()=>materialForm(id),'material-note':()=>{const m=state.materials.find(x=>x.id===id);noteForm(null,'text',{areaId:m.areaId,materialId:id});},
    'new-task':()=>taskForm(),'edit-task':()=>taskForm(id),'columns':()=>columnsForm(),
    'new-book':()=>bookForm(),'edit-book':()=>bookForm(id),'book-note':()=>{const b=state.books.find(x=>x.id===id);noteForm(null,'text',{bookId:id,areaId:b.areaId});},'book-notes':()=>{view='notes';noteFilter=id;noteDiscoveryFilter='';noteDocumentFilter='';query='';selectedNote='';render();},
    'new-note':()=>noteForm(),'new-canvas':()=>noteForm(null,'canvas'),'edit-note':()=>noteForm(id),'open-note':()=>{if(view!=='notes'){query='';noteFilter='';noteDiscoveryFilter='';noteDocumentFilter='';}view='notes';selectedNote=id;render();},
    'new-session':()=>sessionForm(),'edit-session':()=>sessionForm(id),
    'start-timer':()=>{if(!state.timer.running){state.timer.running=true;state.timer.startedAt=Date.now();save();render();$('[data-action=pause-timer]')?.focus({preventScroll:true});}},
    'pause-timer':()=>{state.timer=pauseTimer(state.timer);save();render();$('[data-action=start-timer]')?.focus({preventScroll:true});},
    'finish-timer':()=>{if(timerElapsed(state.timer)<600){toast('Inicie o cronômetro ou registre uma sessão manualmente.');return;}state.timer=pauseTimer(state.timer);save();render();sessionForm(null,true);},
    'discard-timer':()=>confirmAction('Descartar este tempo?','O cronômetro será zerado. Nenhum registro será criado.',()=>{state.timer={...state.timer,running:false,startedAt:null,elapsedMs:0};save();render();},'Descartar'),
    'toggle-metrics':()=>{state.prefs.showMetrics=!state.prefs.showMetrics;save();render();},
    'add-column':()=>{const row=document.createElement('div');row.className='row';row.style.marginBottom='10px';const newId=uid();row.innerHTML=`<label style="flex:1"><span class="sr-only">Nome da coluna</span><input name="column-${newId}" required maxlength="500" placeholder="Nome da coluna"></label>${button('Remover','remove-column',`data-id="${newId}"`,'quiet')}`;$('#column-fields').append(row);row.querySelector('input').focus();},
    'remove-column':()=>el.closest('.row').remove(),
    'new-sticky':appendSticky,
    'remove-sticky':()=>{const n=currentNote();confirmAction('Excluir post-it?','O texto deste post-it e seus vínculos serão excluídos.',()=>{n.stickies=n.stickies.filter(p=>p.id!==id);n.connections=(n.connections||[]).filter(c=>c.from!==id&&c.to!==id);n.updatedAt=new Date().toISOString();save();render();},'Excluir');},
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
    const submit=form.querySelector('[type=submit]'),submitLabel=submit.textContent;submit.disabled=true;submit.textContent='Salvando…';form.setAttribute('aria-busy','true');
    const f=Object.fromEntries(new FormData(event.target));
    try{if(['title','name'].some(key=>key in f&&!f[key].trim()))throw new Error('Preencha o nome ou título do registro.');if(await saveCallback?.(f)!==false)closeDialog('saved');}
    catch(err){const error=$('#form-error');error.textContent=err.message;error.focus();}
    finally{form.dataset.busy='false';form.removeAttribute('aria-busy');submit.disabled=false;submit.textContent=submitLabel;}
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
  if(el.matches('[data-query]')&&!event.isComposing)applySearch(el);
  if(el.matches('[data-note-body]')){const n=state.notes.find(n=>n.id===el.dataset.noteBody);hideNoteTools();n.highlights=adjustHighlights(n.body,el.value,n.highlights||[]);n.body=el.value;updateHighlightBackdrop();n.updatedAt=new Date().toISOString();save();$('[data-note-status]').textContent=unsaved?'Alterações ainda não salvas':'Suas palavras estão salvas neste navegador.';}
  if(el.matches('[data-sticky-text]')){const n=currentNote(),p=n.stickies.find(p=>p.id===el.dataset.stickyText);p.text=el.value;n.updatedAt=new Date().toISOString();save();refreshConnections();}
});
document.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='pdf-file'||el.id==='pdf-replace-file'){uploadPdfs([...el.files],el.dataset.document||'');el.value='';return;}
  if(el.dataset.filter==='note-document'){noteDocumentFilter=el.value;selectedNote='';}
  if(el.dataset.filter==='discovery-status')discoveryStatus=el.value;
  if(el.dataset.filter==='note-discovery'){noteDiscoveryFilter=el.value;selectedNote='';}
  if(el.id==='import-file'){importData(el.files[0]);el.value='';return;}
  if(el.matches('[data-filter]')){if(el.dataset.filter==='division'){studyKind='all';divisionFilter=el.value;areaFilter='';}if(el.dataset.filter==='dictionary'){dictionaryCategory=el.value;dictionaryLimit=24;}if(el.dataset.filter==='area')areaFilter=el.value;if(el.dataset.filter==='book')bookFilter=el.value;if(el.dataset.filter==='note'){noteFilter=el.value;selectedNote='';}render();}
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
document.addEventListener('pointerdown',event=>{
  if(event.button!==0||event.target.closest('dialog'))return;
  const connect=event.target.closest('[data-connect-sticky]'),resize=event.target.closest('[data-resize-sticky]'),worldResize=event.target.closest('[data-resize-canvas]'),handle=event.target.closest('[data-drag-sticky]'),viewport=event.target.closest('.canvas-viewport');
  if(!viewport)return;const n=currentNote(),ui=canvasView(n),canvas=viewport.querySelector('.canvas'),sticky=event.target.closest('[data-sticky]');if(sticky)raiseSticky(sticky);
  let type,control;if(connect){type='connect';control=connect;}else if(resize){type='resize';control=resize;}else if(worldResize){type='canvas-resize';control=worldResize;}else if(handle&&!event.target.closest('button')){type='move';control=handle;}else if(!sticky&&!event.target.closest('button')){type='pan';control=viewport;}else return;
  event.preventDefault();control.setPointerCapture(event.pointerId);
  const p=sticky&&n.stickies.find(p=>p.id===sticky.dataset.sticky),size=canvasSize(n);
  canvasGesture={type,control,p,n,el:sticky,viewport,canvas,zoom:ui.zoom,pointerId:event.pointerId,originalStickies:type==='canvas-resize'?structuredClone(n.stickies):null,startX:event.clientX,startY:event.clientY,clientX:event.clientX,clientY:event.clientY,x:p?.x,y:p?.y,width:sticky?.offsetWidth,height:sticky?.offsetHeight,worldWidth:size.width,worldHeight:size.height,left:viewport.scrollLeft,top:viewport.scrollTop,moved:false,target:null};
  viewport.classList.toggle('is-panning',type==='pan');sticky?.classList.toggle('is-connecting',type==='connect');
});
document.addEventListener('pointermove',event=>{
  const d=canvasGesture;if(!d)return;const dx=(event.clientX-d.startX)/d.zoom,dy=(event.clientY-d.startY)/d.zoom;
  d.clientX=event.clientX;d.clientY=event.clientY;d.moved=d.moved||Math.hypot(event.clientX-d.startX,event.clientY-d.startY)>5;if(!d.moved)return;
  if(d.type==='pan'){d.viewport.scrollLeft=d.left-(event.clientX-d.startX);d.viewport.scrollTop=d.top-(event.clientY-d.startY);return;}
  if(d.type==='resize'){resizeSticky(d.el,d.p,d.width+dx,d.height+dy);return;}
  if(d.type==='canvas-resize'){resizeCanvas(d.worldWidth+dx,d.worldHeight+dy);return;}
  if(d.type==='move')clampSticky(d.el,d.p,d.x+dx/d.worldWidth*100,d.y+dy/d.worldHeight*100);
  d.target=stickyTarget(event.clientX,event.clientY,d.p.id);showConnectionTarget(d.target);drawConnections();
});
function finishCanvasGesture(cancelled=false){
  const d=canvasGesture;if(!d)return;canvasGesture=null;
  d.viewport.classList.remove('is-panning');d.el?.classList.remove('is-connecting');showConnectionTarget(null);
  if(d.control.hasPointerCapture?.(d.pointerId))d.control.releasePointerCapture(d.pointerId);
  if(d.moved&&['connect','resize','canvas-resize'].includes(d.type))suppressedLinkClick={id:d.p?.id||'canvas',until:Date.now()+500};
  if(cancelled){
    if(d.type==='move')clampSticky(d.el,d.p,d.x,d.y);
    if(d.type==='resize')resizeSticky(d.el,d.p,d.width,d.height);
    if(d.type==='canvas-resize'){resizeCanvas(d.worldWidth,d.worldHeight);for(const before of d.originalStickies||[])Object.assign(d.n.stickies.find(p=>p.id===before.id),before);document.querySelectorAll('[data-sticky]').forEach(el=>{const p=d.n.stickies.find(p=>p.id===el.dataset.sticky),size=stickySize(p);el.style.width=size.width+'px';el.style.height=size.height+'px';});fitCanvas();}
  }else if(d.moved){
    if(['move','connect'].includes(d.type)&&d.target){if(d.type==='move')clampSticky(d.el,d.p,d.x,d.y);addStickyConnection(d.n,d.p.id,d.target.dataset.sticky);}
    if(['move','resize','canvas-resize'].includes(d.type)){d.n.updatedAt=new Date().toISOString();save();}
  }
  rememberCanvas();drawConnections();
}
document.addEventListener('pointerup',()=>finishCanvasGesture());
document.addEventListener('pointercancel',()=>finishCanvasGesture(true));
document.addEventListener('lostpointercapture',()=>{if(canvasGesture)finishCanvasGesture(true);});
document.addEventListener('wheel',event=>{if(!event.ctrlKey||!event.target.closest('.canvas-viewport'))return;event.preventDefault();const viewport=$('.canvas-viewport'),box=viewport.getBoundingClientRect();zoomCanvas(canvasView(currentNote()).zoom*Math.exp(-event.deltaY*.003),{x:event.clientX-box.left,y:event.clientY-box.top});},{passive:false});
document.addEventListener('scroll',event=>{if(event.target.matches?.('.canvas-viewport'))rememberCanvas();},true);
document.addEventListener('keydown',event=>{
  if(expandedCanvasId&&event.key==='Tab'&&!dialog.open){const editor=$('.canvas-expanded');const controls=[...editor.querySelectorAll('button:not(:disabled),textarea,[tabindex="0"]')].filter(el=>el.getClientRects().length);const first=controls[0],last=controls.at(-1);if(event.shiftKey&&event.target===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&event.target===last){event.preventDefault();first.focus();}}
  if(!event.target.matches('.canvas-viewport,[data-resize-sticky]'))return;
  const n=currentNote();if(event.target.matches('[data-resize-sticky]')&&event.key.startsWith('Arrow')){event.preventDefault();const p=n.stickies.find(p=>p.id===event.target.dataset.resizeSticky),el=event.target.closest('.sticky');resizeSticky(el,p,el.offsetWidth+({ArrowLeft:-20,ArrowRight:20}[event.key]||0),el.offsetHeight+({ArrowUp:-20,ArrowDown:20}[event.key]||0));n.updatedAt=new Date().toISOString();save();return;}
  if(['+','=','-','0'].includes(event.key)){event.preventDefault();if(event.key==='0')frameCanvas();else zoomCanvas(canvasView(n).zoom*(event.key==='-'?1/1.2:1.2));}
});

window.addEventListener('beforeunload',event=>{const form=$('#editor-form');if(unsaved||(dialog.open&&form&&(form.dataset.busy==='true'||JSON.stringify([...new FormData(form)])!==dialogDraft))){event.preventDefault();event.returnValue='';}});
window.addEventListener('hashchange',()=>{const route=location.hash.slice(1);if([...nav.map(n=>n[0]),'settings'].includes(route)&&route!==view)navigate(route);});
window.addEventListener('storage',event=>{if(event.key!==STORAGE_KEY)return;try{state=readState(localStorage);recovery=false;unsaved=false;closeDialog();render();toast('Registros atualizados por outra aba.');}catch{recovery=true;closeDialog();render();}});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(state.prefs.theme==='system')appearance();});
setInterval(tick,1000);
render();

// Radial spotlight inspired by 21st.dev/aceternity/card-spotlight/default.
// Native implementation; disabled for touch and reduced-motion preferences.
root.addEventListener('pointermove',event=>{
  if(event.pointerType==='touch'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const card=event.target.closest('[data-spotlight]');if(!card)return;
  const bounds=card.getBoundingClientRect();
  card.style.setProperty('--spot-x',`${event.clientX-bounds.left}px`);
  card.style.setProperty('--spot-y',`${event.clientY-bounds.top}px`);
},{passive:true});
