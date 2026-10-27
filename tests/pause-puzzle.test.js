import test from 'node:test';
import assert from 'node:assert/strict';
import {PUZZLE_LEVELS,createPuzzle,puzzleProgress,puzzleHint,tileSides} from '../puzzle.js';
import {createInitial,validateState,readState,writeState,timerElapsed,pauseTimer,resumeTimer,resetTimer,setPauseReminder,timerNotices} from '../data.js';

test('todos os tabuleiros têm solução; pistas resolvem sem exigir peças fora do caminho',()=>{
  for(let level=0;level<PUZZLE_LEVELS.length;level++){
    const stage=PUZZLE_LEVELS[level],p=createPuzzle(level);
    assert.equal(puzzleProgress(p).solved,false,stage.name);
    let steps=0;
    while(!puzzleProgress(p).solved&&steps++<10){
      const hint=puzzleHint(p);assert.ok(hint,stage.name);
      const before=structuredClone(p);assert.deepEqual(puzzleHint(p),hint);assert.deepEqual(p,before);
      p.rotations[hint.index]=(p.rotations[hint.index]+hint.turns)%4;
    }
    assert.ok(puzzleProgress(p).solved,stage.name);assert.equal(puzzleHint(p),null);
    assert.deepEqual([...puzzleProgress(p).connected].sort(),[...stage.path].sort());
    for(let i=0;i<9;i++)if(!stage.path.includes(i))p.rotations[i]=(p.rotations[i]+1)%4;
    assert.ok(puzzleProgress(p).solved);
  }
});

test('pistas resolvem também todas as orientações possíveis de cada caminho desenhado',()=>{
  for(let level=0;level<PUZZLE_LEVELS.length;level++){
    const stage=PUZZLE_LEVELS[level];
    // Todas as orientações das peças do caminho: até 4^7 combinações.
    for(let combination=0;combination<4**stage.path.length;combination++){
      const p=createPuzzle(level);let value=combination;
      for(const index of stage.path){p.rotations[index]=value%4;value=Math.floor(value/4);}
      for(let step=0;step<stage.path.length&&!puzzleProgress(p).solved;step++){
        const h=puzzleHint(p);assert.ok(h);p.rotations[h.index]=(p.rotations[h.index]+h.turns)%4;
      }
      assert.ok(puzzleProgress(p).solved);
    }
  }
});

test('uma peça sem conexão recíproca ou saída orientada não completa o caminho',()=>{
  const p=createPuzzle();p.rotations=PUZZLE_LEVELS[0].tiles.map(t=>t.solution);
  assert.equal(puzzleProgress(p).solved,true);
  const {entry,exit}=PUZZLE_LEVELS[0];p.rotations[exit.index]=(p.rotations[exit.index]+1)%4;
  assert.equal(puzzleProgress(p).solved,false);
  p.rotations[entry.index]=(p.rotations[entry.index]+1)%4;
  assert.ok(!tileSides(p,entry.index).includes(entry.side));assert.equal(puzzleProgress(p).connected.size,0);
});

test('pausa e retomada usam só estudo; lembrete vencido e solução não retomam o cronômetro',()=>{
  const initial=createInitial();assert.equal(initial.timer.targetMinutes,'');assert.equal(initial.timer.pause.minutes,'');
  let timer=resumeTimer(initial.timer,1000);timer=pauseTimer(timer,61000);
  assert.equal(timerElapsed(timer,999999),60000);assert.equal(timer.pause.startedAt,61000);
  timer=setPauseReminder(timer,'2',62000);assert.equal(timer.pause.endsAt,182000);
  assert.equal(timerNotices(timer,181999).pause,false);assert.equal(timerNotices(timer,182000).pause,true);
  assert.equal(timer.running,false);assert.equal(timerElapsed(timer,999999),60000);
  const again=pauseTimer(timer,200000);assert.deepEqual(again,timer);
  timer.pause.notified=true;assert.equal(timerNotices(timer,999999).pause,false);
  timer=resumeTimer(timer,1000000);assert.equal(timer.pause.endsAt,null);assert.equal(timer.pause.minutes,'');
  assert.equal(timerElapsed(timer,1001000),61000);assert.throws(()=>setPauseReminder(timer,'2'));
  timer=resetTimer(timer);assert.equal(timerElapsed(timer),0);assert.equal(timer.pause.startedAt,null);
});

