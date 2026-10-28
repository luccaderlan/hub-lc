// Workspace metadata stays with its owner. Binary files reuse the content-addressed
// IndexedDB store; removing a reference never deletes shared bytes.
export const SPACE_TABS=['overview','notebook','topics','canvas','images','materials'];
export const IMAGE_LIMIT=12*1024*1024;
export const IMAGE_PIXELS=40000000;
export function spaceFiles(state){
  return [...state.documents,...[...state.books,...state.notes].flatMap(item=>[...(item.cover?[item.cover]:[]),...(item.space?.images||[]),...(item.space?.materials||[]).filter(m=>m.sha256)])];
}
export function spaceText(item){return [item.space?.description,...(item.space?.images||[]).flatMap(i=>[i.title,i.caption,i.alt,i.source,i.comment,i.group]),...(item.space?.materials||[]).flatMap(m=>[m.title,m.comment]),...(item.space?.topics||[]).flatMap(t=>[t.title,t.body])].filter(Boolean).join(' ');}
export function newVisual(note){return {id:globalThis.crypto.randomUUID(),title:note.title,body:'',kind:'canvas',category:'Anotação',areaId:'',bookId:'',materialId:'',page:'',updatedAt:note.updatedAt,stickies:[],connections:[]};}
export function validateSpaces(state,fail){
  const str=(v,max=200000)=>typeof v==='string'&&v.length<=max;
  const id=v=>str(v,200)&&/^[A-Za-z0-9_-]+$/.test(v);
  const url=v=>{try{const parsed=new URL(v);return ['https:','http:'].includes(parsed.protocol)&&!parsed.username&&!parsed.password;}catch{return false;}};
  const file=(f,image=false)=>{
    if(!f||!str(f.fileName,500)||!f.fileName.trim()||!str(f.sha256,64)||!/^[a-f0-9]{64}$/.test(f.sha256)||!Number.isInteger(f.size)||f.size<=0||f.size>(image?IMAGE_LIMIT:25*1024*1024)||!['pdf','txt','md','csv','doc','docx','xls','xlsx','ppt','pptx','odt','rtf','epub','png','jpg','jpeg','webp'].includes(f.format))fail();
    if(image&&!['png','jpg','jpeg','webp'].includes(f.format))fail();
  };
  const ids=new Set();const visualIds=new Set([...state.books,...state.notes].map(i=>i.id));
  for(const item of [...state.books,...state.notes]){
    if(item.cover!==undefined)file(item.cover,true);
    if(item.visual!==undefined&&(!item.visual||item.kind!=='text'||!id(item.visual.id)||visualIds.has(item.visual.id)||item.visual.kind!=='canvas'||item.visual.visual!==undefined||item.visual.space!==undefined))fail();
    if(item.visual)visualIds.add(item.visual.id);
    if(item.space===undefined){const inherited=new Set((state.books.find(b=>b.id===item.bookId)?.space?.images||[]).map(i=>i.id));for(const p of (item.visual||item).stickies||[])if(p.imageId!==undefined&&!inherited.has(p.imageId))fail();continue;}
    const s=item.space;if(!s||typeof s!=='object'||Array.isArray(s))fail();
    if(s.description!==undefined&&!str(s.description))fail();
    for(const key of ['images','materials','topics']){
      if(s[key]===undefined)continue;
      if(!Array.isArray(s[key])||s[key].length>1000)fail();
      for(const x of s[key]){
        if(!x||!id(x.id)||ids.has(x.id))fail();ids.add(x.id);
        if(key==='images'){
          file(x,true);
          for(const k of ['title','caption','alt','source','comment','group'])if(!str(x[k]??'',k==='comment'?200000:2000))fail();
        }else if(key==='topics'){
          if(!str(x.title,500)||!x.title.trim()||!str(x.body)||x.topics!==undefined)fail();
        }else{
          if(!str(x.title,500)||!x.title.trim()||!str(x.comment??''))fail();
          if(x.sha256)file(x);
          else if(x.documentId){if(!state.documents.some(d=>d.id===x.documentId))fail();}
          else if(x.discoveryId){if(!state.discoveries.some(d=>d.id===x.discoveryId))fail();}
          else if(!str(x.url,4000)||!url(x.url))fail();
        }
      }
    }
    const images=new Set([...(s.images||[]),...(state.books.find(b=>b.id===item.bookId)?.space?.images||[])].map(i=>i.id));
    for(const p of (item.visual||item).stickies||[])if(p.imageId!==undefined&&!images.has(p.imageId))fail();
  }
  // Equal hashes must describe equal bytes, even across different owners.
  const sizes=new Map();for(const f of spaceFiles(state)){if(sizes.has(f.sha256)&&sizes.get(f.sha256)!==f.size)fail();sizes.set(f.sha256,f.size);}
}
