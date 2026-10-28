const names={'Meu espaço':'home','Áreas':'areas','Estudos':'areas','Documentos':'documents','Descobertas':'discoveries','Links e vídeos':'discoveries','Biblioteca':'books','Livros':'books','Quadro':'board','Anotações':'notes','Sessões':'sessions','Pausa e Puzzle':'puzzle','Evolução':'evolution','Dicionário':'dictionary','Preferências':'settings'};
module.exports=async function navigate(page,name){
  const view=names[name]||name;
  if(['documents','discoveries','dictionary'].includes(view)&&!await page.locator('.workspace-tabs [data-view='+view+']').count()){
    await page.locator('.sidebar [data-view=areas]').click();
    if(view==='dictionary'){await page.locator('.catalog-secondary [data-view=dictionary]').click();return;}
    await page.locator('[data-action=study-all]').click();
    await page.locator('.study-global-links [data-view='+view+']').click();return;
  }
  if(['evolution','puzzle'].includes(view)&&!await page.locator('.workspace-tabs [data-view='+view+']').count())await page.locator('.sidebar [data-view=sessions]').click();
  await page.locator(`.sidebar [data-view="${view}"], .workspace-tabs [data-view="${view}"], .topbar [data-view="${view}"]`).filter({visible:true}).first().click();
};
