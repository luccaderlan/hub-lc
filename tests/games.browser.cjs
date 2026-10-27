const assert=require('node:assert/strict');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
  const action=name=>page.locator(`[data-action="${name}"]:visible`).first().click();
  const choose=kind=>page.locator(`[data-action=choose-game][data-id="${kind}"]`).click();
  const nav=key=>require('./navigation.cjs')(page,key);
  const waitMoves=length=>page.waitForFunction(n=>{const s=JSON.parse(localStorage.getItem('hub-lc:v1'));return s.games[s.games.selected]?.moves.length===n;},length);
  const start=async level=>{if(await page.locator('[data-action=new-game]').count())await action('new-game');await page.locator('#game-difficulty').selectOption(level);await action('start-game');};
  const seed=async(kind,moves)=>{await page.evaluate(({kind,moves})=>{const s=JSON.parse(localStorage.getItem('hub-lc:v1'));s.games.selected=kind;s.games[kind]={difficulty:'hard',moves};localStorage.setItem('hub-lc:v1',JSON.stringify(s));},{kind,moves});await page.reload();await page.locator('.game-status').waitFor();};
  try{
    await page.clock.install({time:new Date('2026-10-27T15:00:00Z')});
    await page.goto(origin+'/#puzzle');await page.locator('.game-picker').waitFor();
    await choose('chess');await action('start-game');assert.equal((await stored()).games.chess,null);assert.equal(await page.locator('#game-difficulty').evaluate(el=>el===document.activeElement),true);
    const base=await stored();
    for(const kind of ['tictactoe','checkers','chess'])for(const level of ['easy','medium','hard']){
      await choose(kind);await start(level);
      assert.equal(await page.locator('.game-cell').count(),kind==='tictactoe'?9:64);
      if(kind==='tictactoe')await page.locator('.game-cell[data-id="0"]').click();
      else{
        const from=page.locator('.game-cell.movable').first();await from.click();assert.equal(await from.evaluate(el=>el===document.activeElement),true);
        await page.locator('.game-cell.available').first().click();
      }
      await waitMoves(2);assert.match(await page.locator('.game-status').innerText(),/Sua vez/);
      const s=await stored();assert.equal(s.games[kind].difficulty,level);assert.deepEqual(s.timer,base.timer);assert.deepEqual(s.sessions,base.sessions);assert.deepEqual(s.puzzle,base.puzzle);
      await page.reload();assert.deepEqual((await stored()).games[kind],s.games[kind]);
    }
    // Teclado: uma entrada no tabuleiro, setas, seleção, destinos e foco após jogada do bot.
    await start('hard');const e2=page.locator('.game-cell[data-id="52"]');await e2.focus();await page.keyboard.press('Enter');assert.equal(await e2.getAttribute('aria-pressed'),'true');
    await page.keyboard.press('ArrowUp');await page.keyboard.press('ArrowUp');assert.equal(await page.locator('.game-cell[data-id="36"]').evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Enter');await waitMoves(2);assert.equal(await page.locator('.game-cell[data-id="36"]').evaluate(el=>el===document.activeElement),true);
    // Promoção exige escolha explícita e só então grava o lance.
    const promotion=['a2a4','h7h5','a4a5','h5h4','a5a6','h4h3','a6b7','h3g2'];
    await seed('chess',promotion);await page.locator('.game-cell[data-id="9"]').click();await page.locator('.game-cell[data-id="0"]').click();
    assert.equal(await page.locator('[data-action=promote-game]').count(),4);assert.equal((await stored()).games.chess.moves.length,8);
    await action('cancel-promotion');assert.equal(await page.locator('.game-cell[data-id="9"]').evaluate(el=>el===document.activeElement),true);
    await page.locator('.game-cell[data-id="0"]').click();await page.locator('[data-action=promote-game][data-id=b7a8n]').click();await waitMoves(10);assert.equal((await stored()).games.chess.moves[8],'b7a8n');
    // Sequência real de dama: cada salto preserva o turno até completar a maior captura.
    const chain=['42-33','17-24','46-39','24-42','49-35','8-17','44-37','1-8','56-49','23-30','37-23','19-26','51-44','26-33','40-26','10-19','39-30','21-39','60-51','19-33','49-42','12-19'];
    await seed('checkers',chain);await page.locator('.game-cell[data-id="42"]').click();await page.locator('.game-cell[data-id="24"]').click();assert.equal((await stored()).games.checkers.moves.length,22);assert.match(await page.locator('.game-status').innerText(),/Continue a captura/);
    await page.locator('.game-cell[data-id="10"]').click();await page.locator('.game-cell[data-id="28"]').click();await waitMoves(24);assert.equal((await stored()).games.checkers.moves[22],'42-24-10-28');
    await seed('chess',['f2f3','e7e5','g2g4','d8h4']);assert.match(await page.locator('.game-status').innerText(),/O bot venceu.*Xeque-mate/);
    await seed('tictactoe',['0','3','1','4','8','5']);assert.match(await page.locator('.game-status').innerText(),/O bot venceu/);
    // Partidas completas e seleção são incluídas em ambas as modalidades de backup.
    const beforeBackup=await stored();await nav('settings');
    for(const name of ['export','export-metadata']){
      const downloadEvent=page.waitForEvent('download');await action(name);const download=await downloadEvent;
      const data=JSON.parse(await require('node:fs/promises').readFile(await download.path(),'utf8'));assert.deepEqual(data.games,beforeBackup.games);
    }
    const invalid=structuredClone(beforeBackup);invalid.games.chess.moves.push('a2a3');
    await page.locator('#import-file').setInputFiles({name:'invalid-games.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(invalid))});
    await page.locator('#toast').filter({hasText:'inválido'}).waitFor();assert.deepEqual((await stored()).games,beforeBackup.games);
    await page.locator('#import-file').setInputFiles({name:'games.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(beforeBackup))});await page.locator('#editor-form [type=submit]').click();await page.locator('#editor').waitFor({state:'hidden'});assert.deepEqual((await stored()).games,beforeBackup.games);
    const old=structuredClone(beforeBackup);delete old.games;
    await nav('settings');await page.locator('#import-file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(old))});await page.locator('#editor-form [type=submit]').click();await page.locator('#editor').waitFor({state:'hidden'});assert.equal((await stored()).games.selected,'desvio');assert.deepEqual((await stored()).puzzle,old.puzzle);assert.deepEqual((await stored()).notes,old.notes);
    // Sessão ativa nunca muda ao entrar, jogar ou terminar; lembrete mantém jogo aberto.
    await nav('sessions');await action('start-timer');await nav('puzzle');await choose('chess');await start('hard');assert.equal((await stored()).timer.running,true);
    await action('pause-timer');const elapsed=(await stored()).timer.elapsedMs;
    await action('pause-reminder');await page.locator('#editor-form [name=minutes]').fill('1');await page.locator('#editor-form [type=submit]').click();
    await page.clock.runFor(61000);assert.equal((await stored()).timer.running,false);assert.equal((await stored()).timer.elapsedMs,elapsed);assert.ok(await page.locator('.strategy-board').isVisible());assert.match(await page.locator('[data-pause-reminder]:visible').first().innerText(),/passou/);
    for(const theme of ['light','dark']){
      await nav('settings');await page.locator('[name=pref-theme]').selectOption(theme);await nav('puzzle');
      for(const kind of ['tictactoe','checkers','chess']){
        await choose(kind);if(!((await stored()).games[kind]))await start('medium');
        for(const width of [1440,768,360,320]){
          await page.setViewportSize({width,height:1050});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${kind} ${theme} ${width}`);
          assert.ok(await page.locator('.game-cell').first().isVisible());
          if(width===1440||width===320)await page.screenshot({path:`${out}/games-${kind}-${theme}-${width}.png`,fullPage:true,animations:'disabled'});
        }
      }
    }
    await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.strategy-board').evaluate(el=>getComputedStyle(el).animationName),'none');
    assert.deepEqual(errors,[]);
    // Respostas atrasadas, falha e retomada: worker controlável para exercitar as condições de corrida.
    const race=await browser.newContext({viewport:{width:360,height:900},hasTouch:true});
    try{
      await race.addInitScript(()=>{window.testWorkers=[];window.Worker=class{constructor(){window.testWorkers.push(this);}postMessage(data){this.request=data;}terminate(){this.terminated=true;}};});
      const p=await race.newPage();await p.goto(origin+'/#puzzle');await p.locator('[data-action=choose-game][data-id=chess]').tap();await p.locator('#game-difficulty').selectOption('hard');await p.locator('[data-action=start-game]').tap();
      await p.locator('.game-cell[data-id="52"]').tap();await p.locator('.game-cell[data-id="36"]').tap();await p.waitForFunction(()=>window.testWorkers.length===1);
      const reply=()=>p.evaluate(()=>{const w=window.testWorkers[0];w.onmessage({data:{token:w.request.token,move:'e7e5'}});});
      await p.locator('[data-action=new-game]').tap();await p.locator('#game-difficulty').selectOption('easy');await p.locator('[data-action=start-game]').tap();await reply();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')).games.chess.moves.length),0);
      await p.locator('.game-cell[data-id="52"]').tap();await p.locator('.game-cell[data-id="36"]').tap();
      await p.locator('[data-action=choose-game][data-id=desvio]').tap();
      await p.evaluate(()=>{const w=window.testWorkers.at(-1);w.onmessage({data:{token:w.request.token,move:'e7e5'}});});assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')).games.chess.moves.length),1);
      await p.locator('[data-action=choose-game][data-id=chess]').tap();await p.evaluate(()=>window.testWorkers.at(-1).onerror());await p.locator('[data-action=retry-bot]').tap();
      await p.evaluate(()=>{const w=window.testWorkers.at(-1);w.onmessage({data:{token:w.request.token,move:'e7e5'}});});assert.equal(await p.locator('.game-cell[data-id="28"]').getAttribute('aria-label').then(x=>x.includes('peão preto')),true);
      await p.reload();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')).games.chess.moves.length),2);
      // Reload durante o turno do bot retoma a busca; restaurar por outra aba invalida a resposta anterior.
      await p.locator('.game-cell[data-id="62"]').tap();await p.locator('.game-cell[data-id="45"]').tap();await p.reload();await p.waitForFunction(()=>window.testWorkers.length===1);
      await p.evaluate(()=>{const s=JSON.parse(localStorage.getItem('hub-lc:v1'));s.games.chess={difficulty:'medium',moves:[]};localStorage.setItem('hub-lc:v1',JSON.stringify(s));window.dispatchEvent(new StorageEvent('storage',{key:'hub-lc:v1'}));});
      await p.evaluate(()=>{const w=window.testWorkers[0];w.onmessage({data:{token:w.request.token,move:'b8c6'}});});assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')).games.chess.moves.length),0);
    }finally{await race.close();}
    return 'Jogos: três níveis por bot, regras e resultado do bot, teclado/foco/toque, promoção, reload, backups/legados/inválidos, pausa/lembrete, workers atrasados e temas de 320 a 1440 px';
  }catch(error){await page.screenshot({path:`${out}/games-failure.png`,fullPage:true});throw error;}
  finally{await context.close();}
};
