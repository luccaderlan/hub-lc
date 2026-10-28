const assert=require('node:assert/strict');
const path=require('node:path');
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const nav=name=>require('./navigation.cjs')(page,name);
  const action=(name,scope=page)=>scope.locator(`[data-action="${name}"]:visible`).first().click();
  const form=page.locator('#editor-form');
  const submit=()=>form.locator('button[type=submit]').click();
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
  try{
    await page.goto(origin+'/#discoveries');
    await page.getByRole('heading',{name:'Descobertas',exact:true}).waitFor();
    const capture=page.locator('#capture-form');
    await capture.locator('[name=url]').fill('https://www.youtube.com/watch?v=example');
    await capture.locator('[name=title]').fill('Memória e aprendizado');
    await capture.locator('button[type=submit]').click();
    assert.equal((await stored()).discoveries.length,1);
    assert.equal((await stored()).discoveries[0].kind,'Vídeo');
    const d=(await stored()).discoveries[0];
    await page.locator('#discovery-body').fill('Quero entender como o cérebro guarda memórias e conectar com uma API.');
    assert.equal((await stored()).discoveries[0].description,'Quero entender como o cérebro guarda memórias e conectar com uma API.');
    assert.equal((await stored()).discoveries[0].areaIds.length,0);
    assert.ok(await page.locator('[data-action=link-discovery-area]').count()>=2);
    await action('new-discovery-point');
    await form.locator('[name=position]').fill('08:42');
    await form.locator('[name=text]').fill('A ideia de revisar depois é o ponto que quero experimentar.');await submit();
    assert.equal(new URL(await page.locator('.point-source').getAttribute('href')).searchParams.get('t'),'522s');
    await page.reload();assert.equal(await page.locator('.discovery-point').count(),1);

    await nav('Áreas');await page.locator('[data-catalog-results] .study-subject strong').filter({hasText:/^Neurociência$/}).click();
    assert.equal(await page.locator('.discovery-card').count(),1);
    assert.equal(await page.locator('.discovery-card').getByText('Vínculo sugerido',{exact:true}).count(),1);
    await action('open-discovery',page.locator('.discovery-card'));
    const neuro=(await stored()).areas.find(a=>a.name==='Neurociência');
    await page.locator(`[data-action=link-discovery-area][data-area="${neuro.id}"]`).click();
    assert.deepEqual((await stored()).discoveries[0].areaIds,[neuro.id]);
    assert.equal(await page.locator(`[data-action=link-discovery-area][data-area="${neuro.id}"]`).count(),0);

    await action('edit-discovery');await form.locator('[name=tags]').fill('memória, aprendizado');
    await form.locator('[name=status]').selectOption('Explorando');
    const api=(await stored()).areas.find(a=>a.name==='APIs');await form.locator(`[name="area-${api.id}"]`).check();await submit();
    assert.equal((await stored()).discoveries[0].areaIds.length,2);
    await action('discovery-note');await form.locator('[name=title]').fill('Minha reflexão sobre memória');await submit();
    await page.locator('#note-body').fill('Quero experimentar isso nos meus estudos.');
    const note=(await stored()).notes[0];assert.equal(note.discoveryId,d.id);
    await page.locator('.note-meta [data-action=open-discovery]').click();
    assert.equal(await page.getByText('Minha reflexão sobre memória',{exact:true}).count(),1);

    await action('discovery-task');await form.locator('[name=title]').fill('Experimentar revisão de memória');await submit();
    assert.equal((await stored()).tasks[0].discoveryId,d.id);
    await nav('Quadro');await action('open-discovery');
    await page.locator('[data-action=discovery-term][data-word="API"]').click();
    const apiCard=page.locator('.term-card').filter({has:page.getByRole('heading',{name:'API',exact:true})});
    assert.equal(await apiCard.locator('[data-action=open-discovery]').count(),1);
    await action('open-discovery',apiCard);
    await page.screenshot({path:path.join(out,'hub-lc-discovery-detail.png'),fullPage:true});
    for(const width of [1024,360,320]){
      await page.setViewportSize({width,height:900});
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Descoberta transborda em ${width}px`);
    }
    await page.setViewportSize({width:1440,height:1050});
    await action('all-discoveries');
    await page.screenshot({path:path.join(out,'hub-lc-discoveries.png'),fullPage:true});
    await page.locator('[data-filter=discovery-status]').selectOption('Guardado');assert.equal(await page.locator('.discovery-card').count(),0);
    await page.locator('[data-filter=discovery-status]').selectOption('Explorando');assert.equal(await page.locator('.discovery-card').count(),1);
    await page.locator('[data-query]').fill('experimentar');assert.equal(await page.locator('.discovery-card').count(),1);
    await nav('Descobertas');await page.locator('#capture-form [name=url]').fill(d.url);await page.locator('#capture-form button[type=submit]').click();
    assert.equal((await stored()).discoveries.length,1);assert.equal((await stored()).discoveries[0].points.length,1);

    await nav('Preferências');const downloaded=page.waitForEvent('download');await action('export');
    const file=await downloaded;const fs=require('node:fs/promises');const backup=JSON.parse(await fs.readFile(await file.path(),'utf8'));
    assert.equal(backup.discoveries[0].points.length,1);assert.equal(backup.notes[0].discoveryId,d.id);
    const before=JSON.stringify(await stored());const corrupt=structuredClone(backup);corrupt.discoveries[0].areaIds.push('missing');
    await page.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(corrupt))});
    await page.locator('#toast').filter({hasText:'inválido'}).waitFor();assert.equal(JSON.stringify(await stored()),before);
    await page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await submit();
    await nav('Descobertas');await action('open-discovery');await action('edit-discovery');await action('delete-record',form);await submit();
    assert.equal((await stored()).discoveries.length,0);assert.equal((await stored()).notes[0].discoveryId,'');assert.equal((await stored()).tasks[0].discoveryId,'');
    assert.equal((await stored()).notes[0].body,'Quero experimentar isso nos meus estudos.');

    await nav('Áreas');await page.locator('[data-catalog-results] .study-subject strong').filter({hasText:/^Neurociência$/}).click();
    await page.locator('.study-secondary-actions summary').click();await page.locator('[data-action=edit-area]').click();await action('delete-record',form);await submit();
    // Reimporta a descoberta sem a área removida: referências continuam válidas.
    const after=await stored();after.discoveries=[{...backup.discoveries[0],areaIds:[api.id]}];
    await page.locator('#import-file').setInputFiles({name:'updated.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(after))});await submit();
    await nav('Áreas');
    await page.locator('[data-action=filter-area]').filter({hasText:'APIs'}).click();await page.locator('.study-secondary-actions summary').click();await page.locator('[data-action=edit-area]').click();await action('delete-record',form);await submit();
    assert.deepEqual((await stored()).discoveries[0].areaIds,[]);
    await nav('Descobertas');
    for(const [kind,title] of [['Artigo','Artigo sobre memória'],['Podcast','Podcast sobre memória'],['Outro','Outro conteúdo']]){
      await page.locator('#capture-form [name=url]').fill('https://example.org/'+kind.toLowerCase());
      await page.locator('#capture-form [name=title]').fill(title);await page.locator('#capture-form button[type=submit]').click();
      await action('edit-discovery');await form.locator('[name=kind]').selectOption(kind);await submit();await action('all-discoveries');
    }
    const kindFilter=page.locator('[data-filter=discovery-kind]');
    assert.equal(await page.locator('.discovery-card').count(),4);
    for(const kind of ['Vídeo','Artigo','Podcast','Outro']){
      await kindFilter.selectOption(kind);assert.equal(await page.locator('.discovery-card').count(),1);
      assert.equal(await page.locator('.discovery-card>.badge-row').first().locator('.badge').first().innerText(),kind);
    }
    await kindFilter.selectOption('Artigo');await page.reload();assert.equal(await kindFilter.inputValue(),'Artigo');
    assert.equal(await page.locator('.discovery-card').count(),1);
    await action('open-discovery');await action('all-discoveries');assert.equal(await kindFilter.inputValue(),'Artigo');
    await page.locator('[data-query]').fill('inexistente');assert.equal(await page.locator('.discovery-card').count(),0);
    assert.equal(await page.getByRole('heading',{name:'Nenhuma descoberta nesse filtro'}).count(),1);
    await action('clear-filters');assert.equal(await kindFilter.inputValue(),'');assert.equal(await page.locator('.discovery-card').count(),4);
    await kindFilter.selectOption('Vídeo');await page.locator('[data-filter=discovery-status]').selectOption('Guardado');
    assert.equal(await page.locator('.discovery-card').count(),0);
    await page.locator('[data-filter=discovery-status]').selectOption('Explorando');assert.equal(await page.locator('.discovery-card').count(),1);
    await page.locator('[data-filter=area]').selectOption((await stored()).areas.find(a=>a.name==='Java').id);
    assert.equal(await page.locator('.discovery-card').count(),0);await action('clear-filters');
    for(const width of [1440,768,360,320]){
      await page.setViewportSize({width,height:1000});await kindFilter.selectOption('Artigo');
      assert.equal(await page.locator('.discovery-card').count(),1);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    }
    assert.deepEqual(errors,[]);
    return 'descobertas: filtro por tipo com persistência e combinação de busca, situação e tema, captura, momentos no vídeo, sugestões e múltiplos temas, notas, quadro, dicionário, duplicatas, backup e exclusões preservando registros; desktop e mobile';
  }catch(error){await page.screenshot({path:path.join(out,'discovery-failure.png'),fullPage:true});throw error;}
  finally{await context.close();}
};
