const assert=require('node:assert/strict');
const path=require('node:path');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const action=name=>page.locator(`[data-action="${name}"]:visible`).first().click();
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
  const submit=()=>page.locator('#editor-form [type=submit]').click();
  try{
    await page.goto(origin+'/#areas');
    assert.equal(await page.locator('[data-catalog-results]>.catalog-area.is-expanded').count(),1);
    assert.equal(await page.locator('[data-catalog-results]>.catalog-area.is-collapsed').count(),3);
    await page.evaluate(()=>localStorage.setItem('hub-lc:study-collapsed','[]'));await page.reload();
    assert.equal(await page.locator('[data-catalog-results]>.catalog-area.is-expanded').count(),1,'previous preferences also restore a single expanded area');
    // An arbitrary collection follows exactly the same structure, including an empty group.
    const ids=await page.evaluate(async()=>{
      const {uid,makeDiscovery,validateState}=await import('/data.js'),s=JSON.parse(localStorage.getItem('hub-lc:v1'));
      const subject={id:uid(),name:'Cerâmica experimental',division:'Oficina de pesquisa',subgroup:'Processos e prática',description:'Investigação com argilas e texturas.'};
      const loose={id:uid(),name:'Arquivo de campo',division:subject.division,subgroup:'',description:''};
      s.areas.push(subject,loose);s.studyGroups.push({division:subject.division,name:subject.subgroup},{division:subject.division,name:'Próximas pesquisas'});
      const material={id:uid(),title:'Caderno de queima',areaId:subject.id,url:'https://example.org/queima',kind:'Leitura',description:'Observações sobre temperatura e acabamento.'};
      const discovery=makeDiscovery('https://example.org/texturas','Cerâmica experimental: texturas','Uma fonte para comparar possibilidades.');
      s.materials.push(material);s.discoveries.push(discovery);validateState(s);localStorage.setItem('hub-lc:v1',JSON.stringify(s));
      return {subject:subject.id,loose:loose.id,material:material.id,discovery:discovery.id};
    });
    await page.reload();
    const area=page.locator('[data-catalog-results]>.catalog-area').filter({has:page.locator('h2',{hasText:'Oficina de pesquisa'})});
    const neutralPaths=await page.locator('.catalog-area-icon svg').evaluateAll(icons=>icons.map(icon=>icon.innerHTML));
    assert.equal(new Set(neutralPaths).size,1);
    await area.locator('.catalog-area-head [data-fold]').focus();await page.keyboard.press('Enter');
    assert.equal(await area.locator('.catalog-area-head [data-fold]').getAttribute('aria-expanded'),'true');
    assert.equal(await page.locator('[data-catalog-results]>.catalog-area.is-expanded').count(),1);
    assert.match(await page.locator('[data-catalog-results]>.catalog-area').first().innerText(),/Oficina de pesquisa/);
    assert.equal(await area.locator('.catalog-area-head [data-fold]').evaluate(el=>el===document.activeElement),true);
    assert.match(await area.innerText(),/Próximas pesquisas/);
    assert.equal(await area.locator('.catalog-ungrouped .study-subject').count(),1);
    await area.locator('[data-action=new-subgroup]').click();await page.locator('[name=name]').fill('Ensaios novos');await submit();
    let managed=area.locator('.catalog-group').filter({has:page.locator('h3',{hasText:'Ensaios novos'})});
    assert.match(await managed.innerText(),/Nenhum assunto neste grupo/);
    await managed.locator('[data-action=edit-subgroup]').click();await page.locator('[name=name]').fill('Ensaios revisados');await submit();
    managed=area.locator('.catalog-group').filter({has:page.locator('h3',{hasText:'Ensaios revisados'})});
    await managed.locator('[data-action=edit-subgroup]').click();await action('delete-record');await submit();
    assert.equal((await stored()).studyGroups.some(group=>group.name==='Ensaios revisados'),false);
    const before=await stored();
    await area.locator(`[data-id="${ids.subject}"]`).click();
    assert.equal(await page.locator('h1').innerText(),'Cerâmica experimental');
    assert.equal(await page.locator('.study-material-section').count(),2);
    assert.equal(await page.locator('.study-material.is-suggested').count(),1);
    const reference=page.locator('.study-material-section').filter({has:page.locator('h2',{hasText:'Referências'})});
    const card=reference.locator('.study-material'),grid=reference.locator('.study-material-grid');
    assert.ok(Math.abs((await card.boundingBox()).width-(await grid.boundingBox()).width)<2,'single card uses the full grid');
    assert.equal(await card.locator('[data-action=edit-material]').isVisible(),false);
    const fold=reference.locator('[data-action=study-section-toggle]');
    await fold.focus();await page.keyboard.press('Enter');assert.equal(await grid.isVisible(),false);
    assert.equal(await fold.evaluate(el=>el===document.activeElement),true);
    await page.keyboard.press('Enter');assert.equal(await grid.isVisible(),true);
    await action('review-study-link');assert.match(await page.locator('#editor').innerText(),/Você registrou/);
    assert.deepEqual(await stored(),before,'opening review never confirms the suggested connection');
    await action('close-dialog');assert.deepEqual(await stored(),before);
    await action('review-study-link');await submit();
    assert.deepEqual((await stored()).discoveries.find(d=>d.id===ids.discovery).areaIds,[ids.subject]);
    assert.equal(await page.locator('.study-material.is-suggested').count(),0);
    await card.locator('summary').focus();await page.keyboard.press('Enter');await card.locator('[data-action=edit-material]').click();
    await page.locator('[name=title]').fill('Caderno de queima revisado');await submit();assert.match(await card.innerText(),/revisado/);
    await card.locator('summary').click();await card.locator('[data-action=quick-delete]').click();await action('close-dialog');
    assert.equal((await stored()).materials.some(m=>m.id===ids.material),true,'delete can be cancelled from the card menu');
    await card.locator('[data-action=quick-delete]').click();await submit();assert.equal((await stored()).materials.some(m=>m.id===ids.material),false);
    await page.locator('[data-action=study-catalog-context][data-group]').click();assert.equal(await page.locator('[data-catalog-results] .study-subject').count(),1);
    await page.locator(`[data-id="${ids.subject}"]`).click();await action('study-switch');
    assert.equal(await page.locator('#study-subject-panel [aria-current=page]').count(),1);
    await page.locator('[data-panel-search]').fill('Arquivo de campo');await page.locator(`#study-subject-panel [data-id="${ids.loose}"]`).click();
    assert.equal(await page.locator('h1').innerText(),'Arquivo de campo');assert.equal(await page.locator('#study-subject-panel').isVisible(),false);
    // Review real populated surfaces at desktop and mobile sizes in both themes.
    for(const theme of ['light','dark']){
      await page.evaluate(theme=>{const s=JSON.parse(localStorage.getItem('hub-lc:v1'));s.prefs.theme=theme;localStorage.setItem('hub-lc:v1',JSON.stringify(s));},theme);
      await page.goto(origin+'/#areas/'+ids.subject);await page.reload();
      for(const width of [320,768,1440]){
        await page.setViewportSize({width,height:1000});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        const backgrounds=await page.evaluate(()=>['body','.study-material-section','.study-material'].map(selector=>getComputedStyle(document.querySelector(selector)).backgroundColor));
        assert.equal(new Set(backgrounds).size,3);
        await page.screenshot({path:path.join(out,`study-surfaces-${theme}-${width}.png`),fullPage:true});
      }
    }
    assert.deepEqual(errors,[]);
    return 'superfícies: hierarquia neutra com área/grupo/assunto arbitrários, sem grupo, cartão único sem coluna vazia, seções pelo teclado, menus editar/excluir, revisão sem vínculo automático, confirmação, breadcrumb e troca de assunto; claro/escuro em 320/768/1440 px';
  }catch(error){await page.screenshot({path:path.join(out,'study-surfaces-failure.png'),fullPage:true});throw error;}
  finally{await context.close();}
};
