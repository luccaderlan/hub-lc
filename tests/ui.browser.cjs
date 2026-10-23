const assert=require('node:assert/strict');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1440,height:1050}}),page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  const nav=async view=>{if(await page.evaluate(()=>location.hash)==='#'+view)return;await require('./navigation.cjs')(page,view);};
  try{
    await page.goto(origin);
    await page.evaluate(async()=>{const {createInitial,makeDiscovery,STORAGE_KEY}=await import('/data.js');const s=createInitial();s.tasks.push({id:'ux-task',title:'Investigar uma nova ideia',areaId:s.areas[0].id,columnId:s.columns[0].id,kind:'Estudo',details:'Comparar as referências e registrar uma reflexão.',duration:'',due:''});s.discoveries.push(makeDiscovery('https://example.org/aprendizado','Aprendizado e memória','Uma pergunta para investigar com calma.'));s.notes.push({id:'ux-note',title:'Ideias que quero revisitar',kind:'text',category:'Reflexão',areaId:'',bookId:'',materialId:'',page:'',body:'Uma boa pergunta pode abrir um novo caminho.\n\nO que mudou na minha forma de entender este assunto?',stickies:[],highlights:[{start:4,end:16,color:'yellow'}],updatedAt:new Date().toISOString()});localStorage.setItem(STORAGE_KEY,JSON.stringify(s));});
    await page.reload();
    for(const theme of ['light','dark']){
      await nav('settings');await page.locator('[name=pref-theme]').selectOption(theme);
      for(const width of [1440,360]){
        await page.setViewportSize({width,height:1050});
        for(const view of ['home','areas','documents','discoveries','board','books','notes','sessions','evolution','dictionary','settings']){
          await nav(view);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${view}: overflow ${theme} ${width}`);
          if(view==='home'){assert.equal(await page.locator('.hero-card').evaluate(el=>getComputedStyle(el).borderLeftWidth), '1px');}
          if(view==='sessions'){
            const count=await page.locator('.session-clock-face svg').count();assert.equal(count,1);assert.equal(await page.locator('.timer-card [data-clock]').count(),0);
            const left=await page.locator('.timer-card').boundingBox(),clock=await page.locator('.session-clock-panel').boundingBox();if(width===1440)assert.ok(clock.x>left.x+left.width);else assert.ok(clock.y>left.y+left.height);
            assert.equal(await page.locator('[data-clock]').innerText(),'00:00:00');
          }
          const labels=await page.locator('button').evaluateAll(buttons=>buttons.filter(b=>b.getClientRects().length&&!b.textContent.trim()&&!b.getAttribute('aria-label')).length);assert.equal(labels,0,`${view}: botão sem nome`);
          await page.screenshot({path:`${out}/ux-${view}-${theme}-${width}.png`,fullPage:true});
        }
      }
    }
    await page.setViewportSize({width:1440,height:1050});await nav('sessions');await page.locator('[data-action=start-timer]').click();await page.waitForTimeout(1100);assert.notEqual(await page.locator('[data-clock-second]').getAttribute('transform'),'rotate(0 60 60)');await page.locator('[data-action=pause-timer]').click();const paused=await page.locator('[data-clock]').innerText();await page.waitForTimeout(1100);assert.equal(await page.locator('[data-clock]').innerText(),paused);
    assert.deepEqual(errors,[]);
    return 'UI/UX: 11 telas revistas em claro/escuro, desktop/mobile, sem overflow ou botões sem nome; relógio à direita com ponteiros sincronizados e destaque lateral removido';
  }finally{await context.close();}
};
