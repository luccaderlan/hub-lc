const names={'Meu espaço':'home','Áreas':'areas','Estudos':'areas','Documentos':'documents','Descobertas':'discoveries','Links e vídeos':'discoveries','Biblioteca':'books','Livros':'books','Quadro':'board','Anotações':'notes','Sessões':'sessions','Pausa e Puzzle':'puzzle','Evolução':'evolution','Preferências':'settings'};
module.exports=async function navigate(page,name){
  const view=names[name]||name;
  const direct=page.locator(`.sidebar .nav-group [data-view="${view}"]`).filter({visible:true});
  if(await direct.count()){await direct.click();return;}
  if(view==='board'){
    if(!await page.locator('.personal-tabs').count())await page.locator('.sidebar .nav-group [data-view=home]').click();
    await page.locator('.personal-tabs [data-view=board]').click();return;
  }
  if(view==='discoveries'&&!await page.locator('.workspace-tabs [data-view='+view+']').count()){
    await page.locator('.sidebar [data-view=areas]').click();
    await page.locator(`.study-catalog [data-view="${view}"]`).click();return;
  }
  if(['evolution','puzzle'].includes(view)&&!await page.locator('.workspace-tabs [data-view='+view+']').count())await page.locator('.sidebar [data-view=sessions]').click();
  await page.locator(`.sidebar [data-view="${view}"], .workspace-tabs [data-view="${view}"], .topbar [data-view="${view}"]`).filter({visible:true}).first().click();
};
