import {chooseBot} from './game-bot.js';
self.onmessage=({data})=>{
  try{self.postMessage({token:data.token,move:chooseBot(data.kind,data.match)});}
  catch{self.postMessage({token:data.token,error:true});}
};