test('lembretes podem ser alterados/removidos e duração de estudo só avisa uma vez por escolha',()=>{
  let timer=pauseTimer(resumeTimer(createInitial().timer,0),60000);
  for(const value of ['0','-1','1.5','1000001','x',3,null])assert.throws(()=>setPauseReminder(timer,value,70000));
  timer=setPauseReminder(timer,'1',70000);timer.pause.notified=true;
  timer=setPauseReminder(timer,'3',100000);assert.equal(timer.pause.endsAt,280000);assert.equal(timer.pause.notified,false);
  timer=setPauseReminder(timer,'',101000);assert.equal(timer.pause.endsAt,null);assert.equal(timer.pause.minutes,'');
  timer.targetMinutes='1';assert.equal(timerNotices(timer,1000000).study,true);assert.equal(timer.running,false);
  timer.targetNotified=true;assert.equal(timerNotices(timer,1000000).study,false);
  timer.targetMinutes='2';timer.targetNotified=false;assert.equal(timerNotices(timer,1000000).study,false);
  timer.targetMinutes='';assert.equal(timerNotices(timer,1000000).study,false);
});

test('migração de backups antigos mantém registros e não impõe duração ou inicia sessão',()=>{
  for(const mode of ['new','running','paused']){
    const old=createInitial();delete old.puzzle;delete old.timer.pause;delete old.timer.targetNotified;
    if(mode!=='new')old.timer.elapsedMs=45000;
    if(mode==='running'){old.timer.running=true;old.timer.startedAt=1000;}
    const original=structuredClone(old),migrated=validateState(old);
    assert.deepEqual(old,original);assert.equal(migrated.timer.running,old.timer.running);
    assert.equal(migrated.timer.elapsedMs,old.timer.elapsedMs);assert.equal(migrated.timer.pause.minutes,'');assert.equal(migrated.timer.pause.endsAt,null);
    assert.equal(migrated.timer.pause.startedAt!==null,mode==='paused');
    for(const collection of ['areas','materials','books','notes','tasks','sessions','documents','discoveries'])assert.deepEqual(migrated[collection],old[collection]);
  }
});

test('backup preserva rodada e pausa vencida; valores inválidos não substituem registros',()=>{
  const s=createInitial();s.puzzle=createPuzzle(4);s.puzzle.rotations[2]=3;
  s.timer=setPauseReminder(pauseTimer(resumeTimer(s.timer,1000),31000),'1',32000);
  let raw='';const storage={getItem:()=>raw,setItem:(k,v)=>raw=v};writeState(storage,s);
  const loaded=readState(storage);assert.deepEqual(loaded,s);assert.equal(loaded.timer.running,false);assert.equal(timerNotices(loaded.timer,999999).pause,true);
  const original=raw;
  for(const mutate of [x=>x.puzzle=null,x=>x.puzzle.level=-1,x=>x.puzzle.level=PUZZLE_LEVELS.length,x=>x.puzzle.rotations.pop(),x=>x.puzzle.rotations[0]=4,x=>x.puzzle.rotations[0]='1',x=>x.timer.targetNotified='yes',x=>x.timer.pause=null,x=>x.timer.pause.endsAt=Infinity,x=>x.timer.pause.minutes='0',x=>x.timer.pause.notified=1,x=>x.timer.pause.startedAt=null,x=>x.timer.running=true]){
    const invalid=structuredClone(s);mutate(invalid);assert.throws(()=>writeState(storage,invalid));assert.equal(raw,original);
  }
});
