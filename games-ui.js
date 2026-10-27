import {GAME_NAMES,DIFFICULTIES,newMatch,replayMatch,gameMoves,gameResult,gameTurn,checkersMoves,squareName,squareIndex,chessMoveId} from './games.js';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pieceNames={p:'peão',n:'cavalo',b:'bispo',r:'torre',q:'rainha',k:'rei'};
const glyphs={p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'};
const btn=(label,action,extra='',cls='')=>`<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${label}</button>`;
export function createGameUI({getGames,persist,render,isActive,notify}){
  let source=null,selected=null,cursor=null,prefix=[],promotion=[],setup=false,worker=null,watchdog=null,token=0,request=null,failed=false;
  function cancel(){token++;worker?.terminate();worker=null;clearTimeout(watchdog);request=null;}
  function reset(){cancel();source=null;selected=null;cursor=null;prefix=[];promotion=[];setup=false;failed=false;}
  function sync(){
    const g=getGames(),match=g[g.selected];
    if(source!==match){cancel();source=match;selected=null;cursor=null;prefix=[];promotion=[];setup=false;failed=false;}
    return {g,kind:g.selected,match};
  }
  function picker(){
    return `<nav class="game-picker" aria-label="Escolher jogo">${Object.entries(GAME_NAMES).map(([id,name])=>`<button type="button" data-action="choose-game" data-id="${id}" aria-pressed="${getGames().selected===id}" class="${getGames().selected===id?'active':''}"><span aria-hidden="true">${{desvio:'↻',tictactoe:'×',checkers:'◉',chess:'♞'}[id]}</span>${name}</button>`).join('')}</nav>`;
  }
  function status(kind,s){
    const result=gameResult(kind,s);
    if(result)return `${result.winner==='draw'?'Empate':result.winner==='w'?'Você venceu':'O bot venceu'}. ${result.reason}. Outra partida quando quiser.`;
    if(promotion.length)return 'Escolha a peça para concluir a promoção.';
    if(prefix.length>1)return 'Continue a captura com a mesma peça. Escolha um dos destinos marcados.';
    if(gameTurn(kind,s)==='b')return failed?'O bot não conseguiu responder. Você pode tentar novamente.':'Vez do bot. Pensando…';
    return kind==='tictactoe'?'Sua vez · você joga com ×.':kind==='checkers'&&checkersMoves(s)[0]?.captures.length?'Sua vez · captura obrigatória. Escolha uma peça marcada.':'Sua vez · escolha uma peça e depois um destino marcado.';
  }
  function panel(sessionStrip=''){
    const {kind,match}=sync();
    const intro={tictactoe:'Três em linha, no seu ritmo.',checkers:'Dama brasileira · 8 × 8',chess:'Você joga com as brancas. O bot, com as pretas.'}[kind];
    const form=!match||setup?`<div class="game-setup"><label for="game-difficulty">Dificuldade do bot</label><div class="button-row"><select id="game-difficulty" name="game-difficulty"><option value="">Escolha um nível</option>${Object.entries(DIFFICULTIES).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select>${btn(match?'Iniciar outra partida':'Começar partida','start-game','','primary')}${match?btn('Continuar esta partida','cancel-game-setup','','quiet'):''}</div><p class="note-status">${match?'Iniciar outra substitui apenas a partida deste jogo.':'Sua partida fica guardada ao sair. Você pode interromper quando quiser.'}</p></div>`:'';
    let play='';
    if(match){
      const s=replayMatch(kind,match),result=gameResult(kind,s),moves=gameMoves(kind,s),human=gameTurn(kind,s)==='w'&&!result;
      const last=match.moves.at(-1),size=kind==='tictactoe'?3:8;
      let legalFrom=[],destinations=[],visual=kind==='chess'?s.board().flat():[...s.board],lastSquares=[];
      if(kind==='tictactoe')destinations=human?moves.map(Number):[];
      if(kind==='chess'){
        legalFrom=human?[...new Set(moves.map(m=>squareIndex(m.slice(0,2))))]:[];
        destinations=human&&selected!==null?[...new Set(moves.filter(m=>squareIndex(m.slice(0,2))===selected).map(m=>squareIndex(m.slice(2,4))))]:[];
        if(last)lastSquares=[squareIndex(last.slice(0,2)),squareIndex(last.slice(2,4))];
      }
      if(kind==='checkers'){
        const legal=human?checkersMoves(s):[],candidates=prefix.length?legal.filter(m=>prefix.every((p,i)=>m.path[i]===p)):legal;
        legalFrom=[...new Set(legal.map(m=>m.path[0]))];
        destinations=prefix.length?[...new Set(candidates.map(m=>m.path[prefix.length]).filter(i=>i!==undefined))]:[];
        if(prefix.length>1){visual[prefix[0]]=0;visual[prefix.at(-1)]=s.board[prefix[0]];}
        if(last)lastSquares=last.split('-').map(Number);
      }
      const cells=visual.map((p,i)=>{
        const coord=kind==='tictactoe'?`Linha ${Math.floor(i/3)+1}, coluna ${i%3+1}`:squareName(i);
        const name=kind==='chess'?(p?`${pieceNames[p.type]} ${p.color==='w'?'branco':'preto'}`:'vazia'):kind==='checkers'?(p?`${Math.abs(p)===2?'dama':'pedra'} ${p>0?'branca':'preta'}`:'vazia'):p==='w'?'×':p==='b'?'○':'vazia';
        const isSelected=kind==='checkers'?prefix.at(-1)===i:selected===i,canMove=destinations.includes(i),canSelect=human&&legalFrom.includes(i),dark=(Math.floor(i/size)+i%size)%2===1;
        const label=`${coord}, ${name}${isSelected?', selecionada':''}${canMove?', destino disponível':canSelect?', pode mover':''}${lastSquares.includes(i)?', última jogada':''}`;
        const piece=kind==='chess'?(p?`<span class="chess-piece ${p.color==='w'?'white':'black'}" aria-hidden="true">${glyphs[p.type]}</span>`:''):kind==='checkers'?(p?`<span class="checker-piece ${p>0?'white':'black'}" aria-hidden="true">${Math.abs(p)===2?'D':''}</span>`:''):`<span aria-hidden="true">${p==='w'?'×':p==='b'?'○':''}</span>`;
        return `<button type="button" class="game-cell ${dark?'dark':'light'} ${isSelected?'selected':''} ${canSelect?'movable':''} ${canMove?'available':''} ${lastSquares.includes(i)?'last-move':''} ${result?.line?.includes(i)?'winning':''}" data-action="game-cell" data-id="${i}" aria-label="${esc(label)}" aria-pressed="${isSelected}" aria-disabled="${!human||promotion.length>0}" tabindex="${i===(cursor??(kind==='tictactoe'?0:kind==='checkers'?40:56))?0:-1}">${piece}${kind!=='tictactoe'?`<small class="cell-coordinate" aria-hidden="true">${coord}</small>`:''}${canMove?'<span class="move-dot" aria-hidden="true">·</span>':''}${canSelect?'<span class="piece-ready" aria-hidden="true"></span>':''}</button>`;
      }).join('');
      const promotions=promotion.length?`<div class="promotion-picker" role="group" aria-label="Promover peão"><p>Promover a:</p><div class="button-row">${promotion.map(id=>btn(pieceNames[id[4]],'promote-game',`data-id="${id}"`)).join('')}${btn('Rever jogada','cancel-promotion','','quiet')}</div></div>`:'';
      play=`<p class="game-status" data-game-status role="status" aria-live="polite" aria-atomic="true">${esc(status(kind,s))}${kind==='chess'&&s.isCheck()&&!result?' Xeque.':''}</p>${promotions}<div class="strategy-board ${kind}" role="group" aria-label="${GAME_NAMES[kind]}, ${size} linhas e ${size} colunas" aria-describedby="game-controls">${cells}</div>${prefix.length?btn('Rever escolha','clear-game-selection','','quiet'):''}<p id="game-controls" class="note-status">Clique ou toque. Use as setas para percorrer o tabuleiro e Enter para escolher. ${kind==='checkers'?'D identifica uma dama. ':''}Você pode sair a qualquer momento.</p><div class="button-row game-actions">${btn('Outra partida','new-game','','quiet')}${failed?btn('Tentar resposta do bot','retry-bot'):''}<span class="game-level">Bot ${DIFFICULTIES[match.difficulty].toLowerCase()}</span></div>`;
    }
    return `<div class="strategy-game"><p class="eyebrow">${kind==='checkers'?'Dama brasileira':GAME_NAMES[kind]} · contra o bot</p><h2 id="puzzle-title">${GAME_NAMES[kind]}</h2><p class="muted">${intro}</p>${sessionStrip}${form}${play}${!match?`<div class="game-welcome" aria-hidden="true">${{tictactoe:'× ○',checkers:'◉ ◉',chess:'♔ ♞'}[kind]}</div>`:''}</div>`;
  }
  function commit(id){
    const {kind,match}=sync(),s=replayMatch(kind,match);
    if(gameTurn(kind,s)!=='w'||!gameMoves(kind,s).includes(id))return;
    cancel();match.moves.push(id);selected=null;prefix=[];promotion=[];failed=false;persist();render();
  }
  function action(el){
    const {action,id}=el.dataset;
    if(action==='choose-game'){
      if(!Object.hasOwn(GAME_NAMES,id))return true;
      if(getGames().selected!==id){reset();getGames().selected=id;persist();render();document.querySelector(`[data-action="choose-game"][data-id="${id}"]`)?.focus();}
      return true;
    }
    if(!['start-game','cancel-game-setup','new-game','game-cell','promote-game','cancel-promotion','clear-game-selection','retry-bot'].includes(action))return false;
    const {kind,match}=sync();
    if(action==='start-game'){
      const select=document.querySelector('#game-difficulty'),difficulty=select?.value;
      if(!Object.hasOwn(DIFFICULTIES,difficulty)){select?.focus();notify('Escolha a dificuldade para começar.');return true;}
      reset();getGames()[kind]=newMatch(difficulty);persist();render();document.querySelector('.game-cell[tabindex="0"]')?.focus();return true;
    }
    if(action==='new-game'){setup=true;render();document.querySelector('#game-difficulty')?.focus();return true;}
    if(action==='cancel-game-setup'){setup=false;render();return true;}
    if(action==='retry-bot'){failed=false;cancel();render();return true;}
    if(!match)return true;
    if(action==='promote-game'){if(promotion.includes(id))commit(id);return true;}
    if(action==='cancel-promotion'){promotion=[];render();document.querySelector(`.game-cell[data-id="${selected}"]`)?.focus();return true;}
    if(action==='clear-game-selection'){selected=null;prefix=[];render();return true;}
    if(action==='game-cell'){
      const s=replayMatch(kind,match),index=Number(id);
      cursor=index;
      if(gameResult(kind,s)||gameTurn(kind,s)!=='w'||promotion.length)return true;
      const moves=gameMoves(kind,s);
      if(kind==='tictactoe'){if(moves.includes(id))commit(id);return true;}
      if(kind==='chess'){
        const from=selected===null?'':squareName(selected),to=squareName(index),candidates=selected===null?[]:moves.filter(m=>m.startsWith(from+to));
        if(candidates.length>1){promotion=candidates;render();document.querySelector('[data-action=promote-game]')?.focus();return true;}
        if(candidates.length===1){commit(candidates[0]);return true;}
        selected=moves.some(m=>m.startsWith(to))?index:null;
      }else{
        const legal=checkersMoves(s),candidates=legal.filter(m=>prefix.every((p,i)=>m.path[i]===p)&&m.path[prefix.length]===index);
        if(prefix.length&&candidates.length){prefix.push(index);const complete=candidates.find(m=>m.path.length===prefix.length);if(complete){commit(complete.id);return true;}}
        else if(prefix.length<=1){prefix=legal.some(m=>m.path[0]===index)?[index]:[];}
        selected=prefix.at(-1)??null;
      }
      render();document.querySelector(`.game-cell[data-id="${index}"]`)?.focus();
    }
    return true;
  }
  function afterRender(){
    if(!isActive()){reset();return;}
    const {kind,match}=sync();
    if(kind==='desvio'||!match)return;
    const s=replayMatch(kind,match);
    const announcement=document.querySelector('#navigation-status'),message=document.querySelector('[data-game-status]')?.textContent;
    if(announcement&&message&&announcement.textContent!==message)announcement.textContent=message;
    if(gameResult(kind,s)||gameTurn(kind,s)!=='b'||request||failed)return;
    const capturedSource=match,capturedMoves=JSON.stringify(match.moves),requestToken=++token;
    request={kind,requestToken};
    const fail=()=>{if(requestToken!==token)return;cancel();failed=true;render();};
    try{
      worker=new Worker(new URL('./game-worker.js',import.meta.url),{type:'module'});
      watchdog=setTimeout(fail,6000);
      worker.onerror=fail;
      worker.onmessage=({data})=>{
        if(data.token!==token||!isActive()||getGames().selected!==kind||getGames()[kind]!==capturedSource||JSON.stringify(capturedSource.moves)!==capturedMoves)return;
        const current=replayMatch(kind,capturedSource);
        if(data.error||!gameMoves(kind,current).includes(data.move)){fail();return;}
        cancel();capturedSource.moves.push(data.move);persist();render();
      };
      worker.postMessage({kind,match,token:requestToken});
    }catch{fail();}
  }
  function keydown(event){
    const cell=event.target.closest('.game-cell');if(!cell)return;
    if(event.key==='Escape'){selected=null;prefix=[];promotion=[];render();return;}
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const size=getGames().selected==='tictactoe'?3:8,index=Number(cell.dataset.id),r=Math.floor(index/size),c=index%size;
    const next=event.key==='Home'?r*size:event.key==='End'?r*size+size-1:event.key==='ArrowUp'?((r+size-1)%size)*size+c:event.key==='ArrowDown'?((r+1)%size)*size+c:r*size+(c+(event.key==='ArrowRight'?1:size-1))%size;
    cursor=next;document.querySelectorAll('.game-cell').forEach(el=>el.tabIndex=Number(el.dataset.id)===next?0:-1);document.querySelector(`.game-cell[data-id="${next}"]`)?.focus();
  }
  return {picker,panel,action,afterRender,keydown,reset};
}
