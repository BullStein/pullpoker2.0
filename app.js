// ============================================================
// O SALÃO — núcleo compartilhado (auth, estado, config, helpers)
// Incluído por index.html, loja.html, perfil.html e painel.html
// ============================================================

const SESSION_KEY = 'salao_session'; // { username: 'nomeDigitado' }
const START_BALANCE_FALLBACK = 500;

const DEFAULT_SHOP = { colors: [], tags: [], crests: [], avatars: [], backgrounds: [] };
const DEFAULT_CONFIG = {
  betCost: 20,
  freePoints: { amount: 100, cooldownMinutes: 3 },
  slot: { cooldownSeconds: 45, payouts: { triple7: 500, tripleOutro: 150, par: 40, nada: 10 } },
  roulette: { minBet: 5, bettingSeconds: 60, spinSeconds: 8, resultSeconds: 12 },
  horseRace: { minBet: 5 },
  blackjack: { minBet: 10, joinSeconds: 20, resultSeconds: 10 }
};
const SYMBOLS = ['🍒','🔔','⭐','7️⃣','🍋','💎'];
const CREST_SUGGESTIONS = ['👑','💎','🔥','☠️','🐉','🦈','⚡','🃏','♠️','🎲','💰','🍀','🎯','🥇','🐺','🦁','🂡','🎰','🍒','👻','🤖','😈','👽','🤡','🏆','🎭','💍','🔑','⏳','🍾','💣','🧛','🧙','🤠','🥷','🧑‍🚀','🦄','🐲','🦊','🐯','🐼','🐝','🐎'];

// itens novos adicionados numa atualização — o merge de baixo (seedShopDefaults)
// injeta esses itens em instalações que já existiam, sem apagar compras feitas.
const SEED_VERSION = 2;
const SHOP_SEED = {
  colors: [
    { id:'c_crimson', label:'Carmesim', hex:'#d43f3f', price:180 },
    { id:'c_teal', label:'Turquesa', hex:'#2fb8a6', price:180 },
    { id:'c_rose', label:'Rosa Choque', hex:'#ef7fb0', price:180 },
    { id:'c_lime', label:'Verde Limão', hex:'#a8e063', price:180 },
    { id:'c_ice', label:'Gelo', hex:'#bfe6f5', price:150 },
    { id:'c_coral', label:'Coral', hex:'#ff8b6b', price:180 },
    { id:'c_navy', label:'Azul Marinho', hex:'#5c7cb0', price:180 },
    { id:'c_copper', label:'Cobre', hex:'#c17a4a', price:200 },
    { id:'c_platinum', label:'Platina', hex:'#e5e4e2', price:300 },
    { id:'c_ruby', label:'Rubi', hex:'#e0335e', price:250 }
  ],
  tags: [
    { id:'t_vip', label:'VIP', price:500 },
    { id:'t_novato', label:'Novato', price:50 },
    { id:'t_azarado', label:'Azarão', price:120 },
    { id:'t_bluff', label:'Rei do Blefe', price:350 },
    { id:'t_gerente', label:'Gerente', price:450 },
    { id:'t_croupier', label:'Crupiê', price:300 },
    { id:'t_lenda_viva', label:'Lenda Viva', price:700 },
    { id:'t_investidor', label:'Investidor', price:250 }
  ],
  crests: [
    { id:'k_horse', emoji:'🐎', label:'Cavalo', price:150 },
    { id:'k_trophy', emoji:'🏆', label:'Troféu', price:220 },
    { id:'k_target', emoji:'🎯', label:'Alvo', price:130 },
    { id:'k_clover', emoji:'🍀', label:'Trevo', price:90 },
    { id:'k_bomb', emoji:'💣', label:'Bomba', price:170 },
    { id:'k_mask', emoji:'🎭', label:'Máscara', price:160 },
    { id:'k_ring', emoji:'💍', label:'Anel', price:260 },
    { id:'k_key', emoji:'🔑', label:'Chave', price:140 },
    { id:'k_hourglass', emoji:'⏳', label:'Ampulheta', price:130 },
    { id:'k_champagne', emoji:'🍾', label:'Champanhe', price:200 }
  ],
  avatars: [
    { id:'a_vampire', emoji:'🧛', label:'Vampiro', price:210 },
    { id:'a_witch', emoji:'🧙', label:'Bruxo(a)', price:210 },
    { id:'a_cowboy', emoji:'🤠', label:'Caubói', price:180 },
    { id:'a_ninja', emoji:'🥷', label:'Ninja', price:220 },
    { id:'a_astronaut', emoji:'🧑‍🚀', label:'Astronauta', price:220 },
    { id:'a_unicorn', emoji:'🦄', label:'Unicórnio', price:260 },
    { id:'a_dragonface', emoji:'🐲', label:'Dragãozinho', price:200 },
    { id:'a_fox', emoji:'🦊', label:'Raposa', price:190 },
    { id:'a_tiger', emoji:'🐯', label:'Tigre', price:220 },
    { id:'a_panda', emoji:'🐼', label:'Panda', price:170 },
    { id:'a_bee', emoji:'🐝', label:'Abelha', price:140 },
    { id:'custom_photo', label:'Foto personalizada (envie a sua)', price:10000, custom:true }
  ],
  backgrounds: [
    { id:'bg_oxblood', label:'Oxblood', hex:'#6e1522', price:200 },
    { id:'bg_brass', label:'Latão', hex:'#8a6f1e', price:200 },
    { id:'bg_emerald', label:'Esmeralda', hex:'#1f6b46', price:220 },
    { id:'bg_royal', label:'Azul Royal', hex:'#2c3f8f', price:220 },
    { id:'bg_violet', label:'Violeta', hex:'#5b2d91', price:220 },
    { id:'bg_charcoal', label:'Chumbo', hex:'#2a2a2a', price:150 },
    { id:'bg_rose', label:'Rosa Escuro', hex:'#8f2c52', price:200 },
    { id:'bg_ember', label:'Brasa', hex:'#a4471c', price:200 },
    { id:'bg_ice', label:'Gelo Escuro', hex:'#2c6b74', price:200 },
    { id:'bg_gold_shimmer', label:'Dourado Fosco', hex:'#7a5c1e', price:250 }
  ]
};

