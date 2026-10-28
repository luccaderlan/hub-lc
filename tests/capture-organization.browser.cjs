const assert=require('node:assert/strict');
const {chromium}=require(process.env.HUB_LC_PLAYWRIGHT||require('node:path').join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
(async()=>{
 await require('node:fs/promises').mkdir('test-results',{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.HUB_LC_CHROME||'/usr/bin/google-chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const act=(name)=>page.locator(`[data-action="${name}"]:visible`).first().click();
 const submit=()=>page.locator('#editor-form [type=submit]').click();
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
 try{
  await page.goto((process.env.HUB_LC_ORIGIN||'http://127.0.0.1:4173')+'/#notes');await act('new-note');await page.locator('[name=title]').fill('Rascunho preservado');
  await page.locator('summary').filter({hasText:'artigo ou site'}).click();await page.locator('[name=sourceUrl]').fill('https://example.org/artigo');await page.locator('[name=sourceTitle]').fill('Artigo de referência');
  await page.locator('[data-action=note-create-linked][data-collection=areas]').click();await page.locator('[name=name]').fill('Assunto dentro da nota');await page.locator('[name=division]').selectOption({label:'TI'});await page.locator('[name=subgroup]').fill('Grupo manual');await submit();
  assert.equal(await page.locator('[name=title]').inputValue(),'Rascunho preservado');assert.equal(await page.locator('[name=areaId] option:checked').innerText(),'Assunto dentro da nota');
  await page.locator('[data-action=note-create-linked][data-collection=books]').click();await page.locator('[name=title]').fill('Livro inline');await submit();
  assert.equal(await page.locator('[name=bookId] option:checked').innerText(),'Livro inline');
  await page.locator('[data-action=note-create-linked][data-collection=discoveries]').click();await page.locator('[name=title]').fill('Descoberta inline');await page.locator('[name=url]').fill('https://example.org/descoberta');await submit();
  assert.equal(await page.locator('[name=discoveryId] option:checked').innerText(),'Descoberta inline');assert.equal(await page.locator('[name=sourceUrl]').inputValue(),'https://example.org/artigo');
  // Canceling a child must preserve all parent fields and relationships.
  await page.locator('[data-action=note-create-linked][data-collection=books]').click();await act('close-dialog');assert.equal(await page.locator('[name=title]').inputValue(),'Rascunho preservado');
  await page.screenshot({path:'test-results/note-linked-form.png'});await page.setViewportSize({width:360,height:900});assert.ok(await page.locator('#editor').evaluate(el=>el.scrollWidth<=el.clientWidth+2));await page.screenshot({path:'test-results/note-linked-mobile.png'});await page.setViewportSize({width:1440,height:1000});await submit();await page.locator('#note-body').waitFor();assert.equal((await stored()).notes[0].sourceTitle,'Artigo de referência');await page.reload();await page.locator('.note-meta a').filter({hasText:'Artigo de referência'}).waitFor();
  await page.locator('[data-view=areas]').first().click();const group=page.locator('.subject-subgroup').filter({has:page.locator('h3',{hasText:'Grupo manual'})});await group.waitFor();
  await group.locator('[data-action=toggle-study-group]').click();assert.equal(await group.locator('[data-action=filter-area]').isVisible(),false);await page.reload();assert.equal(await group.locator('[data-action=filter-area]').isVisible(),false);await group.locator('[data-action=toggle-study-group]').click();
  await group.locator('[data-action=edit-subgroup]').click();await page.locator('[name=name]').fill('Grupo renomeado');await submit();assert.equal((await stored()).areas.find(a=>a.name==='Assunto dentro da nota').subgroup,'Grupo renomeado');
  await page.screenshot({path:'test-results/study-manual-groups.png',fullPage:true});await page.locator('[data-action=new-subgroup][data-division="Filosofia"]').click();await page.locator('[name=name]').fill('Grupo vazio manual');await submit();await page.locator('h3',{hasText:'Grupo vazio manual'}).waitFor();
  const fold=page.locator('[data-action=toggle-study-group][aria-label="Recolher TI"]');await fold.click();assert.equal(await page.locator('h3',{hasText:'Grupo renomeado'}).isVisible(),false);await page.reload();assert.equal(await page.locator('h3',{hasText:'Grupo renomeado'}).isVisible(),false);
  await page.locator('[data-view=sessions]').first().click();await act('start-timer');await page.waitForTimeout(1100);await act('pause-timer');const study=await page.locator('[data-study-total]').innerText();await page.waitForFunction(()=>document.querySelector('[data-pause-clock]')?.textContent!=='00:00:00');assert.equal(await page.locator('[data-study-total]').innerText(),study);assert.notEqual(await page.locator('[data-pause-clock]').innerText(),'00:00:00');await page.reload();await page.locator('[data-pause-clock]').waitFor();await page.screenshot({path:'test-results/session-pause-clock.png',fullPage:true});await act('start-timer');assert.ok((await stored()).timer.pausedMs>=1000);assert.equal(await page.locator('[data-pause-clock]').count(),0);assert.equal(errors.length,0,errors.join('\n'));
  await page.screenshot({path:'test-results/capture-organization.png',fullPage:true});console.log('OK: inline creation and cancellation preserve note drafts, source persists, manual groups and folding survive reload, independent clocks preserve study');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
