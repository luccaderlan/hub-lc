import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitial,validateState,validLocalDate,dayAppointments,movePlannedTask,writeState,readState,today} from '../data.js';
const task=s=>({id:'activity',title:'Uma atividade',columnId:s.columns[1].id,areaId:s.areas[0].id,kind:'Estudo',details:'',duration:'',due:'2027-01-15',plannedDate:'2026-11-04'});
const appointment=(id,date='2026-11-04',time='')=>({id,title:id,date,time,location:'Local',details:'Uma observação'});
test('home: old backups receive empty day data without interpreting custom column names or changing IDs',()=>{
 const old=createInitial();old.tasks.push(task(old));delete old.tasks[0].plannedDate;delete old.appointments;delete old.dayPlanning;delete old.quickIdeaDraft;
 const migrated=validateState(old);assert.deepEqual(migrated.appointments,[]);assert.deepEqual(migrated.dayPlanning,{completionColumnId:'',reopenColumnId:''});assert.equal(migrated.quickIdeaDraft,'');
 for(const key of ['tasks','columns','notes','books','materials','documents','sessions'])assert.deepEqual(migrated[key],old[key]);assert.equal(old.appointments,undefined);
});
test('home: calendar validation and sorting never invent a time or shift a date',()=>{
 for(const date of ['2026-11-04','2024-02-29','0001-01-01','9999-12-31'])assert.ok(validLocalDate(date),date);
 for(const date of ['2026-02-29','2026-02-31','2026-13-01','2026-00-01','2026-1-1','0000-01-01',null,2])assert.equal(validLocalDate(date),false,String(date));
 const s=createInitial();s.appointments=[appointment('later','2026-11-04','15:00'),appointment('free'),appointment('early','2026-11-04','09:00'),appointment('other','2026-11-05')];
 assert.deepEqual(dayAppointments(s,'2026-11-04').map(a=>a.id),['early','later','free']);assert.equal(s.appointments[1].time,'');
 const d=new Date();assert.equal(today(),`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
});
test('home: explicit conclusion preserves former column, deadline, and schedule on moves from either surface',()=>{
 const s=createInitial();s.columns[3].name='Arquivado à minha maneira';s.dayPlanning={completionColumnId:s.columns[3].id,reopenColumnId:s.columns[0].id};s.tasks.push(task(s));
 movePlannedTask(s,'activity',s.columns[3].id);assert.equal(s.tasks[0].previousColumnId,s.columns[1].id);
 movePlannedTask(s,'activity',s.columns[3].id);assert.equal(s.tasks[0].previousColumnId,s.columns[1].id);
 movePlannedTask(s,'activity',s.tasks[0].previousColumnId);assert.equal(s.tasks[0].columnId,s.columns[1].id);
 assert.equal(s.tasks[0].due,'2027-01-15');assert.equal(s.tasks[0].plannedDate,'2026-11-04');assert.equal(s.tasks.length,1);
});
test('home: new backups round-trip, reject corrupt data before writing and preserve records on quota failure',()=>{
 const s=createInitial();s.tasks.push(task(s));s.appointments.push(appointment('event'));s.quickIdeaDraft='Ainda pensando…';s.dayPlanning={completionColumnId:s.columns[3].id,reopenColumnId:s.columns[0].id};
 let raw;const storage={setItem:(k,v)=>{raw=v;},getItem:()=>raw};writeState(storage,s);assert.deepEqual(readState(storage),s);const before=raw;
 for(const mutate of [x=>x.appointments.push({...x.appointments[0]}),x=>x.appointments[0].date='2026-02-30',x=>x.appointments[0].time='24:00',x=>x.appointments[0].title='',x=>x.tasks[0].plannedDate='bad',x=>x.tasks[0].previousColumnId='missing',x=>x.dayPlanning.completionColumnId='missing',x=>x.dayPlanning.reopenColumnId=x.dayPlanning.completionColumnId,x=>x.quickIdeaDraft=null,x=>x.appointments=null]){
  const bad=structuredClone(s);mutate(bad);assert.throws(()=>writeState(storage,bad));assert.equal(raw,before);
 }
 assert.throws(()=>writeState({setItem:()=>{throw new Error('quota');}},s));assert.equal(raw,before);
});