// roster fixo de cavalos usados na Corrida de Cavalos (jogos.html)
const HORSE_ROSTER = [
  { id:'h1', name:'Fantasma', emoji:'🐎', color:'#e9cd85' },
  { id:'h2', name:'Trovão', emoji:'🐎', color:'#c9433f' },
  { id:'h3', name:'Sombra', emoji:'🐎', color:'#9a9a9a' },
  { id:'h4', name:'Relâmpago', emoji:'🐎', color:'#4a8fe0' },
  { id:'h5', name:'Fogo Bravo', emoji:'🐎', color:'#d0602a' },
  { id:'h6', name:'Rainha', emoji:'🐎', color:'#a34bff' },
  { id:'h7', name:'Vendaval', emoji:'🐎', color:'#3fbf7f' },
  { id:'h8', name:'Coringa', emoji:'🐎', color:'#ef7fb0' }
];

// ---------------- roleta automática (gira sozinha, tempo configurável) ----------------
// ordem física real da roda europeia (0-36) — usada tanto pra pagamento
// quanto pra desenhar a roda e girar até o número certo
const WHEEL_ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
// os três tempos da roleta são configurados diretamente pelo host (nada de
// calcular um a partir dos outros) — apostas, giro e a pausa mostrando o
// resultado antes da rodada seguinte começar.
function rouletteBetMs(){ return Math.max(5, (config.roulette&&config.roulette.bettingSeconds) || 60) * 1000; }
function rouletteSpinMs(){ return Math.max(3, (config.roulette&&config.roulette.spinSeconds) || 8) * 1000; }
function rouletteResultMs(){ return Math.max(3, (config.roulette&&config.roulette.resultSeconds) || 12) * 1000; }
function rouletteMinBet(){ return Math.max(1, (config.roulette&&config.roulette.minBet) || 1); }
function horseMinBet(){ return Math.max(1, (config.horseRace&&config.horseRace.minBet) || 1); }
function blackjackMinBet(){ return Math.max(1, (config.blackjack&&config.blackjack.minBet) || 1); }
function blackjackJoinMs(){ return Math.max(5, (config.blackjack&&config.blackjack.joinSeconds) || 20) * 1000; }
function blackjackResultMs(){ return Math.max(3, (config.blackjack&&config.blackjack.resultSeconds) || 10) * 1000; }
const ROULETTE_RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
function rouletteColor(n){
  if(n===0) return 'green';
  return ROULETTE_RED.has(n) ? 'red' : 'black';
}

let state = { users:{}, bets:[], chat:[], banned:[], settings:{startBalance:500}, shop:null };
let config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
let me = null; // { key, username } — key = lowercase, username = como foi cadastrado
let serverUnreachable = false; // true se /api/state falhou (servidor fora do ar / arquivo aberto direto sem python3 server.py)

