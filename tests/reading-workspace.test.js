import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitial,validateState,dictionarySnapshot,dictionaryTerms,discoveryConnections,makeDiscovery} from '../data.js';
import {studyMarkdown} from '../study-export.js';

test('dicionário pessoal preserva inclusões e exclusões no backup e atualiza conexões',()=>{
  const s=createInitial(),original=dictionarySnapshot.terms[0];
  s.hiddenTerms.push(original.url);
  s.customTerms.push({id:'my-term',word:'Termo pessoal',category:'Meus termos',meaning:'Uma definição',comparison:'',example:'',url:''});
  const restored=validateState(JSON.parse(JSON.stringify(s))),terms=dictionaryTerms(restored);
  assert.equal(terms.some(t=>t.url===original.url),false);
  assert.equal(terms.find(t=>t.id==='my-term').meaning,'Uma definição');
  const d=makeDiscovery('https://example.org','Termo pessoal');
  assert.equal(discoveryConnections(d,s.areas,[],terms).terms.some(t=>t.id==='my-term'),true);
  s.customTerms[0].url='javascript:alert(1)';assert.throws(()=>validateState(s));
});

test('backups antigos recebem coleções pessoais vazias; entradas inválidas são rejeitadas',()=>{
  const s=createInitial();delete s.customTerms;delete s.hiddenTerms;
  assert.deepEqual(validateState(s).customTerms,[]);
  assert.equal(dictionaryTerms(validateState(s)).length,dictionarySnapshot.terms.length);
  s.hiddenTerms=['https://example.org'];assert.throws(()=>validateState(s));
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
