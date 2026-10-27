// Regras locais. A interface e os bots usam exatamente as mesmas jogadas legais.
import {Chess} from './vendor/chess.js';
export {Chess};
export const GAME_NAMES={desvio:'Desvio',tictactoe:'Jogo da velha',checkers:'Dama',chess:'Xadrez'};
export const DIFFICULTIES={easy:'Fácil',medium:'Médio',hard:'Difícil'};
export const createGames=()=>({selected:'desvio',tictactoe:null,checkers:null,chess:null});
export const newMatch=(difficulty='medium')=>({difficulty,moves:[]});
const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export const newTicTacToe=()=>({board:Array(9).fill(''),turn:'w'});
export function ticResult(s){
  for(const line of lines)if(s.board[line[0]]&&line.every(i=>s.board[i]===s.board[line[0]]))return {winner:s.board[line[0]],reason:'Três em linha',line};
  return s.board.every(Boolean)?{winner:'draw',reason:'Tabuleiro completo'}:null;
}
export function ticMoves(s){return ticResult(s)?[]:s.board.flatMap((v,i)=>v?[]:[String(i)]);}
export function ticPlay(s,id){
  if(!ticMoves(s).includes(id))throw Error('Jogada inválida.');
  const board=[...s.board];board[Number(id)]=s.turn;return {board,turn:s.turn==='w'?'b':'w'};
}
const dirs=[[-1,-1],[-1,1],[1,-1],[1,1]],inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8;
export const squareName=i=>'abcdefgh'[i%8]+(8-Math.floor(i/8));
export const squareIndex=name=>(8-Number(name[1]))*8+'abcdefgh'.indexOf(name[0]);
const positionKey=s=>s.turn+':'+s.board.join(',');
export function newCheckers(){
  const s={board:Array.from({length:64},(_,i)=>(Math.floor(i/8)+i%8)%2===1?(i<24?-1:i>=40?1:0):0),turn:'w',quietKings:0,stable:0,endingCount:0,ending:'',history:[]};
  s.history=[positionKey(s)];return s;
}
const own=(p,turn)=>turn==='w'?p>0:p<0;
export function checkersMoves(s){
  const captures=[],simple=[];
  for(let from=0;from<64;from++){
    const piece=s.board[from];if(!piece||!own(piece,s.turn))continue;
    const king=Math.abs(piece)===2;
    function walk(board,at,path,taken){
      let extended=false;
      for(const [dr,dc] of dirs){
        let r=Math.floor(at/8)+dr,c=at%8+dc;
        if(king)while(inside(r,c)&&!board[r*8+c]){r+=dr;c+=dc;}
        if(!inside(r,c))continue;
        const victim=r*8+c;
        if(!board[victim]||own(board[victim],s.turn)||taken.includes(victim))continue;
        r+=dr;c+=dc;
        while(inside(r,c)&&!board[r*8+c]){
          const to=r*8+c,next=[...board];next[at]=0;next[to]=piece;
          // Capturadas continuam bloqueando até o fim da sequência (golpe turco).
          walk(next,to,[...path,to],[...taken,victim]);extended=true;
          if(!king)break;r+=dr;c+=dc;
        }
      }
      if(!extended&&taken.length)captures.push({id:path.join('-'),path,captures:taken});
    }
    walk(s.board,from,[from],[]);
    for(const [dr,dc] of dirs){
      if(!king&&dr!==(piece>0?-1:1))continue;
      let r=Math.floor(from/8)+dr,c=from%8+dc;
      while(inside(r,c)&&!s.board[r*8+c]){
        const to=r*8+c;simple.push({id:`${from}-${to}`,path:[from,to],captures:[]});
        if(!king)break;r+=dr;c+=dc;
      }
    }
  }
  if(!captures.length)return simple;
  const max=Math.max(...captures.map(m=>m.captures.length));return captures.filter(m=>m.captures.length===max);
}
function endingType(s){
  const white=s.board.filter(p=>p>0),black=s.board.filter(p=>p<0);
  for(const [side,a,b] of [['w',white,black],['b',black,white]]){
    if(b.length!==1||Math.abs(b[0])!==2)continue;
    const enemyIndex=s.board.findIndex(p=>own(p,side==='w'?'b':'w'));
    if(a.length<=2&&a.some(p=>Math.abs(p)===2))return {key:side+':5',side,limit:5};
    if(a.length===3&&a.some(p=>Math.abs(p)===2)&&Math.floor(enemyIndex/8)+enemyIndex%8===7)return {key:side+':diagonal',side,limit:5};
    if(a.length>=3&&a.every(p=>Math.abs(p)===2))return {key:side+':15',side,limit:15};
  }
  return null;
}
export function checkersPlay(s,id){
  const move=checkersMoves(s).find(m=>m.id===id);if(!move)throw Error('Jogada inválida.');
  const board=[...s.board],from=move.path[0],to=move.path.at(-1),piece=board[from];
  board[from]=0;for(const i of move.captures)board[i]=0;
  board[to]=Math.abs(piece)===1&&(piece>0?to<8:to>=56)?piece*2:piece;
  const promoted=board[to]!==piece;
  const next={board,turn:s.turn==='w'?'b':'w',quietKings:!move.captures.length&&Math.abs(piece)===2?s.quietKings+1:0,stable:move.captures.length||promoted?0:s.stable+1,endingCount:0,ending:'',history:[]};
  const ending=endingType(next);
  if(ending){next.ending=ending.key;next.endingCount=(s.ending===ending.key&&!move.captures.length&&!promoted?s.endingCount:0)+(s.turn===ending.side?1:0);}
  next.history=move.captures.length||promoted?[positionKey(next)]:[...s.history,positionKey(next)];
  return next;
}
export function checkersResult(s,moves=checkersMoves(s)){
  if(!moves.length)return {winner:s.turn==='w'?'b':'w',reason:'Sem jogadas disponíveis'};
  if(s.history.filter(k=>k===positionKey(s)).length>=3)return {winner:'draw',reason:'Repetição de posição'};
  if(s.quietKings>=30)return {winner:'draw',reason:'15 lances de cada lado apenas com damas, sem captura'};
  const ending=endingType(s);
  if(ending&&s.endingCount>=ending.limit)return {winner:'draw',reason:'Limite de lances deste final'};
  const pieces=s.board.filter(Boolean),bothKings=pieces.some(p=>p===2)&&pieces.some(p=>p===-2);
  if(bothKings&&((pieces.length<=5&&s.stable>=60)||(pieces.length<=7&&s.stable>=120)))return {winner:'draw',reason:'Final sem mudança de material'};
  return null;
}
export function chessResult(s){
  if(s.isCheckmate())return {winner:s.turn()==='w'?'b':'w',reason:'Xeque-mate'};
  if(s.isStalemate())return {winner:'draw',reason:'Rei afogado'};
  if(s.isInsufficientMaterial())return {winner:'draw',reason:'Material insuficiente'};
  if(s.isThreefoldRepetition())return {winner:'draw',reason:'Repetição de posição'};
  if(s.isDrawByFiftyMoves())return {winner:'draw',reason:'50 lances sem captura ou movimento de peão'};
  return null;
}
export const chessMoveId=m=>m.from+m.to+(m.promotion||'');
export function chessPlay(s,id){return s.move({from:id.slice(0,2),to:id.slice(2,4),...(id.length===5?{promotion:id[4]}:{})});}
export function gameResult(kind,s){return kind==='tictactoe'?ticResult(s):kind==='checkers'?checkersResult(s):chessResult(s);}
export function gameMoves(kind,s){return kind==='tictactoe'?ticMoves(s):kind==='checkers'?checkersMoves(s).map(m=>m.id):chessResult(s)?[]:s.moves({verbose:true}).map(chessMoveId);}
export const gameTurn=(kind,s)=>kind==='chess'?s.turn():s.turn;

