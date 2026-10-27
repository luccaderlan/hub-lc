// Caminhos desenhados à mão. Direções: norte, leste, sul e oeste.
const BASE={straight:[0,2],curve:[0,1]};
export const DIRECTION_NAMES=['cima','direita','baixo','esquerda'];
const direction=(from,to)=>to===from-3?0:to===from+1?1:to===from+3?2:3;
function level(name,path,offsets){
  const entry={index:path[0],side:3},exit={index:path.at(-1),side:1};
  const tiles=Array.from({length:9},(_,i)=>({kind:i%2?'straight':'curve',solution:0}));
  path.forEach((index,i)=>{
    const sides=[i?direction(index,path[i-1]):entry.side,i===path.length-1?exit.side:direction(index,path[i+1])].sort();
    const kind=(sides[1]-sides[0]===2)?'straight':'curve';
    const solution=[0,1,2,3].find(r=>BASE[kind].map(s=>(s+r)%4).sort().join()===sides.join());
    tiles[index]={kind,solution};
  });
  return {name,entry,exit,path,tiles,initial:tiles.map((t,i)=>(t.solution+(offsets[i]||0))%4)};
}
export const PUZZLE_LEVELS=[
  level('Primeira curva',[3,4,1,2,5],{4:1,2:1}),
  level('Pelas bordas',[0,3,6,7,8],{0:1,6:1,8:3}),
  level('Pequeno desvio',[3,0,1,4,5],{3:1,1:3,5:1}),
  level('Outra margem',[6,7,4,1,2],{7:1,4:1,2:2}),
  level('Caminho de volta',[0,1,4,3,6,7,8],{1:1,3:3,7:1}),
  level('Entre curvas',[6,3,4,1,2,5,8],{6:2,4:1,5:1})
];
export function createPuzzle(levelIndex=0){
  return {level:levelIndex,rotations:[...PUZZLE_LEVELS[levelIndex].initial]};
}
export function validPuzzle(p){
  return !!p&&Number.isInteger(p.level)&&p.level>=0&&p.level<PUZZLE_LEVELS.length&&Array.isArray(p.rotations)&&p.rotations.length===9&&p.rotations.every(r=>Number.isInteger(r)&&r>=0&&r<4);
}
export function tileSides(p,index){
  return BASE[PUZZLE_LEVELS[p.level].tiles[index].kind].map(s=>(s+p.rotations[index])%4).sort();
}
export function puzzleProgress(p){
  const {entry,exit}=PUZZLE_LEVELS[p.level],connected=new Set();
  if(!tileSides(p,entry.index).includes(entry.side))return {connected,solved:false};
  const pending=[entry.index];
  while(pending.length){
    const i=pending.pop();if(connected.has(i))continue;connected.add(i);
    for(const side of tileSides(p,i)){
      const row=Math.floor(i/3),col=i%3;
      if((side===0&&row===0)||(side===1&&col===2)||(side===2&&row===2)||(side===3&&col===0))continue;
      const next=i+[-3,1,3,-1][side];
      if(tileSides(p,next).includes((side+2)%4)&&!connected.has(next))pending.push(next);
    }
  }
  return {connected,solved:connected.has(exit.index)&&tileSides(p,exit.index).includes(exit.side)};
}
export function puzzleHint(p){
  if(puzzleProgress(p).solved)return null;
  const stage=PUZZLE_LEVELS[p.level];
  for(const index of stage.path){
    const target=tileSides({...p,rotations:stage.tiles.map(t=>t.solution)},index).join();
    for(let turns=0;turns<4;turns++){
      const candidate={...p,rotations:[...p.rotations]};candidate.rotations[index]=(candidate.rotations[index]+turns)%4;
      if(tileSides(candidate,index).join()===target){if(turns)return {index,turns};break;}
    }
  }
  return null;
}
