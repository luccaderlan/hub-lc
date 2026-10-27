const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const {chromium} = require(process.env.HUB_LC_PLAYWRIGHT || path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const origin = process.env.HUB_LC_ORIGIN || 'http://127.0.0.1:4173';
const out = path.join(__dirname,'../test-results');
const reports=[];
const mark=text=>{reports.push(text);console.log('OK:',text);};
(async()=>{
  await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.HUB_LC_CHROME||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':'/usr/bin/google-chrome'),headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  const nav=name=>require('./navigation.cjs')(page,name);
  const action=(name,scope=page)=>scope.locator(`[data-action="${name}"]:visible`).first().click();
  const form=page.locator('#editor-form');
  const submit=()=>form.locator('button[type=submit]').click();
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
  try{
    if(process.argv.includes('--games-only')){mark(await require('./games.browser.cjs')({browser,origin,out}));return;}
    if(process.argv.includes('--pause-puzzle-only')){mark(await require('./pause-puzzle.browser.cjs')({browser,origin,out}));return;}
    if(process.argv.includes('--documents-only')){mark(await require('./documents.browser.cjs')({browser,origin,out}));return;}
    if(process.argv.includes('--brand-preview')){
      for(const mode of ['light','dark']){
        const previewContext=await browser.newContext({viewport:{width:1440,height:1050}});
        const previewPage=await previewContext.newPage();await previewPage.goto(origin);
        await previewPage.locator('.sidebar [data-view=settings]').click();
        await previewPage.locator('[name=pref-theme]').selectOption(mode);
        await require('./navigation.cjs')(previewPage,'discoveries');
        await previewPage.screenshot({path:path.join(out,`hub-lc-brand-${mode}.png`),fullPage:false});
        console.log('Prévia da marca:',mode,await previewPage.locator('.brand').isVisible());
        await previewContext.close();
      }
      return;
    }
    const response=await page.goto(origin);assert.equal(response.status(),200);
    await page.getByRole('heading',{name:/Lucca/}).waitFor();
    assert.equal(await page.locator('[data-storage-warning]').isVisible(),false);
    assert.equal(await page.getByText('Bora na Tech',{exact:false}).count(),0);
    assert.equal(await page.locator('#main [data-view=books], #main [data-action=edit-book]').count(),0);
    assert.doesNotMatch(await page.locator('#main').innerText(),/livro|biblioteca|leituras em andamento/i);
    await nav('Áreas');
    assert.equal(await page.locator('.subject-group').count(),4);
    assert.equal(await page.locator('.material-card').count(),4);
    await page.locator('[data-action=open-division][data-division="TI"]').click();
    assert.equal(await page.locator('.subject-group').filter({has:page.locator('[data-division=TI]')}).locator('[data-action=filter-area]').count(),13);
    assert.equal(await page.locator('.material-card').count(),4);
    assert.equal(await page.locator('#main').getByRole('heading',{name:'Filosofia',exact:true}).count(),0);
    await page.locator('[data-filter=division]').selectOption('Filosofia');
    assert.equal(await page.locator('.material-card').count(),0);
    await page.locator('[data-filter=division]').selectOption('');
    await page.locator('[data-query]').fill('PostgreSQL');
    assert.equal(await page.locator('.study-content').count(),1);
    assert.equal(await page.locator('.material-card').count(),1);
    await page.reload();assert.equal(await page.locator('[data-query]').inputValue(),'PostgreSQL');
    mark('coleções e assuntos na lateral, TI com treze assuntos em seis grupos, busca e filtros preservados no reload');
    await nav('Sessões');assert.equal(await page.locator('[name=timer-target]').inputValue(),'');assert.equal(await page.locator('[data-clock]').textContent(),'00:00:00');
    mark('primeiro acesso sem cronômetro iniciado, duração imposta ou links ao Bora na Tech');

    await nav('Áreas');await page.locator('.study-sidebar [data-action=new-area]').click();await form.locator('[name=name]').fill('História');await form.locator('[name=division]').selectOption({label:'Filosofia'});await form.locator('[name=description]').fill('Leituras e conexões');await submit();
    await page.getByRole('heading',{name:'História',exact:true}).waitFor();
    await page.locator('.add-study summary').click();await action('new-material');await form.locator('[name=title]').fill('Minha referência');await form.locator('[name=areaId]').selectOption({label:'História'});await form.locator('[name=url]').fill('javascript:alert(1)');await submit();
    await page.locator('#form-error').filter({hasText:'HTTP'}).waitFor();
    await form.locator('[name=url]').fill('https://example.org/');await submit();
    assert.ok((await stored()).materials.some(m=>m.title==='Minha referência'&&m.areaId));
    assert.equal((await stored()).areas.find(a=>a.name==='História').division,'Filosofia');
    await page.locator('[data-action=edit-area]').click();await form.locator('[name=division]').selectOption('new');await form.locator('[name=newDivision]').fill('Humanidades');await submit();
    assert.equal((await stored()).areas.find(a=>a.name==='História').division,'Humanidades');
    assert.equal(await page.locator('.material-card').count(),1);
    mark('áreas e conteúdos cadastrados; endereço executável rejeitado');

    await nav('Quadro');await action('new-task');
    await form.locator('[name=title]').fill('Investigar uma ideia <script>alert(1)</script>');
    assert.equal(await form.locator('[name=duration]').inputValue(),'');assert.equal(await form.locator('[name=due]').inputValue(),'');
    await form.locator('[name=areaId]').selectOption({label:'História'});await submit();
    assert.equal(await page.locator('.task script').count(),0);
    const columns=(await stored()).columns;
    await page.locator('[data-task-column]').selectOption(columns[1].id);
    await page.reload();assert.equal((await stored()).tasks[0].columnId,columns[1].id);
    await page.locator('.task').dragTo(page.locator(`[data-column="${columns[2].id}"]`));
    assert.equal((await stored()).tasks[0].columnId,columns[2].id);
    await action('columns');await action('add-column',form);await form.locator('#column-fields input').last().fill('Investigações');await submit();
    assert.equal((await stored()).columns.at(-1).name,'Investigações');
    mark('quadro: edição, movimentação por seletor e arraste, persistência e colunas personalizadas');

    await nav('Biblioteca');assert.equal(await page.locator('.book').count(),2);
    await action('edit-book',page.locator('.book').first());assert.equal(await form.locator('[name=status]').inputValue(),'');
    await form.locator('[name=status]').selectOption('Lendo');await form.locator('[name=page]').fill('30');await form.locator('[name=total]').fill('20');await submit();
    await page.locator('#form-error').filter({hasText:'maior que o total'}).waitFor();
    await form.locator('[name=page]').fill('12');await form.locator('[name=total]').fill('120');await submit();
    assert.equal((await stored()).books[0].page,'12');
    await action('book-note',page.locator('.book').first());await form.locator('[name=title]').fill('O que essa leitura despertou');await form.locator('[name=category]').selectOption('Reflexão');await form.locator('[name=page]').fill('12');await submit();
    await page.locator('#note-body').fill('Uma reflexão pessoal, sem metas de leitura.');
    await page.reload();assert.equal(await page.locator('#note-body').inputValue(),'Uma reflexão pessoal, sem metas de leitura.');
    assert.equal((await stored()).notes[0].bookId,(await stored()).books[0].id);
    await nav('Meu espaço');
    assert.equal(await page.getByText('O que essa leitura despertou',{exact:true}).count(),0);
    assert.equal(await page.locator('#main [data-view=books], #main [data-action=edit-book]').count(),0);
    await nav('Anotações');await page.locator('.note-list button').filter({hasText:'O que essa leitura despertou'}).click();
    mark('livros físicos: status livre, validação de páginas e reflexões vinculadas salvas após reload');

    await action('new-canvas');await form.locator('[name=title]').fill('Conexões entre ideias');await submit();
    for(let i=0;i<4;i++)await action('new-sticky');
    await page.locator('[data-sticky-text]').first().fill('Uma conexão');
    const sticky=page.locator('.sticky').first(),handle=sticky.locator('header'),box=await handle.boundingBox();
    await page.mouse.move(box.x+20,box.y+8);await page.mouse.down();await page.mouse.move(box.x+90,box.y+65,{steps:5});await page.mouse.up();
    const canvasNote=(await stored()).notes.find(n=>n.kind==='canvas');assert.ok(canvasNote.stickies[0].x>5);
    await action('move-sticky',sticky);await action('tone-sticky',sticky);
    await page.reload();assert.equal(await page.locator('[data-sticky-text]').first().inputValue(),'Uma conexão');
    mark('mural: post-its editáveis, cores, arraste, alternativa por botões e persistência');

    await nav('Sessões');await page.locator('[name=timer-area]').selectOption({label:'Java'});await action('start-timer');await page.waitForTimeout(1200);await page.reload();
    assert.equal((await stored()).timer.running,true);await action('pause-timer');const paused=(await stored()).timer.elapsedMs;await page.waitForTimeout(400);assert.equal((await stored()).timer.elapsedMs,paused);
    await action('finish-timer');await form.locator('[name=summary]').fill('Cronômetro opcional verificado');await form.locator('[name=next]').fill('Retomar a leitura');await submit();
    assert.equal((await stored()).timer.elapsedMs,0);assert.equal((await stored()).sessions.length,1);
    await action('new-session');await form.locator('[name=minutes]').fill('30');await form.locator('[name=areaId]').selectOption({label:'Filosofia'});await submit();
    await action('new-session');await form.locator('[name=minutes]').fill('60');await form.locator('[name=bookId]').selectOption((await stored()).books[0].id);await form.locator('[name=next]').fill('Retomar meu livro exclusivo');await submit();
    await nav('Meu espaço');assert.equal(await page.getByText('Retomar meu livro exclusivo',{exact:true}).count(),0);
    await nav('Evolução');await page.getByRole('heading',{name:'Tempo por área'}).waitFor();
    assert.doesNotMatch(await page.locator('#main').innerText(),/livro|biblioteca|leituras/i);
    assert.equal(await page.locator('#main [data-view=books]').count(),0);
    assert.ok(!(await page.locator('#main').innerText()).includes('1h '));
    await action('toggle-metrics');assert.equal(await page.getByRole('heading',{name:'Tempo por área'}).count(),0);
    mark('sessões: pausa excluída, retomada após reload, registro manual e métricas ocultáveis');

    await nav('Preferências');await page.locator('[name=pref-theme]').selectOption('dark');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
    assert.equal(await page.locator('[name=pref-accent]').count(),0);assert.equal((await stored()).prefs.accent,'lc');
    assert.equal(await page.locator('.palette-chip').count(),3);
    const downloadPromise=page.waitForEvent('download');await action('export');const download=await downloadPromise;
    const data=JSON.parse(await fs.readFile(await download.path(),'utf8'));assert.equal(data.notes.length,2);assert.equal(data.sessions.length,3);
    const before=JSON.stringify(await stored());await page.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"schemaVersion":99}')});
    await page.locator('#toast').filter({hasText:'inválido'}).waitFor();assert.equal(JSON.stringify(await stored()),before);
    const replacement=structuredClone(data);replacement.books[1].chapter='Um novo ponto de retomada';
    await page.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(replacement))});
    await page.getByRole('heading',{name:'Importar este backup?'}).waitFor();assert.equal((await stored()).books[1].chapter,'');await submit();assert.equal((await stored()).books[1].chapter,replacement.books[1].chapter);
    mark('preferências persistidas e backup exportado/importado; arquivo inválido não sobrescreve dados');

    await nav('Áreas');await page.locator('[data-action=open-division][data-division="Humanidades"]').click();await page.locator('[data-action=filter-area]').filter({hasText:'História'}).click();await page.locator('[data-action=edit-area]').click();await action('delete-record',form);await submit();
    assert.ok(!(await stored()).areas.some(a=>a.name==='História'));assert.equal((await stored()).tasks[0].areaId,'');assert.ok((await stored()).materials.some(m=>m.title==='Minha referência'));
    mark('excluir uma área preserva atividades, conteúdos e registros vinculados');

    await nav('Dicionário');
    assert.match(await page.locator('.info-box').innerText(),/330 registros/);
    assert.equal(await page.locator('.term-card').count(),24);
    await action('more-terms');assert.equal(await page.locator('.term-card').count(),48);
    await page.locator('[data-query]').fill('garçom');
    assert.ok(await page.locator('.term-card').count()>=2);
    await page.locator('[data-query]').fill('');
    await page.locator('[data-filter=dictionary]').selectOption('Backend / Arquitetura');
    assert.ok((await page.locator('.term-card .badge').allTextContents()).every(c=>c==='Backend / Arquitetura'));
    await page.locator('[data-query]').fill('API (Application Programming Interface)');
    assert.equal(await page.locator('.term-card').count(),1);
    await page.locator('.term-details summary').click();
    await page.locator('.term-details').getByRole('heading',{name:'Exemplo',exact:true}).waitFor();
    assert.ok((await page.locator('.term-card .card-footer a').getAttribute('href')).includes('3b19a781589481508fb8ef50c724797a'));
    await page.reload();assert.equal(await page.locator('[data-filter=dictionary]').inputValue(),'Backend / Arquitetura');
    await page.locator('[data-query]').fill('termo que não existe no dicionário');assert.equal(await page.locator('.term-card').count(),0);
    mark('dicionário: 330 registros, paginação, busca nos campos, categorias, comparação, exemplo e origem no Notion');

    await nav('Meu espaço');await page.locator('[name=pref-theme]').count();
    // Captura interna para revisar a interface, sem gerar novos protótipos.
    await page.screenshot({path:path.join(out,'hub-lc-desktop.png'),fullPage:true});
    await nav('Áreas');await page.screenshot({path:path.join(out,'hub-lc-divisions.png'),fullPage:true});
    await page.locator('[data-action=open-division][data-division="TI"]').click();await page.screenshot({path:path.join(out,'hub-lc-ti.png'),fullPage:true});
    await nav('Dicionário');await page.locator('[data-query]').fill('API');await page.screenshot({path:path.join(out,'hub-lc-dictionary.png'),fullPage:true});
    for(const width of [1024,360,320]){
      await page.setViewportSize({width,height:900});
      for(const name of ['Meu espaço','Áreas','Descobertas','Quadro','Biblioteca','Anotações','Sessões','Evolução','Dicionário','Preferências']){
        if(width<781&&name==='Preferências')await page.locator('.topbar [data-view=settings]').click();else await nav(name);
        const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));assert.ok(dimensions.scroll<=dimensions.width+1,`${name} transborda em ${width}px`);
        if(name==='Áreas'){
          await page.locator('[data-action=open-division][data-division="TI"]').click();
          const fit=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);assert.equal(fit,true);
        }
        if(name==='Dicionário'){
          await page.locator('.term-details summary').first().click();
          const fit=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);assert.equal(fit,true);
        }
        if(name==='Anotações'){
          await page.locator('.note-list button').filter({hasText:'Conexões entre ideias'}).click();
          const fit=await page.evaluate(()=>{const c=document.querySelector('.canvas').getBoundingClientRect();return [...document.querySelectorAll('.sticky')].every(s=>{const r=s.getBoundingClientRect();return r.left>=c.left&&r.right<=c.right+1&&r.bottom<=c.bottom+1;});});assert.equal(fit,true);
        }
      }
    }
    mark('todas as telas sem transbordamento em 1024, 360 e 320 px; post-its permanecem no mural');
    const failureContext=await browser.newContext();await failureContext.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Quota','QuotaExceededError');};});
    const failurePage=await failureContext.newPage();await failurePage.goto(origin);await failurePage.locator('[data-action=new-note]').first().click();await failurePage.locator('[name=title]').fill('Registro temporário');await failurePage.locator('#editor-form button[type=submit]').click();await failurePage.locator('[data-storage-warning]').waitFor();assert.match(await failurePage.locator('[data-save-status]').textContent(),/não salvas/);await failureContext.close();
    mark('falhas de armazenamento sinalizadas sem fingir que o registro foi salvo');
    const identityContext=await browser.newContext({viewport:{width:1440,height:1050}});
    const identityPage=await identityContext.newPage();await identityPage.goto(origin);
    const identityNav=name=>require('./navigation.cjs')(identityPage,name);
    const logo=identityPage.locator('.brand-logo');await logo.waitFor();
    assert.equal(await page.locator('.brand-name').count(),1);
    assert.equal(await logo.getAttribute('alt'),'');
    const embedded=Buffer.from((await logo.getAttribute('src')).split(',')[1],'base64');
    assert.deepEqual(embedded,await fs.readFile(path.join(__dirname,'../assets/hub-lc-logo-horizontal.png')));
    for(const mode of ['light','dark']){
      await identityPage.setViewportSize({width:1440,height:1050});
      await identityNav('Preferências');await identityPage.locator('[name=pref-theme]').selectOption(mode);
      const colors=await identityPage.evaluate(()=>{
        const css=getComputedStyle(document.documentElement);
        return Object.fromEntries(['--bg','--surface','--side','--text','--muted','--line','--accent','--progress'].map(key=>[key,css.getPropertyValue(key).trim().toUpperCase()]));
      });
      assert.equal(colors['--bg'],mode==='light'?'#FDFBF8':'#191A20');
      assert.equal(colors['--text'],mode==='light'?'#35384D':'#D6D1CD');
      assert.equal(colors['--line'],mode==='light'?'#DEDBD6':'#38373F');
      assert.equal(colors['--surface'],mode==='light'?'#FDFBF8':'#191A20');
      assert.equal(colors['--accent'],mode==='light'?'#7841EE':'#B297FF');
      assert.equal(colors['--progress'],mode==='light'?'#25A79B':'#54BDAF');
      for(const width of [1440,360,320]){
        await identityPage.setViewportSize({width,height:1050});
        for(const name of ['Meu espaço','Áreas','Descobertas','Quadro','Biblioteca','Anotações','Sessões','Evolução','Dicionário']){
          await identityNav(name);
          assert.ok(await identityPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name} transborda no modo ${mode} em ${width}px`);
          assert.ok(await logo.evaluate(img=>img.complete&&img.naturalWidth>0));
          if(width===1440&&name==='Descobertas'){
            await identityPage.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
            await identityPage.screenshot({path:path.join(out,`hub-lc-brand-${mode}.png`),fullPage:true});
          }
        }
      }
    }
    await identityPage.setViewportSize({width:1440,height:1050});await identityNav('Descobertas');
    await identityPage.keyboard.press('Tab');
    assert.ok(await identityPage.evaluate(()=>getComputedStyle(document.activeElement).outlineWidth==='3px'));
    await identityContext.close();
    mark('nova identidade: logo original intacta, paleta clara/escura, foco visível e todas as telas em desktop e mobile');
    mark(await require('./timer.browser.cjs')({browser,origin,out}));
    mark(await require('./pause-puzzle.browser.cjs')({browser,origin,out}));
    mark(await require('./games.browser.cjs')({browser,origin,out}));
    mark(await require('./sidebar.browser.cjs')({browser,origin,out}));
    mark(await require('./editorial.browser.cjs')({browser,origin,out}));
    mark(await require('./ui.browser.cjs')({browser,origin,out}));
    mark(await require('./usability.browser.cjs')({browser,origin,out}));
    mark(await require('./notes.browser.cjs')({browser,origin,out}));
    mark(await require('./discoveries.browser.cjs')({browser,origin,out}));
    mark(await require('./documents.browser.cjs')({browser,origin,out}));
    mark(await require('./studies.browser.cjs')({browser,origin,out}));
    mark(await require('./reading-workspace.browser.cjs')({browser,origin,out}));
    assert.deepEqual(errors,[]);mark('nenhum erro de JavaScript nos fluxos verificados');
    await fs.writeFile(path.join(out,'browser-report.json'),JSON.stringify({reports,errors},null,2));
  }catch(err){await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});throw err;}
  finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
