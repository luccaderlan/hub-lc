import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitial,completeTimer,timerFinished,timerElapsed,timerDisplay,timerNotices,resumeTimer,pauseTimer,resetTimer,validateState} from '../data.js';

test('timer regressivo preserva restante em pausas e avisa uma vez sem perder tempo estudado',()=>{
  let timer={...createInitial().timer,mode:'countdown',targetMinutes:'1'};
  assert.equal(timerDisplay(timer,1000),60000);
  timer=resumeTimer(timer,1000);assert.equal(timerDisplay(timer,31000),30000);
  timer=pauseTimer(timer,31000);assert.equal(timerDisplay(timer,200000),30000);
  timer=resumeTimer(timer,200000);assert.equal(timerNotices(timer,230000).study,true);
  assert.equal(timerDisplay(timer,240000),0);
  timer.targetNotified=true;assert.equal(timerNotices(timer,240000).study,false);
  timer=resetTimer(timer);assert.equal(timerDisplay(timer),60000);assert.equal(timer.targetNotified,false);
});
test('horário limite só é armado ao iniciar e vence mesmo durante uma pausa',()=>{
  let timer={...createInitial().timer,mode:'deadline',deadline:61000};
  assert.equal(timerNotices(timer,100000).study,false);
  timer=resumeTimer(timer,1000);timer=pauseTimer(timer,11000);
  assert.equal(timerDisplay(timer,31000),30000);assert.equal(timerNotices(timer,61000).study,true);
  assert.equal(timer.elapsedMs,10000);assert.equal(resetTimer(timer).deadline,null);
});
test('backups antigos recebem cronômetro e novos campos são validados',()=>{
  const state=createInitial();delete state.timer.mode;delete state.timer.deadline;delete state.timer.alertDismissed;
  assert.equal(validateState(state).timer.mode,'stopwatch');assert.equal(state.timer.mode,undefined);
  for(const values of [{mode:'invalid'},{deadline:Infinity},{deadline:-1},{alertDismissed:'yes'}]){
    const invalid=createInitial();Object.assign(invalid.timer,values);assert.throws(()=>validateState(invalid));
  }
});

test('limite interrompe no instante exato após aba inativa e continuar abre cronômetro',()=>{
  let timer=resumeTimer({...createInitial().timer,mode:'countdown',targetMinutes:'1'},1000);
  timer=completeTimer(timer,164000);
  assert.equal(timer.running,false);assert.equal(timer.elapsedMs,60000);assert.equal(timer.pause.startedAt,61000);
  assert.equal(timerFinished(timer,164000),true);assert.equal(completeTimer(timer,200000),timer);
  assert.equal(timerElapsed(timer,200000),60000);
  const resumed=resumeTimer(timer,200000);assert.equal(resumed.mode,'stopwatch');assert.equal(resumed.running,true);
  assert.equal(timerDisplay(resumed,210000),70000);
  const deadline=completeTimer(resumeTimer({...createInitial().timer,mode:'deadline',deadline:61000},1000),164000);
  assert.equal(deadline.elapsedMs,60000);assert.equal(deadline.running,false);
  const stopwatch=resumeTimer({...createInitial().timer,targetMinutes:'1'},1000);
  assert.equal(completeTimer(stopwatch,164000),stopwatch);
});
