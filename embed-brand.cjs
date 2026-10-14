// Embute a logo original para o hub local funcionar sem requisições adicionais de imagens.
const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'index.html');
const logo=fs.readFileSync(path.join(__dirname,'assets/hub-lc-logo-horizontal.png')).toString('base64');
const template=`<template id="brand-logo"><span class="brand-symbol" aria-hidden="true"><img class="brand-logo" src="data:image/png;base64,${logo}" alt="" width="150" height="61"></span><strong class="brand-name">Hub LC</strong></template>`;
let source=fs.readFileSync(file,'utf8');
if(source.includes('<template id="brand-logo">'))source=source.replace(/<template id="brand-logo">[\s\S]*?<\/template>/,template);
else source=source.replace('<div id="app"></div>',template+'\n  <div id="app"></div>');
fs.writeFileSync(file,source,'utf8');