// ---------------- utils ----------------
function escapeHTML(s){ return String(s).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function escapeAttr(s){ return escapeHTML(s).replace(/"/g,'&quot;'); }
function cssEscape(s){ return String(s).replace(/["\\]/g, '\\$&'); }
function fmt(n){ return Math.round(n||0).toLocaleString('pt-BR'); }
function fmtClock(ms){ const s=Math.ceil(ms/1000); const m=Math.floor(s/60); const r=s%60; return `${m}:${r.toString().padStart(2,'0')}`; }
function fmtTime(ts){ return new Date(ts).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
function fmtDate(ts){ return new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'}); }
function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function uid(prefix){ return prefix+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

// registra uma entrada no log de eventos (eventos.html). Não salva sozinho —
// quem chama deve estar dentro de um bloco que já vai dar saveState().
function logEvent(type, text){
  if(!state.eventLog) state.eventLog = [];
  state.eventLog.push({ id: uid('ev_'), type, text, ts: Date.now(), by: (me && me.username) || 'sistema' });
  if(state.eventLog.length > 300) state.eventLog = state.eventLog.slice(-300);
}
const EVENT_LABELS = {
  conta: 'Conta', aposta: 'Aposta', cavalo: 'Corrida', roleta: 'Roleta', blackjack: 'Blackjack', loja: 'Loja',
  chat: 'Chat', admin: 'Admin', config: 'Config', trava: 'Trava', backup: 'Backup'
};

function toast(msg){
  if(typeof document === 'undefined') { console.log('[toast]', msg); return; }
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(()=> t.classList.remove('show'), 2600);
}

// crypto.subtle só existe em contexto seguro (https ou localhost). Quem
// acessa pelo IP da rede (http://192.168.x.x) cai no fallback puro-JS abaixo,
// que produz exatamente o mesmo SHA-256.
async function sha256hex(text){
  if(window.crypto && window.crypto.subtle){
    try{
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b=> b.toString(16).padStart(2,'0')).join('');
    }catch(e){ /* segue pro fallback */ }
  }
  return sha256hexPure(text);
}
function sha256hexPure(str){
  const msgBytes = new TextEncoder().encode(str);
  const h = new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const k = new Uint32Array([
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ]);
  const l = msgBytes.length;
  const withOne = new Uint8Array(((l+9+63)>>6)<<6);
  withOne.set(msgBytes);
  withOne[l] = 0x80;
  const bitLenHi = Math.floor(l / 0x20000000);
  const bitLenLo = (l << 3) >>> 0;
  const view = new DataView(withOne.buffer);
  view.setUint32(withOne.length - 8, bitLenHi);
  view.setUint32(withOne.length - 4, bitLenLo);
  function rotr(x,n){ return (x>>>n) | (x<<(32-n)); }
  for(let chunkStart=0; chunkStart<withOne.length; chunkStart+=64){
    const w = new Uint32Array(64);
    for(let i=0;i<16;i++){ w[i] = view.getUint32(chunkStart + i*4); }
    for(let i=16;i<64;i++){
      const s0 = rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15]>>>3);
      const s1 = rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2]>>>10);
      w[i] = (w[i-16] + s0 + w[i-7] + s1) >>> 0;
    }
    let a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
    for(let i=0;i<64;i++){
      const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + S1 + ch + k[i] + w[i]) >>> 0;
      const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h[0]=(h[0]+a)>>>0; h[1]=(h[1]+b)>>>0; h[2]=(h[2]+c)>>>0; h[3]=(h[3]+d)>>>0;
    h[4]=(h[4]+e)>>>0; h[5]=(h[5]+f)>>>0; h[6]=(h[6]+g)>>>0; h[7]=(h[7]+hh)>>>0;
  }
  return Array.from(h).map(x=> x.toString(16).padStart(8,'0')).join('');
}

// ---------------- estado / config remoto ----------------
function normalizeUsers(){
  Object.values(state.users||{}).forEach(u=>{
    u.owned = u.owned || {};
    ['colors','tags','crests','avatars','backgrounds'].forEach(c=>{ if(!u.owned[c]) u.owned[c]=[]; });
    u.equipped = u.equipped || {};
    ['color','tag','crest','avatar','background'].forEach(f=>{ if(!(f in u.equipped)) u.equipped[f]=null; });
    if(typeof u.customAvatarData === 'undefined') u.customAvatarData = null;
    if(!u.stats) u.stats = { lifetimeWon:0, lifetimeLost:0 };
    if(typeof u.stats.lifetimeWon !== 'number') u.stats.lifetimeWon = 0;
    if(typeof u.stats.lifetimeLost !== 'number') u.stats.lifetimeLost = 0;
  });
}
// registra ganho/perda líquido de um jogo (aposta, roleta, corrida, blackjack, caça-níquel...)
// pra estatística de vida da conta e pro total que a casa já tomou (ou deu de graça).
function recordFlow(userKey, netDelta){
  if(!netDelta) return;
  const u = state.users[userKey];
  if(!u) return;
  if(!u.stats) u.stats = { lifetimeWon:0, lifetimeLost:0 };
  if(netDelta > 0) u.stats.lifetimeWon += netDelta;
  else u.stats.lifetimeLost += -netDelta;
  if(typeof state.houseTake !== 'number') state.houseTake = 0;
  state.houseTake -= netDelta;
}
// tira uma versão compacta do ranking pra acompanhar as páginas fora da Mesa principal
function miniRankingHTML(){
  if(!state.users) return '';
  const leaderboard = Object.values(state.users).filter(u=> !u.hidden).sort((a,b)=> b.balance-a.balance).slice(0,5);
  if(!leaderboard.length) return '';
  const rows = leaderboard.map((u,i)=> `
    <div class="mini-rank-row ${u.username===me.username?'me':''}">
      <span class="mini-rank-pos mono">${i+1}º</span>
      ${avatarBadgeHTML(u.username,17)}
      <span class="mini-rank-name"><span class="name-clip">${nameHTML(u.username)}</span></span>
      <span class="mini-rank-bal mono">${fmt(u.balance)}</span>
    </div>`).join('');
  return `
    <div class="mini-ranking">
      <div class="mini-ranking-head">♥ Ranking <a href="index.html">ver mesa →</a></div>
      ${rows}
    </div>
  `;
}
function slotPayout(final, payouts){
  if(final[0]===final[1] && final[1]===final[2]) return final[0]==='7️⃣' ? payouts.triple7 : payouts.tripleOutro;
  if(final[0]===final[1] || final[1]===final[2] || final[0]===final[2]) return payouts.par;
  return payouts.nada;
}
// mini caça-níquel — mesma mecânica/pagamentos do da Mesa, versão compacta pra acompanhar as outras páginas
function miniSlotHTML(){
  if(!state.users || !state.users[me.key]) return '';
  const u = state.users[me.key];
  const locked = state.locks && state.locks.slot;
  const cdMs = ((config.slot&&config.slot.cooldownSeconds) || 45) * 1000;
  const remain = Math.max(0, cdMs - (Date.now() - (u.lastSpin||0)));
  const ready = remain<=0 && !locked;
  return `
    <div class="mini-slot">
      <div class="mini-slot-head">🎰 Caça-níquel</div>
      <div class="mini-slot-reels" id="dockSlotReels"><span class="dreel">🎲</span><span class="dreel">🎲</span><span class="dreel">🎲</span></div>
      <div class="mini-slot-result" id="dockSlotResult"></div>
      ${locked ? `<div class="mini-slot-note">fechado pelo host</div>` :
        `<button class="mini-slot-btn" id="dockSpinBtn" ${ready?'':'disabled'}>${ready?'Girar':fmtClock(remain)}</button>`}
    </div>
  `;
}
// liga o botão do mini caça-níquel — chamar depois de qualquer render() em
// páginas que incluam rightDockHTML()
function bindMiniSlot(){
  const btn = document.getElementById('dockSpinBtn');
  if(!btn) return;
  btn.onclick = async ()=>{
    if(state.locks && state.locks.slot){ toast('Caça-níquel fechado pelo host'); return; }
    const u = state.users[me.key];
    const cd = ((config.slot&&config.slot.cooldownSeconds) || 45) * 1000;
    if(Date.now() - (u.lastSpin||0) < cd) return;
    btn.disabled = true;
    const reels = document.querySelectorAll('#dockSlotReels .dreel');
    const ticks = setInterval(()=>{ reels.forEach(r=> r.textContent = rand(SYMBOLS)); }, 90);
    await new Promise(res=> setTimeout(res, 700));
    clearInterval(ticks);
    const final = [rand(SYMBOLS), rand(SYMBOLS), rand(SYMBOLS)];
    reels.forEach((r,i)=> r.textContent = final[i]);
    const payouts = config.slot.payouts;
    const win = slotPayout(final, payouts);
    const resEl = document.getElementById('dockSlotResult');
    if(resEl) resEl.textContent = win>=payouts.tripleOutro ? `JACKPOT +${win}` : `+${win}`;
    await loadState();
    const uu = state.users[me.key];
    uu.balance += win;
    uu.lastSpin = Date.now();
    recordFlow(me.key, win);
    await saveState();
    toast(win>=payouts.tripleOutro ? `Jackpot! +${win} pontos` : `+${win} pontos no caça-níquel`);
    render();
  };
}
// monta o dock direito (ranking + caça-níquel) — fixo à direita em telas
// largas, e empilhado normalmente em telas estreitas (CSS cuida da troca)
function rightDockHTML(){
  const r = miniRankingHTML();
  const s = miniSlotHTML();
  if(!r && !s) return '';
  return `<div class="side-dock right">${r}${s}</div>`;
}
// tamanho da fonte do número da casa — cresce com a magnitude (escala log,
// suave, com teto), pra "crescer conforme o número cresce" sem explodir
function houseFontSize(n){
  const abs = Math.abs(n||0);
  const scaled = 22 + Math.log10(abs+1) * 9;
  return Math.max(22, Math.min(64, Math.round(scaled)));
}
// dock esquerdo — estatística de vida da conta (ganho/perda) e a banca da
// casa em dourado, crescendo de tamanho conforme o valor cresce
function leftDockHTML(){
  if(!state.users || !state.users[me.key]) return '';
  const u = state.users[me.key];
  const stats = u.stats || { lifetimeWon:0, lifetimeLost:0 };
  const house = typeof state.houseTake==='number' ? state.houseTake : 0;
  return `
    <div class="side-dock left">
      <div class="lifetime-card">
        <div class="lifetime-head">Sua conta</div>
        <div class="lifetime-row won"><span>Ganho</span><span class="mono">+${fmt(stats.lifetimeWon)}</span></div>
        <div class="lifetime-row lost"><span>Perda</span><span class="mono">-${fmt(stats.lifetimeLost)}</span></div>
      </div>
      <div class="house-card">
        <div class="house-label">Banca da casa</div>
        <div class="house-number mono" style="font-size:${houseFontSize(house)}px;">${fmt(house)}</div>
      </div>
    </div>
  `;
}
function seedShopDefaults(){
  if(!state.shop) state.shop = JSON.parse(JSON.stringify(DEFAULT_SHOP));
  let changed = false;
  if(typeof state.seedVersion !== 'number') state.seedVersion = 0;
  if(state.seedVersion < SEED_VERSION){
    Object.keys(SHOP_SEED).forEach(cat=>{
      if(!state.shop[cat]) { state.shop[cat] = []; }
      SHOP_SEED[cat].forEach(item=>{
        if(!state.shop[cat].some(i=> i.id===item.id)){ state.shop[cat].push(JSON.parse(JSON.stringify(item))); }
      });
    });
    state.seedVersion = SEED_VERSION;
    changed = true;
  }
  return changed;
}
async function loadState(){
  try{
    const r = await fetch('/api/state');
    if(r.ok){ state = await r.json(); serverUnreachable = false; }
    else { serverUnreachable = true; }
  }catch(e){ console.error('falha ao buscar estado', e); serverUnreachable = true; }
  // usuários e banidos ficam num arquivo/endpoint à parte (casino_users.json),
  // pra dar pra fazer backup/restaurar só as contas. Aqui a gente funde tudo
  // de volta em `state.users` / `state.banned` — o resto do app nem percebe.
  try{
    const ru = await fetch('/api/users');
    if(ru.ok){
      const usersPayload = await ru.json();
      state.users = usersPayload.users || {};
      state.banned = usersPayload.banned || [];
    } else if(!state.users){ state.users = {}; state.banned = []; }
  }catch(e){ console.error('falha ao buscar usuários', e); if(!state.users){ state.users = {}; state.banned = []; } }
  if(!state.chat) state.chat = [];
  if(!state.banned) state.banned = [];
  if(!state.settings) state.settings = { startBalance: START_BALANCE_FALLBACK };
  if(!state.shop) state.shop = JSON.parse(JSON.stringify(DEFAULT_SHOP));
  ['colors','tags','crests','avatars','backgrounds'].forEach(k=>{ if(!state.shop[k]) state.shop[k]=[]; });
  if(!state.bets) state.bets = [];
  if(!state.users) state.users = {};
  if(!state.announcements) state.announcements = [];
  if(!state.horseRace) state.horseRace = { status:'fechada', horses:[], wagers:[], startedAt:null, bettingEndsAt:null, startedAtRun:null, raceEndsAt:null, winnerId:null, potPaid:false };
  if(!state.roulette) state.roulette = { phase:'apostas', cycleStartedAt: Date.now(), bettingEndsAt: Date.now()+rouletteBetMs(), spinStartedAt:null, spinEndsAt:null, wagers:[], resultNumber:null, potPaid:false, history:[] };
  if(!state.locks) state.locks = { shop:false, bets:false, slot:false, horses:false, roulette:false, blackjack:false };
  if(typeof state.locks.roulette === 'undefined') state.locks.roulette = false;
  if(typeof state.locks.blackjack === 'undefined') state.locks.blackjack = false;
  if(!state.eventLog) state.eventLog = [];
  if(!state.blackjackTable) state.blackjackTable = newBlackjackTable();
  if(typeof state.houseTake !== 'number') state.houseTake = 0;
  normalizeUsers();
  if(!serverUnreachable && seedShopDefaults()) await saveState();
}
async function saveState(){
  // guarda usuários/banidos no endpoint deles, e o resto no /api/state —
  // por fora, pra quem chama saveState() continua sendo uma coisa só.
  const { users, banned, ...gameState } = state;
  try{
    await Promise.all([
      fetch('/api/users', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ users: users||{}, banned: banned||[] }) }),
      fetch('/api/state', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(gameState) })
    ]);
  }catch(e){ console.error('falha ao salvar estado', e); toast('Falha ao salvar — servidor está de pé?'); }
}
async function loadConfig(){
  try{
    const r = await fetch('/api/config');
    if(r.ok) config = await r.json();
  }catch(e){ console.error('falha ao buscar config', e); }
  if(!config.freePoints) config.freePoints = DEFAULT_CONFIG.freePoints;
  if(!config.slot) config.slot = DEFAULT_CONFIG.slot;
  if(!config.slot.payouts) config.slot.payouts = DEFAULT_CONFIG.slot.payouts;
  if(typeof config.betCost !== 'number') config.betCost = DEFAULT_CONFIG.betCost;
  if(!config.roulette) config.roulette = JSON.parse(JSON.stringify(DEFAULT_CONFIG.roulette));
  if(typeof config.roulette.minBet !== 'number') config.roulette.minBet = DEFAULT_CONFIG.roulette.minBet;
  if(typeof config.roulette.bettingSeconds !== 'number'){
    // instalação antiga só tinha cycleMinutes — converte pra um valor direto
    // uma vez só, em vez de continuar calculando o tempo de aposta sozinho
    const legacyCycleS = (typeof config.roulette.cycleMinutes === 'number' ? config.roulette.cycleMinutes : 5) * 60;
    const legacySpinS = typeof config.roulette.spinSeconds === 'number' ? config.roulette.spinSeconds : 8;
    config.roulette.bettingSeconds = Math.max(5, legacyCycleS - legacySpinS - 12);
  }
  if(typeof config.roulette.spinSeconds !== 'number') config.roulette.spinSeconds = DEFAULT_CONFIG.roulette.spinSeconds;
  if(typeof config.roulette.resultSeconds !== 'number') config.roulette.resultSeconds = DEFAULT_CONFIG.roulette.resultSeconds;
  delete config.roulette.cycleMinutes;
  if(!config.horseRace) config.horseRace = JSON.parse(JSON.stringify(DEFAULT_CONFIG.horseRace));
  if(typeof config.horseRace.minBet !== 'number') config.horseRace.minBet = DEFAULT_CONFIG.horseRace.minBet;
  if(!config.blackjack) config.blackjack = JSON.parse(JSON.stringify(DEFAULT_CONFIG.blackjack));
  if(typeof config.blackjack.minBet !== 'number') config.blackjack.minBet = DEFAULT_CONFIG.blackjack.minBet;
  if(typeof config.blackjack.joinSeconds !== 'number') config.blackjack.joinSeconds = DEFAULT_CONFIG.blackjack.joinSeconds;
  if(typeof config.blackjack.resultSeconds !== 'number') config.blackjack.resultSeconds = DEFAULT_CONFIG.blackjack.resultSeconds;
}
async function saveConfig(){
  try{
    await fetch('/api/config', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(config) });
  }catch(e){ console.error('falha ao salvar config', e); toast('Falha ao salvar config'); }
}

