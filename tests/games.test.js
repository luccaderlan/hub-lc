import test from 'node:test';
import assert from 'node:assert/strict';
import {Chess,createGames,newMatch,newTicTacToe,ticResult,ticMoves,ticPlay,newCheckers,checkersMoves,checkersPlay,checkersResult,squareIndex,chessResult,chessPlay,replayMatch,gameMoves,gameResult,gameTurn,validGames} from '../games.js';
import {chooseTic,chooseBot} from '../game-bot.js';
import {createInitial,validateState,writeState,readState} from '../data.js';
const checker=(pieces,turn='w')=>{const s=newCheckers();s.board.fill(0);s.turn=turn;s.history=[];for(const [square,piece] of Object.entries(pieces))s.board[squareIndex(square)]=piece;return s;};
const path=(...squares)=>squares.map(squareIndex).join('-');

test('velha: vitórias, empate, jogadas ilegais e difícil invencível contra toda sequência humana',()=>{
  const play=ids=>ids.reduce((s,id)=>ticPlay(s,String(id)),newTicTacToe());
  assert.equal(ticResult(play([0,3,1,4,2])).winner,'w');
  assert.equal(ticResult(play([0,3,1,4,8,5])).winner,'b');
  assert.equal(ticResult(play([0,1,2,4,3,5,7,6,8])).winner,'draw');
  assert.throws(()=>ticPlay(play([0]),'0'));assert.throws(()=>ticPlay(play([0,3,1,4,2]),'8'));
  for(const botSide of ['w','b']){
    function visit(s){
      const r=ticResult(s);if(r){assert.notEqual(r.winner,botSide==='w'?'b':'w');return;}
      if(s.turn===botSide)visit(ticPlay(s,chooseTic(s,'hard')));
      else for(const id of ticMoves(s))visit(ticPlay(s,id));
    }
    visit(newTicTacToe());
  }
  const threat=play([0,3,1]);assert.equal(chooseTic(threat,'medium'),'2');
  assert.equal(chooseTic(newTicTacToe(),'easy',()=>.99),'8');
});

test('dama brasileira: posição inicial, captura para trás, obrigatoriedade e lei da maioria',()=>{
  const initial=newCheckers();assert.equal(initial.board.filter(p=>p===1).length,12);assert.equal(initial.board.filter(p=>p===-1).length,12);assert.equal(checkersMoves(initial).length,7);
  const backwards=checker({c5:1,d4:-1});assert.deepEqual(checkersMoves(backwards).map(m=>m.id),[path('c5','e3')]);
  const majority=checker({a3:1,b4:-1,d6:-1,h2:1,g3:-1});
  assert.deepEqual(checkersMoves(majority).map(m=>m.id),[path('a3','c5','e7')]);
  assert.throws(()=>checkersPlay(majority,path('h2','f4')));assert.throws(()=>checkersPlay(majority,path('a3','c5')));
  const after=checkersPlay(majority,path('a3','c5','e7'));assert.equal(after.turn,'b');assert.equal(after.board.filter(p=>p<0).length,1);assert.equal(after.board[squareIndex('e7')],1);
});

test('dama: voo, bloqueio das peças capturadas, promoção só ao terminar e sem prioridade de qualidade',()=>{
  assert.deepEqual(checkersMoves(checker({c3:2,e5:-1})).map(m=>m.id),['f6','g7','h8'].map(s=>path('c3',s)));
  const turkish=checkersMoves(checker({c3:2,d4:-1,b2:-1}));assert.ok(turkish.every(m=>m.captures.length===1));
  const through=checker({b6:1,c7:-1,e7:-1}),sequence=path('b6','d8','f6');
  assert.deepEqual(checkersMoves(through).map(m=>m.id),[sequence]);assert.equal(checkersPlay(through,sequence).board[squareIndex('f6')],1);
  const promote=checker({b6:1,c7:-1,f6:-1});assert.equal(checkersPlay(promote,path('b6','d8')).board[squareIndex('d8')],2);
  const equal=checkersMoves(checker({c3:1,b4:-2,d4:-1}));assert.equal(equal.length,2);assert.ok(equal.every(m=>m.captures.length===1));
});

test('dama: bloqueio e fim após última captura; empates por repetição, damas e finais',()=>{
  assert.equal(checkersResult(checker({b8:1,h8:-2})).winner,'b');
  const final=checkersPlay(checker({c3:1,d4:-1}),path('c3','e5'));assert.equal(checkersResult(final).winner,'w');
  const s=checker({a1:2,h8:-2});s.quietKings=30;assert.equal(checkersResult(s).winner,'draw');
  s.quietKings=0;s.history=Array(3).fill(s.turn+':'+s.board.join(','));assert.match(checkersResult(s).reason,/Repetição/);
  s.history=[];s.endingCount=5;assert.equal(checkersResult(s).winner,'draw');
  const stable=checker({a1:2,c1:1,e1:1,h8:-2});stable.stable=60;assert.equal(checkersResult(stable).winner,'draw');
});

