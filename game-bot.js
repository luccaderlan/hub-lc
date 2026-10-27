import {ticResult,ticMoves,ticPlay,checkersMoves,checkersPlay,checkersResult,chessResult,chessMoveId,chessPlay,replayMatch} from './games.js';

function ticScore(s){
  const result=ticResult(s);if(result)return result.winner==='draw'?0:result.winner===s.turn?10:-10;
  return Math.max(...ticMoves(s).map(id=>-ticScore(ticPlay(s,id))));
}
export function chooseTic(s,difficulty,random=Math.random){
  const moves=ticMoves(s);if(!moves.length)return null;
  if(difficulty==='easy')return moves[Math.floor(random()*moves.length)];
  if(difficulty==='medium'){
    const win=moves.find(id=>ticResult(ticPlay(s,id))?.winner===s.turn);if(win)return win;
    const enemy={...s,turn:s.turn==='w'?'b':'w'},block=moves.find(id=>ticResult(ticPlay(enemy,id))?.winner===enemy.turn);
    return block??(moves.includes('4')?'4':moves[Math.floor(random()*moves.length)]);
  }
  return moves.map(id=>({id,score:-ticScore(ticPlay(s,id))})).sort((a,b)=>b.score-a.score)[0].id;
}
const value={p:100,n:320,b:335,r:500,q:900,k:0};
function chessEval(s){
  let score=0;
  for(const row of s.board())for(const p of row){
    if(!p)continue;
    const col=p.square.charCodeAt(0)-97,rank=Number(p.square[1]),center=7-Math.abs(3.5-col)-Math.abs(4.5-rank);
    const bonus=p.type==='p'?(p.color==='w'?rank-2:7-rank)*7:p.type==='k'?0:center*5;
    score+=(p.color==='w'?1:-1)*(value[p.type]+bonus);
  }
  return (s.turn()==='w'?1:-1)*score;
}
function checkerEval(s){
  return s.board.reduce((score,p,i)=>score+(p>0?1:-1)*(Math.abs(p)===2?330:p?100+(p>0?7-Math.floor(i/8):Math.floor(i/8))*5:0),0)*(s.turn==='w'?1:-1);
}
export function chooseBot(kind,match,{random=Math.random,now=()=>performance.now(),budget}={}){
  const s=replayMatch(kind,match),difficulty=match.difficulty;
  if(kind==='tictactoe')return chooseTic(s,difficulty,random);
  const chess=kind==='chess',moves=chess?(chessResult(s)?[]:s.moves({verbose:true})):checkersResult(s)?[]:checkersMoves(s);
  if(!moves.length)return null;
  const idOf=m=>chess?chessMoveId(m):m.id;
  if(difficulty==='easy'&&random()<.7)return idOf(moves[Math.floor(random()*moves.length)]);
  const deadline=now()+(budget??{easy:100,medium:400,hard:1100}[difficulty]),maxDepth={easy:1,medium:3,hard:chess?5:7}[difficulty];
  let nodes=0,best=moves[0];const timeout=Symbol('tempo');
  const ordered=list=>list.sort((a,b)=>chess?((value[b.captured]||0)+(value[b.promotion]||0)-(value[a.captured]||0)-(value[a.promotion]||0)):b.captures.length-a.captures.length);
  function search(state,depth,alpha,beta,ply){
    if((++nodes&15)===0&&now()>=deadline)throw timeout;
    const list=chess?state.moves({verbose:true}):checkersMoves(state),result=chess?chessResult(state):checkersResult(state,list);
    if(result)return result.winner==='draw'?0:-100000+ply;
    if(depth===0)return chess?chessEval(state):checkerEval(state);
    let score=-Infinity;
    for(const move of ordered(list)){
      let candidate;
      if(chess){chessPlay(state,idOf(move));try{candidate=-search(state,depth-1,-beta,-alpha,ply+1);}finally{state.undo();}}
      else candidate=-search(checkersPlay(state,move.id),depth-1,-beta,-alpha,ply+1);
      score=Math.max(score,candidate);alpha=Math.max(alpha,score);if(alpha>=beta)break;
    }
    return score;
  }
  for(let depth=1;depth<=maxDepth;depth++){
    let iterationBest=best,score=-Infinity;
    try{
      for(const move of ordered([...moves])){
        if(now()>=deadline)throw timeout;
        let candidate;
        if(chess){chessPlay(s,idOf(move));try{candidate=-search(s,depth-1,-Infinity,-score,1);}finally{s.undo();}}
        else candidate=-search(checkersPlay(s,move.id),depth-1,-Infinity,-score,1);
        if(candidate>score){score=candidate;iterationBest=move;}
      }
      best=iterationBest;
    }catch(error){if(error!==timeout)throw error;break;}
  }
  return idOf(best);
}
