const assert=require('node:assert/strict');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1280,height:1000}});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    window.timerNotifications=[];
    window.Notification=class{static permission='default';static async requestPermission(){this.permission='granted';return 'granted';}constructor(title,options){window.timerNotifications.push({title,...options});}close(){}};
  });
  const action=name=>page.locator(`[data-action="${name}"]`).first().click();
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
  try{
    await page.clock.install({time:new Date('2026-10-27T15:00:00Z')});
    await page.clock.pauseAt(new Date('2026-10-27T15:00:01Z'));
    await page.goto(origin+'/#sessions');await page.locator('[name=timer-mode]').waitFor();
    await page.locator('[name=timer-mode]').selectOption('countdown');
    await action('start-timer');assert.equal((await stored()).timer.running,false);
    await page.locator('[name=timer-target]').fill('1');await page.locator('[name=timer-target]').blur();
    assert.equal(await page.locator('[data-session-clock]').innerText(),'00:01:00');
    await action('enable-timer-notifications');await action('start-timer');await page.clock.runFor(20000);
    assert.equal(await page.locator('[data-session-clock]').innerText(),'00:00:40');
    await action('pause-timer');await page.clock.runFor(30000);
    assert.equal(await page.locator('[data-session-clock]').innerText(),'00:00:40');
    await page.reload();assert.equal(await page.locator('[data-session-clock]').innerText(),'00:00:40');
    await action('enable-timer-notifications');await action('start-timer');await page.clock.runFor(41000);
    assert.equal(await page.locator('[data-session-clock]').innerText(),'00:00:00');
    assert.equal((await stored()).timer.targetNotified,true);assert.equal((await stored()).timer.running,false);
    assert.equal((await stored()).timer.elapsedMs,60000);
    assert.equal(await page.locator('[data-action=pause-timer]').count(),0);
    assert.equal(await page.locator('#timer-limit-alert').count(),1);
    assert.equal(await page.evaluate(()=>window.timerNotifications.length),1);
    await page.clock.runFor(10000);assert.equal(await page.evaluate(()=>window.timerNotifications.length),1);
    await page.locator('[data-dismiss-timer-alert]').click();await page.reload();assert.equal(await page.locator('#timer-limit-alert').count(),0);
    await require('./navigation.cjs')(page,'home');
    assert.match(await page.locator('.resume-study').innerText(),/Tempo programado concluído/);
    assert.doesNotMatch(await page.locator('.resume-study').innerText(),/Em andamento|Sessão em andamento/);
    assert.equal(await page.locator('.resume-elapsed').innerText(),'00:01:00');
    await page.clock.runFor(120000);assert.equal(await page.locator('.resume-elapsed').innerText(),'00:01:00');
    await require('./navigation.cjs')(page,'sessions');
    // Repair a running timer saved by the previous implementation after its limit.
    await page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('hub-lc:v1'));state.timer.running=true;state.timer.elapsedMs=90000;state.timer.startedAt=Date.now()-90000;state.timer.pause={startedAt:null,minutes:'',endsAt:null,notified:false};localStorage.setItem('hub-lc:v1',JSON.stringify(state));});
    await page.reload();assert.equal((await stored()).timer.running,false);assert.equal((await stored()).timer.elapsedMs,60000);
    await page.locator('[name=timer-mode]').selectOption('deadline');
    const deadline=await page.evaluate(()=>{const date=new Date(Date.now()+120000);return new Date(date-date.getTimezoneOffset()*60000).toISOString().slice(0,16);});
    await page.locator('[name=timer-deadline]').fill(deadline);await page.locator('[name=timer-deadline]').blur();
    await action('start-timer');await page.clock.runFor(1000);await action('pause-timer');
    const elapsed=(await stored()).timer.elapsedMs;
    await page.clock.runFor(120000);assert.equal((await stored()).timer.elapsedMs,elapsed);
    assert.match(await page.locator('#timer-limit-alert').innerText(),/horário limite/);
    await page.reload();assert.equal(await page.locator('#timer-limit-alert').count(),1);
    await page.locator('[data-dismiss-timer-alert]').click();await action('start-timer');assert.equal((await stored()).timer.running,true);assert.equal((await stored()).timer.mode,'stopwatch');
    await page.clock.runFor(5000);assert.equal((await stored()).timer.elapsedMs,elapsed);assert.ok(await page.locator('[data-session-clock]').innerText()!=='00:00:00');
    await page.locator('[name=timer-mode]').selectOption('countdown');
    await page.locator('[name=timer-target]').fill('2');await page.locator('[name=timer-target]').blur();
    await require('./navigation.cjs')(page,'home');await page.clock.runFor(120000);
    assert.equal((await stored()).timer.running,false);assert.equal((await stored()).timer.elapsedMs,120000);
    assert.match(await page.locator('.resume-study').innerText(),/Tempo programado concluído/);
    assert.doesNotMatch(await page.locator('.resume-study').innerText(),/Em andamento|Sessão em andamento/);
    await require('./navigation.cjs')(page,'sessions');
    for(const width of [1280,360,320]){
      await page.setViewportSize({width,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.screenshot({path:`${out}/timer-${width}.png`,fullPage:true});
    }
    assert.deepEqual(errors,[]);return 'Timer: contagem regressiva, pausas, reload, limite por horário, aviso persistente e notificação única; layout de 320 a 1280 px';
  }finally{await context.close();}
};
if(require.main===module)(async()=>{
  const {chromium}=require(require('node:path').join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
  const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',headless:true});
  try{await require('node:fs/promises').mkdir('test-results',{recursive:true});console.log(await module.exports({browser,origin:process.env.HUB_LC_ORIGIN||'http://127.0.0.1:4173',out:'test-results'}));}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