// ---------------- sessão / auth ----------------
function loadSession(){
  try{
    const raw = localStorage.getItem(SESSION_KEY);
    if(raw) me = JSON.parse(raw);
  }catch(e){ me = null; }
}
function saveSession(){ try{ localStorage.setItem(SESSION_KEY, JSON.stringify(me)); }catch(e){} }
function clearSession(){ me = null; try{ localStorage.removeItem(SESSION_KEY); }catch(e){} }

function meUser(){ return me ? state.users[me.key] : null; }

// valida a sessão contra o estado atual (banido / conta apagada)
function sessionStillValid(){
  if(!me) return false;
  const u = state.users[me.key];
  if(!u) return false;
  if((state.banned||[]).includes(u.username)) return false;
  return true;
}

function newUserRecord(username, passwordHash){
  return {
    username,
    passwordHash,
    isAdmin: false,
    hidden: false,
    balance: (state.settings && state.settings.startBalance) || START_BALANCE_FALLBACK,
    createdAt: Date.now(),
    lastBonus: 0,
    lastSpin: 0,
    owned: { colors:[], tags:[], crests:[], avatars:[], backgrounds:[] },
    equipped: { color:null, tag:null, crest:null, avatar:null, background:null },
    customAvatarData: null
  };
}

// retorna {ok, error}
async function registerAccount(usernameRaw, password){
  const username = usernameRaw.trim();
  if(!username || username.length<2) return { ok:false, error:'Escolha um nome com pelo menos 2 letras.' };
  if(username.length>20) return { ok:false, error:'Nome muito longo (máx. 20 caracteres).' };
  if(!password || password.length<4) return { ok:false, error:'Senha precisa ter pelo menos 4 caracteres.' };
  const key = username.toLowerCase();
  await loadState();
  if(state.users[key]) return { ok:false, error:'Esse nome já está em uso.' };
  if((state.banned||[]).includes(username)) return { ok:false, error:'Esse nome foi banido desta mesa.' };
  const hash = await sha256hex(password);
  state.users[key] = newUserRecord(username, hash);
  logEvent('conta', `${username} criou uma conta`);
  await saveState();
  me = { key, username };
  saveSession();
  return { ok:true };
}

