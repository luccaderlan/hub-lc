const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const navigate=require('./navigation.cjs');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const action=(name,scope=page)=>scope.locator(`[data-action="${name}"]:visible`).first().click();
  const submit=()=>page.locator('#editor-form [type=submit]').click();
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
  const download=async click=>{const pending=page.waitForEvent('download');await click();const file=await pending;return fs.readFile(await file.path());};
  try{
    await page.goto(origin+'/#areas');assert.equal(await page.locator('[aria-label="Navegação principal"] [data-view]').count(),5);
    await page.locator('.study-sidebar [data-action=new-area]').click();await page.locator('[name=name]').fill('Escrita criativa');await page.locator('[name=division]').selectOption('');await submit();
    assert.equal(await page.locator('[name=division]').evaluate(el=>el.validity.valueMissing),true);
    assert.equal(((await stored())?.areas||[]).some(a=>a.name==='Escrita criativa'),false);
    assert.equal(await page.locator('[name=division]').evaluate(el=>el.tagName),'SELECT');
    assert.equal(await page.locator('[name=newDivision]').isVisible(),false);
    await page.locator('[name=division]').selectOption('new');await submit();
    assert.equal(await page.locator('[name=newDivision]').evaluate(el=>el.validity.valueMissing),true);
    for(const invalid of ['   ','Outros']){
      await page.locator('[name=newDivision]').fill(invalid);await submit();
      await page.locator('#form-error').filter({hasText:'Informe o nome da nova área'}).waitFor();
      assert.equal(((await stored())?.areas||[]).some(a=>a.name==='Escrita criativa'),false);
    }
    await page.locator('[name=division]').selectOption({label:'Filosofia'});
    assert.equal(await page.locator('[name=newDivision]').isVisible(),false);
    assert.equal(await page.locator('[name=newDivision]').isDisabled(),true);await submit();
    const area=(await stored()).areas.find(a=>a.name==='Escrita criativa');assert.equal(area.division,'Filosofia');
    await action('edit-area');assert.equal(await page.locator('[name=division] option:checked').innerText(),'Filosofia');
    await page.locator('[name=division]').selectOption('new');await page.locator('[name=newDivision]').fill(' Criação ');await submit();
    assert.equal((await stored()).areas.find(a=>a.id===area.id).division,'Criação');
    await page.locator('.study-sidebar [data-action=new-area]').click();await page.locator('[name=name]').fill('Narrativa');
    await page.locator('[name=division]').selectOption({label:'Criação'});await submit();
    assert.equal((await stored()).areas.find(a=>a.name==='Narrativa').division,'Criação');
    await page.locator(`[data-action=filter-area][data-id="${area.id}"]`).click();
    await page.locator('[data-action=rename-collection][data-division="Criação"]').click();await page.locator('[name=name]').fill('Laboratório');await submit();
    assert.equal((await stored()).areas.find(a=>a.id===area.id).division,'Laboratório');
    await page.locator('.add-study summary').click();await action('new-material');await page.locator('[name=title]').fill('Técnicas de escrita');await page.locator('[name=url]').fill('https://example.org/escrita');await submit();
    assert.equal((await stored()).materials.at(-1).areaId,area.id);
    const original=Buffer.from('# Meu estudo\n\nUma ideia para praticar.\n<script>window.UNSAFE=true</script>');
    await page.locator('#pdf-file').setInputFiles({name:'estudo.md',mimeType:'text/markdown',buffer:original});
    await page.locator('[data-document-text]').waitFor();assert.equal(await page.locator('[data-document-text]').innerText(),original.toString());
    assert.equal(await page.evaluate(()=>window.UNSAFE),undefined);assert.equal(await page.locator('#pdf-page-form').isVisible(),false);
    const doc=(await stored()).documents[0];assert.equal(doc.format,'md');assert.equal(doc.areaId,area.id);
    await page.locator('[data-document-body]').fill('Meu objetivo: aplicar uma técnica de escrita.');
    assert.deepEqual(await download(()=>page.locator('[data-document-download]').click()),original);
    await action('document-note');await page.locator('[name=title]').fill('Reflexão com vídeo');await page.locator('.form-details summary').click();
    await page.locator('[name=videoUrl]').fill('https://www.youtube.com/watch?v=escrita');await page.locator('[name=videoPosition]').fill('08:42');await submit();
    await page.locator('#note-body').fill('Entendi como planejar uma narrativa.\nVou testar com um texto curto.');
    assert.equal(new URL(await page.locator('.video-reference a').getAttribute('href')).searchParams.get('t'),'522s');await page.reload();assert.equal((await stored()).notes[0].videoPosition,'08:42');
    await action('export-note-md');assert.deepEqual(JSON.parse(await page.locator('[name=scope]').inputValue()),['note',(await stored()).notes[0].id]);
    const md=(await download(submit)).toString();assert.match(md,/Entendi como planejar/);assert.match(md,/t=522s/);assert.match(md,/estudo.md/);assert.doesNotMatch(md,/Guias do Maven/);
    await navigate(page,'areas');await page.locator(`[data-action=filter-area][data-id="${area.id}"]`).click();assert.equal(await page.locator('.study-note').count(),1);assert.equal(await page.locator('.document-card').count(),1);assert.equal(await page.locator('.material-card').count(),1);
    await page.locator('[data-action=study-kind][data-kind=notes]').click();assert.equal(await page.locator('.document-card').count(),0);assert.equal(await page.locator('.study-note').count(),1);
    await page.locator('[data-query]').fill('Reflexão');assert.equal(await page.locator('.study-note').count(),1);await page.locator('[data-query]').fill('');
    await action('export-md');assert.deepEqual(JSON.parse(await page.locator('[name=scope]').inputValue()),['area',area.id]);await page.locator('[name=detail]').selectOption('Síntese dos registros');
    const scoped=(await download(submit)).toString();assert.match(scoped,/Técnicas de escrita/);assert.match(scoped,/Reflexão com vídeo/);assert.doesNotMatch(scoped,/Aprender Java/);
    await navigate(page,'documents');await page.locator('#pdf-file').setInputFiles({name:'estudo.md',mimeType:'text/markdown',buffer:original});await page.locator('[data-document-download]').waitFor();assert.equal((await stored()).documents.length,1);
    await page.locator('#pdf-file').setInputFiles([{name:'ideias.txt',mimeType:'text/plain',buffer:Buffer.from('Ideias em texto UTF-8: ação')},{name:'dados.csv',mimeType:'text/csv',buffer:Buffer.from('assunto,ideia\nescrita,praticar')}]);await page.locator('[data-document-text]').waitFor();assert.equal((await stored()).documents.length,3);
    await page.locator('#pdf-file').setInputFiles({name:'invalido.docx',mimeType:'application/octet-stream',buffer:Buffer.from('arquivo inválido')});await page.locator('#toast').filter({hasText:'não corresponde'}).waitFor();assert.equal((await stored()).documents.length,3);
    const office=Buffer.from('UEsDBAoAAAAAAIh2VVsAAAAAAAAAAAAAAAAQAAAAZG9jUHJvcHMvYXBwLnhtbFBLAQIUAAoAAAAAAIh2VVsAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAACAAQAAAABkb2NQcm9wcy9hcHAueG1sUEsFBgAAAAABAAEAPgAAAC4AAAAAAA==','base64');
    await page.locator('#pdf-file').setInputFiles({name:'curso.docx',mimeType:'application/octet-stream',buffer:office});await page.locator('[data-document-download]').waitFor();assert.equal(await page.locator('#pdf-viewer').isVisible(),false);assert.match(await page.locator('[data-pdf-status]').innerText(),/prévia/);assert.deepEqual(await download(()=>page.locator('[data-document-download]').click()),office);
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=','base64');
    await page.locator('#pdf-file').setInputFiles({name:'mapa.png',mimeType:'image/png',buffer:png});await page.locator('[data-document-image]').waitFor();assert.equal((await stored()).documents.at(-1).format,'png');
    for(const width of [1440,768,360,320]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
    await navigate(page,'settings');const backup=JSON.parse((await download(()=>action('export'))).toString());assert.equal(backup.documentFiles.length,5);assert.equal(backup.notes[0].videoPosition,'08:42');
    const restored=await browser.newContext({acceptDownloads:true}),fresh=await restored.newPage();
    try{await fresh.goto(origin);await fresh.locator('#import-file').setInputFiles({name:'estudos.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await fresh.locator('#editor-form [type=submit]').click();await fresh.getByRole('heading',{name:/Lucca/}).waitFor();await navigate(fresh,'documents');await fresh.locator(`[data-action=open-document][data-id="${doc.id}"]`).click();await fresh.locator('[data-document-text]').waitFor();assert.equal(await fresh.locator('[data-document-text]').innerText(),original.toString());assert.equal(await fresh.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')).notes[0].videoUrl),'https://www.youtube.com/watch?v=escrita');}finally{await restored.close();}
    await page.setViewportSize({width:1440,height:1000});await navigate(page,'areas');await page.locator(`[data-action=filter-area][data-id="${area.id}"]`).click();await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.locator('#toast').evaluate(el=>el.classList.remove('visible'));await page.screenshot({path:path.join(out,'studies-final-desktop.png'),fullPage:true});
    await page.setViewportSize({width:360,height:900});await page.screenshot({path:path.join(out,'studies-final-mobile.png'),fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('[data-action=rename-collection][data-division="Laboratório"]').click();await action('delete-record');
    await submit();assert.equal(await page.locator('[name=destination]').evaluate(el=>el.validity.valueMissing),true);
    await action('close-dialog');assert.equal((await stored()).areas.find(a=>a.id===area.id).division,'Laboratório');
    await page.locator('[data-action=rename-collection][data-division="Laboratório"]').click();await action('delete-record');
    await page.locator('[name=destination]').selectOption({label:'Mover para Filosofia'});await submit();
    assert.equal((await stored()).areas.find(a=>a.id===area.id).division,'Filosofia');
    assert.equal((await stored()).documents.find(d=>d.id===doc.id).areaId,area.id);
    assert.equal(await page.locator('[data-action=open-division][data-division="Laboratório"]').count(),0);
    const beforeDelete=await stored(),removedIds=beforeDelete.areas.filter(a=>a.division==='Filosofia').map(a=>a.id);
    await page.locator('[data-action=rename-collection][data-division="Filosofia"]').click();await action('delete-record');
    await page.locator('[name=destination]').selectOption('delete');await submit();await page.reload();
    const afterDelete=await stored();assert.equal(afterDelete.areas.some(a=>removedIds.includes(a.id)),false);
    for(const list of ['materials','documents','notes','books','tasks','sessions']){
      assert.equal(afterDelete[list].length,beforeDelete[list].length);
      assert.equal(afterDelete[list].some(item=>removedIds.includes(item.areaId)),false);
    }
    assert.equal(afterDelete.discoveries.some(d=>d.areaIds.some(id=>removedIds.includes(id))),false);
    assert.equal(removedIds.includes(afterDelete.timer.areaId),false);
    assert.equal(await page.locator('[data-action=open-division][data-division="Filosofia"]').count(),0);
    await page.locator('.study-sidebar [data-action=new-area]').click();
    assert.equal(await page.locator('[name=division] option').filter({hasText:/^Filosofia$/}).count(),0);
    await action('close-dialog');
    assert.deepEqual(errors,[]);
    return 'estudos: cinco destinos, área obrigatória com seleção ou criação, fontes reunidas, arquivos MD/TXT/CSV/Word/imagem, prévias seguras, vínculo direto a vídeo, exportação Markdown contextual e restauração completa';
  }catch(err){await page.screenshot({path:path.join(out,'studies-failure.png'),fullPage:true});throw err;}finally{await context.close();}
};
