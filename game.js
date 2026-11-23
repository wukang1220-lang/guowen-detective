(function detectiveGame() {
  'use strict';
  const catalog = window.ACADEMY_CATALOG;
  const coach = window.DETECTIVE_COACH;
  const missions = catalog.cases;
  const directory = new Map(missions.map(m => [m.id, m]));
  const selectFromHash = () => directory.get(location.hash.slice('#case/'.length));
  let active = selectFromHash() || missions[0];
  let cases = active.steps;
  const main = document.getElementById('main');
  if (!Array.isArray(cases) || !cases.length) {
    main.textContent = '找不到案件教材，請從完整遊戲資料夾開啟首頁。';
    return;
  }
  const crew = {
    detective:{name:'阿澄',role:'見習偵探',bio:'隨身帶著放大鏡，習慣先圈出原話，再核對線索。',tip:'先圈出可以核對的細節，再試另一種解釋。'},
    archivist:{name:'小禾',role:'校史檔案員',bio:'熟悉借閱簿和書信。她會翻回落款，找出留下消息的人。',tip:'找找是誰留下這份紀錄，又是寫給誰看的。'},
    inkcat:{name:'墨點',role:'巡館黑貓',bio:'喜歡蹲在書架間聽人讀稿，也會跟著調查員到戶外巡查。',tip:'把最容易一眼略過的字讀出聲，聽聽意思有沒有改變。'},
    ranger:{name:'青岑',role:'野外記錄員',bio:'帶著望遠鏡走田埂、探溪岸，觀察光影、地形與生物留下的痕跡。',tip:'先把親眼可見的現象圈起來，再寫下你推測的原因。'},
    reporter:{name:'小波',role:'聲音採訪員',bio:'戴上監聽耳機，替不同說話人記下語氣、停頓和發言次序。',tip:'誰在什麼時候說了這句話？換一位說話人，意思可能就不同。'},
    artisan:{name:'阿陶',role:'工藝修復員',bio:'擅長修紙、裝框與模型製作，從物件的材質與用法追查來歷。',tip:'留意形狀、材料和使用方式。哪項細節能支持你的讀法？'},
    performer:{name:'映彤',role:'劇社演員',bio:'拿起舞扇就能進入角色。她從臺詞、動作和舞臺指示讀出人物心意。',tip:'站到人物的位置讀一次。此刻他看得到什麼，又知道多少？'},
    guide:{name:'子墨',role:'文史導覽員',bio:'常帶著手卷穿梭古城與展廳，替散落的題籤和典故找回上下文。',tip:'把題名、文字和它出現的場合放在一起讀，再判斷意思。'},
    athlete:{name:'飛晴',role:'校隊紀錄員',bio:'用碼錶記下跑道和球場上的關鍵時刻，也核對規則和賽後證詞。',tip:'把事情排成時間線，看看哪一刻的證據最能影響判斷。'},
    cook:{name:'阿栗',role:'飲食觀察員',bio:'在茶館、點心攤和社區食堂採集故事，擅長用感官讀出生活細節。',tip:'把人物實際看見、聽見或感受到的細節，和他們的評價分開。'}
  };
  const looks={everyday:'日常裝',field:'外勤裝',period:'古裝戲服'};
  let rosterLook='everyday';
  const props='letter mic notebook camera leaf lamp compass scroll brush ticket bag clock shell map card medal mask book pen ruler bell umbrella flask ball'.split(' ');
  const mediaUrls=new Map();
  function asset(file) {
    const embedded=window.DETECTIVE_ASSETS?.[file];
    if (!embedded) return 'assets/'+file;
    if (!mediaUrls.has(file)) {
      const comma=embedded.indexOf(',');
      const bytes=Uint8Array.from(atob(embedded.slice(comma+1)),ch=>ch.charCodeAt(0));
      const type=embedded.slice(5,embedded.indexOf(';'));
      mediaUrls.set(file, URL.createObjectURL(new Blob([bytes],{type})));
    }
    return mediaUrls.get(file);
  }
  const keyFor = m => m.id === 'original' ? 'guowen-detective.issue01.v1' : 'guowen-detective.academy.v1.'+m.id;
  const lastKey = 'guowen-detective.last-open.v1';
  const motionKey = 'guowen-detective.cast-motion.v1';
  const fontKey = 'guowen-detective.font-size.v1';
  const fontSizes = [
    { px: 14, label: '小' },
    { px: 16, label: '標準' },
    { px: 18, label: '稍大' },
    { px: 20, label: '大' },
    { px: 22, label: '特大' }
  ];
  let fontIdx = 1;
  const stillMedia = {auto:'(prefers-reduced-motion: reduce)', play:'not all', still:'all'};
  let castMotion = 'auto';
  const memory = new Map();
  let lastId = '';
  let practice = false;
  let filters = {grade:'全部', book:'全部', term:0, status:'全部', query:'', page:0};
  let noteTab = 'textbook';
  let journalTab = 'cards';
  let sessionCombo = 0;
  const perPage = 12;
  const stages = ['intro','notes','question','evidence','reward','closed'];
  let storageWorks = true;
  const fresh = () => ({version:2, done:0, station:0, stage:'intro', readNotes:false, lastBank:'question',
    picks:{question:[], evidence:[]}, cursors:{question:0, evidence:0}});
  function read(m=active) {
    let value = memory.get(m.id);
    if (storageWorks) {
      try { value = JSON.parse(localStorage.getItem(keyFor(m)) || 'null'); }
      catch { value = memory.get(m.id); }
    }
    const rec = fresh();
    if (!value || !Number.isInteger(value.done) || value.done < 0 || value.done > m.steps.length) return rec;
    rec.done = value.done;
    rec.stage = stages.includes(value.stage) ? value.stage : 'intro';
    if (value.version !== 2) {
      rec.station = Math.min(m.steps.length-1, Math.max(0, rec.done - Number(rec.stage==='reward')));
      if (rec.done===m.steps.length && rec.stage!=='reward') rec.stage='closed';
      rec.readNotes = ['question','evidence','reward','closed'].includes(rec.stage);
      if (rec.stage==='evidence') rec.picks.question[0] = m.steps[rec.station].correct;
      if (!rec.done && rec.stage==='reward') rec.stage='intro';
      if (rec.done!==m.steps.length && rec.stage==='closed') rec.stage='intro';
      return rec;
    }
    rec.station = Number.isInteger(value.station) ? Math.max(0,Math.min(value.station,rec.done,m.steps.length-1)) : 0;
    if (rec.stage==='closed' && rec.done!==m.steps.length) rec.stage='intro';
    rec.readNotes = value.readNotes === true;
    if (value.lastBank==='evidence' || rec.stage==='evidence') rec.lastBank='evidence';
    for (const group of ['question','evidence']) {
      const bank = m.steps[rec.station].banks[group];
      rec.picks[group] = bank.map((q,i) => {
        const pick = value.picks?.[group]?.[i];
        return Number.isInteger(pick) && pick>=0 && pick<q.options.length ? pick : null;
      });
      const cursor = value.cursors?.[group];
      rec.cursors[group] = Number.isInteger(cursor) && bank[cursor] ? cursor : 0;
    }
    return rec;
  }
  let state = read();
  const esc = x => String(x ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const multi = x => esc(x).replace(/\n/g,'<br>');
  try {
    lastId=localStorage.getItem(lastKey)||'';
    const storedMotion=localStorage.getItem(motionKey);
    if(Object.hasOwn(stillMedia,storedMotion)) castMotion=storedMotion;
    const rawFont=localStorage.getItem(fontKey);
    if(rawFont!==null && rawFont!=='') {
      const storedFont=Number(rawFont);
      if(Number.isInteger(storedFont) && fontSizes[storedFont]) fontIdx=storedFont;
    }
  } catch {storageWorks=false;}
  function applyFontSize(idx, persist=false) {
    fontIdx = Math.max(0, Math.min(fontSizes.length - 1, idx));
    document.documentElement.style.fontSize = fontSizes[fontIdx].px + 'px';
    if (persist) {
      try { localStorage.setItem(fontKey, String(fontIdx)); } catch {}
    }
  }
  applyFontSize(fontIdx, false);
  function tab() {
    if (location.hash==='#field' || (location.hash.startsWith('#case/') && selectFromHash())) return 'field';
    if (location.hash==='#arena' || location.hash.startsWith('#arena/')) return 'arena';
    return ['journal','crew'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'lobby';
  }
  const index = () => state.station;
  const xpAt = n => cases.slice(0,n).reduce((sum,c) => sum + c.reward,0);
  const num = n => String(n).padStart(2,'0');
  const person = id => crew[id] || crew.detective;
  function sprite(id,cls='',look='everyday') {
    const path='cast/'+id+'-'+look;
    return `<picture class="sprite ${id} ${cls}" data-actor="${id}" data-look="${look}"><source media="${stillMedia[castMotion]}" srcset="${asset(path+'.png')}"><img src="${asset(path+'.gif')}" alt="${esc(person(id).name+'・'+looks[look])}"></picture>`;
  }
  function applyCastMotion(value) {
    castMotion=Object.hasOwn(stillMedia,value)?value:'auto';
    for(const source of main.querySelectorAll('picture.sprite > source')) source.media=stillMedia[castMotion];
    const select=main.querySelector('#cast-motion');
    if(select) select.value=castMotion;
  }
  function scenery(c) {
    const setting=c.art.setting;
    if (setting==='library') return asset('library-desk.png');
    if (setting==='archive') return asset('archive-room.png');
    return asset('scenes/'+setting+'.webp');
  }
  function save() {
    if (practice) return;
    const existing=read(active);
    if (existing.done > state.done || (existing.done === state.done && existing.station > state.station)) {
      state=existing;
      return;
    }
    memory.set(active.id,{...state});
    try { localStorage.setItem(keyFor(active),JSON.stringify(state)); } catch { storageWorks = false; }
  }
  const announce = text => {document.getElementById('announcer').textContent = text;};
  function button(label,action,extra='') {
    return `<button class="primary" type="button" data-action="${action}" ${extra}>${esc(label)}</button>`;
  }
  function crumb(a,b) {
    return `<div class="eyebrow"><span class="square" aria-hidden="true"></span>${esc(a)}<span class="sep" aria-hidden="true">/</span>${esc(b)}</div>`;
  }
  function complete(m){return read(m).done===m.steps.length;}
  function marker(m){
    const rec=read(m);
    if(rec.done===m.steps.length) return '已結案';
    return rec.done || rec.stage!=='intro' || rec.readNotes || Object.values(rec.picks).some(p=>p.some(Number.isInteger)) ? '調查中':'未開始';
  }
  function totals(){
    let xp=0, cards=0, solved=0;
    const byGrade = {};
    const byBook = {};
    for(const m of missions){
      const n=read(m).done;
      const done = n===m.steps.length;
      solved+=Number(done);
      cards+=n;
      xp+=m.steps.slice(0,n).reduce((sum,step)=>sum+step.reward,0);
      const g = byGrade[m.grade] || (byGrade[m.grade] = {done:0,total:0});
      g.total++; if(done) g.done++;
      const bk = byBook[m.book] || (byBook[m.book] = {done:0,total:0});
      bk.total++; if(done) bk.done++;
    }
    const bonusXp = coach ? coach.getProfile().bonusXp : 0;
    return {xp: xp + bonusXp, caseXp: xp, bonusXp, cards, solved, byGrade, byBook};
  }

  function linkTo(m){return '#case/'+m.id;}
  function bookLabel(b){return catalog.books[b]?.[0] || b;}
  function groupLabel(m){return bookLabel(m.book);}
  function nextMission(){
    const others=missions.filter(m=>m.id!==active.id && !complete(m));
    return others.find(m=>m.book===active.book) || others[0];
  }
  function selection(){
    const q=filters.query.trim().toLocaleLowerCase();
    return missions.filter(m=>{
      if (filters.grade!=='全部' && m.grade!==filters.grade) return false;
      if (filters.book!=='全部' && m.book!==filters.book) return false;
      if (filters.term && /^[123]/.test(filters.book) && m.examTerm!==filters.term) return false;
      if (filters.status!=='全部' && marker(m)!==filters.status) return false;
      if (!q) return true;
      const k = m.steps[0]?.knowledge;
      const gIdx = Number(m.book[0]) - 1;
      const aliases = /^[123]/.test(m.book)
        ? [`國${['一','二','三'][gIdx]}${m.book[1]}`, `${['七','八','九'][gIdx]}年級${m.book[1]}冊`, `${['七','八','九'][gIdx]}${m.book[1]}`]
        : [];
      const haystack = [
        m.title, m.unit, m.skill, m.grade, m.book, groupLabel(m),
        k?.author || '', k?.genre || '', ...aliases
      ].join(' ').toLocaleLowerCase();
      return haystack.includes(q);
    });
  }
  function results(){
    const rows=selection();
    filters.page=Math.min(filters.page,Math.max(0,Math.ceil(rows.length/perPage)-1));
    const visible=rows.slice(filters.page*perPage,(filters.page+1)*perPage);
    const termLabels = ['', '一次段考', '二次段考', '三次段考'];
    const cards=visible.map(m=>{
      const status=marker(m);
      const lead=m.steps[0].art.cast[0];
      const k = m.steps[0].knowledge;
      const tags = [
        m.examTerm ? termLabels[m.examTerm] : '',
        k?.author && k.author !== '語文常識百分百' ? k.author : '',
        k?.phonetics?.length ? `${k.phonetics.length}字卡` : '',
        k?.idioms?.length ? `${k.idioms.length}成語` : ''
      ].filter(Boolean);
      return `<a href="${linkTo(m)}" class="mission-card" data-mission="${m.id}"><span class="card-cover" aria-hidden="true"><img class="cover-thumb" src="${scenery(m.steps[0])}" alt="" loading="lazy">${sprite(lead.id,'cover-guide',lead.look)}</span><span class="card-meta"><small>${esc(groupLabel(m))}</small><span class="case-status s${['未開始','調查中','已結案'].indexOf(status)}">${status}</span></span><h3>${esc(m.title)}</h3><p>${esc(m.unit)}</p>${tags.length?`<span class="card-tags">${tags.slice(0,3).map(t=>`<em>${esc(t)}</em>`).join('')}</span>`:''}<span class="card-foot"><span>${esc(m.skill)}</span><b>${m.steps.length*40} XP</b></span></a>`;
    }).join('');
    return `<div class="result-count" role="status">找到 ${rows.length} 件案件${rows.length?`，顯示第 ${filters.page*perPage+1}–${filters.page*perPage+visible.length} 件`:''}</div><div class="mission-grid">${cards}</div>${!rows.length?'<div class="empty"><h3>這個篩選條件下沒有案件</h3><p>可以換個課名、作者或回到全部案件。</p><button class="quiet" data-action="clearfilters">顯示全部案件</button></div>':''}${rows.length>perPage?`<div class="pager"><button class="quiet" data-action="prevpage" ${filters.page===0?'disabled':''}>上一頁</button><span>第 ${filters.page+1} / ${Math.ceil(rows.length/perPage)} 頁</span><button class="quiet" data-action="nextpage" ${(filters.page+1)*perPage>=rows.length?'disabled':''}>下一頁</button></div>`:''}`;
  }
  function textbookShelfBar(stats) {
    const booksList = [
      {key:'1上', grade:'七年級', title:'7上', sub:'夏夜・背影・論語'},
      {key:'1下', grade:'七年級', title:'7下', sub:'五柳先生・近體詩'},
      {key:'2上', grade:'八年級', title:'8上', sub:'愛蓮說・田園之秋'},
      {key:'2下', grade:'八年級', title:'8下', sub:'木蘭詩・陋室銘'},
      {key:'3上', grade:'九年級', title:'9上', sub:'詞選・生於憂患'},
      {key:'3下', grade:'九年級', title:'9下', sub:'元曲選・鄒忌諷諫'},
      {key:'語文常識', grade:'語文常識', title:'語文常識', sub:'修辭・文法・應用文'}
    ];
    return `<section class="book-strip" aria-label="各冊課本學習進度">
      <div class="strip-head"><h2>課本進度導覽</h2><span>點擊冊別直接對照國文課本複習</span></div>
      <div class="book-cards">${booksList.map(b => {
        const isTopic = b.key === '語文常識';
        const st = isTopic ? (stats.byGrade['語文常識'] || {done:0,total:0}) : (stats.byBook[b.key] || {done:0,total:0});
        const activeBtn = isTopic ? (filters.grade === '語文常識' && filters.book === '全部') : (filters.book === b.key);
        return `<button type="button" class="book-chip${activeBtn?' active':''}" data-action="quickBook" data-grade="${b.grade}" data-book="${isTopic?'全部':b.key}">
          <div class="book-chip-top"><strong>${b.title}</strong><span>${st.done}/${st.total}</span></div>
          <small>${b.sub}</small>
          <progress value="${st.done}" max="${Math.max(1,st.total)}"></progress>
        </button>`;
      }).join('')}</div>
    </section>`;
  }
  function dailyQuestBar() {
    if (!coach) return '';
    const p = coach.getProfile();
    const todayCase = coach.dailyMission(missions, complete);
    const k = todayCase.steps[0]?.knowledge;
    return `<section class="daily-bar" aria-label="今日偵探委託">
      <div class="daily-card">
        <div class="daily-tag">${p.daily?.caseDone ? '✓ 今日案件已完成' : '📌 今日推薦課本案件'}</div>
        <h3>${esc(bookLabel(todayCase.book))}・${esc(todayCase.unit)}</h3>
        <p>${esc(todayCase.title)}${k?.author ? `（${esc(k.author)}）` : ''} — 內含課本重點、翻翻字卡與 10 道推理舉證題。</p>
        <div class="daily-actions">
          <a class="primary" href="${linkTo(todayCase)}">立即查案</a>
          <a class="quiet" href="#arena/case/${esc(todayCase.id)}">⚡ 本課快篩</a>
        </div>
      </div>
      <div class="daily-card arena-card">
        <div class="daily-tag">${p.daily?.arenaDone ? '✓ 今日特訓已完成' : '🔥 3 分鐘特訓競技場'}</div>
        <h3>形音義・成語配對・修辭雷達・會考模擬</h3>
        <p>不想一次寫長文章？先來玩 1 分鐘快問快答或翻牌配對，連擊衝高分拿勳章！${p.mistakes.length ? ` 目前錯題室還有 <b>${p.mistakes.length}</b> 題等你雪恥。` : ''}</p>
        <div class="daily-actions">
          <a class="primary" href="#arena">進入特訓競技場</a>
          ${p.mistakes.length ? `<a class="quiet" href="#journal">📝 重審 ${p.mistakes.length} 題錯題</a>` : ''}
        </div>
      </div>
    </section>`;
  }
  function lobby(){
    const last=directory.get(lastId);
    const resume=last && !complete(last);
    const featured=resume?last:missions[0];
    const featuredStep=featured.steps[read(featured).station];
    const [lead, partner]=featuredStep.art.cast;
    const grades=['全部','七年級','八年級','九年級','語文常識','經典長案'];
    const groups=Array.from(new Set(missions.filter(m=>filters.grade==='全部'||m.grade===filters.grade).map(m=>m.book)));
    const options=(list,v,label)=>list.map(x=>`<option value="${esc(x)}" ${x===v?'selected':''}>${esc(label(x))}</option>`).join('');
    const stats = totals();
    const isBook = /^[123]/.test(filters.book);
    return `${header('案件大廳','國文偵探社',`${missions.length} 件課本與專題案件`)}
      <section class="lobby-top"><div class="desk-scene" style="--cover:url('${scenery(featuredStep)}')"><div class="desk-story"><small>${resume?'繼續上次調查':'經典長案'}</small><h2>${esc(featured.title)}</h2><p>${esc(featured.unit)} · ${esc(featured.skill)}</p><a class="primary" href="${linkTo(featured)}">${resume?'繼續調查':complete(featured)?'查看結案紀錄':'打開卷宗'}</a></div>${sprite(lead.id,'desk-detective',lead.look)}${sprite(partner.id,'desk-partner',partner.look)}</div>${stat(stats)}</section>
      ${dailyQuestBar()}
      ${textbookShelfBar(stats)}
      <section class="case-directory" id="directory"><div class="directory-head"><h2>選擇課本案件</h2><span>配合翰林國中六冊課本與語文常識 · 各案獨立存檔</span></div><div class="shelves" aria-label="年級與專區">${grades.map(g=>`<button type="button" class="shelf" data-action="grade" data-grade="${esc(g)}" aria-pressed="${g===filters.grade}">${g}</button>`).join('')}</div><div class="filters"><label>搜尋案件、課名或作者<input type="search" id="case-search" placeholder="輸入課名（如背影、論語）、作者或修辭" value="${esc(filters.query)}"></label><label>教材冊別<select id="book-filter">${options(['全部',...groups],filters.book,x=>x==='全部'?'全部教材':catalog.books[x]?.[0]||x)}</select></label><label>辦案狀態<select id="status-filter">${options(['全部','未開始','調查中','已結案'],filters.status,x=>x==='全部'?'全部狀態':x)}</select></label></div>${isBook?`<div class="term-bar"><span>段考範圍速篩：</span>${[[0,'全冊'],[1,'第一次段考'],[2,'第二次段考'],[3,'第三次段考']].map(([val,lbl])=>`<button type="button" class="q-chip" data-action="lobbyTerm" data-term="${val}" aria-pressed="${filters.term===val}">${lbl}</button>`).join('')}</div>`:''}<div id="case-results">${results()}</div></section>`;
  }
  function showMission(){
    const next=selectFromHash()||missions[0];active=next;cases=next.steps;practice=false;state=read();
    noteTab = 'textbook';
    sessionCombo = 0;
    lastId=next.id;
    try {localStorage.setItem(lastKey,lastId);} catch {storageWorks=false;}
  }
  function stat(precomputed){
    const stats = precomputed || totals();
    const {xp,solved,cards} = stats;
    const rank = coach ? coach.rankForXp(xp) : {level:1+Math.floor(xp/120), title:'見習偵探', inLevel:xp%120, need:120};
    const p = coach ? coach.getProfile() : null;
    const badges = coach ? coach.computeBadges(stats) : [];
    const unlocked = badges.filter(b => b.ok).length;
    const masteredCnt = p ? Object.keys(p.mastered).length : 0;
    return `<section class="status-card">
      <div class="status-top"><div class="mini-avatar">${sprite('detective')}</div><div><small>偵探階級${p?.streak?.count ? ` · 🔥 連續 ${p.streak.count} 天` : ''}</small><h3><b>Lv.${rank.level}</b> ${esc(rank.title)}</h3></div></div>
      <div class="meter-label"><span>累積經驗</span><strong>${xp} XP</strong></div>
      <progress aria-label="升級經驗進度" value="${rank.inLevel}" max="${rank.need}"></progress>
      <div class="meter-label bottom-meter"><span>${solved} / ${missions.length} 件結案</span><span>${cards} 知識卡</span></div>
      <div class="stat-pills"><span>🏅 ${unlocked}/${badges.length} 勳章</span><span>🃏 ${masteredCnt} 熟記詞</span>${p?.mistakes?.length ? `<span>📝 ${p.mistakes.length} 錯題</span>` : '<span>✨ 0 錯題</span>'}</div>
    </section>`;
  }
  function side(){
    const previous=read(active);
    const rows=cases.map((c,i)=>`<li class="${i<state.done?'cleared':i===state.done?'active':'pending'}"><span class="node">${i<state.done?'✓':num(i+1)}</span><div><strong>${esc(c.location)}</strong><small>${esc(c.lessonTitle)}</small></div></li>`).join('');
    return `<aside aria-label="偵探進度">${stat()}<section class="route"><div class="route-head"><h2>本案線索</h2><span>${num(previous.done)} / ${num(cases.length)}</span></div><ol>${rows}</ol><a href="#arena/case/${esc(active.id)}" class="journal-link arena-side-link">⚡ 本課快篩小遊戲</a><a href="#lobby" class="journal-link">返回案件大廳</a></section></aside>`;
  }
  function header(title,section,detail) {
    const motionOptions=[['auto','依系統'],['play','播放'],['still','靜止']].map(([value,label])=>
      `<option value="${value}" ${castMotion===value?'selected':''}>${label}</option>`).join('');
    const sfxMuted = coach ? coach.sfx.isMuted() : true;
    const curFont = fontSizes[fontIdx];
    return `<div class="page-heading"><div>${crumb(section,detail)}<h1>${esc(title)}</h1></div><div class="page-tools"><div class="font-sizer" role="group" aria-label="全站字體大小調整"><span>字體</span><button type="button" data-action="fontDec" aria-label="縮小字體" ${fontIdx===0?'disabled':''}>A−</button><button type="button" class="font-cur" data-action="fontReset" title="點擊恢復標準字體" aria-label="目前字體：${curFont.label}，點擊重設為標準">${curFont.label}</button><button type="button" data-action="fontInc" aria-label="放大字體" ${fontIdx===fontSizes.length-1?'disabled':''}>A+</button></div><button type="button" class="sfx-toggle" data-action="toggleSfx" aria-pressed="${!sfxMuted}" title="切換答題音效">${sfxMuted?'🔇 靜音':'🔊 音效'}</button><label class="motion-choice">角色動畫<select id="cast-motion">${motionOptions}</select></label><span class="save-state"><i></i>${storageWorks?'進度存於此瀏覽器':'本次遊玩進度'}</span></div></div>`;
  }
  function scene(c) {
    const art=c.art;
    const actors=art.cast.map(({id,look},i)=>{
      const lead=i===0;
      const name=esc(person(id).name);
      const label=lead?`與${name}交談，閱讀調查筆記`:`向${name}詢問卷宗物件`;
      return `<button type="button" class="actor-action ${lead?'lead':'partner'} ${id}" data-action="${lead?'read':'inspectProp'}" aria-label="${label}"><span class="talk-mark" aria-hidden="true">${lead?'⋯':'?'}</span>${sprite(id,'',look)}</button>`;
    }).join('');
    const lines=art.cast.map(({id},i)=>
      `<li class="scene-line"><b>${esc(person(id).name)}</b><p>${esc(c.opening[i])}</p></li>`
    ).join('');
    return `<div class="scene opening-play" data-setting="${art.setting}" role="group" aria-label="單元取景・${esc(art.vista)}">
      <div class="scene-visual"><img class="scene-art" src="${scenery(c)}" alt="">
        <div class="actors">${actors}</div>
        <div class="scene-tools"><div class="place"><i class="pin" aria-hidden="true"></i><span>單元取景</span>${esc(art.vista)}</div><button type="button" class="scene-replay" data-action="replayOpening"><span aria-hidden="true">↻</span> 重播開場</button></div>
      </div>
      <ol class="scene-lines" aria-label="現場對話">${lines}</ol>
    </div>`;
  }
  function intro(c) {
    const partner=c.art.cast[1];
    const propIndex=props.indexOf(c.art.prop);
    const k = c.knowledge;
    const quickChips = k ? [
      k.author && k.author !== '語文常識百分百' ? `✍️ 作者：${k.author}` : '',
      k.phonetics?.length ? `🔤 形音義 ${k.phonetics.length} 筆` : '',
      k.idioms?.length ? `🏮 成語 ${k.idioms.length} 則` : '',
      k.rhetoric?.length ? `🎨 修辭 ${k.rhetoric.length} 句` : ''
    ].filter(Boolean) : [];
    return `<section class="game-panel">${steps(c)}${scene(c)}<div class="dialogue"><h2>${esc(c.title)}</h2><div class="visit-location">辦案地點　${esc(c.location)}</div>${quickChips.length?`<div class="intro-chips">${quickChips.map(x=>`<span>${esc(x)}</span>`).join('')}</div>`:''}<p>${esc(c.teaser)}</p><details class="prop-file"><summary><i class="prop-icon" style="background-position-x:${propIndex*100/(props.length-1)}%" aria-hidden="true"></i>${esc(c.art.detail)}</summary><p><b>${esc(person(partner.id).name)}</b>　${esc(person(partner.id).tip)}</p></details><div class="dialogue-actions">${button('閱讀課本重點與字卡','read')}<button type="button" class="quiet" data-action="openPuzzle">直接開始解謎</button><a class="quiet" href="#arena/case/${esc(active.id)}">⚡ 本課快篩特訓</a><span>${practice?'已收錄的案件，這次練習推理':`掌握本關可獲 <b>${c.reward} XP</b>`}</span></div></div></section>`;
  }
  function revisit(c) {
    const [lead,partner]=c.art.cast;
    return `<button type="button" class="scene-return" data-action="returnScene" aria-label="回到${esc(c.art.vista)}，查看本案現場"><img class="scene-strip" src="${scenery(c)}" alt=""><span class="revisit-label"><strong>${esc(c.art.vista)}</strong><small>${esc(person(lead.id).name)}、${esc(person(partner.id).name)}同行</small></span><span class="revisit-link">回到現場 ›</span></button>`;
  }
  function tally(c,key) { return c.banks[key].filter((q,i)=>state.picks[key][i]===q.correct).length; }
  function checklist(c) {
    return [
      {key:'notes', label:'讀重點', detail: state.readNotes?'已讀完':'待確認閱讀', done:state.readNotes},
      ...[['question','解謎題'],['evidence','找證據']].map(([key,label])=>{
        const count=tally(c,key), total=c.banks[key].length;
        return {key,label,detail:`${count} / ${total} 題答對`,done:count===total};
      })
    ];
  }
  function steps(c) {
    const rows=[...checklist(c),{key:'reward',label:'取線索',done:index()<state.done}];
    return `<nav class="step-nav" aria-label="本關學習步驟"><ol class="steps">${rows.map((r,i)=>`<li><button type="button" data-action="stage" data-stage="${r.key}" class="step-tab${r.done?' was':''}${state.stage===r.key?' current':''}" ${state.stage===r.key?'aria-current="step"':''}><i aria-hidden="true">${r.done?'✓':i+1}</i>${r.label}${r.done?'<span class="sr">，已完成</span>':''}</button></li>`).join('')}</ol></nav>`;
  }
  function noteContents(c) {
    return `<div class="paper note full-notes">${c.notes.map((n,i)=>`<section><h3>${esc(i===0 && n.term===c.lessonTitle?'核心概念':n.term)}</h3><p>${multi(n.body)}</p></section>`).join('')}</div>`;
  }
  function itemLabel(key, position) {
    const earlier=cases.slice(0,index()).reduce((count,step)=>count+step.banks[key].length,0);
    return (key==='evidence'?'證據':'謎題') + (earlier+position+1);
  }
  function notePage(c) {
    const label=itemLabel(state.lastBank,state.cursors[state.lastBank]);
    const richNotes = coach
      ? coach.renderTextbookNotePanel(active, c, noteTab, noteContents(c))
      : noteContents(c);
    return `<section class="task-panel">${steps(c)}<div class="task-inner">${crumb(c.location,'課本情報袋與調查筆記')}<h2>${esc(active.unit)} · ${esc(c.lessonTitle)}</h2>${richNotes}<div class="task-actions">${button(`${state.readNotes?'回到':'已讀完，前往'}${label}`,'markRead')}</div></div></section>`;
  }
  function quiz(c,key) {
    const bank=c.banks[key], pos=state.cursors[key], q=bank[pos], choice=state.picks[key][pos];
    const good=choice===q.correct;
    const feedback=Number.isInteger(choice)?`<div role="status" class="feedback ${good?'good':'retry'}">${sprite(c.speaker,'helper',c.art.cast[0].look)}<div><b>${good?(sessionCombo>=3?`判斷神準！🔥 ${sessionCombo} 連擊！`:'判斷正確'):'再查一處線索（已加入錯題鑑識室）'}</b><p>${esc(q.options[choice].feedback)}</p></div></div>`:'';
    const nextLabel=pos<bank.length-1?`前往${itemLabel(key,pos+1)}`:(key==='question'?'前往找證據':'查看領取條件');
    const explanation=Number.isInteger(choice) && !good
      ? `<details class="case-review answer-explanation"><summary>看這題解析</summary><p>${multi(q.options[q.correct].feedback)}</p></details>` : '';
    const record=q.scene ? `<div class="paper record"><small>${pos?'閱讀材料':'現場紀錄'}</small><p>${multi(q.scene)}</p></div>` : '';
    return `<section class="task-panel">${steps(c)}<div class="task-inner">${crumb(c.location,key==='question'?'解謎題':'找證據')}<div class="question-index" role="group" aria-label="${key==='question'?'選擇謎題':'選擇證據'}">${bank.map((item,i)=>{
      const right=state.picks[key][i]===item.correct;
      return `<button type="button" class="q-chip" data-action="jump" data-i="${i}" aria-pressed="${pos===i}" aria-label="${itemLabel(key,i)}${right?'，已答對':''}">${right?'<span aria-hidden="true">✓ </span>':''}${itemLabel(key,i)}</button>`;
    }).join('')}<span>${sessionCombo>=2?`<em class="combo-chip inline">🔥 ${sessionCombo} 連擊</em> `:''}${tally(c,key)} / ${bank.length} 題答對</span></div><h2>${multi(q.prompt)}</h2>${record}<div class="options" aria-label="作答選項">${q.options.map((o,i)=>`<button type="button" data-action="pick" data-i="${i}" aria-pressed="${choice===i}" class="option ${choice===i?(good?'right':'wrong'):''}"><span>${String.fromCharCode(65+i)}</span>${esc(o.text)}</button>`).join('')}</div>${feedback}${explanation}<div class="task-actions"><button class="quiet" type="button" data-action="stage" data-stage="notes">回看課本重點</button>${button(nextLabel,'nextQuestion')}</div></div></section>`;
  }
  function rewardPage(c) {
    if (index()<state.done) return `<section class="task-panel">${steps(c)}<div class="task-inner reward"><div class="medal">${sprite(c.speaker,'',c.art.cast[0].look)}</div><div class="eyebrow">線索已取得</div><h2>${esc(c.lessonTitle)}</h2><div class="xp-gain">${practice?'複習完成':`本線索已入帳 ${c.reward} XP`}</div><div class="paper record"><small>寫入調查紀錄</small><p>${multi(c.finding)}</p></div><div class="task-actions">${button(state.done===cases.length?'查看結案報告':`前往下一站・${cases[state.done].location}`,'forward')}</div></div></section>`;
    const required=checklist(c), ready=required.every(r=>r.done);
    return `<section class="task-panel">${steps(c)}<div class="task-inner">${crumb(c.location,'取線索')}<h2>${ready?'可以領取本關線索了':'你的調查進度'}</h2><p>${ready?'卷宗已備齊，收下線索即可查看本案的新發現。':'讀完筆記，解開全部謎題並找齊證據，即可打開線索。點選下方項目可回去補齊。'}</p><ul class="checklist">${required.map(r=>`<li><button type="button" data-action="stage" data-stage="${r.key}"><strong>${r.done?'✓ ':''}${r.label}</strong><span>${r.detail} ›</span></button></li>`).join('')}</ul>${ready?`<div class="task-actions">${button(practice?'完成複習並查看線索':`領取線索與 ${c.reward} XP`,'claim')}</div>`:''}</div></section>`;
  }
  function closed(){
    const next=nextMission();
    const team=new Map(cases.flatMap(c=>c.art.cast).map(member=>[member.id,member]));
    return `<section class="task-panel">${steps(cases[index()])}<div class="task-inner ending">${crumb(groupLabel(active),'案件已結')}<div class="lineup">${Array.from(team.values(),m=>sprite(m.id,'',m.look)).join('')}</div><h2>《${esc(active.title)}》結案</h2><p>${multi(cases[cases.length-1].finding)}</p><div class="result">${cases.length} 張知識卡　·　${xpAt(cases.length)} XP</div>${cases.length>1?`<h3>證據如何連成答案</h3><ol class="end-log">${cases.map(c=>`<li><b>${esc(c.location)}</b><p>${esc(c.finding)}</p></li>`).join('')}</ol>`:`<details class="case-review"><summary>回顧本案的關鍵證據</summary><p>${esc(cases[0].evidenceOptions[cases[0].evidenceCorrect].text)}</p><p>${esc(cases[0].options[cases[0].correct].feedback)}</p></details>`}<div class="ending-nav"><a href="#arena/case/${esc(active.id)}" class="primary">⚡ 玩本課快篩特訓</a><a href="#lobby" class="quiet">回大廳選案</a><button data-action="practice" class="quiet">再練一次</button></div>${next?`<a class="next-case" href="${linkTo(next)}">下一件可查的案件 · ${esc(next.title)}</a>`:'<p class="all-solved">所有案件已結案！可在偵探手冊複習知識卡。</p>'}</div></section>`;
  }
  function field() {
    const c=cases[index()]; let center='';
    switch (state.stage) {
      case 'notes': center=notePage(c); break;
      case 'question': case 'evidence': center=quiz(c,state.stage); break;
      case 'reward': center=rewardPage(c); break;
      case 'closed': center=closed(); break;
      default: center=intro(c);
    }
    return `${header(active.title,groupLabel(active),practice?'複習中':active.unit)}<div class="game-layout"><div>${state.stage==='intro'?'':revisit(c)}${center}</div>${side()}</div>`;
  }
  function journal(){
    const stats = totals();
    const collected=missions.flatMap(m=>m.steps.slice(0,read(m).done).map(c=>({m,c})));
    const p = coach ? coach.getProfile() : {mistakes:[], mastered:{}};
    const badges = coach ? coach.computeBadges(stats) : [];
    const unlockedCount = badges.filter(b => b.ok).length;

    const subTabs = `<div class="note-tabs journal-tabs" role="tablist" aria-label="偵探手冊分頁">
      <button type="button" role="tab" class="note-tab${journalTab==='cards'?' active':''}" data-action="journalTab" data-tab="cards" aria-selected="${journalTab==='cards'}">🃏 知識卡圖鑑 (${collected.length})</button>
      <button type="button" role="tab" class="note-tab${journalTab==='mistakes'?' active':''}" data-action="journalTab" data-tab="mistakes" aria-selected="${journalTab==='mistakes'}">📝 錯題鑑識室 (${p.mistakes.length})</button>
      <button type="button" role="tab" class="note-tab${journalTab==='badges'?' active':''}" data-action="journalTab" data-tab="badges" aria-selected="${journalTab==='badges'}">🏅 偵探勳章牆 (${unlockedCount}/${badges.length})</button>
    </div>`;

    let body = '';
    if (journalTab === 'mistakes') {
      body = p.mistakes.length
        ? `<div class="mistake-banner"><div><strong>共有 ${p.mistakes.length} 題待重審錯題</strong><p>進入特訓競技場一次重審，答對就會自動移出錯題本！</p></div><button type="button" class="primary" data-action="startMistakeReview">⚡ 立即重審錯題</button></div>
          <div class="journal-stack">${p.mistakes.map(ms => `<article class="journal-card mistake-item">
            <div class="card-meta"><small>${esc(ms.book ? `${bookLabel(ms.book)}・${ms.unit}` : ms.missionTitle)} · ${esc(ms.tag)}</small><button type="button" class="quiet mini-btn" data-action="dismissMistake" data-id="${esc(ms.id)}">✓ 已掌握移出</button></div>
            <h3>${multi(ms.prompt)}</h3>
            ${ms.scene ? `<div class="paper record"><p>${multi(ms.scene)}</p></div>` : ''}
            <p class="mistake-ans"><b>正解：</b>${esc(ms.options?.[ms.correct] || '')}</p>
            ${ms.why ? `<p class="mistake-why">${esc(ms.why)}</p>` : ''}
            ${ms.missionId ? `<a href="#case/${esc(ms.missionId)}" class="next-case">回到原案複習 ›</a>` : ''}
          </article>`).join('')}</div>`
        : `<div class="journal-card"><h2>錯題鑑識室空空如也！</h2><p>目前沒有待複習的錯題。去案件大廳或特訓競技場挑戰看看吧，答錯的題目會自動幫你收錄在這裡！</p><a href="#arena" class="primary">前往特訓競技場</a></div>`;
    } else if (journalTab === 'badges') {
      body = `<div class="badge-grid">${badges.map(b => `<article class="badge-card${b.ok?' unlocked':''}">
        <div class="badge-ico" aria-hidden="true">${b.icon}</div>
        <div>
          <strong>${esc(b.name)}</strong>
          <p>${esc(b.desc)}</p>
          <small>${b.ok ? '✓ 已解鎖' : '尚未解鎖'}</small>
        </div>
      </article>`).join('')}</div>`;
    } else {
      body = `<div class="journal-stack">${collected.length?collected.map(({m,c})=>`<details class="journal-card"><summary><small>${esc(groupLabel(m))}　·　${esc(m.unit)}</small><strong>${esc(c.lessonTitle)}</strong></summary><p>${esc(c.finding)}</p>${c.knowledge?.main?`<div class="tb-main"><small>課本重點摘要</small><p>${esc(c.knowledge.main)}</p></div>`:''}${noteContents(c)}<a href="${linkTo(m)}" class="next-case">查看案件 · ${esc(m.title)}</a></details>`).join(''):`<div class="journal-card"><h2>第一張知識卡會記下什麼？</h2><p>完成任一案件的推理與舉證，就能在這裡翻閱讀法、課本重點與調查發現。</p></div>`}<a href="#lobby" class="primary">回大廳選案</a></div>`;
    }

    return `${header('偵探手冊','個人檔案',`已收錄 ${collected.length} 張知識卡 · ${unlockedCount} 枚勳章`)}<div class="game-layout"><div>${subTabs}${body}</div><aside>${stat(stats)}</aside></div>`;
  }
  function roster() {
    return `${header('角色檔案','國文偵探社','調查小隊')}<div class="costume-select" aria-label="預覽角色服裝">${Object.entries(looks).map(([id,label])=>`<button type="button" class="q-chip" data-action="rosterLook" data-look="${id}" aria-pressed="${rosterLook===id}">${label}</button>`).join('')}</div><div class="crew-grid">${Object.entries(crew).map(([id,p])=>`<article class="crew-card"><div class="portrait">${sprite(id,'',rosterLook)}</div><small>${esc(p.role)}</small><h2>${esc(p.name)}</h2><p>${esc(p.bio)}</p></article>`).join('')}</div><a href="#lobby" class="quiet back-link">回大廳選案</a>`;
  }
  function arenaPage() {
    if (!coach) return lobby();
    return coach.renderArenaPage(missions, header('特訓競技場','國文課本快篩實戰','形音義・成語配對・修辭雷達・會考模擬'));
  }
  function render(focus=false) {
    const page=tab();
    document.querySelectorAll('[data-tab]').forEach(el=>{
      if (el.dataset.tab===(page==='field'?'lobby':page)) el.setAttribute('aria-current','page');
      else el.removeAttribute('aria-current');
    });
    main.innerHTML=page==='lobby'?lobby():page==='field'?field():page==='arena'?arenaPage():page==='journal'?journal():roster();
    if (focus) {
      const heading=main.querySelector('.task-inner h2,.dialogue h2') || main.querySelector('h1');
      if (heading) {heading.tabIndex=-1; heading.focus({preventScroll:true});}
      const panel=main.querySelector('.task-panel,.game-panel') || main;
      if (panel.getBoundingClientRect().top<0) panel.scrollIntoView({block:'start'});
    }
  }
  function transition(stage) {
    if (stage==='question' || stage==='evidence') state.lastBank=stage;
    state.stage=stage; save(); render(true);
  }
  function syncRoute() {
    const page = tab();
    if (page === 'field') showMission();
    else if (page === 'arena' && coach) {
      if (location.hash.startsWith('#arena/case/')) {
        coach.openCaseArena(location.hash.slice('#arena/case/'.length));
      } else {
        coach.openGlobalArena();
      }
    }
  }
  window.addEventListener('hashchange',()=>{syncRoute(); render(); window.scrollTo(0,0);});
  window.addEventListener('storage',e=>{
    if(e.key===motionKey){applyCastMotion(e.newValue);return;}
    if(e.key===fontKey){const n=e.newValue===null?1:Number(e.newValue);applyFontSize(Number.isInteger(n)?n:1,false);render();return;}
    const changed=missions.find(m=>keyFor(m)===e.key);
    if (!changed) return;
    memory.delete(changed.id);
    if (changed===active && !practice) {state=read();}
    render();
  });
  // Keyboard shortcuts for smooth quiz solving (1-4 / A-D / Enter)
  window.addEventListener('keydown', e => {
    if (e.target && ['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key.toUpperCase();
    const mapIdx = {'1':0,'2':1,'3':2,'4':3,'A':0,'B':1,'C':2,'D':3};
    const page = tab();
    if (page === 'field' && ['question','evidence'].includes(state.stage)) {
      if (Object.hasOwn(mapIdx, key)) {
        const btn = main.querySelector(`button[data-action="pick"][data-i="${mapIdx[key]}"]`);
        if (btn) { e.preventDefault(); btn.click(); }
      } else if (e.key === 'Enter') {
        const btn = main.querySelector('button[data-action="nextQuestion"]');
        if (btn) { e.preventDefault(); btn.click(); }
      }
    } else if (page === 'arena') {
      if (Object.hasOwn(mapIdx, key)) {
        const btn = main.querySelector(`button[data-action="arenaPick"][data-i="${mapIdx[key]}"]:not(:disabled)`);
        if (btn) { e.preventDefault(); btn.click(); }
      } else if (e.key === 'Enter') {
        const btn = main.querySelector('button[data-action="arenaNext"]');
        if (btn) { e.preventDefault(); btn.click(); }
      }
    }
  });
  main.addEventListener('input',e=>{
    if(e.target.id!=='case-search') return;
    filters.query=e.target.value;filters.page=0;
    document.getElementById('case-results').innerHTML=results();
  });
  main.addEventListener('change',e=>{
    if(e.target.id==='cast-motion'){
      applyCastMotion(e.target.value);
      try{localStorage.setItem(motionKey,castMotion);} catch{}
      return;
    }
    if(e.target.id==='book-filter') { filters.book=e.target.value; filters.term=0; filters.page=0; render(); return; }
    else if(e.target.id==='status-filter') filters.status=e.target.value;
    else return;
    filters.page=0;document.getElementById('case-results').innerHTML=results();
  });
  main.addEventListener('click',e=>{
    const btn=e.target.closest('button[data-action]'); if(!btn) return;
    const c=cases[index()], action=btn.dataset.action;

    if (action === 'fontDec' || action === 'fontInc' || action === 'fontReset') {
      const nextIdx = action === 'fontReset' ? 1 : fontIdx + (action === 'fontInc' ? 1 : -1);
      applyFontSize(nextIdx, true);
      if (coach) coach.sfx.flip();
      render();
      announce(`全站字體已調整為「${fontSizes[fontIdx].label}」`);
      main.querySelector(`button[data-action="${action}"]`)?.focus({preventScroll:true});
      return;
    }
    if (action === 'toggleSfx' && coach) {
      coach.sfx.toggle(); render(); return;
    }
    if (coach && coach.handleArenaAction(action, btn, missions, render)) return;

    if (action === 'noteTab') {
      noteTab = btn.dataset.tab || 'textbook';
      if (coach) coach.sfx.flip();
      render();
      main.querySelector('.note-tab.active')?.focus({preventScroll:true});
      return;
    }
    if (action === 'flipCard') {
      const card = btn.closest('.flash-card');
      const flipped = card.classList.toggle('flipped');
      btn.setAttribute('aria-expanded', String(flipped));
      if (coach) coach.sfx.flip();
      return;
    }
    if (action === 'toggleMaster' && coach) {
      const on = coach.toggleMastered(btn.dataset.key);
      const card = btn.closest('.flash-card');
      card.classList.toggle('mastered', on);
      btn.classList.toggle('on', on);
      btn.textContent = on ? '✓ 已熟記' : '標記已熟記';
      const wrap = btn.closest('.cards-wrap');
      const totalCards = wrap.querySelectorAll('.flash-card').length;
      const doneCards = wrap.querySelectorAll('.flash-card.mastered').length;
      const meter = wrap.querySelector('.cards-meter b');
      if (meter) meter.textContent = String(doneCards);
      announce(on ? `已標記熟記，本區進度 ${doneCards} / ${totalCards}` : '已取消熟記標記');
      return;
    }
    if (action === 'journalTab') {
      journalTab = btn.dataset.tab || 'cards';
      render(); return;
    }
    if (action === 'dismissMistake' && coach) {
      coach.resolveMistake(btn.dataset.id);
      render(); return;
    }
    if (action === 'startMistakeReview' && coach) {
      location.hash = '#arena';
      coach.openGlobalArena();
      coach.handleArenaAction('arenaStart', {dataset:{mode:'mistakes'}}, missions, render);
      return;
    }
    if (action === 'quickBook') {
      filters.grade = btn.dataset.grade;
      filters.book = btn.dataset.book;
      filters.term = 0;
      filters.page = 0;
      render();
      main.querySelector('#directory')?.scrollIntoView({behavior:'smooth', block:'start'});
      return;
    }
    if (action === 'lobbyTerm') {
      filters.term = Number(btn.dataset.term) || 0;
      filters.page = 0;
      render(); return;
    }
    if(action==='grade'||action==='clearfilters'){
      if(action==='clearfilters') filters={grade:'全部',book:'全部',term:0,status:'全部',query:'',page:0};
      else {filters.grade=btn.dataset.grade;filters.book='全部';filters.term=0;filters.page=0;}
      render();main.querySelector('.shelf[aria-pressed="true"]')?.focus({preventScroll:true});return;
    }
    if(action==='nextpage'||action==='prevpage'){
      filters.page+=action==='nextpage'?1:-1;
      document.getElementById('case-results').innerHTML=results();
      const first=main.querySelector('.mission-card');first?.focus({preventScroll:true});first?.scrollIntoView({block:'nearest'});return;
    }
    if(action==='practice' && complete(active)){practice=true;state=fresh();render(true);return;}
    if (action==='replayOpening') {
      const opening=btn.closest('.scene');
      opening.classList.remove('opening-play');
      void opening.offsetWidth;
      opening.classList.add('opening-play');
      return;
    }
    if (action==='inspectProp') {
      const file=main.querySelector('.prop-file');
      file.open=true;file.querySelector('summary').focus(); return;
    }
    if (action==='rosterLook' && Object.hasOwn(looks,btn.dataset.look)) {
      rosterLook=btn.dataset.look; render(); main.querySelector('.costume-select [aria-pressed=true]').focus({preventScroll:true}); return;
    }
    if (action==='returnScene') return transition('intro');
    if (action==='openPuzzle') {
      const unfinished=c.banks.question.findIndex((q,i)=>state.picks.question[i]!==q.correct);
      state.cursors.question=unfinished<0?0:unfinished;
      return transition('question');
    }
    if (action==='read') return transition('notes');
    if (action==='stage' && ['notes','question','evidence','reward'].includes(btn.dataset.stage)) return transition(btn.dataset.stage);
    if (action==='markRead' && state.stage==='notes') {
      state.readNotes=true;
      return transition(state.lastBank);
    }
    if (['question','evidence'].includes(state.stage)) {
      const group=state.stage, bank=c.banks[group], pos=state.cursors[group], number=Number(btn.dataset.i);
      if (action==='jump' && bank[number]) {
        state.cursors[group]=number; save(); render(true); return;
      }
      if (action==='pick' && bank[pos].options[number]) {
        const q = bank[pos];
        const wasAlreadyRight = state.picks[group][pos] === q.correct;
        state.picks[group][pos]=number; save();
        if (number === q.correct) {
          if (!wasAlreadyRight) {
            sessionCombo += 1;
            if (coach) { coach.recordCombo(sessionCombo); coach.sfx.correct(sessionCombo); }
          }
        } else {
          sessionCombo = 0;
          if (coach) {
            coach.sfx.wrong();
            coach.recordMistake({
              missionId: active.id,
              missionTitle: active.title,
              book: active.book,
              unit: active.unit,
              tag: group === 'evidence' ? '找證據' : '解謎題',
              prompt: q.prompt,
              scene: q.scene || '',
              options: q.options.map(o => o.text),
              correct: q.correct,
              why: q.options[q.correct].feedback
            });
          }
        }
        render();
        const selected=main.querySelector('[data-action="pick"][aria-pressed="true"]');
        selected?.focus({preventScroll:true});
        main.querySelector('.feedback')?.scrollIntoView({block:'nearest'}); return;
      }
      if (action==='nextQuestion') {
        if (pos===bank.length-1) return transition(group==='question'?'evidence':'reward');
        state.cursors[group]++; save(); render(true); return;
      }
    }
    if (state.stage==='reward' && action==='claim' && index()===state.done && checklist(c).every(r=>r.done)) {
      state.done=index()+1; save();
      if (coach) { coach.sfx.victory(); if (!practice) coach.markDailyCase(); }
      render(true);
      announce(practice?'已完成複習。':`取得知識卡，增加 ${c.reward} XP。`); return;
    }
    if (state.stage==='reward' && action==='forward' && index()<state.done) {
      if (state.done===cases.length) return transition('closed');
      state={...fresh(),done:state.done,station:state.done}; save(); render(true);
    }
  });
  syncRoute();
  render();
})();