async function loginAccount(usernameRaw, password){
  const username = usernameRaw.trim();
  const key = username.toLowerCase();
  await loadState();
  const u = state.users[key];
  if(!u) return { ok:false, error:'Conta não encontrada.' };
  if((state.banned||[]).includes(u.username)) return { ok:false, error:'Você foi banido desta mesa.' };
  const hash = await sha256hex(password);
  if(hash !== u.passwordHash) return { ok:false, error:'Senha incorreta.' };
  me = { key, username: u.username };
  saveSession();
  return { ok:true };
}

async function changePassword(currentPw, newPw){
  if(!newPw || newPw.length<4) return { ok:false, error:'Nova senha precisa ter pelo menos 4 caracteres.' };
  await loadState();
  const u = state.users[me.key];
  const curHash = await sha256hex(currentPw);
  if(curHash !== u.passwordHash) return { ok:false, error:'Senha atual incorreta.' };
  u.passwordHash = await sha256hex(newPw);
  await saveState();
  return { ok:true };
}

function logout(){ clearSession(); location.href = 'index.html'; }

// redireciona pro login se não estiver logado; retorna true se ok
function requireAuth(){
  loadSession();
  return !!me;
}

// ---------------- nome / avatar ----------------
function nameHTML(username){
  const key = String(username).toLowerCase();
  const u = state.users[key];
  const safeName = escapeHTML(username);
  if(!u) return safeName;
  const eq = u.equipped || {};
  const color = eq.color && (state.shop.colors||[]).find(c=> c.id===eq.color);
  const tag = eq.tag && (state.shop.tags||[]).find(t=> t.id===eq.tag);
  const crest = eq.crest && (state.shop.crests||[]).find(k=> k.id===eq.crest);
  const bg = eq.background && (state.shop.backgrounds||[]).find(k=> k.id===eq.background);
  const nameStyle = color ? `color:${color.hex};` : '';
  const crestHtml = crest ? `<span class="crest" title="${escapeAttr(crest.label)}">${crest.emoji}</span>` : '';
  const tagHtml = tag ? `<span class="name-tag">${escapeHTML(tag.label)}</span>` : '';
  const nameSpan = u.isAdmin
    ? `<b class="brilhante" style="${nameStyle}">${safeName}</b>`
    : `<span style="${nameStyle}">${safeName}</span>`;
  const wrapped = bg ? `<span class="name-bg" style="background:${bg.hex};">${nameSpan}</span>` : nameSpan;
  return `${crestHtml}${wrapped}${tagHtml}`;
}