test('xadrez: geração legal, roque, xeque, en passant e escolha das quatro promoções',()=>{
  const initial=new Chess();let nodes=0;
  for(const a of initial.moves()){initial.move(a);for(const b of initial.moves()){initial.move(b);nodes+=initial.moves().length;initial.undo();}initial.undo();}assert.equal(nodes,8902);
  const castle=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');assert.ok(castle.moves().includes('O-O'));chessPlay(castle,'e1g1');assert.equal(castle.get('f1').type,'r');
  const attacked=new Chess('r3k2r/8/8/8/8/5r2/8/R3K2R w KQkq - 0 1');assert.ok(!attacked.moves().includes('O-O'));
  const ep=new Chess();for(const id of ['e2e4','a7a6','e4e5','d7d5'])chessPlay(ep,id);chessPlay(ep,'e5d6');assert.equal(ep.get('d5'),undefined);assert.equal(ep.get('d6').color,'w');
  const expired=new Chess();for(const id of ['e2e4','a7a6','e4e5','d7d5','h2h3','a6a5'])chessPlay(expired,id);assert.throws(()=>chessPlay(expired,'e5d6'));
  const pinned=new Chess('k3r3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');assert.ok(!pinned.moves({verbose:true}).some(m=>m.from==='e5'&&m.to==='d6'));
  for(const piece of ['q','r','b','n']){const s=new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');chessPlay(s,'a7a8'+piece);assert.equal(s.get('a8').type,piece);}
});

test('xadrez: resultado também após mate do bot, afogamento, material, 50 lances e repetição restaurada',()=>{
  const mate=newMatch('hard');mate.moves=['f2f3','e7e5','g2g4','d8h4'];assert.equal(chessResult(replayMatch('chess',mate)).winner,'b');
  assert.match(chessResult(new Chess('7k/5K2/6Q1/8/8/8/8/8 b - - 0 1')).reason,/afogado/);
  assert.match(chessResult(new Chess('7k/8/8/8/8/8/8/7K w - - 0 1')).reason,/insuficiente/);
  assert.match(chessResult(new Chess('7k/8/8/8/8/8/R7/7K w - - 100 51')).reason,/50/);
  const repeat=newMatch();repeat.moves=['g1f3','g8f6','f3g1','f6g8','g1f3','g8f6','f3g1','f6g8'];assert.match(chessResult(replayMatch('chess',repeat)).reason,/Repetição/);
  assert.throws(()=>replayMatch('chess',{...mate,moves:[...mate.moves,'a2a3']}));
  assert.throws(()=>replayMatch('chess',{...mate,moves:['e2e4q']}));
});

test('bots nos três níveis só escolhem jogadas legais e respeitam o orçamento de busca',()=>{
  for(const kind of ['tictactoe','checkers','chess'])for(const difficulty of ['easy','medium','hard']){
    const match=newMatch(difficulty);let state=replayMatch(kind,match);
    for(let turn=0;turn<4&&!gameResult(kind,state);turn++){
      let ticks=0;const id=chooseBot(kind,match,{random:()=>.9,now:()=>ticks++,budget:30});
      assert.ok(gameMoves(kind,state).includes(id),`${kind} ${difficulty} ${id}`);match.moves.push(id);state=replayMatch(kind,match);
    }
  }
});

test('backup: um jogo por tipo, migração sem alterar estudo, replay e rejeição atômica de partidas inválidas',()=>{
  const s=createInitial(),old=structuredClone(s);delete old.games;
  const migrated=validateState(old);assert.deepEqual(migrated.games,createGames());for(const key of Object.keys(old))assert.deepEqual(migrated[key],old[key]);
  for(const kind of ['tictactoe','checkers','chess']){const match=newMatch('hard');match.moves.push(gameMoves(kind,replayMatch(kind,match))[0]);s.games[kind]=match;}
  s.games.selected='chess';let raw='';const storage={getItem:()=>raw,setItem:(k,v)=>raw=v};writeState(storage,s);assert.deepEqual(readState(storage),s);const saved=raw;
  for(const mutate of [g=>g.selected='bad',g=>g.chess.difficulty='super',g=>g.chess.moves.push('e8e1'),g=>g.tictactoe.moves.push(g.tictactoe.moves[0]),g=>g.checkers.moves.push('0-63'),g=>delete g.chess,g=>g.chess=null,g=>g.checkers.moves=null]){
    const bad=structuredClone(s);mutate(bad.games);if(bad.games.chess===null){assert.ok(validGames(bad.games));continue;}assert.throws(()=>writeState(storage,bad));assert.equal(raw,saved);
  }
  const isolated=replayMatch('checkers',s.games.checkers);isolated.board.fill(0);assert.ok(replayMatch('checkers',s.games.checkers).board.some(Boolean));
  assert.equal(gameTurn('chess',replayMatch('chess',s.games.chess)),'b');
});
