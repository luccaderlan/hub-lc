const assert=require('node:assert/strict');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1586,height:992},timezoneId:'America/Sao_Paulo'}),page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  const nav=async view=>{if(await page.evaluate(()=>location.hash)==='#'+view)return;await require('./navigation.cjs')(page,view);};
  const submit=()=>page.locator('#editor-form [type=submit]').click();
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
  try{
    await page.goto(origin);
    const fixture=await page.evaluate(async()=>{
      const {createInitial,STORAGE_KEY,uid}=await import('/data.js'),s=createInitial(),java=s.areas[0].id,philosophy=s.areas.find(a=>a.name==='Filosofia').id;
      const note=(title,body,areaId,materialId='',bookId='')=>({id:uid(),title,body,kind:'text',category:'Anotação',areaId,materialId,bookId,page:'',stickies:[],updatedAt:new Date().toISOString()});
      const direct=note('Classes e construtores','Minhas reflexões sobre classes, objetos e construtores.',java),indirect=note('Ligada à referência','Uma nota vinculada pelo material.','',s.materials[0].id);
      s.notes.push(direct,indirect,note('Maturidade intelectual em Kant','Autonomia, razão prática e os limites do conhecimento.',philosophy),note('Uma leitura reservada','Não aparece no início.',java,'',s.books[0].id));
      s.sessions.push({id:uid(),areaId:java,bookId:'',minutes:32,date:'2026-10-26',summary:'Classes, objetos e construtores',next:'Praticar construtores'});
      const task={id:uid(),title:'Praticar construtores',areaId:java,columnId:s.columns[1].id,kind:'Estudo',details:'',duration:'',due:''};s.tasks.push(task);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(s));return {java,taskId:task.id,doneId:s.columns[3].id,directId:direct.id,indirectId:indirect.id};
    });
    await page.reload();assert.match(await page.locator('h1').innerText(),/Lucca/);
    assert.match(await page.locator('.resume-description').innerText(),/Praticar construtores/);
    assert.equal(await page.locator('.editorial-note-row').count(),3);
    assert.doesNotMatch(await page.locator('#main').innerText(),/leitura reservada/);
    await page.locator('[data-action=area-notes]').click();
    assert.equal(await page.locator('[data-filter=area]').inputValue(),fixture.java);
    const noteIds=await page.locator('.note-list [data-action=open-note]').evaluateAll(els=>els.map(el=>el.dataset.id));
    assert.ok(noteIds.includes(fixture.directId));assert.ok(noteIds.includes(fixture.indirectId));
    assert.doesNotMatch(await page.locator('.note-list').innerText(),/Kant/);
    await page.reload();assert.equal(await page.locator('[data-filter=area]').inputValue(),fixture.java);
    await nav('home');await page.locator('.resume-primary').click();assert.equal(await page.locator('.study-context h2').innerText(),'Java');
    await nav('home');await page.locator('[data-action=home-division]').filter({hasText:'Filosofia'}).click();assert.equal(await page.locator('[data-filter=division]').inputValue(),'Filosofia');
    await nav('home');await page.locator('[data-action=quick-note]').first().click();await page.locator('[name=title]').fill('Aprender com minhas palavras');await page.locator('[name=body]').fill('Aprender melhor é conseguir explicar com as próprias palavras.');await submit();
    assert.equal(await page.locator('#main').getAttribute('data-page'),'home');
    assert.match(await page.locator('.idea-paper').innerText(),/Aprender melhor/);
    await page.reload();await page.locator('.idea-paper').click();assert.equal(await page.locator('#note-body').inputValue(),'Aprender melhor é conseguir explicar com as próprias palavras.');
    await page.locator('#note-body').fill('Ideia revisada e salva.');await nav('home');assert.match(await page.locator('.idea-paper').innerText(),/Ideia revisada/);
    await page.locator('[data-action=complete-task]').click();assert.equal((await stored()).tasks.find(t=>t.id===fixture.taskId).columnId,fixture.doneId);
    await nav('board');assert.equal(await page.locator(`[data-column="${fixture.doneId}"] [data-task="${fixture.taskId}"]`).count(),1);
    await nav('settings');await page.locator('[name=pref-name]').fill('Ana');await page.locator('[name=pref-name]').press('Tab');await nav('home');assert.match(await page.locator('h1').innerText(),/Ana/);await page.reload();assert.match(await page.locator('h1').innerText(),/Ana/);
    // Screenshot the same saved content in both themes and at mobile size.
    await nav('settings');await page.locator('[name=pref-name]').fill('Lucca');await page.locator('[name=pref-name]').press('Tab');
    for(const theme of ['light','dark']){
      await page.locator('[name=pref-theme]').selectOption(theme);
      for(const width of [1586,768,360,320]){
        await page.setViewportSize({width,height:992});await nav('home');
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${theme} ${width}: overflow`);
        await page.screenshot({path:`${out}/editorial-home-${theme}-${width}.png`,fullPage:true});await nav('settings');
      }
    }
    assert.deepEqual(errors,[]);
    return 'editorial: atalhos por assunto e coleção, notas vinculadas diretamente e por referência, captura rápida, edição, conclusão no quadro e nome persistem após recarregar; temas claro/escuro em 320–1586 px';
  }finally{await context.close();}
};
