const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const navigate=require('./navigation.cjs');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const action=name=>page.locator(`[data-action="${name}"]:visible`).first().click();
  const submit=()=>page.locator('#editor-form [type=submit]').click();
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
  const sidebar=()=>page.locator('.sidebar [aria-label="Navegação principal"]');
  const order=async()=>{
    const boxes=await page.locator('.home-heading,.personal-tabs').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
    assert.equal(boxes.length,2);assert.ok(boxes[0].bottom<=boxes[1].top,'tabs are below the entire greeting');
    assert.equal(await page.locator('.personal-tabs [aria-current=page]').count(),1);
    assert.equal(await sidebar().locator('[aria-current=page]').getAttribute('data-view'),'home');
  };
  try{
    await page.goto(origin+'/#home');await page.locator('.personal-tabs').waitFor();
    assert.deepEqual(await sidebar().locator('[data-view]').evaluateAll(elements=>elements.map(el=>el.dataset.view)),['home','areas','documents','books','notes','sessions']);
    await order();const initial=await stored();
    await page.locator('.personal-tabs [data-view=board]').focus();await page.keyboard.press('Enter');await page.waitForURL('**/#board');
    await order();assert.equal(await page.locator('#main h1').innerText(),'Quadro de atividades');
    assert.deepEqual(await stored(),initial,'navigation never rewrites personal records');
    await action('new-task');await page.locator('[name=title]').fill('Projeto sem data definida');
    for(const name of ['due','plannedDate','duration'])assert.equal(await page.locator(`[name=${name}]`).inputValue(),'');
    await submit();
    await action('new-task');await page.locator('[name=title]').fill('Planejamento de longo prazo');await page.locator('[name=due]').fill('2026-12-15');await submit();
    const tasks=(await stored()).tasks;assert.equal(tasks.length,2);assert.equal(tasks[0].plannedDate,'');assert.equal(tasks[1].plannedDate,'');
    await page.locator('.personal-tabs [data-view=home]').click();assert.equal(await page.locator('.day-task').count(),0);
    await page.locator('.personal-tabs [data-view=board]').click();assert.equal(await page.locator('.task').count(),2);
    await page.reload();await order();assert.equal(await page.locator('.task').count(),2);
    const to=tasks[0].columnId===(await stored()).columns[1].id?(await stored()).columns[0].id:(await stored()).columns[1].id;
    await page.locator(`[data-task-column="${tasks[0].id}"]`).selectOption(to);await page.reload();assert.equal((await stored()).tasks[0].columnId,to);
    await page.locator('.personal-tabs [data-view=home]').click();await page.goBack();await page.waitForURL('**/#board');await page.goForward();await page.waitForURL('**/#home');
    await navigate(page,'areas');
    assert.equal(await page.locator('.study-catalog [data-view=documents]').count(),0,'no duplicate Documentos shortcut');
    const shortcut=await page.locator('.catalog-secondary').boundingBox(),catalog=await page.locator('[data-catalog-results]').boundingBox();assert.ok(shortcut.y<catalog.y);
    await action('study-all');await action('study-unassigned');assert.equal(await page.locator('h1').innerText(),'Sem assunto');
    await navigate(page,'discoveries');await navigate(page,'documents');
    assert.equal(await sidebar().locator('[aria-current=page]').getAttribute('data-view'),'documents');
    assert.equal(await page.locator('.workspace-tabs').count(),0);
    const original=Buffer.from('# Guia de estudo\n\nConteúdo de teste para baixar e retomar.');
    await page.locator('#pdf-file').setInputFiles({name:'guia.md',mimeType:'text/markdown',buffer:original});await page.locator('[data-document-text]').waitFor();
    await action('edit-document');await page.locator('[name=areaId]').selectOption({label:'Java'});await submit();
    const document=(await stored()).documents[0];await navigate(page,'documents');
    await page.locator('[data-query]').fill('guia');await page.locator('[data-filter=document-type]').selectOption('md');await page.locator('[data-filter=area]').selectOption(document.areaId);
    const download=page.waitForEvent('download');await action('download-document');const file=await download;
    assert.equal(file.suggestedFilename(),'guia.md');assert.deepEqual(await fs.readFile(await file.path()),original);assert.equal(await page.evaluate(()=>location.hash),'#documents');
    await action('open-document');await page.locator('[data-document-text]').waitFor();await page.reload();await action('all-documents');
    assert.equal(await page.locator('[data-query]').inputValue(),'guia');assert.equal(await page.locator('[data-filter=document-type]').inputValue(),'md');assert.equal(await page.locator('[data-filter=area]').inputValue(),document.areaId);
    // A filtered upload offers the subject explicitly instead of assigning it silently.
    await action('upload-pdf');assert.equal(await page.locator('[name=areaId]').inputValue(),document.areaId);await action('close-dialog');
    // Entering the global destination from a subject never inherits the subject filter.
    await navigate(page,'areas');await page.locator('[data-catalog-search]').fill('Maven');await page.locator('[data-catalog-results] .study-subject').click();await navigate(page,'documents');assert.equal(await page.locator('[data-filter=area]').inputValue(),'');
    // Missing originals open the existing recovery flow without removing metadata or tasks.
    await page.evaluate(async hash=>{const {pdfFileStore}=await import('/data.js');await pdfFileStore('delete',hash);},document.sha256);
    await action('download-document');await page.locator('[data-pdf-repair]').waitFor();assert.equal((await stored()).documents[0].id,document.id);
    await action('replace-pdf');await page.locator('#pdf-replace-file').setInputFiles({name:'guia.md',mimeType:'text/markdown',buffer:original});await page.locator('[data-document-download]').waitFor();
    // Returning to a long list also preserves its position across reader reload.
    await page.locator('#pdf-file').setInputFiles(Array.from({length:8},(_,i)=>({name:`lista-${i}.txt`,mimeType:'text/plain',buffer:Buffer.from(`Material de teste ${i}`)})));
    await page.locator('[data-document-download][download="lista-7.txt"]').waitFor();await navigate(page,'documents');
    const originalRow=page.locator(`.document-grid [data-action=open-document][data-id="${document.id}"]`);await originalRow.scrollIntoViewIfNeeded();
    const scroll=await page.evaluate(()=>scrollY);assert.ok(scroll>300);
    await originalRow.click();await page.locator('[data-document-text]').waitFor();await page.reload();await action('all-documents');
    assert.ok(Math.abs(await page.evaluate(()=>scrollY)-scroll)<2,'list scroll position survives the reader and reload');
    await navigate(page,'documents');const before=await stored();await page.locator('#toast').evaluate(el=>el.classList.remove('visible'));
    for(const theme of ['light','dark']){
      await navigate(page,'settings');await page.locator('[name=pref-theme]').selectOption(theme);
      for(const width of [1440,768,360,320]){
        await page.setViewportSize({width,height:1000});
        for(const view of ['home','board','documents','areas']){
          await navigate(page,view);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${view}, ${theme}, ${width}: overflow`);
          if(view==='areas')await page.locator('[data-catalog-search]').fill('');
          if(['home','board'].includes(view)){
            await order();
            if(view==='home'&&width<=360){
              assert.ok(await sidebar().locator('[data-view=documents]').evaluate(el=>{const r=el.getBoundingClientRect(),nav=el.parentElement.getBoundingClientRect();return r.left>=nav.left-1&&r.right<=nav.right+1;}),'Documentos is fully visible in the initial mobile menu');
            }
            const small=await page.locator('.personal-tabs button').evaluateAll(elements=>elements.some(el=>el.getBoundingClientRect().height<44));assert.equal(small,false);
            await page.evaluate(()=>scrollTo(0,500));const tab=await page.locator('.personal-tabs').boundingBox();assert.ok(tab.y>=0,'permanent tabs remain visible while scrolling');await page.evaluate(()=>scrollTo(0,0));
          }
          if([1440,360].includes(width))await page.screenshot({path:path.join(out,`personal-navigation-${view}-${theme}-${width}.png`),fullPage:true});
        }
      }
    }
    const after=await stored();assert.deepEqual(after.tasks,before.tasks);assert.deepEqual(after.documents,before.documents);assert.deepEqual(errors,[]);
    return 'navegação aprovada: seis destinos, abas abaixo da saudação e fixas ao rolar, quadro geral sem data obrigatória, histórico/reload, Estudos compacto, documentos diretos, download original, recuperação e retorno com filtros; claro/escuro em 320/360/768/1440 px';
  }catch(error){await page.screenshot({path:path.join(out,'personal-navigation-failure.png'),fullPage:true});throw error;}
  finally{await context.close();}
};
