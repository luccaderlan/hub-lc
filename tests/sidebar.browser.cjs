const assert=require('node:assert/strict');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const toggle=()=>page.locator('[data-action=toggle-sidebar]');
  const nav=async view=>{if(await page.evaluate(()=>location.hash)==='#'+view)return;await require('./navigation.cjs')(page,view);};
  try{
    await page.goto(origin);
    assert.equal(await toggle().getAttribute('aria-expanded'),'true');
    const size=await page.locator('.home-heading h1').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));assert.ok(size>58&&size<62,`Título compacto: ${size}`);
    const before=await page.evaluate(()=>localStorage.getItem('hub-lc:v1'));
    await toggle().focus();await page.keyboard.press('Enter');
    assert.equal(await toggle().getAttribute('aria-expanded'),'false');
    assert.equal(await toggle().evaluate(el=>el===document.activeElement),true);
    assert.equal(Math.round((await page.locator('.sidebar').boundingBox()).width),64);
    assert.equal(await page.evaluate(()=>localStorage.getItem('hub-lc:v1')),before);
    assert.equal(await page.locator('.sidebar [data-view=areas]').getAttribute('aria-label'),'Estudos');
    assert.equal(await page.getByRole('link',{name:'Hub LC · Meu espaço'}).count(),1);
    assert.equal(await page.locator('.sidebar [data-view=areas] .nav-text').isVisible(),false);
    await nav('areas');assert.equal(await toggle().getAttribute('aria-expanded'),'false');
    await page.reload();assert.equal(await toggle().getAttribute('aria-expanded'),'false');
    await nav('notes');await page.locator('.topbar [data-action=new-note]').click();await page.locator('[name=title]').fill('Escrever com espaço');await page.locator('#editor-form [type=submit]').click();
    await page.locator('#note-body').fill('Este texto permanece ao alternar a navegação.');
    await page.locator('#note-body').evaluate(el=>window.sidebarTestEditor=el);
    await toggle().click();assert.equal(await page.locator('#note-body').evaluate(el=>el===window.sidebarTestEditor),true);
    assert.equal(await page.locator('#note-body').inputValue(),'Este texto permanece ao alternar a navegação.');
    await page.reload();assert.equal(await toggle().getAttribute('aria-expanded'),'true');assert.equal(await page.locator('#note-body').inputValue(),'Este texto permanece ao alternar a navegação.');
    for(const theme of ['light','dark']){
      await nav('settings');await page.locator('[name=pref-theme]').selectOption(theme);
      for(const collapsed of [false,true]){
        if((await toggle().getAttribute('aria-expanded')==='false')!==collapsed)await toggle().click();
        for(const width of [1440,1024,768,360,320]){
          await page.setViewportSize({width,height:1000});
          for(const view of ['home','areas','documents','discoveries','books','dictionary','board','notes','sessions','puzzle','evolution','settings']){
            await nav(view);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${view}: ${theme}, ${collapsed}, ${width}`);
            assert.equal(await toggle().getAttribute('aria-expanded'),String(!collapsed));
          }
          if(width<=780){
            assert.ok((await page.locator('.sidebar').boundingBox()).height<180);
            assert.ok((await toggle().boundingBox()).height>=44);
            const small=await page.locator('input:not([type=file]),select,textarea').evaluateAll(els=>els.filter(el=>el.getClientRects().length&&parseFloat(getComputedStyle(el).fontSize)<16).length);assert.equal(small,0);
          }
          if([1440,360].includes(width)){
            await nav('home');await page.screenshot({path:`${out}/sidebar-${theme}-${collapsed?'closed':'open'}-${width}.png`,fullPage:true});
          }
        }
      }
    }
    assert.deepEqual(errors,[]);
    return 'barra lateral: expandir/recolher por mouse e teclado, ícones acessíveis, preferência persistida, texto preservado sem recriar editor; 12 telas nos dois modos e temas entre 320 e 1440 px';
  }finally{await context.close();}
};
