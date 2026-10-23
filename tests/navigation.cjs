const names={'Meu espaço':'home','Áreas':'areas','Estudos':'areas','Documentos':'documents','Descobertas':'discoveries','Links e vídeos':'discoveries','Biblioteca':'books','Livros':'books','Quadro':'board','Anotações':'notes','Sessões':'sessions','Evolução':'evolution','Dicionário':'dictionary','Preferências':'settings'};
module.exports=async function navigate(page,name){
  const view=names[name]||name;
  if(['documents','discoveries','books','dictionary'].includes(view)&&!await page.locator('.workspace-tabs [data-view='+view+']').count())await page.locator('.sidebar [data-view=areas]').click();
  if(view==='evolution'&&!await page.locator('.workspace-tabs [data-view=evolution]').count())await page.locator('.sidebar [data-view=sessions]').click();
  await page.locator(`.sidebar [data-view="${view}"], .workspace-tabs [data-view="${view}"], .topbar [data-view="${view}"]`).filter({visible:true}).first().click();
};