function avatarContentHTML(username){
  const key = String(username).toLowerCase();
  const u = state.users[key];
  if(!u) return '🂠';
  const eq = u.equipped || {};
  if(eq.avatar === 'custom_photo' && u.customAvatarData){
    return `<img src="${u.customAvatarData}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
  }
  const av = eq.avatar && (state.shop.avatars||[]).find(a=> a.id===eq.avatar);
  return av ? (av.emoji || '🂠') : (u.isAdmin ? '👑' : '🂠');
}

function avatarBadgeHTML(username, size){
  return `<div class="avatar-badge" style="${size?`width:${size}px;height:${size}px;font-size:${Math.round(size*0.5)}px;`:''}overflow:hidden;">${avatarContentHTML(username)}</div>`;
}

// só considera "com foto de perfil" quem equipou algum avatar (emoji da loja
// ou foto personalizada) — usado pra decidir se mostra o avatar ou o nome
// na lista de quem apostou em cada opção.
function hasEquippedAvatar(username){
  const u = state.users[String(username).toLowerCase()];
  return !!(u && u.equipped && u.equipped.avatar);
}

// avatar quando a pessoa tem um equipado; senão, o nome em texto —
// pedido explícito: foto de perfil obrigatória pra aparecer como ícone.
// mostra também quanto essa pessoa apostou ali.
function voterChipHTML(username, amount, size){
  size = size || 20;
  const amtTxt = amount ? `<span class="voter-amt mono">${fmt(amount)}</span>` : '';
  if(hasEquippedAvatar(username)){
    return `<span class="voter-chip" title="${escapeAttr(username)}${amount?` — ${fmt(amount)} pts`:''}">${avatarBadgeHTML(username, size)}${amtTxt}</span>`;
  }
  return `<span class="voter-name-pill" title="${escapeAttr(username)}"><span class="name-clip">${nameHTML(username)}</span>${amtTxt}</span>`;
}

// tamanho da fonte do valor do pote crescendo com o valor apostado (escala
// logarítmica, pra não ficar gigante em potes muito grandes)
function poolFontSizePx(amount){
  if(!amount) return 12.5;
  const size = 12.5 + Math.min(15, Math.log2(amount+1)*1.7);
  return Math.round(size*10)/10;
}

// redimensiona uma foto enviada pelo usuário para um quadrado pequeno em base64
function resizeImageToDataURL(file, size){
  size = size || 160;
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onerror = ()=> reject(new Error('Não consegui ler o arquivo'));
    reader.onload = ()=>{
      const img = new Image();
      img.onerror = ()=> reject(new Error('Arquivo não parece ser uma imagem válida'));
      img.onload = ()=>{
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2, sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---------------- nav / hud comum ----------------
function navHTML(active){
  const u = meUser();
  const pages = [
    ['index.html','Mesa'],
    ['jogos.html','Jogos'],
    ['loja.html','Loja'],
    ['perfil.html','Perfil'],
    ['eventos.html','Eventos']
  ];
  if(u && u.isAdmin) pages.push(['painel.html','Painel']);
  const tabs = pages.map(([href,label])=>
    `<a class="nav-tab ${active===href?'active':''}" href="${href}">${label}</a>`
  ).join('');
  return `
    <div class="hud">
      <div class="brand"><span class="mark">♠</span> O Salão <em>reservado</em></div>
      ${u ? `<div class="nav-tabs">${tabs}</div>` : ''}
      <div class="spacer"></div>
      ${u ? `
        <div class="who-block">
          ${avatarBadgeHTML(u.username)}
          <div class="who-name">sentado como <b>${nameHTML(u.username)}</b>${u.isAdmin?' · host':''}</div>
        </div>
        <div class="balance-pill"><div class="chip-dot"></div><div class="num mono">${fmt(u.balance)}</div></div>
        <button class="logout-btn" id="navLogoutBtn">Sair</button>
      ` : ''}
    </div>
  `;
}
function bindNav(){
  const b = document.getElementById('navLogoutBtn');
  if(b) b.onclick = ()=> logout();
}

// ---------------- loja: comprar / equipar (compartilhado) ----------------
async function buyItem(category, id){
  await loadState();
  if(state.locks && state.locks.shop){ toast('Loja fechada pelo host'); return false; }
  const item = (state.shop[category]||[]).find(i=> i.id===id);
  const u = state.users[me.key];
  if(!item){ toast('Esse item não existe mais'); return false; }
  if((u.owned[category]||[]).includes(id)){ toast('Você já tem isso'); return false; }
  if(u.balance < item.price){ toast('Pontos insuficientes'); return false; }
  u.balance -= item.price;
  u.owned[category].push(id);
  await saveState();
  toast(`Comprou "${item.label}"`);
  return true;
}
async function equipItem(category, id){
  await loadState();
  const u = state.users[me.key];
  const field = category==='colors' ? 'color' : category==='tags' ? 'tag' : category==='avatars' ? 'avatar' : category==='backgrounds' ? 'background' : 'crest';
  u.equipped[field] = (u.equipped[field] === id) ? null : id;
  await saveState();
  return true;
}

// tranca apostas vencidas (sem devolver pontos — fica travada esperando o
// host resolver) e chamado após loadState()
function processExpiredBets(){
  const nowTs = Date.now();
  let changed = false;
  (state.bets||[]).forEach(b=>{
    if(b.status==='aberta' && b.expiresAt && nowTs >= b.expiresAt){
      b.status = 'travada';
      logEvent('aposta', `"${b.title}" travou (prazo esgotado) — aguardando o host resolver`);
      changed = true;
    }
  });
  return changed;
}

// avança a Corrida de Cavalos (apostas -> correndo -> resultado) e paga o
// pote. Fica isolada do chat/loop da Mesa — só corre enquanto alguém está
// na página Jogos. Idempotente via race.potPaid.
function processHorseRace(){
  const race = state.horseRace;
  if(!race || race.status==='fechada' || race.status==='resultado') return false;
  const nowTs = Date.now();
  let changed = false;
  if(race.status==='apostas' && race.bettingEndsAt && nowTs >= race.bettingEndsAt){
    race.status = 'correndo';
    const ids = race.horses.map(h=> h.id);
    race.winnerId = rand(ids);
    race.startedAtRun = nowTs;
    race.raceEndsAt = nowTs + 8000;
    changed = true;
  }
  if(race.status==='correndo' && race.raceEndsAt && nowTs >= race.raceEndsAt && !race.potPaid){
    const pot = (race.wagers||[]).reduce((s,w)=> s+w.amount, 0);
    const winWagers = (race.wagers||[]).filter(w=> w.horseId===race.winnerId);
    const winPool = winWagers.reduce((s,w)=> s+w.amount, 0);
    (race.wagers||[]).forEach(w=>{
      const userKey = String(w.user).toLowerCase();
      if(w.horseId===race.winnerId && winPool>0){
        const u = state.users[userKey];
        const share = w.amount / winPool;
        const profit = share * (pot - winPool);
        if(u) u.balance += w.amount + profit;
        recordFlow(userKey, profit);
      } else {
        recordFlow(userKey, -w.amount);
      }
    });
    race.status = 'resultado';
    race.potPaid = true;
    const winnerHorse = race.horses.find(h=> h.id===race.winnerId);
    logEvent('cavalo', `Corrida terminou: ${winnerHorse?winnerHorse.name:'?'} venceu, pote de ${pot} pts`);
    changed = true;
  }
  return changed;
}

// roleta automática: gira sozinha a cada ~5 min (apostas -> girando -> resultado
// -> nova rodada), sem precisar do host. Chamada em todo poll das páginas.
function processRoulette(){
  const rl = state.roulette;
  if(!rl) return false;
  const nowTs = Date.now();
  let changed = false;
  if(rl.phase==='apostas' && rl.bettingEndsAt && nowTs >= rl.bettingEndsAt){
    rl.phase = 'girando';
    rl.resultNumber = Math.floor(Math.random()*37);
    rl.spinStartedAt = nowTs;
    rl.spinEndsAt = nowTs + rouletteSpinMs();
    changed = true;
  }
  if(rl.phase==='girando' && rl.spinEndsAt && nowTs >= rl.spinEndsAt && !rl.potPaid){
    const num = rl.resultNumber;
    const color = rouletteColor(num);
    (rl.wagers||[]).forEach(w=>{
      let win = false, mult = 0;
      if(w.betType==='numero' && Number(w.betValue)===num){ win=true; mult=36; }
      else if(w.betType==='cor' && color!=='green' && w.betValue===color){ win=true; mult=2; }
      else if(w.betType==='paridade' && num!==0 && ((num%2===0 && w.betValue==='par')||(num%2===1 && w.betValue==='impar'))){ win=true; mult=2; }
      else if(w.betType==='metade' && num!==0 && ((num<=18 && w.betValue==='baixa')||(num>=19 && w.betValue==='alta'))){ win=true; mult=2; }
      const userKey = String(w.user).toLowerCase();
      if(win){
        const u = state.users[userKey];
        if(u) u.balance += w.amount * mult;
        recordFlow(userKey, w.amount * (mult-1));
      } else {
        recordFlow(userKey, -w.amount);
      }
    });
    rl.potPaid = true;
    rl.phase = 'resultado';
    rl.resultEndsAt = nowTs + rouletteResultMs();
    rl.lastNumber = num;
    rl.lastColor = color;
    if(!rl.history) rl.history = [];
    rl.history = [{ number:num, color, ts:nowTs }, ...rl.history].slice(0,14);
    logEvent('roleta', `Roleta parou no ${num} (${color==='green'?'verde':color==='red'?'vermelho':'preto'})`);
    changed = true;
  }
  if(rl.phase==='resultado' && rl.resultEndsAt && nowTs >= rl.resultEndsAt){
    rl.phase = 'apostas';
    rl.cycleStartedAt = nowTs;
    rl.bettingEndsAt = nowTs + rouletteBetMs();
    rl.spinStartedAt = null;
    rl.spinEndsAt = null;
    rl.resultEndsAt = null;
    rl.wagers = [];
    rl.potPaid = false;
    changed = true;
  }
  return changed;
}

// ---------------- Blackjack — mesa central multiplayer (contra a casa,
// baralho "infinito": cada carta sorteada é independente, sem monte físico) ----------------
const BJ_RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const BJ_SUITS = ['♠','♥','♦','♣'];
const MAX_BJ_SEATS = 6;
function bjDrawCard(){ return { r: rand(BJ_RANKS), s: rand(BJ_SUITS) }; }
function bjCardValue(card){ if(card.r==='A') return 11; if(card.r==='J'||card.r==='Q'||card.r==='K') return 10; return parseInt(card.r,10); }
function bjHandTotal(cards){
  let total = cards.reduce((s,c)=> s+bjCardValue(c), 0);
  let aces = cards.filter(c=> c.r==='A').length;
  while(total>21 && aces>0){ total -= 10; aces--; }
  return total;
}
function bjIsBlackjack(cards){ return cards.length===2 && bjHandTotal(cards)===21; }
function bjCardHTML(card, hidden, isNew, small){
  const sizeCls = small ? ' bj-card-sm' : '';
  if(hidden) return `<span class="bj-card${sizeCls} bj-hidden${isNew?' bj-deal-in':''}"></span>`;
  const red = card.s==='♥'||card.s==='♦';
  return `<span class="bj-card${sizeCls}${red?' bj-red':''}${isNew?' bj-deal-in':''}">
    <span class="bj-card-corner">${escapeHTML(card.r)}<em>${card.s}</em></span>
    <span class="bj-card-pip">${card.s}</span>
  </span>`;
}

function newBlackjackTable(){
  return { phase:'aberta', seats:[], dealer:{cards:[]}, turnIndex:-1, autoStartAt:null, resultEndsAt:null, roundId:null };
}

// acha o próximo assento que ainda não jogou (pula quem já tem blackjack
// natural, estourou ou já parou) a partir de fromIdx
function bjNextEligibleIndex(seats, fromIdx){
  for(let i=fromIdx; i<seats.length; i++){ if(seats[i].status==='aguardando') return i; }
  return -1;
}
// casa compra até 17 (inclusive) e paga/cobra todo mundo de uma vez
function bjDealerPlayAndResolve(table){
  while(bjHandTotal(table.dealer.cards) < 17) table.dealer.cards.push(bjDrawCard());
  const dealerTotal = bjHandTotal(table.dealer.cards);
  const dealerBJ = bjIsBlackjack(table.dealer.cards);
  table.seats.forEach(seat=>{
    if(seat.status==='estourou'){ seat.result='estourou'; seat.payout=0; seat.status='resolvido'; return; }
    const seatTotal = bjHandTotal(seat.cards);
    const seatBJ = seat.status==='blackjack_natural';
    if(seatBJ && dealerBJ){ seat.result='empate'; seat.payout=seat.bet; }
    else if(seatBJ){ seat.result='blackjack'; seat.payout=Math.round(seat.bet*2.5); }
    else if(dealerBJ){ seat.result='perdeu'; seat.payout=0; }
    else if(dealerTotal>21 || seatTotal>dealerTotal){ seat.result='ganhou'; seat.payout=seat.bet*2; }
    else if(seatTotal<dealerTotal){ seat.result='perdeu'; seat.payout=0; }
    else { seat.result='empate'; seat.payout=seat.bet; }
    seat.status = 'resolvido';
    const u = state.users[String(seat.user).toLowerCase()];
    if(u && seat.payout>0) u.balance += seat.payout;
    recordFlow(String(seat.user).toLowerCase(), seat.payout - seat.bet);
  });
}
// passa a vez pro próximo elegível; se acabou todo mundo, a casa joga e resolve
function bjAdvanceTurn(table){
  const next = bjNextEligibleIndex(table.seats, table.turnIndex+1);
  if(next===-1){
    bjDealerPlayAndResolve(table);
    table.phase = 'resultado';
    table.resultEndsAt = Date.now() + blackjackResultMs();
    const winners = table.seats.filter(s=> s.payout>0).map(s=> s.user);
    logEvent('blackjack', `Rodada de blackjack terminou${winners.length ? ' — ganharam: '+winners.join(', ') : ' — ninguém bateu a casa'}`);
  } else {
    table.turnIndex = next;
    table.seats[next].status = 'jogando';
  }
}
// chamada em todo poll — abre a rodada quando o tempo de espera de novos
// jogadores acaba, e reabre a mesa depois de mostrar o resultado
function processBlackjackTable(){
  const table = state.blackjackTable;
  if(!table) return false;
  const nowTs = Date.now();
  let changed = false;
  if(table.phase==='aberta' && table.autoStartAt && nowTs >= table.autoStartAt && table.seats.length>=2){
    table.dealer = { cards:[bjDrawCard(), bjDrawCard()] };
    table.seats.forEach(seat=>{
      seat.cards = [bjDrawCard(), bjDrawCard()];
      seat.status = bjIsBlackjack(seat.cards) ? 'blackjack_natural' : 'aguardando';
      seat.result = null; seat.payout = 0;
    });
    table.roundId = uid('bj_');
    table.phase = 'jogando';
    table.turnIndex = -1;
    table.autoStartAt = null;
    bjAdvanceTurn(table);
    logEvent('blackjack', `Rodada de blackjack começou com ${table.seats.length} jogador(es)`);
    changed = true;
  }
  if(table.phase==='resultado' && table.resultEndsAt && nowTs >= table.resultEndsAt){
    state.blackjackTable = newBlackjackTable();
    changed = true;
  }
  return changed;
}

// ações da mesa — cada uma recebe a key (lowercase) de quem chamou;
// devolvem {ok, error?} e quem chamou é responsável por saveState()
function bjTableJoin(userKey, bet){
  const table = state.blackjackTable;
  const u = state.users[userKey];
  if(!u) return { ok:false, error:'Conta não encontrada.' };
  if(table.phase!=='aberta') return { ok:false, error:'A mesa já está com uma rodada em andamento — espere terminar.' };
  if(table.seats.length >= MAX_BJ_SEATS) return { ok:false, error:'Mesa cheia.' };
  if(table.seats.some(s=> s.user.toLowerCase()===userKey)) return { ok:false, error:'Você já está sentado.' };
  if(!bet || bet<=0) return { ok:false, error:'Digite um valor válido.' };
  if(bet < blackjackMinBet()) return { ok:false, error:`Aposta mínima: ${blackjackMinBet()} pts` };
  if(bet > u.balance) return { ok:false, error:'Pontos insuficientes' };
  u.balance -= bet;
  table.seats.push({ user:u.username, bet, cards:[], status:'aguardando', result:null, payout:0 });
  // o contador só começa quando a mesa bate o mínimo de 2 jogadores — com só
  // 1 sentado, a mesa fica esperando parada, sem rodar sozinha
  if(table.seats.length===2) table.autoStartAt = Date.now() + blackjackJoinMs();
  logEvent('blackjack', `${u.username} sentou à mesa de blackjack com ${bet} pts`);
  return { ok:true };
}
function bjTableLeave(userKey){
  const table = state.blackjackTable;
  if(table.phase!=='aberta') return { ok:false, error:'Não dá pra sair com a rodada em andamento.' };
  const idx = table.seats.findIndex(s=> s.user.toLowerCase()===userKey);
  if(idx===-1) return { ok:false, error:'Você não está sentado.' };
  const seat = table.seats[idx];
  const u = state.users[userKey];
  if(u) u.balance += seat.bet;
  table.seats.splice(idx,1);
  if(table.seats.length < 2) table.autoStartAt = null;
  logEvent('blackjack', `${seat.user} levantou da mesa e recebeu ${seat.bet} pts de volta`);
  return { ok:true };
}
function bjTableForceStart(){
  const table = state.blackjackTable;
  if(table.phase!=='aberta' || table.seats.length<2) return { ok:false, error:'Precisa de pelo menos 2 jogadores sentados.' };
  table.autoStartAt = Date.now();
  return { ok:true };
}
function bjTableHit(userKey){
  const table = state.blackjackTable;
  if(table.phase!=='jogando') return { ok:false };
  const seat = table.seats[table.turnIndex];
  if(!seat || seat.user.toLowerCase()!==userKey || seat.status!=='jogando') return { ok:false, error:'Não é sua vez.' };
  seat.cards.push(bjDrawCard());
  const total = bjHandTotal(seat.cards);
  if(total > 21){ seat.status='estourou'; bjAdvanceTurn(table); }
  else if(total === 21){ seat.status='parou'; bjAdvanceTurn(table); }
  return { ok:true };
}
function bjTableStand(userKey){
  const table = state.blackjackTable;
  if(table.phase!=='jogando') return { ok:false };
  const seat = table.seats[table.turnIndex];
  if(!seat || seat.user.toLowerCase()!==userKey || seat.status!=='jogando') return { ok:false, error:'Não é sua vez.' };
  seat.status = 'parou';
  bjAdvanceTurn(table);
  return { ok:true };
}
