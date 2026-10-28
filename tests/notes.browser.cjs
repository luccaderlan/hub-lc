const assert = require('node:assert/strict');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const action=name=>page.locator(`[data-action="${name}"]:visible`).first().click(),submit=()=>page.locator('#editor-form button[type=submit]').click(),stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
  const note=async kind=>(await stored()).notes.find(n=>n.kind===kind);
  const selectText=async(start,end)=>{const editor=page.locator('#note-body');await editor.focus();await page.keyboard.press('Control+Home');for(let i=0;i<start;i++)await page.keyboard.press('ArrowRight');await page.keyboard.down('Shift');for(let i=start;i<end;i++)await page.keyboard.press('ArrowRight');await page.keyboard.up('Shift');await page.locator('.selection-tools').waitFor({state:'visible'});};
  const mark=async color=>{await action('marker-palette');if(color==='yellow')await page.screenshot({path:out+'/hub-lc-marker-palette.png',fullPage:false});await page.locator(`[data-color="${color}"]`).click();};
  const drag=async(locator,dx,dy)=>{await locator.scrollIntoViewIfNeeded();const box=await locator.boundingBox();assert.ok(box);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+dx,box.y+box.height/2+dy,{steps:8});await page.mouse.up();};
  const dragBetween=async(source,target)=>{const a=await source.boundingBox(),b=await target.boundingBox();await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:10});await page.mouse.up();};
  try{
    await page.goto(origin);await action('new-note');await page.locator('[name=title]').fill('Destaques discretos');await submit();
    await page.locator('#note-body').fill('Uma ideia importante. Outra reflexão.\n<script>literal</script>');
    assert.equal(await page.locator('.highlight-toolbar').count(),0);assert.equal(await page.locator('.selection-tools').isVisible(),false);
    // Select by a real mouse drag and release before using the contextual tool.
    await page.locator('#note-body').scrollIntoViewIfNeeded();const points=await page.locator('#note-body').evaluate(el=>{const box=el.getBoundingClientRect(),css=getComputedStyle(el),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=css.font;return {x:box.left+ctx.measureText('Uma ').width,y:box.top+parseFloat(css.paddingTop)+parseFloat(css.lineHeight)/2,end:box.left+ctx.measureText('Uma ideia importante').width};});
    await page.mouse.move(points.x,points.y);await page.mouse.down();await page.mouse.move(points.end,points.y,{steps:10});assert.equal(await page.locator('.selection-tools').isVisible(),false);await page.mouse.up();await page.locator('.selection-tools').waitFor({state:'visible'});
    assert.equal(await page.locator('#marker-palette').isVisible(),false);const selected=await page.locator('#note-body').evaluate(el=>({start:el.selectionStart,end:el.selectionEnd}));assert.ok(selected.end>selected.start);
    await mark('yellow');assert.deepEqual((await note('text')).highlights,[{...selected,color:'yellow'}]);assert.equal(await page.locator('.selection-tools').isVisible(),false);
    assert.equal(await page.locator('.highlight-backdrop script').count(),0);await page.reload();assert.equal(await page.locator('.highlight-backdrop mark').count(),1);
    await page.locator('#note-body').focus();await page.keyboard.press('Control+Home');await page.keyboard.type('Nova: ');assert.equal((await note('text')).highlights[0].start,selected.start+6);
    await selectText(10,14);await mark('pink');assert.equal((await note('text')).highlights.length,2);
    await selectText(10,14);await page.locator('[data-color=""]').click();assert.equal((await note('text')).highlights[0].start,14);
    await selectText(14,20);await page.keyboard.press('Escape');assert.equal(await page.locator('.selection-tools').isVisible(),false);
    await selectText(14,20);await page.locator('h1').click();assert.equal(await page.locator('.selection-tools').isVisible(),false);
    await page.screenshot({path:out+'/hub-lc-markers-contextual.png',fullPage:true});

    await action('all-notes');await action('new-canvas');await page.locator('[name=title]').fill('Mural expansível');await submit();await action('new-sticky');await action('new-sticky');
    const stickies=page.locator('.sticky');await page.locator('[data-sticky-text]').nth(0).fill('Primeira ideia');await page.locator('[data-sticky-text]').nth(1).fill('Outra ideia');
    const viewport=page.locator('.canvas-viewport');await viewport.evaluate(el=>{el.scrollLeft=0;el.scrollTop=0;});await stickies.first().locator('textarea').focus();
    const dims=(await note('canvas')).stickies[0];await drag(stickies.first().locator('[data-resize-sticky]'),60,45);let updated=(await note('canvas')).stickies[0];assert.ok(updated.width>dims.width);assert.ok(updated.height>dims.height);assert.equal(await page.locator('#editor').isVisible(),false);
    await drag(stickies.first().locator('[data-resize-sticky]'),-40,-25);let shrunk=(await note('canvas')).stickies[0];assert.ok(shrunk.width<updated.width);assert.ok(shrunk.height<updated.height);assert.equal(shrunk.text,'Primeira ideia');
    await stickies.first().locator('[data-resize-sticky]').focus();await page.keyboard.press('ArrowRight');assert.equal((await note('canvas')).stickies[0].width,shrunk.width+20);
    // Drag the connector itself: no chooser or confirmation dialog.
    await dragBetween(stickies.first().locator('[data-connect-sticky]'),stickies.last().locator('textarea'));assert.equal((await note('canvas')).connections.length,1);assert.equal(await page.locator('#editor').isVisible(),false);assert.equal(await page.locator('.link-preview').count(),0);
    await dragBetween(stickies.first().locator('[data-connect-sticky]'),stickies.last().locator('textarea'));assert.equal((await note('canvas')).connections.length,1);
    await drag(stickies.first().locator('[data-connect-sticky]'),0,-50);assert.equal((await note('canvas')).connections.length,1);assert.equal(await page.locator('.connection-target').count(),0);
    const oldPath=await page.locator('.sticky-links path').getAttribute('d');await stickies.first().locator('[data-action=move-sticky][data-y="1"]').click();assert.notEqual(await page.locator('.sticky-links path').getAttribute('d'),oldPath);
    // Expand and reduce the world, preserving text, links, and absolute positions when expanding.
    const before=(await note('canvas')).stickies[0];await action('canvas-size');await page.locator('[name=width]').fill('1600');await page.locator('[name=height]').fill('1100');await submit();let mural=await note('canvas');assert.deepEqual(mural.canvas,{width:1600,height:1100});assert.ok(Math.abs(mural.stickies[0].x*1600/100-before.x*1200/100)<.1);
    await action('canvas-size');await page.locator('[name=width]').fill('900');await page.locator('[name=height]').fill('650');await submit();assert.equal((await note('canvas')).canvas.width,900);assert.equal((await note('canvas')).connections.length,1);
    const zoom=await page.locator('[data-canvas-zoom]').innerText();await action('canvas-zoom-out');assert.notEqual(await page.locator('[data-canvas-zoom]').innerText(),zoom);await action('canvas-zoom-in');await action('canvas-fit');
    const measured=await viewport.evaluate(el=>({width:el.clientWidth,height:el.clientHeight}));assert.ok(parseInt(await page.locator('[data-canvas-zoom]').innerText())<=100);
    await action('canvas-expand');assert.equal(await page.locator('.canvas-expanded').count(),1);assert.equal(await page.locator('[data-action=canvas-expand]').getAttribute('aria-pressed'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('.canvas-expanded').count(),0);
    // Navigation uses a drag on the empty background, independent of moving cards.
    for(let i=0;i<8&&await viewport.evaluate(el=>el.scrollWidth<=el.clientWidth+150);i++)await action('canvas-zoom-in');await viewport.scrollIntoViewIfNeeded();const panBox=await viewport.boundingBox();await page.mouse.move(panBox.x+panBox.width-35,panBox.y+panBox.height-55);await page.mouse.down();await page.mouse.move(panBox.x+panBox.width-125,panBox.y+panBox.height-100,{steps:8});await page.mouse.up();assert.ok(await viewport.evaluate(el=>el.scrollLeft)>0);
    await page.reload();mural=await note('canvas');assert.equal(mural.stickies[0].text,'Primeira ideia');assert.equal(mural.canvas.width,900);assert.equal(mural.connections.length,1);assert.ok(mural.stickies[0].width>220);
    await action('canvas-fit');await page.screenshot({path:out+'/hub-lc-canvas-desktop.png',fullPage:true});
    // Remove a link; moving a card onto the other card also links and restores its position.
    await action('canvas-expand');await action('manage-sticky-connections');
    assert.equal(await page.locator('#editor [data-action=unlink-sticky]').count(),1);
    await action('unlink-sticky');await action('close-dialog');assert.equal((await note('canvas')).connections.length,1);
    await action('manage-sticky-connections');await action('unlink-sticky');await submit();
    assert.equal((await note('canvas')).connections.length,0);assert.equal((await note('canvas')).stickies.length,2);
    assert.equal((await note('canvas')).stickies[0].text,'Primeira ideia');assert.equal(await page.locator('.sticky-links path').count(),0);
    assert.equal(await page.locator('[data-action=manage-sticky-connections]').innerText(),'Conexões (0)');
    await page.keyboard.press('Escape');await page.reload();assert.equal((await note('canvas')).connections.length,0);await action('canvas-fit');
    await action('canvas-expand');await action('canvas-fit');const from=(await note('canvas')).stickies[0];await dragBetween(stickies.first().locator('header>span'),stickies.last().locator('textarea'));assert.equal((await note('canvas')).connections.length,1);assert.ok(Math.abs((await note('canvas')).stickies[0].x-from.x)<.01);await page.keyboard.press('Escape');
    await action('canvas-fit');
    // Resize the world with its corner handle while it is fully visible.
    const beforeWorld=(await note('canvas')).canvas;await drag(page.locator('[data-resize-canvas]'),-25,-20);assert.ok((await note('canvas')).canvas.width<beforeWorld.width);assert.equal(await page.locator('#editor').isVisible(),false);
    for(const width of [1024,360,320]){await page.setViewportSize({width,height:1000});await action('canvas-fit');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await page.locator('.sticky-links path').count(),1);}
    await page.screenshot({path:out+'/hub-lc-canvas-mobile.png',fullPage:true});
    await action('canvas-expand');await action('canvas-fit');await page.screenshot({path:out+'/hub-lc-canvas-expanded-mobile.png',fullPage:true});await page.keyboard.press('Escape');
    await page.setViewportSize({width:1440,height:1050});await viewport.evaluate(el=>{el.scrollLeft=0;el.scrollTop=0;});await action('canvas-fit');
    await action('remove-sticky');await action('close-dialog');assert.equal((await note('canvas')).stickies.length,2);
    await action('remove-sticky');await submit();assert.equal((await note('canvas')).stickies.length,1);assert.equal((await note('canvas')).connections.length,0);
    await page.locator('.individual-note-head [data-action=quick-delete]').click();await action('close-dialog');assert.equal((await stored()).notes.length,2);
    await page.locator('.individual-note-head [data-action=quick-delete]').click();await submit();assert.equal((await stored()).notes.length,1);
    await page.setViewportSize({width:320,height:1000});const fit=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1;}).map(el=>({tag:el.tagName,class:el.className,right:el.getBoundingClientRect().right})).slice(0,12)}));assert.ok(fit.scroll<=fit.width+1,JSON.stringify(fit));
    await page.locator('.note-list [data-action=open-note]').first().click();await page.locator('#note-body').fill('Texto longo com marcação e mais ideias.\n'.repeat(40));await selectText(5,25);await mark('green');
    await page.locator('#note-body').evaluate(el=>el.scrollTop=100);await page.waitForTimeout(100);assert.equal(await page.locator('.highlight-backdrop').evaluate(el=>el.scrollTop),await page.locator('#note-body').evaluate(el=>el.scrollTop));
    await page.screenshot({path:out+'/hub-lc-markers-mobile.png',fullPage:true});assert.deepEqual(errors,[]);
    return 'anotações: seleção real com mouse → ferramenta contextual → cor; post-its e mural redimensionáveis, zoom, ampliação, vínculos por arraste, persistência, cancelamento e layout mobile';
  }finally{await context.close();}
};
