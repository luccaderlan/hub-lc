import {inspectDocument,documentFormat} from './documents.js';
import {createPuzzle,validPuzzle} from './puzzle.js';
import {createGames,validGames} from './games.js';
export {inspectDocument,documentFormat} from './documents.js';
import {validateSpaces} from './spaces.js';
export const STORAGE_KEY = 'hub-lc:v1';
export const DEFAULT_DIVISIONS = ['TI','Filosofia','Neurociência','Espiritualidade','Outros'];
export const TI_STUDY_GROUPS = [
  {name:'Fundamentos e ferramentas',subjects:['Java','Maven','APIs']},
  {name:'Arquitetura e design',subjects:['Arquitetura de software','Design Patterns','Microsserviços']},
  {name:'Spring',subjects:['Spring Boot','Spring Security']},
  {name:'Persistência de dados',subjects:['PostgreSQL','Spring Data JPA Specifications']},
  {name:'Qualidade e testes',subjects:['Testes unitários','Testes de integração']},
  {name:'Infraestrutura e containers',subjects:['Docker']}
];
const additionalTiSubjects = [
  ['Arquitetura de software','Responsabilidades, camadas, coesão, acoplamento e decisões de arquitetura.'],
  ['Design Patterns','Padrões de criação, estrutura e comportamento; aplicação e critérios de escolha.'],
  ['Microsserviços','Limites de serviços, comunicação, consistência de dados, resiliência e observabilidade.'],
  ['Spring Security','Autenticação, autorização e proteção de aplicações e APIs com Spring.'],
  ['Spring Data JPA Specifications','Consultas dinâmicas com Specification, predicados e composição de filtros no Spring Data JPA.'],
  ['Testes unitários','Testes isolados de regras e componentes, cenários de borda, JUnit e Mockito.'],
  ['Testes de integração','Integração entre componentes, APIs e banco de dados; testes com Spring Boot e Testcontainers.'],
  ['Docker','Imagens, containers, Dockerfile, volumes, redes e Docker Compose.']
];
function addTiStudySubjects(state) {
  if(state.tiStudyTopicsVersion===1)return state;
  const key=name=>name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const names=new Set(state.areas.map(a=>key(a.name)));
  for(const [name,description] of additionalTiSubjects){
    if(!names.has(key(name))){state.areas.push({id:uid(),name,division:'TI',description});names.add(key(name));}
  }
  state.tiStudyTopicsVersion=1;
  return state;
}
export function divisionFor(area) {
  if (area.division !== undefined) return area.division;
  if (TI_STUDY_GROUPS.some(group=>group.subjects.includes(area.name))) return 'TI';
  if (['Filosofia','Neurociência','Espiritualidade'].includes(area.name)) return area.name;
  return 'Outros';
}
export const subgroupFor = area => area.subgroup ?? (divisionFor(area)==='TI'?TI_STUDY_GROUPS.find(g=>g.subjects.includes(area.name))?.name||'':'');
export const defaultStudyGroups = () => TI_STUDY_GROUPS.map(g=>({name:g.name,division:'TI'}));
export const uid = () => globalThis.crypto.randomUUID();
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
export function createInitial() {
  const areas = ['Java','Maven','Spring Boot','APIs','PostgreSQL','Neurociência','Filosofia','Espiritualidade'].map(name => ({ id:uid(),name,division:divisionFor({name}),description:name==='Espiritualidade'?'Despertar espiritual, autoconhecimento e reflexões pessoais.':'' }));
  const material = (title,name,url,kind='Documentação') => ({id:uid(),title,areaId:areas.find(a=>a.name===name).id,url,kind,description:'Referência inicial. Você pode editar ou remover.'});
  return addTiStudySubjects({
    schemaVersion:1, areas, studyGroups:defaultStudyGroups(),
    materials:[material('Aprender Java','Java','https://dev.java/learn/'),material('Guias do Maven','Maven','https://maven.apache.org/guides/'),material('Guias do Spring','Spring Boot','https://spring.io/guides/'),material('Tutorial do PostgreSQL','PostgreSQL','https://www.postgresql.org/docs/current/tutorial.html')],
    columns:['Ideias','Em andamento','Para revisar','Concluído'].map(name=>({id:uid(),name})),tasks:[],
    books:[['O espírito do guerreiro','Steven Pressfield'],['A arte da Guerra','Sun Tzu']].map(([title,author])=>({id:uid(),title,author,status:'',page:'',total:'',chapter:'',areaId:''})),
    notes:[],sessions:[],discoveries:[],documents:[],appointments:[],dayPlanning:{completionColumnId:'',reopenColumnId:''},quickIdeaDraft:'',
    timer:{running:false,areaId:'',bookId:'',startedAt:null,elapsedMs:0,pausedMs:0,targetMinutes:'',targetNotified:false,mode:'stopwatch',deadline:null,alertDismissed:false,pause:emptyPause()},
    puzzle:createPuzzle(),
    games:createGames(),
    prefs:{theme:'light',accent:'lc',showMetrics:true,displayName:'Lucca'},
    updatedAt:new Date().toISOString()
  });
}
export function safeUrl(value) {
  if (!value) return '';
  try { const url = new URL(value); return ['http:','https:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; }
  catch { return ''; }
}
export const DISCOVERY_STATUSES = ['Para explorar','Explorando','Guardado'];
export const MAX_PDF_BYTES=25*1024*1024;
export async function inspectPdf(file){
  if(!file.size||file.size>MAX_PDF_BYTES)throw new Error('Escolha um PDF de até 25 MB.');
  const bytes=await file.arrayBuffer();
  if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw new Error('O arquivo não tem um cabeçalho PDF válido.');
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return {sha256:[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join(''),size:bytes.byteLength};
}
let pdfDatabase;
function openPdfDatabase(){
  if(!pdfDatabase)pdfDatabase=new Promise((resolve,reject)=>{
    const req=indexedDB.open('hub-lc:pdfs',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('files');
    req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();pdfDatabase=null;};resolve(req.result);};
    req.onerror=()=>{pdfDatabase=null;reject(new Error('Não foi possível abrir o armazenamento de PDFs.'));};
    req.onblocked=()=>{pdfDatabase=null;reject(new Error('Feche outras abas do Hub para liberar o armazenamento de PDFs.'));};
  }).catch(err=>{pdfDatabase=null;throw err;});
  return pdfDatabase;
}
export async function pdfFileStore(operation,key,blob){
  const db=await openPdfDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('files',operation==='get'?'readonly':'readwrite'),store=tx.objectStore('files');
    const request=operation==='get'?store.get(key):operation==='put'?store.put(blob,key):store.delete(key);
    tx.oncomplete=()=>resolve(request.result);
    tx.onerror=tx.onabort=()=>reject(new Error('Não foi possível guardar ou recuperar o PDF neste navegador.'));
  });
}
export async function pdfBackupFiles(documents){
  const files=[],missing=[];
  for(const d of documents){
    if(files.some(f=>f.sha256===d.sha256))continue;
    const blob=await pdfFileStore('get',d.sha256);
    if(!blob){missing.push(d.fileName);continue;}
    const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(new Error('Não foi possível preparar os PDFs para o backup.'));reader.readAsDataURL(blob);});
    files.push({sha256:d.sha256,data});
  }
  return {files,missing};
}
export async function decodePdfBackup(documents,files){
  if(!Array.isArray(files)||files.length>documents.length)throw new Error('Arquivos inválidos no backup.');
  const hashes=new Set(),decoded=[];
  for(const file of files){
    if(!file||typeof file.data!=='string'||file.data.length>Math.ceil(MAX_PDF_BYTES/3)*4||!file.data.length||file.data.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(file.data)||hashes.has(file.sha256))throw new Error('Arquivos inválidos no backup.');
    const document=documents.find(d=>d.sha256===file.sha256);if(!document)throw new Error('O backup contém um arquivo sem cadastro correspondente.');
    const bytes=Uint8Array.from(atob(file.data),c=>c.charCodeAt(0)),blob=new Blob([bytes],{type:documentFormat(document).mime}),checked=await inspectDocument(blob,document.fileName);
    if(checked.sha256!==document.sha256||checked.size!==document.size)throw new Error('O arquivo do backup não corresponde ao documento cadastrado.');
    hashes.add(file.sha256);decoded.push({sha256:file.sha256,blob});
  }
  return decoded;
}
export const DISCOVERY_KINDS = ['Vídeo','Artigo','Podcast','Outro'];
export function makeDiscovery(url,title='',description='') {
  const checked=safeUrl(url.trim());
  if(!checked)throw new Error('Use um endereço HTTP ou HTTPS válido.');
  const host=new URL(checked).hostname.replace(/^www\./,'');
  const video=['youtube.com','youtu.be','vimeo.com','tiktok.com'].some(domain=>host===domain||host.endsWith('.'+domain));
  const now=new Date().toISOString();
  return {id:uid(),url:checked,title:title.trim()||host,description:description.trim(),kind:video?'Vídeo':'Outro',status:'Para explorar',tags:[],areaIds:[],points:[],createdAt:now,updatedAt:now};
}
const normalized=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function discoveryConnections(discovery,areas,notes=[]) {
  // Sugestões usam somente o que a pessoa registrou; o conteúdo remoto não é consultado.
  const text=[discovery.title,discovery.description,...discovery.tags,...discovery.points.map(p=>p.text),...notes.filter(n=>n.discoveryId===discovery.id&&!n.bookId).map(n=>n.title+' '+n.body)].join(' ');
  const normalizedText=' '+normalized(text)+' ';
  const mentions=term=>{const keyword=normalized(term);return keyword.length>=3&&normalizedText.includes(' '+keyword+' ');};
  const hints={Java:['java'],Maven:['maven'], 'Spring Boot':['spring boot','spring'],APIs:['api','apis','rest','http'],PostgreSQL:['postgresql','postgres'],Neurociência:['neurociência','cérebro','memória','neurônios','neuroplasticidade'],Filosofia:['filosofia','filosófico','estoicismo','ética','Sócrates'],Espiritualidade:['espiritualidade','espiritual','meditação','autoconhecimento']};
  const confirmed=areas.filter(a=>discovery.areaIds.includes(a.id));
  const suggested=areas.filter(a=>!discovery.areaIds.includes(a.id)).flatMap(a=>{
    const match=[a.name,...(hints[a.name]||[])].find(mentions);
    return match?[{area:a,reason:`Você registrou “${match}”.`}]:[];
  });
  return {confirmed,suggested};
}
export function timestampUrl(url,position) {
  const checked=safeUrl(url);
  if(!checked)return '';
  const parts=position.trim().split(':');
  if(!/^\d{1,3}:\d{2}(?::\d{2})?$/.test(position.trim())||parts.slice(1).some(p=>Number(p)>59))return checked;
  const seconds=parts.reduce((total,part)=>total*60+Number(part),0);
  const target=new URL(checked),host=target.hostname.replace(/^www\./,'');
  if(host==='youtu.be'||host==='youtube.com'||host.endsWith('.youtube.com')){target.searchParams.set('t',String(seconds)+'s');return target.href;}
  return checked;
}
export function timerElapsed(timer, now=Date.now()) {
  return Math.max(0, timer.elapsedMs + (timer.running ? Math.max(0,now-timer.startedAt) : 0));
}
export function pauseElapsed(timer,now=Date.now()){return !timer.running&&timer.pause?.startedAt!=null?Math.max(0,now-timer.pause.startedAt):0;}
export function totalPauseElapsed(timer,now=Date.now()){return (timer.pausedMs||0)+pauseElapsed(timer,now);}
export function pauseTimer(timer, now=Date.now()) {
  return {...timer,elapsedMs:timerElapsed(timer,now),startedAt:null,running:false,pause:timer.running?{...emptyPause(),startedAt:now}:(timer.pause||emptyPause())};
}
export function emptyPause(){return {startedAt:null,minutes:'',endsAt:null,notified:false};}
export function resumeTimer(timer,now=Date.now()){
  timer=completeTimer(timer,now);
  if(timerFinished(timer,now))timer={...timer,mode:'stopwatch',targetMinutes:'',deadline:null,targetNotified:false,alertDismissed:false};
  return timer.running?timer:{...timer,running:true,startedAt:now,pausedMs:totalPauseElapsed(timer,now),pause:emptyPause()};
}
export function resetTimer(timer){
  return {...timer,running:false,startedAt:null,elapsedMs:0,pausedMs:0,targetNotified:false,deadline:null,alertDismissed:false,pause:emptyPause()};
}
export function setPauseReminder(timer,minutes,now=Date.now()){
  if(timer.running||timer.pause?.startedAt==null)throw new Error('Pause a sessão antes de definir um lembrete.');
  if(typeof minutes!=='string'||(minutes!==''&&(!Number.isInteger(Number(minutes))||Number(minutes)<1||Number(minutes)>1000000)))throw new Error('Informe uma duração entre 1 e 1000000 minutos.');
  return {...timer,pause:{...timer.pause,minutes,endsAt:minutes===''?null:now+Number(minutes)*60000,notified:false}};
}
export function timerDisplay(timer,now=Date.now()){
  if(timer.mode==='deadline')return Math.max(0,(timer.deadline??now)-now);
  if(timer.mode==='countdown')return Math.max(0,Number(timer.targetMinutes)*60000-timerElapsed(timer,now));
  return timerElapsed(timer,now);
}
// Settle at the actual limit, even when a background tab wakes up late.
export function timerFinished(timer,now=Date.now()){
  return ['countdown','deadline'].includes(timer.mode)&&(timer.running||timer.elapsedMs>0||timer.pause?.startedAt!=null)&&(timer.mode==='deadline'?timer.deadline!==null:!!timer.targetMinutes)&&timerDisplay(timer,now)===0;
}
export function completeTimer(timer,now=Date.now()){
  if(!timer.running||!timerFinished(timer,now))return timer;
  const elapsed=timerElapsed(timer,now);
  const elapsedMs=timer.mode==='countdown'?Number(timer.targetMinutes)*60000:timerElapsed(timer,Math.min(now,timer.deadline));
  const endedAt=timer.mode==='countdown'?now-Math.max(0,elapsed-elapsedMs):timer.deadline;
  return {...timer,running:false,startedAt:null,elapsedMs,pause:{...emptyPause(),startedAt:endedAt}};
}
export function timerNotices(timer,now=Date.now()){
  return {
    study:!timer.targetNotified&&(timer.mode==='deadline'?timer.deadline!=null&&(timer.running||timer.elapsedMs>0||timer.pause?.startedAt!=null)&&now>=timer.deadline:!!timer.targetMinutes&&timerElapsed(timer,now)>=Number(timer.targetMinutes)*60000),
    pause:!timer.running&&timer.pause?.endsAt!=null&&!timer.pause.notified&&now>=timer.pause.endsAt
  };
}
export function percentages(sessions) {
  const total=sessions.reduce((sum,s)=>sum+s.minutes,0);
  if (!total) return [];
  const values=new Map();
  for(const s of sessions) values.set(s.areaId,(values.get(s.areaId)||0)+s.minutes);
  return [...values].map(([areaId,minutes])=>({areaId,minutes,percent:minutes/total*100})).sort((a,b)=>b.minutes-a.minutes);
}
// Importação e leitura usam o mesmo contrato: dados inválidos não sobrescrevem registros.
export function validLocalDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'0001-01-01')return false;
  const date=new Date(value+'T12:00:00');
  return Number.isFinite(date.getTime())&&date.getFullYear()===Number(value.slice(0,4))&&date.getMonth()+1===Number(value.slice(5,7))&&date.getDate()===Number(value.slice(8,10));
}
export function dayAppointments(state,date=today()){
  return state.appointments.filter(a=>a.date===date).sort((a,b)=>(a.time||'99:99').localeCompare(b.time||'99:99')||a.title.localeCompare(b.title));
}
export function movePlannedTask(state,id,columnId){
  const task=state.tasks.find(t=>t.id===id);
  if(!task||!state.columns.some(c=>c.id===columnId))return;
  if(columnId===state.dayPlanning.completionColumnId&&task.columnId!==columnId)task.previousColumnId=task.columnId;
  task.columnId=columnId;
}
export function validateState(input) {
  const fail=()=>{throw new Error('Backup inválido ou incompatível com esta versão do Hub LC.');};
  if (!input || input.schemaVersion!==1) fail();
  if(input.tiStudyTopicsVersion!==undefined&&input.tiStudyTopicsVersion!==1)fail();
  input={...input,discoveries:input.discoveries===undefined?[]:input.discoveries,documents:input.documents===undefined?[]:input.documents};
  // Drop retired personal dictionary data when reading older storage or backups.
  input={...input};
  delete input.customTerms;delete input.hiddenTerms;delete input.dictionaryUrl;
  input={...input,appointments:input.appointments===undefined?[]:input.appointments,dayPlanning:input.dayPlanning===undefined?{completionColumnId:'',reopenColumnId:''}:input.dayPlanning,quickIdeaDraft:input.quickIdeaDraft===undefined?'':input.quickIdeaDraft};
  const collections=['appointments','areas','materials','columns','tasks','books','notes','sessions','discoveries','documents'];
  for (const key of collections) if (!Array.isArray(input[key]) || input[key].length>10000) fail();
  const string=(v,max=200000)=>typeof v==='string' && v.length<=max;
  if(input.studyGroups!==undefined&&(!Array.isArray(input.studyGroups)||input.studyGroups.length>10000||input.studyGroups.some(g=>!g||!string(g.name,100)||!g.name.trim()||!string(g.division,100)||!g.division.trim())))fail();
  for(const a of input.areas)if(a.subgroup!==undefined&&!string(a.subgroup,100))fail();
  const ids=new Set();
  for(const key of collections) for(const item of input[key]) {
    if(!item || !string(item.id,200) || !/^[A-Za-z0-9_-]+$/.test(item.id) || ids.has(item.id)) fail();
    ids.add(item.id);
  }
  for(const b of input.books)if((b.journal!==undefined&&!string(b.journal))||(b.nextStep!==undefined&&!string(b.nextStep,2000)))fail();
  for(const a of input.areas) if(!string(a.name,500)||!a.name.trim()||!string(a.description)||(a.division!==undefined&&(!string(a.division,100)||!a.division.trim()))) fail();
  if(!input.columns.length) fail();
  for(const c of input.columns) if(!string(c.name,500)||!c.name.trim()) fail();
  const areaIds=new Set(input.areas.map(a=>a.id)),columnIds=new Set(input.columns.map(c=>c.id)),bookIds=new Set(input.books.map(b=>b.id)),materialIds=new Set(input.materials.map(m=>m.id)),discoveryIds=new Set(input.discoveries.map(d=>d.id)),documentIds=new Set(input.documents.map(d=>d.id));
  const ref=(id,set)=>string(id,200) && (!id || set.has(id));
  const plan=input.dayPlanning;
  if(!plan||!ref(plan.completionColumnId,columnIds)||!ref(plan.reopenColumnId,columnIds)||(plan.completionColumnId&&plan.completionColumnId===plan.reopenColumnId)||!string(input.quickIdeaDraft))fail();
  for(const a of input.appointments)if(!string(a.title,500)||!a.title.trim()||!validLocalDate(a.date)||!string(a.time,5)||(a.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(a.time))||!string(a.location,500)||!string(a.details))fail();
  for(const t of input.tasks)if((t.plannedDate!==undefined&&t.plannedDate!==''&&!validLocalDate(t.plannedDate))||(t.previousColumnId!==undefined&&!ref(t.previousColumnId,columnIds)))fail();

  for(const d of input.documents)if((d.format!==undefined&&(!string(d.format,10)||!documentFormat(d).supported||d.format!==documentFormat(d).extension))||!string(d.title,500)||!d.title.trim()||!string(d.fileName,500)||!d.fileName.trim()||!Number.isInteger(d.size)||d.size<=0||d.size>MAX_PDF_BYTES||!string(d.sha256,64)||!/^[a-f0-9]{64}$/.test(d.sha256)||!ref(d.areaId,areaIds)||!string(d.description)||!string(d.page,30)||(d.page!==''&&(!/^\d+$/.test(d.page)||Number(d.page)<1||Number(d.page)>1000000))||!string(d.createdAt,100))fail();
  for(const d of input.discoveries) {
    if(!string(d.title,500)||!d.title.trim()||!string(d.url,4000)||!safeUrl(d.url)||!string(d.description)||!DISCOVERY_KINDS.includes(d.kind)||!DISCOVERY_STATUSES.includes(d.status)||!string(d.createdAt,100)||!string(d.updatedAt,100)||!Array.isArray(d.tags)||d.tags.length>30||d.tags.some(t=>!string(t,100)||!t.trim())||!Array.isArray(d.areaIds)||d.areaIds.length>100||new Set(d.areaIds).size!==d.areaIds.length||d.areaIds.some(id=>!id||!ref(id,areaIds))||!Array.isArray(d.points)||d.points.length>200)fail();
    const pointIds=new Set();
    for(const p of d.points){
      if(!p||!string(p.id,200)||!/^[A-Za-z0-9_-]+$/.test(p.id)||pointIds.has(p.id)||!string(p.text,20000)||!p.text.trim()||!string(p.position,50))fail();
      pointIds.add(p.id);
    }
  }
  for(const m of input.materials) if(!string(m.title,500)||!m.title.trim()||!ref(m.areaId,areaIds)||!string(m.kind,100)||!string(m.description)||!string(m.url,4000)||(m.url&&!safeUrl(m.url))) fail();
  for(const t of input.tasks) if(!string(t.title,500)||!t.title.trim()||!ref(t.areaId,areaIds)||!columnIds.has(t.columnId)||!string(t.kind,100)||!string(t.details)||!string(t.duration,30)||!string(t.due,30)) fail();
  for(const t of input.tasks)if(t.discoveryId!==undefined&&!ref(t.discoveryId,discoveryIds))fail();
  for(const t of input.tasks)if(t.documentId!==undefined&&!ref(t.documentId,documentIds))fail();
  const numberText=v=>string(v,30) && (v==='' || (Number.isFinite(Number(v)) && Number(v)>=0));
  for(const b of input.books) if(!string(b.title,500)||!b.title.trim()||!string(b.author,500)||!['','Quero ler','Lendo','Pausado','Lido'].includes(b.status)||!numberText(b.page)||!numberText(b.total)||!string(b.chapter,500)||!ref(b.areaId,areaIds)||(b.total!==''&&Number(b.total)<=0)||(b.page!==''&&b.total!==''&&Number(b.page)>Number(b.total))) fail();
  for(const n of input.notes.flatMap(n=>n.visual?[n,n.visual]:[n])) {
    if(n.videoUrl!==undefined&&(!string(n.videoUrl,4000)||(n.videoUrl&&!safeUrl(n.videoUrl))))fail();
    if(n.sourceUrl!==undefined&&(!string(n.sourceUrl,4000)||(n.sourceUrl&&!safeUrl(n.sourceUrl))))fail();
    if(n.sourceTitle!==undefined&&!string(n.sourceTitle,500))fail();
    if(n.videoPosition!==undefined&&!string(n.videoPosition,50))fail();
    if(n.documentId!==undefined&&!ref(n.documentId,documentIds))fail();
    if(n.discoveryId!==undefined&&!ref(n.discoveryId,discoveryIds))fail();
    if(!string(n.title,500)||!n.title.trim()||!string(n.body)||!['text','canvas'].includes(n.kind)||!['Anotação','Trecho','Reflexão','Dúvida'].includes(n.category)||!ref(n.areaId,areaIds)||!ref(n.bookId,bookIds)||!ref(n.materialId,materialIds)||!string(n.page,50)||!string(n.updatedAt,100)||!Array.isArray(n.stickies)||n.stickies.length>200) fail();
    if(n.canvas!==undefined&&(!n.canvas||!Number.isInteger(n.canvas.width)||!Number.isInteger(n.canvas.height)||n.canvas.width<480||n.canvas.width>8000||n.canvas.height<360||n.canvas.height>8000))fail();
    if(n.highlights!==undefined){
      if(!Array.isArray(n.highlights)||n.highlights.length>200000)fail();
      let end=0;for(const h of n.highlights){if(!h||!Number.isInteger(h.start)||!Number.isInteger(h.end)||h.start<end||h.end<=h.start||h.end>n.body.length||!['yellow','green','pink'].includes(h.color))fail();end=h.end;}
    }
    const stickyIds=new Set();
    for(const p of n.stickies) {
      if(!p||!string(p.id,200)||!/^[A-Za-z0-9_-]+$/.test(p.id)||stickyIds.has(p.id)||!string(p.text,20000)||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>100||p.y<0||p.y>100||!['paper','jade','rose'].includes(p.tone)) fail();
      if(p.width!==undefined&&(!Number.isInteger(p.width)||p.width<180||p.width>1000))fail();
      if(p.height!==undefined&&(!Number.isInteger(p.height)||p.height<160||p.height>1000))fail();
      stickyIds.add(p.id);
    }
    if(n.connections!==undefined){
      if(!Array.isArray(n.connections)||n.connections.length>19900)fail();
      const pairs=new Set();for(const c of n.connections){if(!c||!stickyIds.has(c.from)||!stickyIds.has(c.to)||c.from===c.to)fail();const pair=[c.from,c.to].sort().join(':');if(pairs.has(pair))fail();pairs.add(pair);}
    }
  }
  for(const s of input.sessions) if(!ref(s.areaId,areaIds)||!ref(s.bookId,bookIds)||!Number.isFinite(s.minutes)||s.minutes<=0||s.minutes>1000000||!string(s.date,10)||!/^\d{4}-\d{2}-\d{2}$/.test(s.date)||!string(s.summary)||!string(s.next)) fail();
  const t=input.timer,p=input.prefs;
  if(!t||typeof t.running!=='boolean'||!ref(t.areaId,areaIds)||!ref(t.bookId,bookIds)||!Number.isFinite(t.elapsedMs)||t.elapsedMs<0||!numberText(t.targetMinutes)||(t.targetMinutes!==''&&Number(t.targetMinutes)<=0)||!(t.startedAt===null||Number.isFinite(t.startedAt))||(t.running&&t.startedAt===null)) fail();
  if(!p||!['light','dark','system'].includes(p.theme)||!['lc','petroleum','jade','plum'].includes(p.accent)||typeof p.showMetrics!=='boolean'||!string(input.updatedAt,100)) fail();
  if(p.displayName!==undefined&&!string(p.displayName,100))fail();
  validateSpaces(input,fail);
  const checked=structuredClone(input);
  if(checked.puzzle===undefined)checked.puzzle=createPuzzle();
  if(!validPuzzle(checked.puzzle))fail();
  if(checked.games===undefined)checked.games=createGames();
  if(!validGames(checked.games))fail();
  checked.studyGroups??=defaultStudyGroups();
  const timer=checked.timer;
  timer.pausedMs??=0;if(!Number.isFinite(timer.pausedMs)||timer.pausedMs<0)fail();
  if(timer.targetNotified===undefined)timer.targetNotified=false;
  if(timer.mode===undefined)timer.mode='stopwatch';
  if(timer.deadline===undefined)timer.deadline=null;
  if(timer.alertDismissed===undefined)timer.alertDismissed=false;
  if(!['stopwatch','countdown','deadline'].includes(timer.mode)||typeof timer.alertDismissed!=='boolean'||!(timer.deadline===null||(Number.isSafeInteger(timer.deadline)&&timer.deadline>=0&&timer.deadline<=8640000000000000)))fail();
  if(timer.pause===undefined)timer.pause={...emptyPause(),startedAt:!timer.running&&timer.elapsedMs>0?Date.now():null};
  const pause=timer.pause;
  const timestamp=value=>Number.isSafeInteger(value)&&value>=0&&value<=8640000000000000;
  if(typeof timer.targetNotified!=='boolean'||!pause||typeof pause.notified!=='boolean'||!string(pause.minutes,30)||(pause.minutes!==''&&(!Number.isInteger(Number(pause.minutes))||Number(pause.minutes)<1||Number(pause.minutes)>1000000))||!(pause.startedAt===null||timestamp(pause.startedAt))||!(pause.endsAt===null||timestamp(pause.endsAt))||(timer.running&&pause.startedAt!==null)||(pause.startedAt===null&&(pause.minutes!==''||pause.endsAt!==null||pause.notified))||(pause.minutes===''&&(pause.endsAt!==null||pause.notified))||(pause.minutes!==''&&pause.endsAt===null))fail();
  checked.prefs.accent='lc';
  for(const area of checked.areas) area.division=divisionFor(area);
  return checked;
}
export function readState(storage) {
  const raw=storage.getItem(STORAGE_KEY);
  return raw ? validateState(addTiStudySubjects(validateState(JSON.parse(raw)))) : createInitial();
}
export function writeState(storage,state) {
  const checked=validateState(state);
  const raw=JSON.stringify(checked);
  storage.setItem(STORAGE_KEY,raw);
  return raw;
}

// Preserve highlights around an edited span; replacement text inherits an enclosing mark.
export function adjustHighlights(before,after,ranges){
  let start=0;while(start<before.length&&start<after.length&&before[start]===after[start])start++;
  let oldEnd=before.length,newEnd=after.length;while(oldEnd>start&&newEnd>start&&before[oldEnd-1]===after[newEnd-1]){oldEnd--;newEnd--;}
  const delta=newEnd-oldEnd;
  return ranges.map(h=>{
    if(h.end<=start)return {...h};
    if(h.start>=oldEnd)return {...h,start:h.start+delta,end:h.end+delta};
    return {...h,start:Math.min(h.start,start),end:h.end>=oldEnd?h.end+delta:newEnd};
  }).filter(h=>h.end>h.start).reduce((result,h)=>{const last=result.at(-1);if(last&&h.start<last.end)h={...h,start:last.end};if(h.end>h.start)result.push(h);return result;},[]);
}
