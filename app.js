// ============================================================
// O SALÃO — núcleo compartilhado (auth, estado, config, helpers)
// Incluído por index.html, loja.html, perfil.html e painel.html
// ============================================================

const SESSION_KEY = 'salao_session'; // { username: 'nomeDigitado' }
const START_BALANCE_FALLBACK = 500;

const DEFAULT_SHOP = { colors: [], tags: [], crests: [], avatars: [] };
const DEFAULT_CONFIG = {
  betCost: 20,
  freePoints: { amount: 100, cooldownMinutes: 3 },
  slot: { cooldownSeconds: 45, payouts: { triple7: 500, tripleOutro: 150, par: 40, nada: 10 } }
};
const SYMBOLS = ['🍒','🔔','⭐','7️⃣','🍋','💎'];
const CREST_SUGGESTIONS = ['👑','💎','🔥','☠️','🐉','🦈','⚡','🃏','♠️','🎲','💰','🍀','🎯','🥇','🐺','🦁','🂡','🎰','🍒','👻','🤖','😈','👽','🤡'];

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

function toast(msg){
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
async function loadState(){
  try{
    const r = await fetch('/api/state');
    if(r.ok){ state = await r.json(); serverUnreachable = false; }
    else { serverUnreachable = true; }
  }catch(e){ console.error('falha ao buscar estado', e); serverUnreachable = true; }
  if(!state.chat) state.chat = [];
  if(!state.banned) state.banned = [];
  if(!state.settings) state.settings = { startBalance: START_BALANCE_FALLBACK };
  if(!state.shop) state.shop = JSON.parse(JSON.stringify(DEFAULT_SHOP));
  ['colors','tags','crests','avatars'].forEach(k=>{ if(!state.shop[k]) state.shop[k]=[]; });
  if(!state.bets) state.bets = [];
  if(!state.users) state.users = {};
}
async function saveState(){
  try{
    await fetch('/api/state', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(state) });
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
    owned: { colors:[], tags:[], crests:[], avatars:[] },
    equipped: { color:null, tag:null, crest:null, avatar:null }
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
  const nameStyle = color ? ` style="color:${color.hex};"` : '';
  const crestHtml = crest ? `<span class="crest" title="${escapeAttr(crest.label)}">${crest.emoji}</span>` : '';
  const tagHtml = tag ? `<span class="name-tag">${escapeHTML(tag.label)}</span>` : '';
  const nameSpan = u.isAdmin
    ? `<b class="brilhante"${nameStyle}>${safeName}</b>`
    : `<span${nameStyle}>${safeName}</span>`;
  return `${crestHtml}${nameSpan}${tagHtml}`;
}

function avatarEmoji(username){
  const key = String(username).toLowerCase();
  const u = state.users[key];
  if(!u) return '🂠';
  const av = u.equipped && u.equipped.avatar && (state.shop.avatars||[]).find(a=> a.id===u.equipped.avatar);
  return av ? av.emoji : (u.isAdmin ? '👑' : '🂠');
}

function avatarBadgeHTML(username, size){
  return `<div class="avatar-badge" style="${size?`width:${size}px;height:${size}px;font-size:${Math.round(size*0.5)}px;`:''}">${avatarEmoji(username)}</div>`;
}

// ---------------- nav / hud comum ----------------
function navHTML(active){
  const u = meUser();
  const pages = [
    ['index.html','Mesa'],
    ['loja.html','Loja'],
    ['perfil.html','Perfil']
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
  const field = category==='colors' ? 'color' : category==='tags' ? 'tag' : category==='avatars' ? 'avatar' : 'crest';
  u.equipped[field] = (u.equipped[field] === id) ? null : id;
  await saveState();
  return true;
}

// checa apostas expiradas e devolve pontos automaticamente (chamado após loadState)
function processExpiredBets(){
  const nowTs = Date.now();
  let changed = false;
  (state.bets||[]).forEach(b=>{
    if(b.status==='aberta' && b.expiresAt && nowTs >= b.expiresAt){
      b.status = 'expirada';
      b.winner = null;
      (b.wagers||[]).forEach(w=>{
        const u = state.users[String(w.user).toLowerCase()];
        if(u) u.balance += w.amount;
      });
      changed = true;
    }
  });
  return changed;
}
