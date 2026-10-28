const assert=require('node:assert/strict');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  const action=name=>page.locator(`[data-action="${name}"]:visible`).first().click();
  const nav=async view=>{if(await page.evaluate(()=>location.hash)==='#'+view)return;await require('./navigation.cjs')(page,view);};
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
  const submit=()=>page.locator('#editor-form [type=submit]').click();
  try{
    await page.goto(origin);await page.keyboard.press('Tab');assert.equal(await page.locator('.skip-link').evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Enter');assert.equal(await page.locator('#main').evaluate(el=>el===document.activeElement),true);
    await nav('books');assert.equal(await page.locator('h1').evaluate(el=>el===document.activeElement),true);
    // Native Back/Forward and bookmarked settings navigate to the matching screen.
    await nav('sessions');await page.goBack();await page.waitForURL('**/#books');assert.match(await page.locator('h1').innerText(),/biblioteca/i);
    await page.goForward();await page.waitForURL('**/#sessions');assert.match(await page.locator('h1').innerText(),/dedicar/);
    await page.goto(origin+'/#settings');assert.match(await page.locator('h1').innerText(),/sua cara/);
    await page.locator('[name=pref-theme]').focus();await page.locator('[name=pref-theme]').selectOption('dark');assert.equal(await page.locator('[name=pref-theme]').evaluate(el=>el===document.activeElement),true);
    // Re-rendered selectors and search keep focus, caret and text composition.
    await nav('books');await page.locator('[data-filter=book]').focus();await page.locator('[data-filter=book]').selectOption('Lendo');assert.equal(await page.locator('[data-filter=book]').evaluate(el=>el===document.activeElement),true);
    assert.match(await page.locator('.empty h3').innerText(),/neste filtro/);await action('clear-filters');assert.equal(await page.locator('.book').count(),2);
    await page.locator('#query').pressSequentially('inexistente');assert.equal(await page.locator('#query').inputValue(),'inexistente');assert.equal(await page.locator('#query').evaluate(el=>el===document.activeElement),true);
    await action('clear-filters');await nav('notes');await action('new-note');assert.equal(await page.locator('[name=title]').evaluate(el=>el===document.activeElement),true);
    await page.locator('[name=title]').fill('Uma reflexão');await submit();await page.locator('#note-body').fill('Texto preservado.');
    await action('all-notes');await page.locator('#query').pressSequentially('ausente');assert.equal(await page.locator('#query').inputValue(),'ausente');assert.equal(await page.locator('#query').evaluate(el=>el===document.activeElement),true);assert.match(await page.locator('.empty h3').innerText(),/neste filtro/);
    await action('clear-filters');assert.equal((await stored()).notes[0].body,'Texto preservado.');
    await page.locator('#query').evaluate(el=>{el.focus();el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));el.value='refle';el.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));});
    assert.equal(await page.locator('#query').inputValue(),'refle');assert.equal(await page.locator('.note-list-item').count(),1);
    await page.locator('#query').dispatchEvent('compositionend');assert.equal(await page.locator('#query').inputValue(),'refle');await action('clear-filters');
    // Escape and Cancel protect drafts, and cancellation returns to the opener.
    await action('new-note');await page.locator('[name=title]').fill('Rascunho protegido');await page.keyboard.press('Escape');await page.locator('[data-discard-prompt]').waitFor({state:'visible'});
    await action('continue-editing');assert.equal(await page.locator('[name=title]').inputValue(),'Rascunho protegido');
    await action('close-dialog');await action('discard-changes');await page.locator('#editor').waitFor({state:'hidden'});assert.equal((await stored()).notes.length,1);
    assert.equal(await page.locator('.topbar [data-action=new-note]').evaluate(el=>el===document.activeElement),true);
    await page.locator('.note-list [data-action=open-note]').first().click();await action('edit-note');await page.locator('[name=title]').fill('   ');await submit();assert.match(await page.locator('#form-error').innerText(),/Preencha/);assert.equal(await page.locator('#form-error').evaluate(el=>el===document.activeElement),true);
    await page.locator('[name=title]').fill('Reflexão revisada');await submit();assert.equal((await stored()).notes[0].title,'Reflexão revisada');
    await page.locator('.individual-note-head [data-action=quick-delete]').click();assert.equal(await page.locator('.dialog-footer [data-action=close-dialog]').evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Enter');await page.locator('#editor').waitFor({state:'hidden'});assert.equal((await stored()).notes.length,1);
    await nav('dictionary');await action('more-terms');assert.equal(await page.locator('.term-card h2').nth(24).evaluate(el=>el===document.activeElement),true);
    // Touch targets and long data fit narrow screens; expanded canvas isolates background.
    await nav('notes');await action('new-canvas');await page.locator('[name=title]').fill('Mural de investigação');await submit();await action('new-sticky');await action('canvas-expand');
    assert.equal(await page.locator('.sidebar').evaluate(el=>el.inert),true);await page.keyboard.press('Escape');assert.equal(await page.locator('.sidebar').evaluate(el=>el.inert),false);
    for(const theme of ['light','dark']){
      await nav('settings');await page.locator('[name=pref-theme]').selectOption(theme);
      for(const width of [320,360,768]){
        await page.setViewportSize({width,height:900});
        for(const view of ['home','areas','documents','discoveries','board','books','notes','sessions','evolution','dictionary','settings']){
          await nav(view);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${view}, ${theme}, ${width}: overflow`);
          const invalid=await page.locator('input:not([type=file]),select,textarea').evaluateAll(els=>els.filter(el=>el.getClientRects().length&&!el.closest('.sticky')&&parseFloat(getComputedStyle(el).fontSize)<16).map(el=>el.outerHTML.slice(0,100)));
          assert.deepEqual(invalid,[],`${view}: campo com texto pequeno`);
          const targets=await page.locator('.btn').evaluateAll(els=>els.filter(el=>el.getClientRects().length&&el.getBoundingClientRect().height<43).map(el=>el.textContent));assert.deepEqual(targets,[],`${view}: área de toque pequena`);
          const navHeight=await page.locator('.sidebar').evaluate(el=>el.getBoundingClientRect().height);assert.ok(navHeight<180,`${view}: navegação ocupa ${navHeight}px`);
        }
      }
    }
    await page.screenshot({path:out+'/ux-usability-mobile.png',fullPage:true});
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
  // Simulated storage failure never reports success and protects unsaved text on exit.
  const failure=await browser.newContext({viewport:{width:360,height:900},acceptDownloads:true});
  try{
    const p=await failure.newPage();await p.goto(origin);await p.locator('[data-action=new-note]').first().click();await p.locator('[name=title]').fill('Preservar meu trabalho');await p.locator('#editor-form [type=submit]').click();
    await p.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Sem espaço','QuotaExceededError');};});
    await p.locator('#note-body').fill('Ideias ainda na memória');await p.locator('[data-storage-warning]').waitFor({state:'visible'});
    assert.match(await p.locator('[data-note-status]').innerText(),/não salvas/);assert.equal(await p.locator('#toast').getAttribute('data-tone'),'error');
    assert.equal(await p.evaluate(()=>{const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;}),true);
    const downloading=p.waitForEvent('download');await p.locator('[data-storage-warning] [data-action=export]').click();const download=await downloading;const fs=require('node:fs/promises');const backup=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.equal(backup.notes[0].body,'Ideias ainda na memória');
    await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:out+'/ux-storage-warning-mobile.png',fullPage:true});
  }finally{await failure.close();}
  return 'usabilidade: navegação e histórico, foco e teclado, filtros, composição de texto, proteção de rascunhos, confirmações seguras, isolamento do mural e falha de salvamento com backup; 11 telas em 320/360/768 px nos dois temas';
};
