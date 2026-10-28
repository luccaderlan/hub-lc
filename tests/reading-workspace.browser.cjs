const assert=require('node:assert/strict');
const path=require('node:path');
const navigate=require('./navigation.cjs');
module.exports=async({browser,origin,out})=>{
 const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const action=name=>page.locator(`[data-action="${name}"]:visible`).first().click();
 const submit=()=>page.locator('#editor-form [type=submit]').click();
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
 try{
  await page.goto(origin+'/#areas');
  assert.equal(await page.locator('.study-material').count(),0);await action('study-all');
  assert.equal(await page.locator('.study-material').count(),4);
  await page.locator('[data-action=study-kind][data-kind=references]').click();assert.equal(await page.locator('.study-material').count(),4);assert.equal(await page.locator('.study-section').count(),0);
  await navigate(page,'dictionary');await action('new-term');
  await page.locator('[name=word]').fill('Meu novo conceito');await page.locator('[name=meaning]').fill('Um significado pessoal');await submit();
  assert.equal(await page.locator('.term-card').count(),1);await page.reload();assert.match(await page.locator('.term-card').innerText(),/Um significado pessoal/);
  await action('delete-term');await submit();assert.equal((await stored()).customTerms.length,0);
  await action('clear-filters');const removedWord=await page.locator('.term-card h2').first().innerText();await action('delete-term');await submit();
  await page.reload();assert.equal((await stored()).hiddenTerms.length,1);assert.notEqual(await page.locator('.term-card h2').first().innerText(),removedWord);
  await navigate(page,'documents');
  await page.locator('#pdf-file').setInputFiles([{name:'leitura.md',mimeType:'text/markdown',buffer:Buffer.from('# Leitura')},{name:'ideias.txt',mimeType:'text/plain',buffer:Buffer.from('Meu texto')}]);
  await page.locator('[data-document-text]').waitFor();await action('all-documents');await page.locator('[data-filter=document-type]').selectOption('md');
  assert.equal(await page.locator('.document-card').count(),1);await page.reload();assert.equal(await page.locator('[data-filter=document-type]').inputValue(),'md');await action('clear-filters');assert.equal(await page.locator('.document-card').count(),2);
  await navigate(page,'books');await action('open-book');
  await page.locator('[data-action=book-tab][data-tab=notebook]').click();await page.locator('#book-journal').fill('Primeiro livro: minhas reflexões.');
  await page.locator('[data-action=book-tab][data-tab=overview]').click();await page.locator('#book-resume-form [name=page]').fill('12');await page.locator('#book-resume-form [name=chapter]').fill('Capítulo 2');await page.locator('[name=nextStep]').fill('Retomar a passagem sobre coragem.');await page.locator('#book-resume-form [type=submit]').click();
  await page.reload();assert.equal((await stored()).books[0].journal,'Primeiro livro: minhas reflexões.');assert.equal(await page.locator('[name=nextStep]').inputValue(),'Retomar a passagem sobre coragem.');
  const readingForm=page.locator('#book-resume-form'),modal=page.locator('#editor-form');
  await action('edit-book');await modal.locator('[name=total]').fill('120');await modal.locator('[name=status]').selectOption('Lendo');
  const subject=await modal.locator('[name=areaId] option:not([value=""])').first().getAttribute('value');await modal.locator('[name=areaId]').selectOption(subject);await submit();
  assert.equal((await stored()).books[0].journal,'Primeiro livro: minhas reflexões.');
  for(const [name,value] of Object.entries({total:'120',page:'12',chapter:'Capítulo 2',status:'Lendo',areaId:subject}))assert.equal(await readingForm.locator(`[name=${name}]`).inputValue(),value);
  assert.equal(await page.locator('.book-reading-progress strong').innerText(),'10%');assert.equal(await page.locator('.book-header .reading-position,.book-header .badge-row,.book-header progress').count(),0);
  await readingForm.locator('[name=total]').fill('11');await readingForm.locator('[type=submit]').click();assert.match(await readingForm.locator('[data-resume-error]').innerText(),/maior que o total/);assert.equal((await stored()).books[0].total,'120');
  await readingForm.locator('[name=total]').fill('240');await readingForm.locator('[name=page]').fill('24');await readingForm.locator('[name=status]').selectOption('Pausado');await readingForm.locator('[name=chapter]').fill('Capítulo 3');await readingForm.locator('[type=submit]').click();
  await page.reload();await action('edit-book');
  for(const [name,value] of Object.entries({total:'240',page:'24',chapter:'Capítulo 3',status:'Pausado',areaId:subject}))assert.equal(await modal.locator(`[name=${name}]`).inputValue(),value);
  await submit();assert.equal(await page.locator('[name=nextStep]').inputValue(),'Retomar a passagem sobre coragem.');
  await readingForm.locator('[name=page]').fill('0');await readingForm.locator('[type=submit]').click();assert.equal(await page.locator('.book-reading-progress strong').innerText(),'0%');
  await readingForm.locator('[name=page]').fill('');await readingForm.locator('[type=submit]').click();assert.equal(await page.locator('.book-reading-progress').count(),0);assert.equal(await readingForm.locator('[name=total]').inputValue(),'240');
  await readingForm.locator('[name=total]').fill('');await readingForm.locator('[name=status]').selectOption('');await readingForm.locator('[name=areaId]').selectOption('');await readingForm.locator('[type=submit]').click();assert.equal(await readingForm.locator('[name=total]').inputValue(),'');
  await readingForm.locator('[name=total]').fill('240');await readingForm.locator('[name=page]').fill('24');await readingForm.locator('[name=status]').selectOption('Pausado');await readingForm.locator('[type=submit]').click();
  await page.locator('[data-action=book-tab][data-tab=topics]').click();await action('book-note');await page.locator('[name=title]').fill('Uma passagem especial');await page.locator('#editor-form [name=page]').fill('12');await submit();
  await page.locator('#note-body').fill('Minha anotação vinculada ao livro.');assert.equal(await page.locator('[data-page=books]').count(),1);
  await action('book-return-notes');await page.locator('[data-action=book-tab][data-tab=canvas]').click();await action('book-canvas');await page.locator('[name=title]').fill('Conexões da leitura');await submit();
  await action('new-sticky');await page.locator('[data-sticky-text]').fill('Coragem e criatividade');await action('new-sticky');
  await page.locator('[data-sticky-text]').nth(1).fill('Uma nova conexão');await page.locator('[data-action=link-sticky]').first().click();await submit();
  await page.reload();assert.equal(await page.locator('.sticky').count(),2);assert.equal(await page.locator('[data-sticky-text]').first().inputValue(),'Coragem e criatividade');assert.equal((await stored()).notes.find(n=>n.kind==='canvas').connections.length,1);
  await action('canvas-expand');assert.equal(await page.locator('.canvas-expanded').count(),1);await page.keyboard.press('Escape');
  for(const theme of ['light','dark']){
   await navigate(page,'settings');await page.locator('[name=pref-theme]').selectOption(theme);await navigate(page,'books');await action('open-book');
   for(const width of [1440,768,360,320]){
    await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${theme} ${width}`);
    await page.locator('.book-header').evaluate(el=>Promise.all(el.getAnimations({subtree:true}).map(a=>a.finished)));
    await page.screenshot({path:path.join(out,`reading-${theme}-${width}.png`),fullPage:true});
   }
   await page.locator('[data-action=book-tab][data-tab=canvas]').click();
   for(const width of [1440,360]){await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(out,`reading-mural-${theme}-${width}.png`),fullPage:true});}
  }
  await action('all-books');await page.locator('.book').nth(1).locator('[data-action=open-book]').first().click();await page.locator('[data-action=book-tab][data-tab=notebook]').click();assert.equal(await page.locator('#book-journal').inputValue(),'');assert.equal(await page.locator('.book-record').count(),0);
  await page.locator('[data-action=book-tab][data-tab=canvas]').click();assert.equal(await page.locator('.sticky').count(),0);
  assert.deepEqual(errors,[]);
  return 'estudos: catálogo separado do acervo unificado, filtro de formato persistido, dicionário pessoal, livros isolados com caderno/retomada/notas/murais e layouts em dois temas de 320 a 1440 px';
 }catch(e){await page.screenshot({path:path.join(out,'reading-failure.png'),fullPage:true});throw e;}finally{await context.close();}
};