// Só o histórico de jogadas é persistido: backups não fornecem tabuleiros ou resultados arbitrários.
// Cache pequeno por conteúdo, sem confiar em referências mutáveis.
const replayCache=new Map();
export function replayMatch(kind,match){
  if(!['tictactoe','checkers','chess'].includes(kind)||!match||!Object.hasOwn(DIFFICULTIES,match.difficulty)||!Array.isArray(match.moves)||match.moves.length>(kind==='tictactoe'?9:2000)||match.moves.some(m=>typeof m!=='string'||m.length>100))throw Error('Partida inválida.');
  const key=kind+JSON.stringify(match.moves);
  // Objetos Chess são exclusivos de cada chamada; os demais estados são clonados.
  if(kind!=='chess'&&replayCache.has(key))return structuredClone(replayCache.get(key));
  let s=kind==='tictactoe'?newTicTacToe():kind==='checkers'?newCheckers():new Chess();
  for(const id of match.moves){
    if(gameResult(kind,s))throw Error('Partida já terminada.');
    if(kind==='chess'){if(!s.moves({verbose:true}).some(m=>chessMoveId(m)===id))throw Error('Jogada inválida.');chessPlay(s,id);}
    else s=kind==='tictactoe'?ticPlay(s,id):checkersPlay(s,id);
  }
  if(kind!=='chess'){if(replayCache.size>=12)replayCache.delete(replayCache.keys().next().value);replayCache.set(key,structuredClone(s));}
  return s;
}
const validCache=new Set();
export function validGames(g){
  if(!g||!Object.hasOwn(GAME_NAMES,g.selected))return false;
  try{
    for(const kind of ['tictactoe','checkers','chess']){
      const match=g[kind];if(match===null)continue;
      const key=kind+JSON.stringify(match);
      if(!validCache.has(key)){replayMatch(kind,match);if(validCache.size>=12)validCache.delete(validCache.values().next().value);validCache.add(key);}
    }
    return true;
  }catch{return false;}
}
