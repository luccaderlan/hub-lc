const assert=require('node:assert/strict'),path=require('node:path');
const {fixturePdf}=require('./documents.browser.cjs');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const toggle=page.locator('[data-action=document-fullscreen]'),reader=page.locator('#document-reader');
  const upload=async(name,mimeType,buffer)=>{await page.locator('#pdf-file').setInputFiles({name,mimeType,buffer});await page.locator('[data-document-download]').waitFor();};
  const expanded=()=>page.waitForFunction(()=>document.querySelector('#document-reader').classList.contains('document-reader-expanded'));
  const closed=async()=>{
    await page.waitForFunction(()=>!document.querySelector('.document-reader-expanded')&&!document.fullscreenElement);
    assert.equal(await toggle.getAttribute('aria-pressed'),'false');
    assert.equal(await toggle.evaluate(el=>el===document.activeElement),true);
    assert.equal(await page.locator('[inert]').count(),0);
    assert.equal(await reader.getAttribute('role'),null);
  };
  const fits=async()=>assert.equal(await reader.evaluate(el=>{const r=el.getBoundingClientRect();return Math.abs(r.x)<1&&Math.abs(r.y)<1&&Math.abs(r.width-innerWidth)<2&&Math.abs(r.height-innerHeight)<2&&el.scrollWidth<=el.clientWidth+1&&el.scrollHeight<=el.clientHeight+1;}),true);
  try{
    await page.goto(origin+'/#documents');
    await upload('Leitura.pdf','application/pdf',fixturePdf());await toggle.waitFor();
    const src=await page.locator('#pdf-viewer').getAttribute('src');
    await page.evaluate(()=>{window.originalPreview=document.querySelector('#pdf-viewer');});
    await toggle.click();await expanded();
    await page.waitForFunction(()=>document.fullscreenElement?.id==='document-reader');
    await fits();assert.equal(await reader.getAttribute('role'),'dialog');
    assert.equal(await page.locator('.sidebar').evaluate(el=>el.inert),true);
    assert.equal(await page.locator('#pdf-page-form').isVisible(),false);
    await page.screenshot({path:path.join(out,'document-fullscreen-desktop.png')});
    // Browser-initiated exit must restore the app too (Esc is handled by the browser).
    await page.evaluate(()=>document.exitFullscreen());await closed();
    await toggle.click();await expanded();await page.waitForFunction(()=>!!document.fullscreenElement);await toggle.click();await closed();
    assert.equal(await page.evaluate(()=>window.originalPreview===document.querySelector('#pdf-viewer')),true);
    assert.equal(await page.locator('#pdf-viewer').getAttribute('src'),src);

    // Denied and unavailable APIs both retain the viewport version.
    await page.evaluate(()=>{Element.prototype.requestFullscreen=()=>Promise.reject(new Error('Denied for test'));});
    await upload('Ideias.md','text/markdown',Buffer.from('# Minhas ideias\n'+('Uma passagem para estudar.\n'.repeat(600))));
    const text=page.locator('[data-document-text]');await text.waitFor();
    await text.evaluate(el=>{el.scrollTop=430;window.originalText=el;});
    await toggle.click();await expanded();await fits();
    assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false);
    assert.equal(await text.evaluate(el=>el.scrollTop),430);
    await page.keyboard.press('Tab');assert.equal(await text.evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Tab');assert.equal(await toggle.evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Shift+Tab');assert.equal(await text.evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Escape');await closed();
    assert.equal(await page.evaluate(()=>window.originalText===document.querySelector('[data-document-text]')),true);
    assert.equal(await text.evaluate(el=>el.scrollTop),430);
    await page.evaluate(()=>{Element.prototype.requestFullscreen=undefined;});
    for(const theme of ['light','dark']){
      for(const width of [1440,768,360,320]){
        await page.setViewportSize({width,height:850});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
        await toggle.click();await expanded();await fits();
        assert.equal(await text.evaluate(el=>el.clientHeight>400),true);
        if(width===360&&theme==='dark')await page.screenshot({path:path.join(out,'document-fullscreen-mobile.png')});
        await toggle.click();await closed();
      }
    }
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=','base64');
    await upload('Mapa.png','image/png',png);await page.locator('[data-document-image]').waitFor();
    await toggle.click();await expanded();await fits();
    assert.equal(await page.locator('[data-document-image]').evaluate(el=>el.clientHeight>400&&el.complete&&el.naturalWidth>0),true);
    await page.keyboard.press('Escape');await closed();
    await toggle.click();await expanded();
    await page.evaluate(()=>{location.hash='#home';});await page.locator('.personal-tabs').waitFor();
    assert.equal(await page.locator('[inert]').count(),0);assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('document-is-expanded')),false);
    await page.goto(origin+'/#documents');
    await upload('Documento.rtf','application/rtf',Buffer.from('{\\rtf1 Conteudo de estudo}'));
    assert.equal(await toggle.isVisible(),false);
    const doc=await page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')).documents.find(d=>d.format==='pdf'));
    await page.goto(origin+'/#documents');await page.locator(`[data-action=open-document][data-id="${doc.id}"]`).click();await toggle.waitFor();
    await page.evaluate(hash=>new Promise((resolve,reject)=>{const req=indexedDB.open('hub-lc:pdfs',1);req.onsuccess=()=>{const db=req.result,tx=db.transaction('files','readwrite');tx.objectStore('files').delete(hash);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};}),doc.sha256);
    await page.reload();await page.locator('[data-pdf-repair]').waitFor();assert.equal(await toggle.isVisible(),false);
    assert.deepEqual(errors,[]);
    return 'tela cheia: API nativa, saída pelo navegador/botão/Esc, fallback sem API ou com recusa, PDF preservado, texto com rolagem, foco/teclado, imagem, limpeza ao navegar e temas em 320–1440 px';
  }catch(error){await page.screenshot({path:path.join(out,'document-fullscreen-failure.png')});throw error;}
  finally{await context.close();}
};
