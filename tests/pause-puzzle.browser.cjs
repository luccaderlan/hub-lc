const assert=require('node:assert/strict');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true}),errors=[];
  let page=await context.newPage();
  page.on('pageerror',err=>errors.push(err.message));
  const nav=view=>require('./navigation.cjs')(page,view);
  const action=name=>page.locator(`[data-action="${name}"]:visible`).first().click();
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
  const submit=()=>page.locator('#editor-form [type=submit]').click();
  const reminder=async minutes=>{await action('pause-reminder');await page.locator('#editor-form [name=minutes]').fill(minutes);await submit();};
  try{
    await page.goto(origin+'/#puzzle');await page.locator('.puzzle-tile').first().waitFor();
    await page.clock.install({time:new Date('2026-10-27T15:00:00Z')});
    assert.equal(await page.locator('.puzzle-tile').count(),9);
    assert.match(await page.locator('.puzzle-session').innerText(),/Jogue no seu tempo/);
    let first=page.locator('.puzzle-tile').first();await first.focus();await page.keyboard.press('Enter');
    assert.equal(await first.evaluate(el=>el===document.activeElement),true);
    let snapshot=await stored();assert.equal(snapshot.timer.running,false);assert.equal(snapshot.timer.elapsedMs,0);assert.deepEqual(snapshot.sessions,[]);
    const puzzle=snapshot.puzzle;
    await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.puzzle-tile[data-id="1"]').evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('ArrowDown');assert.equal(await page.locator('.puzzle-tile[data-id="4"]').evaluate(el=>el===document.activeElement),true);
    assert.match(await first.getAttribute('aria-label'),/Linha 1, coluna 1.*Caminho.*Girar 90 graus/);
    await page.reload();assert.deepEqual((await stored()).puzzle,puzzle);
    await nav('sessions');assert.equal(await page.locator('[name=timer-target]').inputValue(),'');assert.equal(await page.locator('.pause-options').count(),0);
    await page.locator('[name=timer-target]').fill('1');await page.locator('[name=timer-target]').blur();
    await action('start-timer');await page.clock.runFor(61000);
    snapshot=await stored();assert.equal(snapshot.timer.running,true);assert.equal(snapshot.timer.targetNotified,true);assert.equal(snapshot.timer.pause.startedAt,null);
    assert.match(await page.locator('[data-timer-hint]').innerText(),/alcançou/);
    const notifiedAt=snapshot.updatedAt;await page.clock.runFor(2000);assert.equal((await stored()).updatedAt,notifiedAt);
    await page.locator('[name=timer-target]').fill('2');await page.locator('[name=timer-target]').blur();assert.doesNotMatch(await page.locator('[data-timer-hint]').innerText(),/alcançou/);
    await page.locator('[name=timer-target]').fill('');await page.locator('[name=timer-target]').blur();assert.equal((await stored()).timer.targetMinutes,'');
    snapshot=await stored();await nav('puzzle');assert.deepEqual((await stored()).timer,snapshot.timer);
    assert.match(await page.locator('.puzzle-session h2').innerText(),/em andamento/);
    await action('pause-timer');const paused=await stored(),elapsed=paused.timer.elapsedMs;
    assert.equal(paused.timer.running,false);assert.equal(paused.timer.pause.minutes,'');assert.match(await page.locator('[data-pause-reminder]:visible').innerText(),/sem lembrete/);
    await page.clock.runFor(20000);assert.equal((await stored()).timer.elapsedMs,elapsed);
    await action('pause-reminder');assert.equal(await page.locator('#editor-form [name=minutes]').inputValue(),'');
    await page.locator('#editor-form [name=minutes]').fill('1');await submit();
    const deadline=(await stored()).timer.pause.endsAt;await page.clock.runFor(30000);await page.reload();
    assert.equal((await stored()).timer.pause.endsAt,deadline);assert.equal((await stored()).timer.running,false);
    await page.clock.runFor(31000);assert.equal((await stored()).timer.pause.notified,true);assert.equal((await stored()).timer.elapsedMs,elapsed);
    assert.match(await page.locator('[data-pause-reminder]:visible').innerText(),/passou/);assert.equal(await page.locator('.puzzle-tile').count(),9);
    const once=(await stored()).updatedAt;await page.clock.runFor(2000);assert.equal((await stored()).updatedAt,once);
    await reminder('3');assert.equal((await stored()).timer.pause.notified,false);assert.ok((await stored()).timer.pause.endsAt>deadline);
    await action('clear-reminder');assert.equal((await stored()).timer.pause.endsAt,null);
    await reminder('1');const beforeResume=(await stored()).puzzle;
    await action('resume-study');assert.match(page.url(),/#sessions$/);assert.equal((await stored()).timer.running,true);assert.equal((await stored()).timer.pause.endsAt,null);
    await page.clock.runFor(10000);await action('finish-timer');
    const minutes=Number(await page.locator('#editor-form [name=minutes]').inputValue());assert.ok(Math.abs(minutes-(elapsed+10000)/60000)<.02);
    await submit();assert.equal((await stored()).sessions.length,1);assert.equal((await stored()).timer.elapsedMs,0);assert.equal((await stored()).timer.pause.startedAt,null);
    await nav('puzzle');assert.deepEqual((await stored()).puzzle,beforeResume);
    // Every stage is completed by following the hint offered in the UI.
    for(let level=0;level<6;level++){
      for(let attempt=0;attempt<10&&!await page.locator('.puzzle-board.solved').count();attempt++){
        await action('puzzle-hint');const message=await page.locator('[data-puzzle-result]').innerText();
        const match=message.match(/linha (\d), coluna (\d) (uma vez|\d vezes)/);assert.ok(match,message);
        const index=(Number(match[1])-1)*3+Number(match[2])-1,turns=match[3]==='uma vez'?1:Number(match[3].split(' ')[0]);
        const tile=page.locator(`.puzzle-tile[data-id="${index}"]`);assert.ok(await tile.evaluate(el=>el.classList.contains('hinted')));
        for(let t=0;t<turns;t++)await tile.click();
        assert.equal(await tile.evaluate(el=>el===document.activeElement),true);
      }
      assert.match(await page.locator('[data-puzzle-result]').innerText(),/Caminho completo/);
      const solved=(await stored()).puzzle;await page.clock.runFor(5000);assert.deepEqual((await stored()).puzzle,solved);
      assert.equal((await stored()).sessions.length,1);assert.equal((await stored()).timer.running,false);
      await action('next-puzzle');
    }
    // A closed page with an expired reminder comes back paused, preserving the board.
    await nav('sessions');await action('start-timer');await page.clock.runFor(10000);await action('pause-timer');await reminder('1');await nav('puzzle');
    const saved=(await stored()).puzzle,closedElapsed=(await stored()).timer.elapsedMs;await page.close();page=await context.newPage();page.on('pageerror',err=>errors.push(err.message));await page.clock.install({time:new Date('2026-10-27T18:00:00Z')});await page.goto(origin+'/#puzzle');await page.locator('.puzzle-tile').first().waitFor();first=page.locator('.puzzle-tile').first();
    snapshot=await stored();assert.equal(snapshot.timer.running,false);assert.equal(snapshot.timer.elapsedMs,closedElapsed);assert.equal(snapshot.timer.pause.notified,true);assert.deepEqual(snapshot.puzzle,saved);
    // Export/import keeps both features; import never starts study.
    await nav('settings');const downloadEvent=page.waitForEvent('download');await action('export');const download=await downloadEvent;
    const backup=JSON.parse(await require('node:fs/promises').readFile(await download.path(),'utf8'));assert.deepEqual(backup.puzzle,saved);assert.deepEqual(backup.timer.pause,snapshot.timer.pause);
    await page.locator('#import-file').setInputFiles({name:'pausa-puzzle.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await submit();await page.locator('#editor').waitFor({state:'hidden'});
    assert.deepEqual((await stored()).puzzle,saved);assert.equal((await stored()).timer.running,false);
    for(const theme of ['light','dark']){
      await nav('settings');await page.locator('[name=pref-theme]').selectOption(theme);await nav('puzzle');
      for(const width of [1440,1024,768,360,320]){
        await page.setViewportSize({width,height:1050});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`puzzle overflow ${theme} ${width}`);
        const box=await first.boundingBox();assert.ok(box.width>=44&&box.height>=44,`peça pequena em ${width}: ${JSON.stringify(box)}`);
        const overlap=await page.locator('.puzzle-entry').evaluate(el=>{const a=el.getBoundingClientRect(),b=document.querySelector('.puzzle-tile').getBoundingClientRect();return a.right>b.left;});assert.equal(overlap,false);
        const centers=await page.locator('.puzzle-entry').evaluate(el=>{const a=el.getBoundingClientRect(),tiles=document.querySelectorAll('.puzzle-tile'),entry=[...tiles].find(t=>t.getAttribute('aria-label').includes('Entrada à esquerda')),b=entry.getBoundingClientRect();return [a.y+a.height/2,b.y+b.height/2];});assert.ok(Math.abs(centers[0]-centers[1])<3);
        await page.screenshot({path:`${out}/pause-puzzle-${theme}-${width}.png`,fullPage:true,animations:'disabled'});
      }
    }
    await page.emulateMedia({reducedMotion:'reduce'});await action('rotate-puzzle');
    assert.equal(await page.locator('.puzzle-pipe').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    assert.equal(await page.locator('.puzzle-board').evaluate(el=>getComputedStyle(el).animationName),'none');
    assert.deepEqual(errors,[]);
    return 'Pausa e Puzzle: seis fases e pistas, teclado, tempos livres, avisos únicos, pausa sem estudo, reload/aba fechada, backup e layout claro/escuro de 320 a 1440 px';
  }catch(err){await page.screenshot({path:`${out}/pause-puzzle-failure.png`,fullPage:true,animations:'disabled'});throw err;}
  finally{await context.close();}
};
