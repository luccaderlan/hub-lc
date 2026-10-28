import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitial,resumeTimer,pauseTimer,pauseElapsed,totalPauseElapsed,timerElapsed,resetTimer,validateState,subgroupFor} from '../data.js';
import {studyMarkdown} from '../study-export.js';

test('pausas acumulam entre retomadas e reload sem entrar no tempo estudado',()=>{
 let timer=resumeTimer(createInitial().timer,1000);
 timer=pauseTimer(timer,11000);
 assert.equal(pauseElapsed(timer,16000),5000);assert.equal(timerElapsed(timer,16000),10000);
 timer=resumeTimer(timer,16000);assert.equal(totalPauseElapsed(timer,21000),5000);
 timer=pauseTimer(timer,26000);
 const state=createInitial();state.timer=timer;timer=validateState(state).timer;
 assert.equal(totalPauseElapsed(timer,36000),15000);assert.equal(timerElapsed(timer,36000),20000);
 timer=resumeTimer(timer,36000);assert.equal(timer.pausedMs,15000);assert.equal(pauseElapsed(timer,40000),0);
 assert.equal(totalPauseElapsed(resetTimer(timer),50000),0);
});

test('grupos manuais e fontes sobrevivem ao backup e à exportação; antigos mantêm grupos de TI',()=>{
 const state=createInitial(),java=state.areas.find(a=>a.name==='Java');
 assert.equal(subgroupFor(java),'Fundamentos e ferramentas');java.subgroup='';assert.equal(subgroupFor(java),'');
 java.subgroup='Meu grupo';state.studyGroups.push({name:'Meu grupo',division:'TI'});
 state.notes.push({id:'note_source',title:'Minha anotação',body:'Ideia',kind:'text',category:'Anotação',areaId:java.id,bookId:'',materialId:'',page:'',stickies:[],updatedAt:'2026-10-28T12:00:00Z',sourceUrl:'https://example.org/fonte',sourceTitle:'Artigo'});
 const restored=validateState(state);assert.equal(restored.areas.find(a=>a.id===java.id).subgroup,'Meu grupo');assert.deepEqual(restored.studyGroups,state.studyGroups);
 assert.match(studyMarkdown(restored),/Fonte: \[Artigo\]\(https:\/\/example.org\/fonte\)/);
 delete state.studyGroups;delete state.timer.pausedMs;assert.ok(validateState(state).studyGroups.length);assert.equal(validateState(state).timer.pausedMs,0);
 for(const value of ['javascript:alert(1)','https://user:password@example.org']){state.notes[0].sourceUrl=value;assert.throws(()=>validateState(state));}
});

test('backup rejeita grupos e totais de pausa inválidos',()=>{
 for(const group of [{name:'',division:'TI'},{name:'Grupo',division:''},{name:4,division:'TI'}]){const state=createInitial();state.studyGroups=[group];assert.throws(()=>validateState(state));}
 for(const pausedMs of [-1,Infinity,'100']){const state=createInitial();state.timer.pausedMs=pausedMs;assert.throws(()=>validateState(state));}
});
