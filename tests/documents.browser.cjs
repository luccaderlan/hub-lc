const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
// Fixture sintética: uma página PDF, sem dados do usuário.
function fixturePdf(){
  const stream='BT /F1 24 Tf 55 745 Td (Hub LC - Documento de estudo) Tj 0 -45 Td /F1 12 Tf (Material de teste para leitura, notas e backup.) Tj ET';
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let body='%PDF-1.4\n',offsets=[0];for(let i=0;i<objects.length;i++){offsets.push(Buffer.byteLength(body));body+=`${i+1} 0 obj\n${objects[i]}\nendobj\n`;}
  const start=Buffer.byteLength(body);body+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return Buffer.from(body);
}
module.exports=async({browser,origin,out})=>{
  const context=await browser.newContext({viewport:{width:1440,height:1050},acceptDownloads:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  const nav=name=>require('./navigation.cjs')(page,name),action=name=>page.locator(`[data-action=${name}]:visible`).first().click();
  const form=page.locator('#editor-form'),submit=()=>form.locator('button[type=submit]').click(),stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hub-lc:v1')));
  const pdf=fixturePdf(),upload=()=>page.locator('#pdf-file').setInputFiles({name:'Material de estudo.pdf',mimeType:'application/pdf',buffer:pdf});
  try{
    await page.goto(origin+'/#documents');await page.getByRole('heading',{name:'Documentos',exact:true}).waitFor();
    await page.locator('#pdf-file').setInputFiles({name:'invalid.pdf',mimeType:'application/pdf',buffer:Buffer.from('not pdf')});await page.locator('#toast').filter({hasText:'não corresponde ao formato PDF'}).waitFor();
    await upload();await page.locator('#pdf-viewer').waitFor();
    assert.equal((await stored()).documents.length,1);assert.match(await page.locator('#pdf-viewer').getAttribute('src'),/^blob:.*#page=1$/);
    const d=(await stored()).documents[0];
    await page.locator('[data-document-body]').fill('Investigar ideias para estudar Java.');await page.locator('#pdf-page-form [name=page]').fill('1');await page.locator('#pdf-page-form button').click();
    await action('edit-document');await form.locator('[name=title]').fill('Material para estudar Java');await form.locator('[name=areaId]').selectOption({label:'Java'});await submit();
    await action('document-note');await form.locator('[name=title]').fill('Pergunta sobre o documento');await form.locator('[name=category]').selectOption('Dúvida');assert.equal(await form.locator('[name=page]').inputValue(),'1');await submit();await page.locator('#note-body').fill('O que preciso experimentar para entender melhor?');
    assert.equal((await stored()).notes[0].documentId,d.id);await page.locator('.note-meta [data-action=open-document]').click();
    await action('document-task');await form.locator('[name=title]').fill('Aplicar uma ideia do PDF');await submit();assert.equal((await stored()).tasks[0].documentId,d.id);
    await nav('Quadro');await action('open-document');await page.reload();await page.locator('[data-document-download]').waitFor();
    assert.equal((await stored()).documents[0].page,'1');assert.equal(await page.locator('[data-document-body]').inputValue(),'Investigar ideias para estudar Java.');
    const download=page.waitForEvent('download');await page.locator('[data-document-download]').click();const file=await download;assert.deepEqual(await fs.readFile(await file.path()),pdf);
    await nav('Áreas');await page.locator('[data-action=open-division][data-division="TI"]').click();assert.equal(await page.locator('.document-card').count(),1);await action('open-document');
    await page.waitForTimeout(1200);
    await page.screenshot({path:path.join(out,'hub-lc-document-reader.png'),fullPage:false});
    for(const width of [1024,360,320]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
    await page.setViewportSize({width:1440,height:1050});await nav('Documentos');await upload();await page.locator('#pdf-viewer').waitFor();assert.equal((await stored()).documents.length,1);
    await nav('Preferências');const backupDownload=page.waitForEvent('download');await action('export');const backupFile=await backupDownload,backup=JSON.parse(await fs.readFile(await backupFile.path(),'utf8'));
    assert.equal(backup.documentFiles.length,1);assert.deepEqual(Buffer.from(backup.documentFiles[0].data,'base64'),pdf);
    const fresh=await browser.newContext({acceptDownloads:true}),freshPage=await fresh.newPage();await freshPage.goto(origin);
    const corrupt=structuredClone(backup);corrupt.documentFiles[0].data=Buffer.from('%PDF-invalid').toString('base64');
    await freshPage.locator('#import-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(corrupt))});await freshPage.locator('#toast').filter({hasText:'não corresponde'}).waitFor();assert.equal(await freshPage.evaluate(()=>localStorage.getItem('hub-lc:v1')),null);
    await freshPage.locator('#import-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await freshPage.locator('#editor-form button[type=submit]').click();await freshPage.getByRole('heading',{name:'O que te move hoje?'}).waitFor();
    await require('./navigation.cjs')(freshPage,'documents');await freshPage.locator('[data-action=open-document]').click();await freshPage.locator('[data-document-download]').waitFor();
    const restoredDownload=freshPage.waitForEvent('download');await freshPage.locator('[data-document-download]').click();const restored=await restoredDownload;assert.deepEqual(await fs.readFile(await restored.path()),pdf);
    await freshPage.evaluate(hash=>new Promise((resolve,reject)=>{const req=indexedDB.open('hub-lc:pdfs',1);req.onsuccess=()=>{const db=req.result,tx=db.transaction('files','readwrite');tx.objectStore('files').delete(hash);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};}),d.sha256);
    await freshPage.reload();await freshPage.locator('[data-pdf-repair]').waitFor();await freshPage.locator('[data-action=replace-pdf]').click();
    await freshPage.locator('#pdf-replace-file').setInputFiles({name:d.fileName,mimeType:'application/pdf',buffer:pdf});await freshPage.locator('[data-document-download]').waitFor();
    assert.equal(await freshPage.locator('[data-document-body]').inputValue(),'Investigar ideias para estudar Java.');await fresh.close();
    await nav('Documentos');await action('open-document');await action('edit-document');await form.locator('[data-action=delete-record]').click();await submit();
    const after=await stored();assert.equal(after.documents.length,0);assert.equal(after.notes[0].documentId,'');assert.equal(after.tasks[0].documentId,'');assert.equal(after.notes[0].body,'O que preciso experimentar para entender melhor?');
    assert.deepEqual(errors,[]);
    return 'PDFs: validação, arquivo persistido, leitor, retomada, notas, atividades, áreas, deduplicação, backup e restauração em navegador vazio; exclusão preserva registros e layout mobile';
  }catch(err){await page.screenshot({path:path.join(out,'document-failure.png'),fullPage:false});throw err;}
  finally{await context.close();}
};
