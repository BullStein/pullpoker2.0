/* =========================================================
   O SALÃO — script compartilhado por todas as páginas
   ========================================================= */
(function(){
'use strict';

const TOKEN_KEY = 'salao_token';
const USER_KEY  = 'salao_user';
const SYMBOLS = ['🍒','🔔','⭐','7️⃣','🍋','💎'];

const TIPOS = {
  cor:     { label:'Cor do nome',    slot:'cor' },
  tag:     { label:'Tag',            slot:'tag' },
  brasao:  { label:'Brasão',         slot:'brasao' },
  moldura: { label:'Moldura',        slot:'moldura' },
  efeito:  { label:'Efeito no chat', slot:'efeito' }
};

let S = { users:{}, bets:[], chat:[], shop:{items:[]}, log:[] };
let C = {};
let ME = { name:null, token:null, isAdmin:false };
let PAGE = 'mesa';
let now = Date.now();

let chatDraft = '';
let spinning = false;
let shopFilter = 'todos';
let newBetType = 'fixa';
let newItemType = 'cor';
let pendingImg = '';
let editingItemId = null;

/* ------------------------------------------------ utilidades */
function $(id){ return document.getElementById(id); }
function fmt(n){ return Math.round(n).toLocaleString('pt-BR'); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function uid(p){ return p + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function val(id){ const e=$(id); return e ? e.value.trim() : ''; }
function num(id){ const n=parseInt(val(id),10); return isNaN(n)?null:n; }
function chk(id){ const e=$(id); return !!(e&&e.checked); }

function hora(ts){ return new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
function dataHora(ts){ return new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}); }
function relogio(ms){
  const s=Math.ceil(ms/1000);
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}
function faltam(ms){
  if(ms<=0) return 'encerrado';
  const m=Math.floor(ms/60000), h=Math.floor(m/60), d=Math.floor(h/24);
  if(d>0) return `${d}d ${h%24}h`;
  if(h>0) return `${h}h ${m%60}min`;
  return `${Math.max(1,m)}min`;
}
function corSegura(c,f='#f2ece3'){ return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(String(c||'').trim()) ? String(c).trim() : f; }
function srcSeguro(s){
  s=String(s||'').trim();
  return (/^data:image\/(png|jpe?g|gif|webp|svg\+xml);/i.test(s)||/^https?:\/\//i.test(s)) ? s : '';
}

function toast(msg){
  const t=$('toast'); if(!t) return;
  t.textContent=msg; t.classList.add('up');
  clearTimeout(t._h); t._h=setTimeout(()=> t.classList.remove('up'), 2800);
}

/* ------------------------------------------------ rede */
async function api(path, method, body){
  const opt={ method: method||'GET', headers:{} };
  if(ME.token) opt.headers['X-Token']=ME.token;
  if(body!==undefined){ opt.headers['Content-Type']='application/json'; opt.body=JSON.stringify(body); }
  const r=await fetch(path,opt);
  let data={};
  try{ data=await r.json(); }catch(e){}
  if(!r.ok) throw Object.assign(new Error(data.error||'falha'), {status:r.status, data});
  return data;
}

async function carregar(){
  try{
    const [st,cf]=await Promise.all([api('/api/state'), api('/api/config')]);
    S=st; C=cf;
  }catch(e){ console.error(e); }
  normalizar();
}
async function salvar(){
  try{ await api('/api/state','POST',S); }
  catch(e){
    if(e.status===401){ sair(true); return; }
    toast('Não salvou — o servidor está de pé?');
  }
}
async function salvarConfig(patch){
  try{ const r=await api('/api/config','POST',patch); C=r.config; }
  catch(e){ toast(e.message||'não deu para salvar as regras'); }
}
async function comBloqueio(fn){
  await carregar();
  const r=fn();
  await salvar();
  render();
  return r;
}

const CONFIG_PADRAO={ adminUser:'Casa', startBalance:500, betCost:20, bonusAmount:100,
  bonusCooldownMin:3, spinCooldownSec:45, defaultExpireMin:60,
  slot:{ seteTriplo:500, trio:150, par:40, nada:10 },
  betsLocked:false, chatOn:true, shopOn:true, announcement:'' };

function normalizar(){
  C=Object.assign({}, CONFIG_PADRAO, C||{});
  C.slot=Object.assign({}, CONFIG_PADRAO.slot, C.slot||{});
  if(!S||typeof S!=='object') S={};
  if(!S.users) S.users={};
  if(!Array.isArray(S.bets)) S.bets=[];
  if(!Array.isArray(S.chat)) S.chat=[];
  if(!S.shop||!Array.isArray(S.shop.items)) S.shop={items:[]};
  if(!Array.isArray(S.log)) S.log=[];
}

function conta(nome){
  if(!S.users[nome]) S.users[nome]={ balance:C.startBalance||500, lastBonus:0, lastSpin:0, inventory:[], equipped:{} };
  const u=S.users[nome];
  if(!Array.isArray(u.inventory)) u.inventory=[];
  if(!u.equipped||typeof u.equipped!=='object') u.equipped={};
  if(typeof u.balance!=='number') u.balance=C.startBalance||500;
  return u;
}
function ehCasa(nome){ return !!nome && nome===C.adminUser; }
function souCasa(){ return ehCasa(ME.name); }

function registrar(txt){
  S.log.push({ ts:Date.now(), who:ME.name, text:txt });
  if(S.log.length>80) S.log=S.log.slice(-80);
}
function avisoChat(txt){
  S.chat.push({ id:uid('m'), system:true, text:txt, ts:Date.now() });
  if(S.chat.length>200) S.chat=S.chat.slice(-200);
}

/* ------------------------------------------------ cosméticos */
function item(id){ return (S.shop.items||[]).find(i=> i.id===id)||null; }
function equipado(u, slot){
  const id=u&&u.equipped?u.equipped[slot]:null;
  if(!id) return null;
  const it=item(id);
  if(!it||!(u.inventory||[]).includes(id)) return null;
  return it;
}

function nome(n, opts){
  opts=opts||{};
  if(ehCasa(n)){
    return `<span class="pname house"><span class="pn">${esc(n)}</span><span class="badge-house">CASA</span></span>`;
  }
  const u=S.users[n];
  if(!u) return `<span class="pname"><span class="pn">${esc(n)}</span></span>`;
  conta(n);
  const cor=equipado(u,'cor'), tag=equipado(u,'tag'), bra=equipado(u,'brasao'), mol=equipado(u,'moldura');

  let cls='pn', style='';
  if(cor){
    const c1=corSegura(cor.data.color);
    if(cor.data.color2){ cls+=' grad'; style=`background-image:linear-gradient(95deg, ${c1}, ${corSegura(cor.data.color2)});`; }
    else style=`color:${c1};`;
  }
  let crest='';
  if(bra){
    const src=srcSeguro(bra.data.src);
    if(src) crest=`<img class="crest" src="${esc(src)}" alt="">`;
    else if(bra.data.emoji) crest=`<span class="crest-e">${esc(bra.data.emoji)}</span>`;
  }
  const et=tag?`<span class="ptag" style="background:${corSegura(tag.data.bg,'#a8112a')};color:${corSegura(tag.data.fg)}">${esc(tag.data.text||tag.nome)}</span>`:'';
  let wrap='pname', ws='';
  if(mol){
    wrap+=' mold-'+(['brilho','aura','pulso','caixa'].includes(mol.data.estilo)?mol.data.estilo:'brilho');
    ws=`--mold:${corSegura(mol.data.color,'#a8112a')};`;
  }
  return `<span class="${wrap}" style="${ws}">${crest}<span class="${cls}" style="${style}">${esc(n)}</span>${et}</span>`;
}

function efeitoChat(n){
  if(ehCasa(n)) return {cls:' house', style:''};
  const u=S.users[n];
  const fx=u?equipado(u,'efeito'):null;
  if(!fx) return {cls:'',style:''};
  const e=['destaque','ouro'].includes(fx.data.estilo)?fx.data.estilo:'destaque';
  return { cls:' fx-'+e, style:`--fx:${corSegura(fx.data.color,'#a8112a')};` };
}

function amostra(it){
  const antes=S.users;
  S.users=Object.assign({},antes,{ '__amostra__':{ inventory:[it.id], equipped:{ [TIPOS[it.tipo].slot]: it.id } } });
  const html=nome('__amostra__').replace('__amostra__','Seu nome');
  S.users=antes;
  return html;
}

/* ------------------------------------------------ render base */
function guardaInputs(){
  const m={};
  document.querySelectorAll('input[id],select[id],textarea[id]').forEach(el=>{
    if(el.type==='file') return;
    m[el.id]={ v:el.value, c:el.checked, foco:el===document.activeElement, s:el.selectionStart };
  });
  return m;
}
function devolveInputs(m){
  Object.keys(m).forEach(id=>{
    const el=$(id); if(!el||el.type==='file') return;
    if(el.type==='checkbox'||el.type==='radio'){ el.checked=m[id].c; if(m[id].foco) el.focus(); return; }
    if(el.tagName==='SELECT'){ if([...el.options].some(o=>o.value===m[id].v)) el.value=m[id].v; }
    else el.value=m[id].v;
    if(m[id].foco){ el.focus(); try{ el.setSelectionRange(m[id].s,m[id].s); }catch(e){} }
  });
}

function render(){
  const snap=guardaInputs();
  const log=$('chatLog');
  const embaixo=!log||(log.scrollHeight-log.scrollTop-log.clientHeight<45);

  if($('topbar')) $('topbar').innerHTML=topo();
  if($('announce')) $('announce').innerHTML=aviso();
  if($('ribbon')) $('ribbon').innerHTML=faixa();
  if($('page')) $('page').innerHTML=pagina();
  if($('rail')) $('rail').innerHTML=lateral();

  devolveInputs(snap);
  ligar();
  const l2=$('chatLog');
  if(l2&&embaixo) l2.scrollTop=l2.scrollHeight;
}

function topo(){
  const u=conta(ME.name);
  const link=(href,txt,extra)=> `<a href="${href}" class="${PAGE===extra?'on':''} ${extra==='admin'?'host':''}">${txt}</a>`;
  return `
    <div class="topbar-in">
      <div class="brand">
        <div class="lozenge"><span>♦</span></div>
        <div class="wordmark">O Salão<small>casa de apostas</small></div>
      </div>
      <nav class="nav">
        ${link('index.html','Mesa','mesa')}
        ${C.shopOn||souCasa()?link('loja.html','Loja','loja'):''}
        ${link('perfil.html','Perfil','perfil')}
        ${souCasa()?link('admin.html','Painel da casa','admin'):''}
      </nav>
      <div class="whoami">${nome(ME.name)}</div>
      ${souCasa()?'':`<div class="purse"><span class="coin"></span><span class="val mono">${fmt(u.balance)}</span></div>`}
    </div>`;
}
function aviso(){
  if(!C.announcement) return '';
  return `<div class="announce-in"><span class="tagword">AVISO DA CASA</span><span>${esc(C.announcement)}</span></div>`;
}
function faixa(){
  const f=S.bets.filter(b=>b.status==='fechada').slice(-10).reverse();
  if(!f.length) return '';
  const it=f.map(b=>`<span><b>${esc(b.title)}</b> — venceu “${esc(b.winner||'—')}”</span>`).join('');
  return `<div class="ribbon-in">${it+it}</div>`;
}

function pagina(){
  if(PAGE==='mesa') return pgMesa();
  if(PAGE==='loja') return pgLoja();
  if(PAGE==='perfil') return pgPerfil();
  if(PAGE==='admin') return souCasa()?pgAdmin():'<div class="empty">Esta página é só da casa.</div>';
  return '';
}

/* ------------------------------------------------ MESA */
function expirada(b){ return !!b.expiresAt && now>b.expiresAt; }
function podeApostar(b){ return b.status==='aberta' && !expirada(b); }

function pgMesa(){
  const u=conta(ME.name);
  const ordem=[...S.bets].sort((a,b)=>{
    if(!!b.pinned!==!!a.pinned) return b.pinned?1:-1;
    return b.createdAt-a.createdAt;
  });
  const trancada=C.betsLocked&&!souCasa();
  return `
    <div class="page-head">
      <div class="kicker">MESA PRINCIPAL</div>
      <h1>Apostas da noite</h1>
      <div class="sub">Abrir uma aposta custa ${fmt(C.betCost)} pontos, que vão para o caixa da casa. Quem abre define o prazo e decide o resultado no fim.</div>
    </div>

    ${trancada
      ? '<div class="empty">A mesa está trancada pela casa. Ninguém abre aposta nova até liberarem.</div>'
      : `<div class="panel">
          <h3>Abrir uma aposta</h3>
          <div class="field-row">
            <input type="text" id="betTitle" placeholder="O que vai acontecer? Ex: “Vai chover até sábado?”" />
          </div>
          <div class="field-row">
            <button class="btn ${newBetType==='fixa'?'btn-primary':'btn-outline'}" data-act="tipo" data-v="fixa">Opções fixas</button>
            <button class="btn ${newBetType==='aberta'?'btn-primary':'btn-outline'}" data-act="tipo" data-v="aberta">Palpite livre</button>
          </div>
          ${newBetType==='fixa'
            ? '<div class="field-row"><input type="text" id="betOptions" placeholder="Opções separadas por vírgula: Sim, Não" /></div>'
            : '<div class="legend" style="margin:0 0 11px;">Cada pessoa escreve o próprio palpite na hora de apostar.</div>'}
          <div class="field-row">
            <span class="lab">Prazo</span>
            <select id="betPrazo">
              <option value="15">15 minutos</option>
              <option value="60" ${(C.defaultExpireMin||60)==60?'selected':''}>1 hora</option>
              <option value="180">3 horas</option>
              <option value="720">12 horas</option>
              <option value="1440">24 horas</option>
              <option value="0">sem prazo</option>
            </select>
            <button class="btn btn-primary" data-act="criar-aposta">Abrir por ${fmt(C.betCost)} pts</button>
          </div>
          <div class="legend">Depois de aberta, você ainda pode acrescentar opções enquanto o prazo não estourar.</div>
        </div>`}

    <div class="bets">
      ${ordem.length?ordem.map(b=>cartaAposta(b,u)).join(''):'<div class="empty">Ninguém abriu aposta ainda. Comece a noite.</div>'}
    </div>`;
}

function cartaAposta(b,u){
  const pot=b.wagers.reduce((s,w)=>s+w.amount,0);
  const dono=b.creator===ME.name;
  const manda=dono||souCasa();
  const exp=expirada(b);
  const aberta=podeApostar(b);
  const minhas=b.wagers.filter(w=>w.user===ME.name);

  const opts=[...b.options];
  if(!opts.includes('Nenhuma das opções')) opts.push('Nenhuma das opções');
  const pools={}; opts.forEach(o=>pools[o]=0);
  b.wagers.forEach(w=> pools[w.option]=(pools[w.option]||0)+w.amount);

  const linhas=opts.map((o,i)=>{
    const vazia=o==='Nenhuma das opções';
    const venceu=b.status==='fechada'&&b.winner===o;
    const share=pot?Math.round((pools[o]/pot)*100):0;
    const aposta=aberta?`
      <input type="number" min="1" id="ap_${b.id}_${i}" placeholder="pts" />
      <button class="btn btn-outline btn-sm" data-act="apostar" data-bet="${b.id}" data-in="ap_${b.id}_${i}" data-opt="${esc(o)}">Apostar</button>`:'';
    return `<div class="opt ${venceu?'win':''}">
      <div class="opt-line">
        <div class="opt-name ${vazia?'void':''}">${esc(o)}</div>
        <div class="opt-num mono">${pools[o]?fmt(pools[o])+' pts · '+share+'%':'—'}</div>
        ${aposta}
      </div>
      <div class="track"><i style="width:${share}%"></i></div>
    </div>`;
  }).join('');

  const livre=(aberta&&b.type==='aberta')?`
    <div class="free-guess">
      <input type="text" id="pal_${b.id}" placeholder="Seu palpite" />
      <input type="number" min="1" style="width:92px" id="palv_${b.id}" placeholder="pts" />
      <button class="btn btn-outline btn-sm" data-act="apostar-livre" data-bet="${b.id}">Apostar</button>
    </div>`:'';

  const addOpt=(manda&&b.type==='fixa'&&b.status==='aberta')?`
    <div class="free-guess">
      <input type="text" id="novaOpt_${b.id}" placeholder="Acrescentar outra opção" />
      <button class="btn btn-outline btn-sm" data-act="add-opcao" data-bet="${b.id}">Acrescentar</button>
    </div>`:'';

  let barra='';
  if(manda&&b.status==='aberta'){
    barra=`<div class="owner-bar">
      <div class="who-can">${dono?'VOCÊ ABRIU ESTA APOSTA':'CONTROLE DA CASA'}</div>
      <select id="res_${b.id}">${opts.map(o=>`<option value="${esc(o)}">${esc(o)}</option>`).join('')}</select>
      <button class="btn btn-primary btn-sm" data-act="encerrar" data-bet="${b.id}">Encerrar e pagar</button>
      <button class="btn btn-outline btn-sm" data-act="cancelar" data-bet="${b.id}">Cancelar e devolver</button>
      ${souCasa()?`<button class="btn btn-outline btn-sm" data-act="fixar" data-bet="${b.id}">${b.pinned?'Desafixar':'Fixar'}</button>
      <button class="btn btn-outline btn-sm" data-act="renomear" data-bet="${b.id}">Renomear</button>
      <button class="btn btn-outline btn-sm" data-act="prazo" data-bet="${b.id}">Mudar prazo</button>`:''}
      <button class="btn btn-danger btn-sm" data-act="excluir-aposta" data-bet="${b.id}">Excluir</button>
    </div>`;
  } else if(manda){
    barra=`<div class="owner-bar">
      <div class="who-can">CONTROLE</div>
      ${souCasa()?`<button class="btn btn-outline btn-sm" data-act="reabrir" data-bet="${b.id}">Reabrir (estorna)</button>`:''}
      <button class="btn btn-danger btn-sm" data-act="excluir-aposta" data-bet="${b.id}">Excluir do histórico</button>
    </div>`;
  }

  const prazoFact=b.expiresAt
    ? (exp?`<span class="fact dead">prazo encerrado em ${dataHora(b.expiresAt)}</span>`
          :`<span class="fact clock ${(b.expiresAt-now)<600000?'urgent':''}">fecha em ${faltam(b.expiresAt-now)}</span>`)
    : '<span class="fact dead">sem prazo</span>';

  const selo=b.status==='fechada'?'fechada':(exp?'expirada':'aberta');
  const veredito=b.status==='fechada'?`<div class="verdict">${b.winner==='Nenhuma das opções'
    ? 'Ninguém acertou — o pote ficou com a casa.'
    : `“${esc(b.winner)}” venceu. O pote foi dividido entre quem apostou nela.`}</div>`:'';

  return `
    <article class="bet ${b.status==='fechada'?'fechada':''} ${exp&&b.status!=='fechada'?'expirada':''} ${b.pinned?'fixada':''}">
      <div class="bet-strip"></div>
      <div class="bet-body">
        <div class="bet-head">
          <div>
            <div class="bet-title">${esc(b.title)}</div>
            <div class="bet-facts">
              <span class="fact">aberta por ${nome(b.creator)}</span>
              <span class="fact">${b.type==='fixa'?'opções fixas':'palpite livre'}</span>
              <span class="fact">criada ${dataHora(b.createdAt)}</span>
              ${prazoFact}
            </div>
          </div>
          <span class="stamp ${selo}">${selo}</span>
        </div>
        <div class="pot"><span class="n mono">${fmt(pot)}</span><span class="l">PONTOS NO POTE</span></div>
        ${linhas}
        ${livre}
        ${addOpt}
        ${minhas.length?`<div class="mine">Você apostou ${minhas.map(w=>`<b>${fmt(w.amount)}</b> em “${esc(w.option)}”`).join(', ')}</div>`:''}
        ${veredito}
        ${barra}
      </div>
    </article>`;
}

/* ------------------------------------------------ LOJA */
function pgLoja(){
  const u=conta(ME.name);
  const itens=(S.shop.items||[]).filter(i=> souCasa()||i.ativo!==false);
  const alvo=shopFilter==='todos'?itens:itens.filter(i=>i.tipo===shopFilter);
  const porTipo={};
  alvo.forEach(i=>(porTipo[i.tipo]=porTipo[i.tipo]||[]).push(i));
  const prateleiras=Object.keys(TIPOS).filter(t=>porTipo[t]&&porTipo[t].length).map(t=>`
    <section class="shelf">
      <div class="shelf-name">${TIPOS[t].label.toUpperCase()}</div>
      <div class="goods">${porTipo[t].map(i=>vitrine(i,u)).join('')}</div>
    </section>`).join('');

  return `
    <div class="page-head">
      <div class="kicker">VITRINE</div>
      <h1>Loja do salão</h1>
      <div class="sub">Tudo aqui é aparência: cor do nome, tag, brasão, moldura e efeito no chat. Comprou, é seu para sempre — trocar depois não custa nada.</div>
    </div>
    <div class="chips">
      <button data-act="filtro" data-v="todos" class="${shopFilter==='todos'?'on':''}">Tudo</button>
      ${Object.keys(TIPOS).map(t=>`<button data-act="filtro" data-v="${t}" class="${shopFilter===t?'on':''}">${TIPOS[t].label}</button>`).join('')}
    </div>
    ${prateleiras||'<div class="empty">A casa ainda não colocou nada à venda.</div>'}`;
}

function vitrine(it,u){
  const tem=(u.inventory||[]).includes(it.id);
  const slot=TIPOS[it.tipo].slot;
  const usando=u.equipped&&u.equipped[slot]===it.id;
  let acao;
  if(tem) acao=`<button class="btn btn-outline btn-sm" data-act="usar" data-id="${it.id}">${usando?'Tirar':'Usar'}</button>`;
  else if(it.exclusivo) acao='<span class="owned-note">só a casa entrega</span>';
  else acao=`<button class="btn btn-primary btn-sm" data-act="comprar" data-id="${it.id}" ${u.balance<it.preco?'disabled':''}>Comprar</button>`;
  return `
    <div class="good ${tem?'has':''}">
      <div class="stage">${amostra(it)}</div>
      <div class="gname">${esc(it.nome)}</div>
      ${it.desc?`<div class="gdesc">${esc(it.desc)}</div>`:''}
      <div class="gfoot">
        <span class="cost mono">${it.exclusivo?'—':fmt(it.preco)+' pts'}</span>
        ${acao}
      </div>
    </div>`;
}

/* ------------------------------------------------ PERFIL */
function pgPerfil(){
  const u=conta(ME.name);
  const meus=(u.inventory||[]).map(item).filter(Boolean);
  const criadas=S.bets.filter(b=>b.creator===ME.name).length;
  const apostado=S.bets.reduce((s,b)=>s+b.wagers.filter(w=>w.user===ME.name).reduce((x,w)=>x+w.amount,0),0);

  const escolhas=Object.keys(TIPOS).map(t=>{
    const slot=TIPOS[t].slot;
    const lista=meus.filter(i=>i.tipo===t);
    return `<div class="field-row">
      <span class="lab" style="width:104px">${TIPOS[t].label}</span>
      <select id="slot_${slot}" data-act="trocar-slot" data-slot="${slot}">
        <option value="">— nada —</option>
        ${lista.map(i=>`<option value="${i.id}" ${u.equipped[slot]===i.id?'selected':''}>${esc(i.nome)}</option>`).join('')}
      </select>
      ${lista.length?'':'<span class="lab">nada seu ainda</span>'}
    </div>`;
  }).join('');

  return `
    <div class="page-head">
      <div class="kicker">SUA CONTA</div>
      <h1>${esc(ME.name)}</h1>
      <div class="sub">Saldo de <b class="mono">${fmt(u.balance)}</b> pontos · ${criadas} ${criadas===1?'aposta aberta':'apostas abertas'} por você · ${fmt(apostado)} pontos já apostados.</div>
    </div>

    <div class="panel">
      <h3>Como seu nome aparece</h3>
      <div class="stage" style="padding:22px;text-align:center;border:1px solid var(--line-soft);border-radius:var(--r-sm);background:#0b0709;font-size:19px;margin-bottom:16px;">${nome(ME.name)}</div>
      ${escolhas}
      <div class="legend">Isso vale no chat, no ranking e em todas as apostas. Trocar é de graça.</div>
    </div>

    <div class="grid-2">
      <div class="panel">
        <h3>Trocar senha</h3>
        <div class="field-row"><input type="password" id="pwOld" placeholder="senha atual" /></div>
        <div class="field-row"><input type="password" id="pwNew" placeholder="senha nova (mín. 3)" /></div>
        <button class="btn btn-primary" data-act="trocar-senha">Salvar senha</button>
      </div>
      <div class="panel">
        <h3>Sessão</h3>
        <div class="legend" style="margin-top:0">Sair encerra o acesso neste aparelho. Seu saldo e seus itens ficam guardados na conta.</div>
        <button class="btn btn-outline" style="margin-top:12px" data-act="sair">Sair da conta</button>
      </div>
    </div>`;
}

/* ------------------------------------------------ PAINEL DA CASA */
function pgAdmin(){
  const jog=Object.entries(S.users).sort((a,b)=>b[1].balance-a[1].balance);
  const itens=S.shop.items||[];
  const edit=editingItemId?item(editingItemId):null;
  const listaJog=Object.keys(S.users).map(n=>`<option value="${esc(n)}">`).join('');
  const listaItens=itens.map(i=>`<option value="${i.id}">${esc(i.nome)} (${TIPOS[i.tipo].label})</option>`).join('');

  return `
    <div class="page-head">
      <div class="kicker">SOMENTE A CASA</div>
      <h1>Painel da casa</h1>
      <div class="sub">${jog.length} contas na mesa. As regras abaixo ficam no arquivo <span class="mono">casino_config.json</span>, separado do jogo.</div>
    </div>

    <div class="panel">
      <h3>Regras da casa</h3>
      <div class="field-row">
        <span class="lab">Saldo inicial</span><input type="number" class="w-sm" id="cfgStart" value="${C.startBalance}" />
        <span class="lab">Custo para abrir aposta</span><input type="number" class="w-sm" id="cfgBet" value="${C.betCost}" />
        <span class="lab">Prazo padrão (min)</span><input type="number" class="w-sm" id="cfgExp" value="${C.defaultExpireMin}" />
      </div>
      <div class="field-row">
        <span class="lab">Pontos grátis</span><input type="number" class="w-sm" id="cfgBonus" value="${C.bonusAmount}" />
        <span class="lab">a cada (min)</span><input type="number" class="w-sm" id="cfgBonusCd" value="${C.bonusCooldownMin}" />
        <span class="lab">Giro a cada (s)</span><input type="number" class="w-sm" id="cfgSpinCd" value="${C.spinCooldownSec}" />
      </div>
      <div class="field-row">
        <span class="lab">Caça-níquel — três 7</span><input type="number" class="w-sm" id="slot7" value="${C.slot.seteTriplo}" />
        <span class="lab">trinca</span><input type="number" class="w-sm" id="slotTrio" value="${C.slot.trio}" />
        <span class="lab">par</span><input type="number" class="w-sm" id="slotPar" value="${C.slot.par}" />
        <span class="lab">nada</span><input type="number" class="w-sm" id="slotNada" value="${C.slot.nada}" />
      </div>
      <button class="btn btn-primary" data-act="salvar-regras">Salvar regras</button>
      <div class="legend">A conta da casa é <b>${esc(C.adminUser)}</b>: fica fora do ranking e aparece com nome dourado no chat. Para mudar qual conta manda, edite <span class="mono">adminUser</span> no arquivo e reinicie o servidor.</div>
    </div>

    <div class="panel">
      <h3>Mesa, chat e loja</h3>
      <div class="field-row">
        <button class="btn btn-outline" data-act="trancar">${C.betsLocked?'Destrancar mesa':'Trancar mesa'}</button>
        <button class="btn btn-outline" data-act="chat-onoff">${C.chatOn?'Fechar chat':'Abrir chat'}</button>
        <button class="btn btn-outline" data-act="loja-onoff">${C.shopOn?'Fechar loja':'Abrir loja'}</button>
      </div>
      <div class="field-row">
        <input type="text" id="aviso" placeholder="aviso fixo no topo (vazio = sem aviso)" value="${esc(C.announcement)}" />
        <button class="btn btn-brass" data-act="publicar-aviso">Publicar</button>
      </div>
      <div class="field-row">
        <button class="btn btn-danger" data-act="limpar-chat">Limpar chat</button>
        <button class="btn btn-danger" data-act="limpar-fechadas">Apagar apostas encerradas</button>
        <button class="btn btn-danger" data-act="cancelar-todas">Cancelar todas as abertas</button>
      </div>
    </div>

    <div class="panel">
      <h3>Pontos</h3>
      <div class="field-row">
        <input list="jogadores" type="text" id="alvoNome" placeholder="jogador" />
        <input type="number" class="w-sm" id="alvoPts" placeholder="pontos" />
        <button class="btn btn-primary" data-act="dar">Dar</button>
        <button class="btn btn-outline" data-act="tirar">Tirar</button>
        <button class="btn btn-outline" data-act="definir">Definir saldo</button>
      </div>
      <div class="field-row">
        <input type="number" class="w-sm" id="todosPts" placeholder="pontos" />
        <button class="btn btn-brass" data-act="dar-todos">Dar a todos</button>
        <button class="btn btn-outline" data-act="zerar-todos">Zerar todos para ${fmt(C.startBalance)}</button>
      </div>
      <datalist id="jogadores">${listaJog}</datalist>
    </div>

    <div class="panel">
      <h3>Contas</h3>
      <table class="tbl">
        <thead><tr><th>Jogador</th><th style="text-align:right">Saldo</th><th></th></tr></thead>
        <tbody>
        ${jog.map(([n,u])=>`
          <tr>
            <td>${nome(n)}${u.muted?'<span class="flagchip warn">mudo</span>':''}${u.banned?'<span class="flagchip warn">barrado</span>':''}${ehCasa(n)?'<span class="flagchip">casa</span>':''}</td>
            <td class="money mono">${fmt(u.balance)}</td>
            <td><div class="acts">
              <button class="btn-tiny" data-act="mais100" data-n="${esc(n)}">+100</button>
              <button class="btn-tiny" data-act="menos100" data-n="${esc(n)}">-100</button>
              <button class="btn-tiny" data-act="mudo" data-n="${esc(n)}">${u.muted?'Falar':'Calar'}</button>
              <button class="btn-tiny" data-act="barrar" data-n="${esc(n)}">${u.banned?'Liberar':'Barrar'}</button>
              <button class="btn-tiny" data-act="senha-de" data-n="${esc(n)}">Nova senha</button>
              <button class="btn-tiny" data-act="excluir-conta" data-n="${esc(n)}">Excluir</button>
            </div></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="panel">
      <h3>${edit?'Editar item':'Criar item da loja'}</h3>
      <div class="field-row">
        ${Object.keys(TIPOS).map(t=>`<button class="btn ${newItemType===t?'btn-primary':'btn-outline'}" data-act="tipo-item" data-v="${t}">${TIPOS[t].label}</button>`).join('')}
      </div>
      <div class="field-row">
        <input type="text" id="itNome" placeholder="nome do item (ex: Coroa de Ouro)" />
        <input type="number" class="w-sm" id="itPreco" placeholder="preço" />
      </div>
      <div class="field-row">
        <input type="text" id="itDesc" placeholder="descrição curta (opcional)" />
        <label class="inline"><input type="checkbox" id="itExcl"> só a casa entrega</label>
      </div>
      ${camposItem()}
      <div class="field-row">
        <button class="btn btn-primary" data-act="${edit?'salvar-item':'criar-item'}">${edit?'Salvar alterações':'Colocar na loja'}</button>
        ${edit?'<button class="btn btn-outline" data-act="cancelar-edicao">Cancelar</button>':''}
        <button class="btn btn-outline" data-act="pacote">Carregar pacote inicial</button>
      </div>
    </div>

    <div class="panel">
      <h3>Itens na loja (${itens.length})</h3>
      ${itens.length?itens.map(i=>`
        <div class="itemrow">
          <div>${amostra(i)}</div>
          <div class="grow">
            <div>${esc(i.nome)} ${i.ativo===false?'<span class="flagchip">desligado</span>':''} ${i.exclusivo?'<span class="flagchip warn">só casa</span>':''}</div>
            <div class="sub">${TIPOS[i.tipo].label} · ${fmt(i.preco)} pts · ${donos(i.id)} com o item</div>
          </div>
          <input type="number" id="pr_${i.id}" value="${i.preco}" />
          <button class="btn-tiny" data-act="preco" data-id="${i.id}">Preço</button>
          <button class="btn-tiny" data-act="onoff-item" data-id="${i.id}">${i.ativo===false?'Ligar':'Desligar'}</button>
          <button class="btn-tiny" data-act="editar-item" data-id="${i.id}">Editar</button>
          <button class="btn-tiny" data-act="excluir-item" data-id="${i.id}">Excluir</button>
        </div>`).join(''):'<div class="legend">Nenhum item cadastrado.</div>'}
    </div>

    <div class="panel">
      <h3>Entregar item</h3>
      <div class="field-row">
        <input list="jogadores" type="text" id="daNome" placeholder="jogador" />
        <select id="daItem"><option value="">escolha um item</option>${listaItens}</select>
        <button class="btn btn-primary" data-act="entregar">Entregar</button>
        <button class="btn btn-outline" data-act="tomar">Tomar de volta</button>
      </div>
      <div class="legend">Entrega de graça, sem descontar pontos — serve de prêmio ou brinde.</div>
    </div>

    <div class="panel">
      <h3>Últimas ações da casa</h3>
      ${(S.log||[]).slice(-14).reverse().map(l=>`<div class="logrow"><span class="mono">${hora(l.ts)}</span> <b>${esc(l.who)}</b> ${esc(l.text)}</div>`).join('')||'<div class="legend">Nada por aqui ainda.</div>'}
    </div>`;
}

function donos(id){ return Object.values(S.users).filter(u=>(u.inventory||[]).includes(id)).length; }

function camposItem(){
  const ed=editingItemId?item(editingItemId):null;
  const d=(ed&&ed.tipo===newItemType)?ed.data:{};
  if(newItemType==='cor') return `<div class="field-row">
    <span class="lab">Cor</span><input type="color" id="itCor" value="${corSegura(d.color,'#a8112a')}" />
    <span class="lab">Degradê até</span><input type="color" id="itCor2" value="${corSegura(d.color2,'#c9a227')}" />
    <label class="inline"><input type="checkbox" id="itGrad" ${d.color2?'checked':''}> usar degradê</label>
  </div>`;
  if(newItemType==='tag') return `<div class="field-row">
    <input type="text" id="itTag" maxlength="18" placeholder="texto da tag (ex: TUBARÃO)" value="${esc(d.text||'')}" />
    <span class="lab">Fundo</span><input type="color" id="itTagBg" value="${corSegura(d.bg,'#a8112a')}" />
    <span class="lab">Letra</span><input type="color" id="itTagFg" value="${corSegura(d.fg,'#f2ece3')}" />
  </div>`;
  if(newItemType==='brasao'){
    const img=pendingImg||srcSeguro(d.src);
    return `
    <div class="field-row"><input type="text" id="itEmoji" maxlength="4" placeholder="emoji (ex: 👑) — ou envie uma imagem" value="${esc(d.emoji||'')}" /></div>
    <div class="field-row">
      <input type="file" id="itFile" accept="image/*" />
      ${img?`<img class="thumb" src="${esc(img)}" alt="">`:'<span class="lab">nenhuma imagem escolhida</span>'}
      ${img?'<button class="btn btn-outline btn-sm" data-act="tirar-img">Tirar imagem</button>':''}
    </div>
    <div class="field-row"><input type="text" id="itUrl" placeholder="ou cole o endereço de uma imagem (https://...)" value="${(d.src&&!String(d.src).startsWith('data:'))?esc(d.src):''}" /></div>
    <div class="legend">A imagem vira 96px e fica guardada dentro do jogo, então funciona sem internet. PNG com fundo transparente fica melhor.</div>`;
  }
  if(newItemType==='moldura') return `<div class="field-row">
    <select id="itMold">${[['brilho','Brilho suave'],['aura','Aura forte'],['pulso','Pulso piscante'],['caixa','Caixa em volta']].map(([v,l])=>`<option value="${v}" ${d.estilo===v?'selected':''}>${l}</option>`).join('')}</select>
    <span class="lab">Cor</span><input type="color" id="itMoldCor" value="${corSegura(d.color,'#c9a227')}" />
  </div>`;
  return `<div class="field-row">
    <select id="itFx">${[['destaque','Barra colorida na mensagem'],['ouro','Mensagem com fundo brilhante']].map(([v,l])=>`<option value="${v}" ${d.estilo===v?'selected':''}>${l}</option>`).join('')}</select>
    <span class="lab">Cor</span><input type="color" id="itFxCor" value="${corSegura(d.color,'#a8112a')}" />
  </div>`;
}

/* ------------------------------------------------ coluna lateral */
function lateral(){
  const u=conta(ME.name);
  const bonusCd=(C.bonusCooldownMin||0)*60000;
  const spinCd=(C.spinCooldownSec||0)*1000;
  const bOk=now-(u.lastBonus||0)>=bonusCd;
  const sOk=now-(u.lastSpin||0)>=spinCd;

  const rank=Object.entries(S.users)
    .filter(([n,x])=>!x.banned&&!ehCasa(n))
    .sort((a,b)=>b[1].balance-a[1].balance).slice(0,8);

  return `
    <div class="panel tight">
      <h3>Chat <span class="lab" style="font-size:11px;color:var(--muted)">${C.chatOn?'aberto':'fechado'}</span></h3>
      <div class="chat-log" id="chatLog">
        ${(S.chat||[]).length?(S.chat||[]).map(msgHTML).join(''):'<div class="msg sys">Ninguém falou nada ainda.</div>'}
      </div>
      <div class="chat-send">
        <input type="text" id="chatInput" maxlength="240" ${(u.muted||!C.chatOn)?'disabled':''}
          placeholder="${u.muted?'você está calado pela casa':(C.chatOn?'Escreva algo...':'chat fechado')}" />
        <button class="btn btn-primary btn-sm" data-act="falar" ${(u.muted||!C.chatOn)?'disabled':''}>Enviar</button>
      </div>
    </div>

    ${souCasa()?'':`
    <div class="panel tight">
      <h3>Pontos grátis</h3>
      <div class="reward">
        <span class="txt">${fmt(C.bonusAmount)} pontos a cada ${C.bonusCooldownMin} min</span>
        <button class="btn ${bOk?'btn-brass':'btn-outline'} btn-sm" data-act="bonus" ${bOk?'':'disabled'}>${bOk?'Pegar':relogio(bonusCd-(now-(u.lastBonus||0)))}</button>
      </div>
      <div class="slot" id="reels"><div class="reel">🎲</div><div class="reel">🎲</div><div class="reel">🎲</div></div>
      <div class="slot-msg" id="slotMsg"></div>
      <button class="btn ${sOk?'btn-primary':'btn-outline'} btn-sm" style="width:100%;margin-top:8px" data-act="girar" ${sOk&&!spinning?'':'disabled'}>
        ${spinning?'girando…':(sOk?'Girar o caça-níquel':relogio(spinCd-(now-(u.lastSpin||0))))}
      </button>
    </div>`}

    <div class="panel tight">
      <h3>Ranking</h3>
      <div class="ranks">
        ${rank.map(([n,x],i)=>`
          <div class="rank ${i===0?'top':''} ${n===ME.name?'self':''}">
            <div class="pos mono">${i+1}</div>
            <div class="n">${nome(n)}</div>
            <div class="v mono">${fmt(x.balance)}</div>
          </div>`).join('')||'<div class="legend">Ninguém no placar ainda.</div>'}
      </div>
      ${souCasa()?'<div class="legend">A casa não entra no placar.</div>':''}
    </div>`;
}

function msgHTML(m){
  if(m.system) return `<div class="msg sys">${esc(m.text)}</div>`;
  const fx=efeitoChat(m.user);
  const podeApagar=souCasa()||m.user===ME.name;
  const x=podeApagar?`<button class="kill" data-act="apagar-msg" data-id="${esc(m.id||'')}" data-ts="${m.ts}" title="Apagar">✕</button>`:'';
  return `<div class="msg${fx.cls}" style="${fx.style}">
    <span class="when mono">${hora(m.ts)}</span>${x}${nome(m.user)}
    <span class="said">${esc(m.text)}</span></div>`;
}

/* ------------------------------------------------ ações */
async function criarAposta(){
  const title=val('betTitle');
  if(!title){ toast('Dê um título para a aposta'); return; }
  let options=[];
  if(newBetType==='fixa'){
    options=val('betOptions').split(',').map(s=>s.trim()).filter(Boolean);
    if(!options.length){ toast('Escreva ao menos uma opção'); return; }
  }
  const mins=parseInt(val('betPrazo')||'0',10);
  let erro='';
  await comBloqueio(()=>{
    const u=conta(ME.name);
    if(C.betsLocked&&!souCasa()){ erro='A mesa está trancada'; return; }
    if(u.balance<C.betCost){ erro=`Abrir uma aposta custa ${fmt(C.betCost)} pontos`; return; }
    u.balance-=C.betCost;
    S.bets.push({
      id:uid('b'), title, type:newBetType, options, creator:ME.name,
      status:'aberta', wagers:[], winner:null, pinned:false,
      createdAt:Date.now(), expiresAt: mins>0?Date.now()+mins*60000:null,
      cost:C.betCost
    });
  });
  if(erro){ toast(erro); return; }
  const t=$('betTitle'); if(t) t.value='';
  const o=$('betOptions'); if(o) o.value='';
  toast(`Aposta aberta — ${fmt(C.betCost)} pts para a casa`);
  render();
}

async function apostar(betId, opcao, valor, livre){
  let msg='';
  await comBloqueio(()=>{
    const b=S.bets.find(x=>x.id===betId);
    const u=conta(ME.name);
    if(!b||b.status!=='aberta'){ msg='Essa aposta já foi encerrada'; return; }
    if(expirada(b)){ msg='O prazo dessa aposta acabou'; return; }
    if(valor>u.balance){ msg='Você não tem pontos suficientes'; return; }
    u.balance-=valor;
    let alvo=opcao;
    if(livre){
      const existe=b.options.find(o=>o.toLowerCase()===opcao.toLowerCase());
      if(existe) alvo=existe; else b.options.push(opcao);
    }
    b.wagers.push({ user:ME.name, option:alvo, amount:valor, ts:Date.now() });
    msg=`Apostou ${fmt(valor)} pontos`;
  });
  toast(msg);
}

async function encerrar(betId, vencedora){
  await comBloqueio(()=>{
    const b=S.bets.find(x=>x.id===betId);
    if(!b||b.status!=='aberta') return;
    b.status='fechada';
    const pot=b.wagers.reduce((s,w)=>s+w.amount,0);
    const ganhos=b.wagers.filter(w=>w.option===vencedora);
    const base=ganhos.reduce((s,w)=>s+w.amount,0);
    b.payouts={};
    if(base>0){
      ganhos.forEach(w=>{
        const pago=w.amount+(w.amount/base)*(pot-base);
        conta(w.user).balance+=pago;
        b.payouts[w.user]=(b.payouts[w.user]||0)+pago;
      });
      b.winner=vencedora;
    } else b.winner='Nenhuma das opções';
  });
  toast('Aposta encerrada e paga');
}

async function cancelarAposta(betId, apagar){
  await comBloqueio(()=>{
    const b=S.bets.find(x=>x.id===betId);
    if(!b) return;
    if(b.status==='aberta') b.wagers.forEach(w=> conta(w.user).balance+=w.amount);
    S.bets=S.bets.filter(x=>x.id!==betId);
    if(souCasa()) registrar(`${apagar?'excluiu':'cancelou'} a aposta “${b.title}”`);
  });
  toast(apagar?'Aposta excluída':'Aposta cancelada, pontos devolvidos');
}

async function girar(){
  const u=conta(ME.name);
  if(spinning||Date.now()-(u.lastSpin||0)<(C.spinCooldownSec||0)*1000) return;
  spinning=true; render();
  const reels=document.querySelectorAll('#reels .reel');
  reels.forEach(r=>r.classList.add('rolling'));
  const t=setInterval(()=> reels.forEach(r=> r.textContent=pick(SYMBOLS)), 85);
  await new Promise(r=>setTimeout(r,1200));
  clearInterval(t);
  reels.forEach(r=>r.classList.remove('rolling'));
  const f=[pick(SYMBOLS),pick(SYMBOLS),pick(SYMBOLS)];
  reels.forEach((r,i)=> r.textContent=f[i]);

  let ganho;
  if(f[0]===f[1]&&f[1]===f[2]) ganho=(f[0]==='7️⃣')?C.slot.seteTriplo:C.slot.trio;
  else if(f[0]===f[1]||f[1]===f[2]||f[0]===f[2]) ganho=C.slot.par;
  else ganho=C.slot.nada;

  const m=$('slotMsg'); if(m) m.textContent=`+${fmt(ganho)} pontos`;
  await comBloqueio(()=>{
    const x=conta(ME.name);
    x.balance+=ganho; x.lastSpin=Date.now();
  });
  spinning=false; render();
  toast(ganho>=C.slot.trio?`Trinca! +${fmt(ganho)} pontos`:`+${fmt(ganho)} pontos`);
}

async function comprar(id){
  let msg='';
  await comBloqueio(()=>{
    const it=item(id), u=conta(ME.name);
    if(!it||it.ativo===false){ msg='Esse item saiu da loja'; return; }
    if(it.exclusivo){ msg='Esse item só a casa entrega'; return; }
    if(u.inventory.includes(id)){ msg='Você já tem esse item'; return; }
    if(u.balance<it.preco){ msg='Pontos insuficientes'; return; }
    u.balance-=it.preco;
    u.inventory.push(id);
    u.equipped[TIPOS[it.tipo].slot]=id;
    msg=`${it.nome} já está no seu nome`;
  });
  toast(msg);
}

function pacoteInicial(){
  const seed=[
    ['cor','Vermelho da casa',300,'A cor do salão.',{color:'#a8112a',color2:''}],
    ['cor','Osso',150,'Discreto e limpo.',{color:'#f2ece3',color2:''}],
    ['cor','Latão',900,'Para quem já ganhou alguma.',{color:'#c9a227',color2:''}],
    ['cor','Azul gelo',500,'Sangue frio na mesa.',{color:'#4db8ff',color2:''}],
    ['cor','Verde feltro',500,'Cor de quem só pensa no pote.',{color:'#2f7d5c',color2:''}],
    ['cor','Roxo da sorte',700,'Dizem que atrai trinca.',{color:'#a259ff',color2:''}],
    ['cor','Degradê brasa',1600,'Do laranja ao vermelho.',{color:'#ff8a00',color2:'#a8112a'}],
    ['cor','Degradê neon',1600,'Verde-água virando azul.',{color:'#00ffc8',color2:'#4d7cff'}],
    ['tag','Novato',100,'Acabou de sentar.',{text:'NOVATO',bg:'#2a1a20',fg:'#b6a5aa'}],
    ['tag','Apostador',400,'Já sabe o que faz.',{text:'APOSTADOR',bg:'#a8112a',fg:'#ffffff'}],
    ['tag','Tubarão',900,'Cuidado com esse.',{text:'TUBARÃO',bg:'#0e3b5c',fg:'#9fdcff'}],
    ['tag','Sortudo',600,'Ganha sem entender como.',{text:'SORTUDO',bg:'#1e4d3b',fg:'#b7ffdc'}],
    ['tag','Quebrado',50,'Honestidade acima de tudo.',{text:'QUEBRADO',bg:'#1a1015',fg:'#7d6b72'}],
    ['tag','VIP',1300,'Tratamento de camarote.',{text:'VIP',bg:'#c9a227',fg:'#1b1206'}],
    ['tag','Lenda',3000,'Só para quem ficou na história.',{text:'LENDA',bg:'#e0263f',fg:'#ffffff'}],
    ['brasao','Coroa',1000,'Dono da mesa.',{emoji:'👑',src:''}],
    ['brasao','Dragão',900,'Aposta alto.',{emoji:'🐉',src:''}],
    ['brasao','Coringa',700,'Nunca se sabe.',{emoji:'🃏',src:''}],
    ['brasao','Caveira',500,'Perdeu tudo e voltou.',{emoji:'💀',src:''}],
    ['brasao','Dado',300,'O básico bem feito.',{emoji:'🎲',src:''}],
    ['brasao','Chama',400,'Tá pegando fogo.',{emoji:'🔥',src:''}],
    ['brasao','Tubarão',800,'Come os pequenos.',{emoji:'🦈',src:''}],
    ['brasao','Raio',400,'Aposta rápido demais.',{emoji:'⚡',src:''}],
    ['moldura','Brilho discreto',600,'Um brilho leve no nome.',{estilo:'brilho',color:'#a8112a'}],
    ['moldura','Aura dourada',1400,'Ninguém ignora.',{estilo:'aura',color:'#c9a227'}],
    ['moldura','Pulso neon',1200,'O nome pisca devagar.',{estilo:'pulso',color:'#00ffc8'}],
    ['moldura','Moldura da casa',800,'Nome dentro de um quadro.',{estilo:'caixa',color:'#a8112a'}],
    ['efeito','Fala marcada',500,'Barra colorida nas suas falas.',{estilo:'destaque',color:'#a8112a'}],
    ['efeito','Fala dourada',1500,'Suas falas brilham no chat.',{estilo:'ouro',color:'#c9a227'}]
  ];
  let n=0;
  seed.forEach(([tipo,nm,preco,desc,data])=>{
    if((S.shop.items||[]).some(i=>i.nome===nm&&i.tipo===tipo)) return;
    S.shop.items.push({ id:uid('i'), tipo, nome:nm, preco, desc, data, ativo:true, exclusivo:false, createdAt:Date.now()+n });
    n++;
  });
  return n;
}

function dadosItem(){
  if(newItemType==='cor') return { color:val('itCor')||'#a8112a', color2: chk('itGrad')?(val('itCor2')||''):'' };
  if(newItemType==='tag'){
    const t=val('itTag'); if(!t) return null;
    return { text:t, bg:val('itTagBg')||'#a8112a', fg:val('itTagFg')||'#f2ece3' };
  }
  if(newItemType==='brasao'){
    const url=srcSeguro(val('itUrl')), emoji=val('itEmoji');
    const src=pendingImg||url;
    if(!src&&!emoji) return null;
    return { src, emoji: src?'':emoji };
  }
  if(newItemType==='moldura') return { estilo:val('itMold')||'brilho', color:val('itMoldCor')||'#c9a227' };
  return { estilo:val('itFx')||'destaque', color:val('itFxCor')||'#a8112a' };
}

function lerImagem(file){
  if(!file) return;
  if(file.size>4*1024*1024){ toast('Imagem muito grande (máx 4 MB)'); return; }
  const fr=new FileReader();
  fr.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      const max=96, k=Math.min(max/img.width,max/img.height,1);
      const cv=document.createElement('canvas');
      cv.width=Math.max(1,Math.round(img.width*k));
      cv.height=Math.max(1,Math.round(img.height*k));
      cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
      try{ pendingImg=cv.toDataURL('image/png'); }catch(e){ pendingImg=String(fr.result); }
      render();
      toast('Imagem pronta');
    };
    img.onerror=()=>toast('Não consegui ler essa imagem');
    img.src=String(fr.result);
  };
  fr.readAsDataURL(file);
}

/* ------------------------------------------------ eventos */
function ligar(){
  const ci=$('chatInput');
  if(ci){
    ci.oninput=e=>{ chatDraft=e.target.value; };
    ci.onkeydown=e=>{ if(e.key==='Enter') falar(); };
  }
  const f=$('itFile');
  if(f) f.onchange=e=> lerImagem(e.target.files[0]);
  document.querySelectorAll('select[data-act="trocar-slot"]').forEach(sel=>{
    sel.onchange=async ()=>{
      const slot=sel.dataset.slot, id=sel.value;
      await comBloqueio(()=>{
        const u=conta(ME.name);
        if(id&&!u.inventory.includes(id)) return;
        u.equipped[slot]=id||null;
      });
    };
  });
}

async function falar(){
  const txt=(chatDraft||'').trim();
  if(!txt) return;
  chatDraft='';
  const i=$('chatInput'); if(i) i.value='';
  await comBloqueio(()=>{
    const u=conta(ME.name);
    if(u.muted||!C.chatOn) return;
    S.chat.push({ id:uid('m'), user:ME.name, text:txt, ts:Date.now() });
    if(S.chat.length>200) S.chat=S.chat.slice(-200);
  });
}

document.addEventListener('click', async (e)=>{
  const b=e.target.closest('[data-act]');
  if(!b) return;
  const act=b.dataset.act, id=b.dataset.id, n=b.dataset.n, bet=b.dataset.bet;

  switch(act){
    case 'tipo': newBetType=b.dataset.v; render(); return;
    case 'filtro': shopFilter=b.dataset.v; render(); return;
    case 'criar-aposta': await criarAposta(); return;
    case 'falar': await falar(); return;
    case 'comprar': await comprar(id); return;
    case 'usar':
      await comBloqueio(()=>{
        const it=item(id), u=conta(ME.name);
        if(!it||!u.inventory.includes(id)) return;
        const s=TIPOS[it.tipo].slot;
        u.equipped[s]=(u.equipped[s]===id)?null:id;
      });
      return;
    case 'apostar': {
      const el=$(b.dataset.in);
      const v=parseInt(el?el.value:'',10);
      if(!v||v<=0){ toast('Digite um valor válido'); return; }
      await apostar(bet,b.dataset.opt,v,false);
      return;
    }
    case 'apostar-livre': {
      const p=val('pal_'+bet), v=num('palv_'+bet);
      if(!p){ toast('Escreva seu palpite'); return; }
      if(!v||v<=0){ toast('Digite um valor válido'); return; }
      await apostar(bet,p,v,true);
      return;
    }
    case 'add-opcao': {
      const nova=val('novaOpt_'+bet);
      if(!nova){ toast('Escreva a opção'); return; }
      await comBloqueio(()=>{
        const x=S.bets.find(y=>y.id===bet);
        if(!x||x.status!=='aberta') return;
        if(x.options.some(o=>o.toLowerCase()===nova.toLowerCase())) return;
        x.options.push(nova);
      });
      toast('Opção acrescentada');
      return;
    }
    case 'encerrar': {
      const sel=$('res_'+bet); if(!sel) return;
      if(!confirm(`Encerrar com “${sel.value}” como resultado certo?`)) return;
      await encerrar(bet,sel.value);
      return;
    }
    case 'cancelar':
      if(!confirm('Cancelar e devolver os pontos de todo mundo?')) return;
      await cancelarAposta(bet,false);
      return;
    case 'excluir-aposta':
      if(!confirm('Excluir esta aposta? Quem apostou recebe os pontos de volta.')) return;
      await cancelarAposta(bet,true);
      return;
    case 'bonus': {
      let ok=false;
      await comBloqueio(()=>{
        const u=conta(ME.name);
        if(Date.now()-(u.lastBonus||0)<(C.bonusCooldownMin||0)*60000) return;
        u.balance+=C.bonusAmount; u.lastBonus=Date.now(); ok=true;
      });
      if(ok) toast(`+${fmt(C.bonusAmount)} pontos da casa`);
      return;
    }
    case 'girar': await girar(); return;
    case 'apagar-msg': {
      const ts=parseInt(b.dataset.ts,10);
      await comBloqueio(()=>{
        const alvo=S.chat.find(m=> m.id?m.id===id:m.ts===ts);
        if(!alvo) return;
        if(!souCasa()&&alvo.user!==ME.name) return;
        S.chat=S.chat.filter(m=> m!==alvo);
      });
      return;
    }
    case 'trocar-senha': {
      const o=val('pwOld'), nw=val('pwNew');
      try{
        await api('/api/password','POST',{ old:o, new:nw });
        toast('Senha trocada');
        ['pwOld','pwNew'].forEach(i=>{ const el=$(i); if(el) el.value=''; });
      }catch(err){ toast(err.message); }
      return;
    }
    case 'sair': await sair(); return;
  }

  if(!souCasa()) return;

  switch(act){
    case 'dar': case 'tirar': case 'definir': {
      const quem=val('alvoNome'), v=num('alvoPts');
      if(!quem||v===null){ toast('Preencha jogador e valor'); return; }
      await comBloqueio(()=>{
        const u=conta(quem);
        if(act==='dar') u.balance+=v;
        else if(act==='tirar') u.balance=Math.max(0,u.balance-v);
        else u.balance=Math.max(0,v);
        registrar(`${act==='dar'?'deu':act==='tirar'?'tirou':'definiu'} ${fmt(v)} pts — ${quem}`);
      });
      toast('Saldo atualizado');
      return;
    }
    case 'mais100': case 'menos100':
      await comBloqueio(()=>{
        const u=conta(n);
        u.balance=act==='mais100'?u.balance+100:Math.max(0,u.balance-100);
        registrar(`${act==='mais100'?'+100':'-100'} pts — ${n}`);
      });
      return;
    case 'dar-todos': {
      const v=num('todosPts');
      if(!v){ toast('Diga quantos pontos'); return; }
      await comBloqueio(()=>{
        Object.keys(S.users).forEach(x=>{ if(!ehCasa(x)) conta(x).balance+=v; });
        registrar(`deu ${fmt(v)} pts para todos`);
        avisoChat(`A casa distribuiu ${fmt(v)} pontos para todo mundo.`);
      });
      toast('Todo mundo recebeu');
      return;
    }
    case 'zerar-todos':
      if(!confirm('Zerar o saldo de todos para o valor inicial?')) return;
      await comBloqueio(()=>{
        Object.keys(S.users).forEach(x=> conta(x).balance=C.startBalance);
        registrar('zerou os saldos');
        avisoChat('A casa zerou os saldos.');
      });
      return;
    case 'mudo':
      await comBloqueio(()=>{ const u=conta(n); u.muted=!u.muted; registrar(`${u.muted?'calou':'liberou'} ${n}`); });
      return;
    case 'barrar':
      await comBloqueio(()=>{ const u=conta(n); u.banned=!u.banned; registrar(`${u.banned?'barrou':'liberou'} ${n}`); });
      return;
    case 'senha-de': {
      const nova=prompt(`Nova senha para ${n}:`);
      if(!nova) return;
      try{ await api('/api/password','POST',{ name:n, new:nova }); toast('Senha trocada — avise a pessoa'); }
      catch(err){ toast(err.message); }
      return;
    }
    case 'excluir-conta':
      if(!confirm(`Excluir ${n}? Saldo e itens somem (a senha continua no arquivo).`)) return;
      await comBloqueio(()=>{ delete S.users[n]; registrar(`excluiu a conta ${n}`); });
      return;
    case 'fixar':
      await comBloqueio(()=>{ const x=S.bets.find(y=>y.id===bet); if(x) x.pinned=!x.pinned; });
      return;
    case 'renomear': {
      const x=S.bets.find(y=>y.id===bet); if(!x) return;
      const t=prompt('Novo título:',x.title);
      if(!t||!t.trim()) return;
      await comBloqueio(()=>{ const y=S.bets.find(z=>z.id===bet); if(y){ y.title=t.trim(); registrar('renomeou uma aposta'); } });
      return;
    }
    case 'prazo': {
      const m=prompt('Novo prazo em minutos a partir de agora (0 = sem prazo):','60');
      if(m===null) return;
      const mm=parseInt(m,10);
      if(isNaN(mm)) return;
      await comBloqueio(()=>{
        const y=S.bets.find(z=>z.id===bet);
        if(y){ y.expiresAt=mm>0?Date.now()+mm*60000:null; registrar('mudou o prazo de uma aposta'); }
      });
      return;
    }
    case 'reabrir':
      if(!confirm('Reabrir? Quem recebeu tem o pagamento estornado.')) return;
      await comBloqueio(()=>{
        const y=S.bets.find(z=>z.id===bet);
        if(!y||y.status!=='fechada') return;
        Object.entries(y.payouts||{}).forEach(([p,v])=> conta(p).balance-=v);
        y.payouts={}; y.winner=null; y.status='aberta';
        registrar(`reabriu “${y.title}”`);
      });
      return;
    case 'tipo-item': newItemType=b.dataset.v; pendingImg=''; render(); return;
    case 'tirar-img': pendingImg=''; render(); return;
    case 'criar-item': case 'salvar-item': {
      const nm=val('itNome'), preco=num('itPreco'), data=dadosItem();
      if(!nm){ toast('Dê um nome ao item'); return; }
      if(preco===null||preco<0){ toast('Defina um preço (0 = grátis)'); return; }
      if(!data){ toast(newItemType==='brasao'?'Escolha um emoji ou uma imagem':'Escreva o texto da tag'); return; }
      const excl=chk('itExcl'), desc=val('itDesc');
      if(act==='criar-item'){
        await comBloqueio(()=>{
          S.shop.items.push({ id:uid('i'), tipo:newItemType, nome:nm, preco, desc, data, ativo:true, exclusivo:excl, createdAt:Date.now() });
          registrar(`criou o item “${nm}”`);
        });
        toast(`${nm} está na loja`);
      } else {
        const eid=editingItemId;
        await comBloqueio(()=>{
          const it=item(eid); if(!it) return;
          Object.assign(it,{ tipo:newItemType, nome:nm, preco, desc, data, exclusivo:excl });
          registrar(`editou o item “${nm}”`);
        });
        editingItemId=null;
        toast('Item atualizado');
      }
      pendingImg='';
      ['itNome','itPreco','itDesc','itTag','itEmoji','itUrl'].forEach(i=>{ const el=$(i); if(el) el.value=''; });
      render();
      return;
    }
    case 'editar-item': {
      const it=item(id); if(!it) return;
      editingItemId=id; newItemType=it.tipo;
      pendingImg=(it.data.src&&String(it.data.src).startsWith('data:'))?it.data.src:'';
      render();
      const a=$('itNome'); if(a) a.value=it.nome;
      const p=$('itPreco'); if(p) p.value=it.preco;
      const d=$('itDesc'); if(d) d.value=it.desc||'';
      const x=$('itExcl'); if(x) x.checked=!!it.exclusivo;
      toast('Editando — altere e salve');
      return;
    }
    case 'cancelar-edicao': editingItemId=null; pendingImg=''; render(); return;
    case 'preco': {
      const p=num('pr_'+id);
      if(p===null||p<0){ toast('Preço inválido'); return; }
      await comBloqueio(()=>{ const it=item(id); if(it){ it.preco=p; registrar(`mudou o preço de “${it.nome}”`); } });
      toast('Preço atualizado');
      return;
    }
    case 'onoff-item':
      await comBloqueio(()=>{ const it=item(id); if(it) it.ativo=it.ativo===false; });
      return;
    case 'excluir-item': {
      const it=item(id); if(!it) return;
      if(!confirm(`Excluir “${it.nome}”? Quem tinha perde o item.`)) return;
      await comBloqueio(()=>{
        S.shop.items=S.shop.items.filter(x=>x.id!==id);
        Object.values(S.users).forEach(u=>{
          if(Array.isArray(u.inventory)) u.inventory=u.inventory.filter(x=>x!==id);
          if(u.equipped) Object.keys(u.equipped).forEach(s=>{ if(u.equipped[s]===id) u.equipped[s]=null; });
        });
        registrar(`excluiu o item “${it.nome}”`);
      });
      if(editingItemId===id) editingItemId=null;
      return;
    }
    case 'pacote': {
      let add=0;
      await comBloqueio(()=>{ add=pacoteInicial(); registrar(`carregou o pacote inicial (${add} itens)`); });
      toast(add?`${add} itens adicionados`:'O pacote já estava carregado');
      return;
    }
    case 'entregar': case 'tomar': {
      const quem=val('daNome'), qual=val('daItem');
      if(!quem||!qual){ toast('Escolha jogador e item'); return; }
      await comBloqueio(()=>{
        const u=conta(quem), it=item(qual);
        if(!it) return;
        if(act==='entregar'){
          if(!u.inventory.includes(qual)) u.inventory.push(qual);
          u.equipped[TIPOS[it.tipo].slot]=qual;
          registrar(`entregou “${it.nome}” para ${quem}`);
          avisoChat(`${quem} recebeu ${it.nome} das mãos da casa.`);
        } else {
          u.inventory=u.inventory.filter(x=>x!==qual);
          Object.keys(u.equipped).forEach(s=>{ if(u.equipped[s]===qual) u.equipped[s]=null; });
          registrar(`tomou “${it.nome}” de ${quem}`);
        }
      });
      toast(act==='entregar'?'Item entregue':'Item removido');
      return;
    }
    case 'salvar-regras': {
      await salvarConfig({
        startBalance:num('cfgStart'), betCost:num('cfgBet'), defaultExpireMin:num('cfgExp'),
        bonusAmount:num('cfgBonus'), bonusCooldownMin:num('cfgBonusCd'), spinCooldownSec:num('cfgSpinCd'),
        slot:{ seteTriplo:num('slot7'), trio:num('slotTrio'), par:num('slotPar'), nada:num('slotNada') }
      });
      await comBloqueio(()=> registrar('mudou as regras da casa'));
      toast('Regras salvas no casino_config.json');
      return;
    }
    case 'trancar': await salvarConfig({ betsLocked:!C.betsLocked }); render(); return;
    case 'chat-onoff': await salvarConfig({ chatOn:!C.chatOn }); render(); return;
    case 'loja-onoff': await salvarConfig({ shopOn:!C.shopOn }); render(); return;
    case 'publicar-aviso': {
      const t=val('aviso');
      await salvarConfig({ announcement:t });
      render();
      toast(t?'Aviso publicado':'Aviso removido');
      return;
    }
    case 'limpar-chat':
      if(!confirm('Apagar todas as mensagens?')) return;
      await comBloqueio(()=>{ S.chat=[]; registrar('limpou o chat'); });
      return;
    case 'limpar-fechadas':
      if(!confirm('Apagar todas as apostas encerradas?')) return;
      await comBloqueio(()=>{ S.bets=S.bets.filter(x=>x.status!=='fechada'); registrar('apagou as apostas encerradas'); });
      return;
    case 'cancelar-todas':
      if(!confirm('Cancelar todas as abertas e devolver os pontos?')) return;
      await comBloqueio(()=>{
        S.bets.filter(x=>x.status==='aberta').forEach(x=> x.wagers.forEach(w=> conta(w.user).balance+=w.amount));
        S.bets=S.bets.filter(x=>x.status!=='aberta');
        registrar('cancelou todas as apostas abertas');
        avisoChat('A casa cancelou as apostas abertas e devolveu os pontos.');
      });
      return;
  }
});

/* ------------------------------------------------ sessão */
async function sair(silencioso){
  try{ await api('/api/logout','POST',{}); }catch(e){}
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  if(!silencioso) location.href='login.html';
  else location.href='login.html';
}

async function init(page){
  PAGE=page;
  ME.token=localStorage.getItem(TOKEN_KEY);
  ME.name=localStorage.getItem(USER_KEY);
  if(!ME.token||!ME.name){ location.href='login.html'; return; }
  normalizar();
  await carregar();
  ME.isAdmin=souCasa();
  const u=S.users[ME.name];
  if(u&&u.banned){ await sair(); return; }
  conta(ME.name);
  render();
  setInterval(async ()=>{
    now=Date.now();
    if(spinning) return;
    await carregar();
    render();
  }, 2500);
}

/* ------------------------------------------------ portaria */
function initLogin(){
  let modo='entrar';
  const box=$('doorBox');
  const pinta=()=>{
    box.innerHTML=`
      <div class="panel">
        <div class="err" id="doorErr"></div>
        <input type="text" id="doorName" placeholder="nome na mesa" maxlength="20" autocomplete="username" />
        <input type="password" id="doorPw" placeholder="senha" autocomplete="current-password" />
        ${modo==='criar'?'<input type="password" id="doorPw2" placeholder="repita a senha" autocomplete="new-password" />':''}
        <button class="btn btn-primary" id="doorGo">${modo==='entrar'?'Entrar':'Criar conta'}</button>
        <div class="switcher">
          ${modo==='entrar'?'Ainda não tem conta? <a href="#" id="doorSwap">criar uma</a>':'Já tem conta? <a href="#" id="doorSwap">entrar</a>'}
        </div>
      </div>`;
    $('doorGo').onclick=vai;
    $('doorSwap').onclick=e=>{ e.preventDefault(); modo=modo==='entrar'?'criar':'entrar'; pinta(); };
    [...box.querySelectorAll('input')].forEach(i=> i.onkeydown=e=>{ if(e.key==='Enter') vai(); });
    $('doorName').focus();
  };
  const erro=t=>{ const e=$('doorErr'); if(e) e.textContent=t; };
  async function vai(){
    const name=val('doorName'), pw=val('doorPw');
    if(!name||!pw){ erro('Preencha nome e senha'); return; }
    if(modo==='criar'&&pw!==val('doorPw2')){ erro('As senhas não batem'); return; }
    try{
      const r=await api(modo==='criar'?'/api/register':'/api/login','POST',{ name, password:pw });
      localStorage.setItem(TOKEN_KEY,r.token);
      localStorage.setItem(USER_KEY,r.name);
      location.href='index.html';
    }catch(e){ erro(e.message||'não deu certo'); }
  }
  pinta();
}

window.Salao={ init, initLogin };
})();
