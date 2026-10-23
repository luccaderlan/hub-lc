// File metadata is kept alongside the original bytes; legacy records remain PDFs.
const formats={
  pdf:['PDF','application/pdf','pdf'],
  txt:['Texto','text/plain','text'],md:['Markdown','text/markdown','text'],csv:['CSV','text/csv','text'],
  doc:['Word','application/msword','download'],docx:['Word','application/vnd.openxmlformats-officedocument.wordprocessingml.document','download'],
  odt:['OpenDocument','application/vnd.oasis.opendocument.text','download'],rtf:['RTF','application/rtf','download'],
  ppt:['PowerPoint','application/vnd.ms-powerpoint','download'],pptx:['PowerPoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','download'],
  xls:['Excel','application/vnd.ms-excel','download'],xlsx:['Excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','download'],
  epub:['EPUB','application/epub+zip','download'],
  png:['Imagem PNG','image/png','image'],jpg:['Imagem JPEG','image/jpeg','image'],jpeg:['Imagem JPEG','image/jpeg','image'],webp:['Imagem WebP','image/webp','image']
};
export const DOCUMENT_ACCEPT=Object.keys(formats).map(x=>'.'+x).join(',');
export function documentFormat(document){
  const extension=document.format||'pdf',f=Object.hasOwn(formats,extension)?formats[extension]:null;
  return {extension,supported:!!f,label:f?.[0]||'Arquivo',mime:f?.[1]||'application/octet-stream',preview:f?.[2]||'download'};
}
export async function inspectDocument(file,name=file.name||'documento.pdf'){
  const extension=name.split('.').pop().toLowerCase(),f=Object.hasOwn(formats,extension)?formats[extension]:null;
  if(!f)throw new Error('Formato não aceito. Use PDF, texto, Markdown, Office, OpenDocument, EPUB ou imagens PNG, JPEG e WebP.');
  if(!file.size||file.size>25*1024*1024)throw new Error('Escolha um arquivo não vazio de até 25 MB.');
  const bytes=await file.arrayBuffer(),head=new Uint8Array(bytes.slice(0,12));
  const starts=values=>values.every((v,i)=>head[i]===v);
  const invalid=()=>{throw new Error('O conteúdo do arquivo não corresponde ao formato '+extension.toUpperCase()+'.');};
  if(extension==='pdf'&&new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')invalid();
  if(['docx','pptx','xlsx','odt','epub'].includes(extension)&&!starts([0x50,0x4b,3,4]))invalid();
  if(['doc','ppt','xls'].includes(extension)&&!starts([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]))invalid();
  if(extension==='rtf'&&!new TextDecoder().decode(bytes.slice(0,5)).startsWith('{\\rtf'))invalid();
  if(extension==='png'&&!starts([137,80,78,71,13,10,26,10]))invalid();
  if(['jpg','jpeg'].includes(extension)&&!starts([255,216,255]))invalid();
  if(extension==='webp'&&(new TextDecoder().decode(bytes.slice(0,4))!=='RIFF'||new TextDecoder().decode(bytes.slice(8,12))!=='WEBP'))invalid();
  if(f[2]==='text'){
    try{new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new Error('Salve o texto em UTF-8 para importá-lo.');}
    if(new Uint8Array(bytes).includes(0))invalid();
  }
  const hash=await crypto.subtle.digest('SHA-256',bytes);
  return {sha256:[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join(''),size:bytes.byteLength,format:extension,mime:f[1]};
}
