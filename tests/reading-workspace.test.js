import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitial,validateState,makeDiscovery} from '../data.js';
import {studyMarkdown} from '../study-export.js';

test('backups antigos descartam o dicionário e preservam os demais registros',()=>{
  const s=createInitial();
  s.discoveries.push(makeDiscovery('https://example.org','Meu estudo'));
  const expected=validateState(structuredClone(s));
  Object.assign(s,{customTerms:[{id:'my-term',word:'Termo pessoal',meaning:'Definição pessoal'}],hiddenTerms:['https://example.org/term'],dictionaryUrl:'https://example.org/private'});
  const restored=validateState(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored,expected);
  for(const key of ['customTerms','hiddenTerms','dictionaryUrl'])assert.equal(Object.hasOwn(restored,key),false);
  assert.ok(Object.hasOwn(s,'customTerms'));
});

test('caderno e retomada de cada livro sobrevivem ao backup e à exportação contextual',()=>{
  const s=createInitial(),b=s.books[0];
  Object.assign(b,{journal:'Minha ideia exclusiva do primeiro livro',nextStep:'Revisitar a passagem no capítulo 2',page:'14',total:'100'});
  s.books[1].journal='Texto exclusivo do segundo livro';
  const restored=validateState(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.books[0].journal,b.journal);assert.equal(restored.books[0].nextStep,b.nextStep);
  const md=studyMarkdown(restored,{scope:'book',id:b.id});
  assert.match(md,/Minha ideia exclusiva/);assert.match(md,/Revisitar a passagem/);assert.doesNotMatch(md,/Texto exclusivo do segundo/);
  restored.books[0].journal=42;assert.throws(()=>validateState(restored));
});
