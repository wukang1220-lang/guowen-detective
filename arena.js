// 國文偵探社 2.0：課本知識互動筆記、翻翻字卡、特訓競技場、錯題本、勳章與輕量音效引擎
(function initCoach() {
  'use strict';

  const COACH_KEY = 'guowen-detective.coach.v1';
  const SFX_KEY = 'guowen-detective.sfx.v1';
  const esc = x => String(x ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const multi = x => esc(x).replace(/\n/g, '<br>');
  const BOOK_LABELS = {'1上':'7上','1下':'7下','2上':'8上','2下':'8下','3上':'9上','3下':'9下'};
  const bookName = b => BOOK_LABELS[b] || b || '';

  function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function hashStr(s) {
    let h = 2166136261;
    for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return h >>> 0;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---------- Web Audio Tactile SFX ----------
  let audioCtx = null;
  let muted = false;
  try { muted = localStorage.getItem(SFX_KEY) === 'off'; } catch {}

  function ensureAudio() {
    if (muted) return null;
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audioCtx = new Ctx();
      }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch { return null; }
  }

  function tone(freq, startOffset, duration, type = 'triangle', gainVal = 0.08) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  const sfx = {
    isMuted: () => muted,
    toggle() {
      muted = !muted;
      try { localStorage.setItem(SFX_KEY, muted ? 'off' : 'on'); } catch {}
      if (!muted) tone(587.33, 0, 0.12, 'triangle', 0.06);
      return muted;
    },
    flip() { tone(440, 0, 0.07, 'sine', 0.045); },
    correct(combo = 1) {
      const shift = Math.min(combo - 1, 7) * 36;
      tone(523.25 + shift, 0, 0.13, 'triangle', 0.075);
      tone(659.25 + shift, 0.08, 0.18, 'triangle', 0.08);
    },
    wrong() {
      tone(220, 0, 0.14, 'sawtooth', 0.04);
      tone(185, 0.09, 0.18, 'sawtooth', 0.035);
    },
    match() {
      tone(587.33, 0, 0.11, 'triangle', 0.07);
      tone(783.99, 0.07, 0.14, 'triangle', 0.07);
      tone(1046.5, 0.14, 0.2, 'sine', 0.065);
    },
    victory() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.09, 0.24, 'triangle', 0.085));
    }
  };

  // ---------- Persistent Student Coach Profile ----------
  function defaultProfile() {
    return {
      bonusXp: 0,
      bestCombo: 0,
      arenaWins: 0,
      phoneticCorrect: 0,
      idiomMatches: 0,
      rhetoricCorrect: 0,
      mockBestGrade: '',
      mastered: {},
      mistakes: [],
      streak: { count: 0, lastDay: '' },
      daily: { day: todayStr(), caseDone: false, arenaDone: false }
    };
  }

  let profile = defaultProfile();
  function loadProfile() {
    try {
      const raw = JSON.parse(localStorage.getItem(COACH_KEY) || 'null');
      if (raw && typeof raw === 'object') {
        profile = { ...defaultProfile(), ...raw };
        if (!profile.mastered || typeof profile.mastered !== 'object') profile.mastered = {};
        if (!Array.isArray(profile.mistakes)) profile.mistakes = [];
        if (!profile.streak) profile.streak = { count: 0, lastDay: '' };
        if (!profile.daily || profile.daily.day !== todayStr()) {
          profile.daily = { day: todayStr(), caseDone: false, arenaDone: false };
        }
      }
    } catch {}
    touchStreak();
  }

  function saveProfile() {
    try { localStorage.setItem(COACH_KEY, JSON.stringify(profile)); } catch {}
  }

  function touchStreak() {
    const today = todayStr();
    if (profile.streak.lastDay === today) return;
    const yesterday = new Date(Date.now() - 86400000);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    if (profile.streak.lastDay === yStr) profile.streak.count += 1;
    else profile.streak.count = Math.max(1, profile.streak.lastDay ? 1 : 1);
    profile.streak.lastDay = today;
    saveProfile();
  }

  loadProfile();

  // ---------- Ranks & Badges ----------
  const RANKS = [
    [1, '見習偵探'], [2, '線索見習生'], [3, '語文小探員'], [4, '字詞鑑識員'],
    [5, '修辭觀察家'], [6, '成語破譯師'], [8, '文言解碼手'], [10, '校園名偵探'],
    [13, '國文特級探長'], [16, '會考先鋒官'], [20, '文壇傳奇神探']
  ];

  function rankForXp(xp) {
    const level = 1 + Math.floor(xp / 120);
    let title = RANKS[0][1];
    for (const [lv, name] of RANKS) {
      if (level >= lv) title = name;
    }
    const inLevel = xp % 120;
    return { level, title, inLevel, need: 120 };
  }

  function computeBadges(stats) {
    const masteredCount = Object.keys(profile.mastered).length;
    const gradeDone = g => stats.byGrade[g]?.done || 0;
    const gradeTotal = g => stats.byGrade[g]?.total || 1;
    const defs = [
      { id:'first', icon:'🔍', name:'初出茅廬', desc:'完成第 1 件國文案件', ok: stats.solved >= 1 },
      { id:'five', icon:'📁', name:'五案連破', desc:'累計結案 5 件案件', ok: stats.solved >= 5 },
      { id:'twenty', icon:'🗂️', name:'卷宗大師', desc:'累計結案 20 件案件', ok: stats.solved >= 20 },
      { id:'combo5', icon:'🔥', name:'推理神準', desc:'創下 5 題以上連擊紀錄', ok: profile.bestCombo >= 5 },
      { id:'combo10', icon:'⚡', name:'十連神斷', desc:'創下 10 題以上連擊紀錄', ok: profile.bestCombo >= 10 },
      { id:'card10', icon:'🃏', name:'翻卡達人', desc:'在翻翻字卡熟記 10 筆形音義或成語', ok: masteredCount >= 10 },
      { id:'card40', icon:'📚', name:'字詞寶庫', desc:'累計熟記 40 筆課本形音義或成語', ok: masteredCount >= 40 },
      { id:'phonetic', icon:'🔤', name:'形音義鷹眼', desc:'在特訓答對 15 題字音字形', ok: profile.phoneticCorrect >= 15 },
      { id:'idiom', icon:'🏮', name:'成語破譯師', desc:'在配對戰完成 18 組詞語配對', ok: profile.idiomMatches >= 18 },
      { id:'rhetoric', icon:'🎨', name:'修辭雷達', desc:'在修辭雷達答對 15 題課本原句', ok: profile.rhetoricCorrect >= 15 },
      { id:'arena3', icon:'🎯', name:'特訓常客', desc:'完成 3 場特訓競技場挑戰', ok: profile.arenaWins >= 3 },
      { id:'mockA', icon:'🏆', name:'會考精熟', desc:'在段考／會考模擬取得 A 以上等第', ok: ['A++', 'A+', 'A'].includes(profile.mockBestGrade) },
      { id:'mockApp', icon:'👑', name:'滿分神探', desc:'在段考／會考模擬考出 A++ 滿分', ok: profile.mockBestGrade === 'A++' },
      { id:'g7', icon:'🌱', name:'七年級制霸', desc:'完成七年級全部課本案件', ok: gradeDone('七年級') >= gradeTotal('七年級') },
      { id:'g8', icon:'🌿', name:'八年級制霸', desc:'完成八年級全部課本案件', ok: gradeDone('八年級') >= gradeTotal('八年級') },
      { id:'g9', icon:'🌳', name:'九年級制霸', desc:'完成九年級全部課本案件', ok: gradeDone('九年級') >= gradeTotal('九年級') }
    ];
    return defs;
  }

  // ---------- Mistakes & Mastery API ----------
  function recordMistake(item) {
    const id = item.id || ('m_' + hashStr((item.prompt || '') + '|' + (item.scene || '')));
    const idx = profile.mistakes.findIndex(x => x.id === id);
    const entry = {
      id,
      missionId: item.missionId || '',
      missionTitle: item.missionTitle || '',
      book: item.book || '',
      unit: item.unit || '',
      tag: item.tag || '閱讀推理',
      prompt: item.prompt,
      scene: item.scene || '',
      options: item.options,
      correct: item.correct,
      why: item.why || '',
      ts: Date.now()
    };
    if (idx >= 0) profile.mistakes.splice(idx, 1);
    profile.mistakes.unshift(entry);
    if (profile.mistakes.length > 80) profile.mistakes.length = 80;
    saveProfile();
  }

  function resolveMistake(id) {
    const before = profile.mistakes.length;
    profile.mistakes = profile.mistakes.filter(x => x.id !== id);
    if (profile.mistakes.length !== before) saveProfile();
  }

  function toggleMastered(key) {
    if (profile.mastered[key]) delete profile.mastered[key];
    else profile.mastered[key] = true;
    sfx.flip();
    saveProfile();
    return !!profile.mastered[key];
  }

  function isMastered(key) {
    return !!profile.mastered[key];
  }

  function recordCombo(n) {
    if (n > profile.bestCombo) {
      profile.bestCombo = n;
      saveProfile();
    }
  }

  function markDailyCase() {
    if (profile.daily.day !== todayStr()) profile.daily = { day: todayStr(), caseDone: false, arenaDone: false };
    profile.daily.caseDone = true;
    saveProfile();
  }

  function markDailyArena(xpGain) {
    if (profile.daily.day !== todayStr()) profile.daily = { day: todayStr(), caseDone: false, arenaDone: false };
    profile.daily.arenaDone = true;
    profile.arenaWins += 1;
    profile.bonusXp += xpGain;
    saveProfile();
  }

  function dailyMission(missions, isCompleteFn) {
    const textbookMissions = missions.filter(m => /^[123]/.test(m.book));
    const pool = textbookMissions.filter(m => !isCompleteFn(m));
    const list = pool.length ? pool : textbookMissions;
    if (!list.length) return missions[0];
    const seed = hashStr(todayStr() + '::daily');
    return list[seed % list.length];
  }

  // ---------- Rich 4-Tab Textbook Notes Renderer ----------
  function availableNoteTabs(step) {
    const k = step.knowledge;
    const tabs = [];
    if (k && (k.main || k.lines?.length || k.rhetoric?.length)) {
      tabs.push({ id: 'textbook', label: '課本重點', icon: '📖' });
    }
    if (k && (k.phonetics?.length || k.glossary?.length)) {
      const cnt = (k.phonetics?.length || 0) + (k.glossary?.length || 0);
      tabs.push({ id: 'cards', label: `形音義與注釋 (${cnt})`, icon: '🔤' });
    }
    if (k && k.idioms?.length) {
      tabs.push({ id: 'idioms', label: `成語大進擊 (${k.idioms.length})`, icon: '🏮' });
    }
    tabs.push({ id: 'method', label: '偵探讀法筆記', icon: '🔍' });
    return tabs;
  }

  function renderTextbookNotePanel(mission, step, activeTab, originalNotesHtml) {
    const tabs = availableNoteTabs(step);
    const current = tabs.some(t => t.id === activeTab) ? activeTab : tabs[0].id;
    const k = step.knowledge;
    const keyPrefix = `${mission.book}／${mission.unit}／`;

    const tabBar = `<div class="note-tabs" role="tablist" aria-label="調查筆記分頁">${tabs.map(t =>
      `<button type="button" role="tab" class="note-tab${t.id === current ? ' active' : ''}" data-action="noteTab" data-tab="${t.id}" aria-selected="${t.id === current}"><span aria-hidden="true">${t.icon}</span>${esc(t.label)}</button>`
    ).join('')}</div>`;

    let body = '';
    if (current === 'textbook' && k) {
      const metaBadges = [
        k.author ? `<span><b>作者</b> ${esc(k.author)}</span>` : '',
        k.genre ? `<span><b>文體</b> ${esc(k.genre)}</span>` : '',
        k.source ? `<span><b>出處</b> ${esc(k.source)}</span>` : ''
      ].filter(Boolean).join('');

      const featuresHtml = k.features?.length
        ? `<div class="tb-block"><h3>寫作特色與考點</h3><ul class="tb-list">${k.features.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>`
        : '';

      const linesHtml = k.lines?.length
        ? `<div class="tb-block"><h3>課文金句與解析</h3><div class="quote-list">${k.lines.map(l =>
            `<article class="quote-card"><blockquote>「${esc(l.q)}」</blockquote><p>${esc(l.a)}</p></article>`
          ).join('')}</div></div>`
        : '';

      const rhetHtml = k.rhetoric?.length
        ? `<div class="tb-block"><h3>課本必考修辭</h3><div class="rhet-grid">${k.rhetoric.map(r =>
            `<div class="rhet-card"><span class="rhet-pill">${esc(r.t)}</span><p>${esc(r.s)}</p></div>`
          ).join('')}</div></div>`
        : '';

      body = `<div class="tb-sheet">
        ${metaBadges ? `<div class="tb-meta">${metaBadges}</div>` : ''}
        ${k.main ? `<div class="tb-main"><small>課文主旨與核心知識</small><p>${esc(k.main)}</p></div>` : ''}
        ${featuresHtml}${linesHtml}${rhetHtml}
      </div>`;
    } else if (current === 'cards' && k) {
      const items = [
        ...(k.phonetics || []).map((p, i) => ({
          key: keyPrefix + 'ph_' + i + '_' + p.w,
          badge: p.k || '形音義',
          front: p.w,
          answer: p.a,
          back: p.d
        })),
        ...(k.glossary || []).map((g, i) => ({
          key: keyPrefix + 'gl_' + i + '_' + g.w,
          badge: '課本注釋',
          front: g.w,
          answer: '',
          back: g.d
        }))
      ];
      const doneCnt = items.filter(it => isMastered(it.key)).length;
      body = `<div class="cards-wrap">
        <div class="cards-head">
          <p>點擊卡片翻面看解答，背熟了就按「✓ 已熟記」！</p>
          <span class="cards-meter">已熟記 <b>${doneCnt}</b> / ${items.length}</span>
        </div>
        <div class="flash-grid">${items.map((it, idx) => {
          const mastered = isMastered(it.key);
          return `<div class="flash-card${mastered ? ' mastered' : ''}" data-card-idx="${idx}">
            <button type="button" class="flash-face" data-action="flipCard" aria-expanded="false">
              <span class="flash-badge ${it.badge === '課本注釋' ? 'gl' : it.badge === '字音' ? 'py' : 'ch'}">${esc(it.badge)}</span>
              <strong class="flash-front">${esc(it.front)}</strong>
              <span class="flash-hint">點我翻面看答案 ↻</span>
              <span class="flash-back">
                ${it.answer ? `<em class="flash-ans">${esc(it.answer)}</em>` : ''}
                <span>${esc(it.back)}</span>
              </span>
            </button>
            <button type="button" class="master-btn${mastered ? ' on' : ''}" data-action="toggleMaster" data-key="${esc(it.key)}">${mastered ? '✓ 已熟記' : '標記已熟記'}</button>
          </div>`;
        }).join('')}</div>
      </div>`;
    } else if (current === 'idioms' && k) {
      const items = (k.idioms || []).map((id, i) => ({
        key: keyPrefix + 'id_' + i + '_' + id.w,
        w: id.w,
        d: id.d
      }));
      const doneCnt = items.filter(it => isMastered(it.key)).length;
      body = `<div class="cards-wrap">
        <div class="cards-head">
          <p>本課必考成語大進擊！先想意思再點卡片揭曉釋義。</p>
          <span class="cards-meter">已熟記 <b>${doneCnt}</b> / ${items.length}</span>
        </div>
        <div class="flash-grid idiom-grid">${items.map((it, idx) => {
          const mastered = isMastered(it.key);
          return `<div class="flash-card${mastered ? ' mastered' : ''}" data-card-idx="${idx}">
            <button type="button" class="flash-face" data-action="flipCard" aria-expanded="false">
              <span class="flash-badge idm">本課成語</span>
              <strong class="flash-front">${esc(it.w)}</strong>
              <span class="flash-hint">點我揭曉釋義 ↻</span>
              <span class="flash-back"><span>${esc(it.d)}</span></span>
            </button>
            <button type="button" class="master-btn${mastered ? ' on' : ''}" data-action="toggleMaster" data-key="${esc(it.key)}">${mastered ? '✓ 已熟記' : '標記已熟記'}</button>
          </div>`;
        }).join('')}</div>
      </div>`;
    } else {
      body = originalNotesHtml;
    }

    const quickTrainCta = (k && (k.phonetics?.length || k.idioms?.length || k.rhetoric?.length || k.drills?.length || k.glossary?.length))
      ? `<div class="note-train-banner">
          <div>
            <strong>⚡ 讀完重點想馬上練手感？</strong>
            <p>進入本課專屬 1 分鐘特訓（形音義快閃／成語配對／段考實戰），答對額外賺取特訓 XP！</p>
          </div>
          <a class="primary" href="#arena/case/${esc(mission.id)}">開始本課快篩特訓 ›</a>
        </div>`
      : '';

    return `${tabBar}<div class="note-tab-body">${body}</div>${quickTrainCta}`;
  }

  // ---------- ARENA ENGINE (4 Interactive Games + Mistake Review) ----------
  const CANONICAL_RHETORICS = [
    '譬喻', '轉化（擬人）', '誇飾', '排比', '對偶', '設問', '借代', '摹寫', '映襯', '類疊', '引用', '層遞', '倒反', '雙關', '回文'
  ];

  function normRhetoric(t) {
    if (!t) return '';
    if (t.includes('轉化') || t.includes('擬人') || t.includes('擬物')) return '轉化（擬人）';
    for (const c of CANONICAL_RHETORICS) {
      if (t.includes(c.slice(0, 2))) return c;
    }
    return t.slice(0, 6);
  }

  let arenaState = {
    scope: '全部',        // '全部' | '七年級' | '八年級' | '九年級' | '1上'..'3下' | '語文常識' | 'case:<id>'
    examTerm: 0,         // 0=全部, 1/2/3=第1/2/3次段考
    mode: 'menu',        // 'menu' | 'phonetic' | 'rhetoric' | 'mock' | 'match' | 'mistakes'
    session: null        // active quiz or match board state
  };

  function collectScopeMissions(missions, scope, examTerm) {
    if (scope.startsWith('case:')) {
      const id = scope.slice(5);
      const found = missions.find(m => m.id === id);
      return found ? [found] : missions;
    }
    return missions.filter(m => {
      if (scope === '全部') return true;
      if (['七年級', '八年級', '九年級', '語文常識'].includes(scope)) return m.grade === scope;
      if (m.book === scope) return !examTerm || m.examTerm === examTerm;
      return true;
    });
  }

  function buildPhoneticQuestions(missions, scopeList, count = 10) {
    const qs = [];
    // Gather global distractor pools
    const allPy = [];
    const allCh = [];
    for (const m of missions) {
      const k = m.steps[0]?.knowledge;
      if (!k) continue;
      for (const p of (k.phonetics || [])) {
        if (p.k === '字音' && p.a) allPy.push(p.a);
        if (p.k === '字形' && p.a) allCh.push(p.a);
      }
    }
    const uniqPy = Array.from(new Set(allPy));
    const uniqCh = Array.from(new Set(allCh));

    const addFromList = list => {
      for (const m of list) {
        const k = m.steps[0]?.knowledge;
        if (!k) continue;
        // 1) Textbook MCQ drills on 形音義 / 字詞義
        for (const d of (k.drills || [])) {
          if (d.tag === '形音義' || d.tag === '字詞義') {
            qs.push({
              tag: d.tag,
              source: `${bookName(m.book)}・${m.unit}`,
              missionId: m.id,
              missionTitle: m.title,
              book: m.book,
              unit: m.unit,
              prompt: d.q,
              scene: '',
              options: d.o,
              correct: d.a,
              why: `出自【${bookName(m.book)} ${m.unit}】課本段考精選題。正解為（${String.fromCharCode(65 + d.a)}）${d.o[d.a]}。`
            });
          }
        }
        // 2) Auto-generated zhuyin / character questions from 基礎篇國字注音
        for (const p of (k.phonetics || [])) {
          if (p.k !== '字音' && p.k !== '字形') continue;
          const pool = p.k === '字音' ? uniqPy : uniqCh;
          const wrongs = shuffle(pool.filter(x => x !== p.a && x.length === p.a.length)).slice(0, 3);
          if (wrongs.length < 3) continue;
          const opts = shuffle([p.a, ...wrongs]);
          qs.push({
            tag: p.k === '字音' ? '必考字音' : '必考字形',
            source: `${bookName(m.book)}・${m.unit}`,
            missionId: m.id,
            missionTitle: m.title,
            book: m.book,
            unit: m.unit,
            prompt: p.k === '字音'
              ? `下列詞語中「」內的字，正確讀音是哪一個？\n【 ${p.w} 】`
              : `請根據注音，選出【 ${p.w} 】中「」內正確的國字：`,
            scene: '',
            options: opts,
            correct: opts.indexOf(p.a),
            why: `${p.w} → ${p.d}（出自 ${bookName(m.book)} ${m.unit}）`
          });
        }
      }
    };

    addFromList(scopeList);
    if (qs.length < count) addFromList(missions);
    return shuffle(qs).slice(0, count);
  }

  function buildRhetoricQuestions(missions, scopeList, count = 10) {
    const qs = [];
    const seen = new Set();
    const addFromList = list => {
      for (const m of list) {
        const k = m.steps[0]?.knowledge;
        if (!k) continue;
        for (const r of (k.rhetoric || [])) {
          const canon = normRhetoric(r.t);
          if (!CANONICAL_RHETORICS.includes(canon) || seen.has(r.s)) continue;
          seen.add(r.s);
          const wrongs = shuffle(CANONICAL_RHETORICS.filter(c => c !== canon)).slice(0, 3);
          const opts = shuffle([canon, ...wrongs]);
          qs.push({
            tag: '課本修辭',
            source: `${bookName(m.book)}・${m.unit}`,
            missionId: m.id,
            missionTitle: m.title,
            book: m.book,
            unit: m.unit,
            prompt: '請判斷下列課本原句主要運用了哪一種修辭法？',
            scene: `「${r.s}」`,
            options: opts,
            correct: opts.indexOf(canon),
            why: `本句出自【${bookName(m.book)} ${m.unit}】，主要運用「${r.t}」修辭。`
          });
        }
      }
    };
    addFromList(scopeList);
    if (qs.length < count) addFromList(missions);
    return shuffle(qs).slice(0, count);
  }

  function buildMockQuestions(missions, scopeList, count = 10) {
    const ph = buildPhoneticQuestions(missions, scopeList, 4);
    const rh = buildRhetoricQuestions(missions, scopeList, 2);
    const comp = [];
    const readQs = [];
    const addRest = list => {
      for (const m of list) {
        const step = m.steps[0];
        const k = step?.knowledge;
        if (k?.drills) {
          for (const d of k.drills) {
            if (d.tag === '課文綜合' || d.tag === '成語') {
              comp.push({
                tag: d.tag,
                source: `${bookName(m.book)}・${m.unit}`,
                missionId: m.id,
                missionTitle: m.title,
                book: m.book,
                unit: m.unit,
                prompt: d.q,
                scene: '',
                options: d.o,
                correct: d.a,
                why: `出自【${bookName(m.book)} ${m.unit}】課本綜合評量。正解為（${String.fromCharCode(65 + d.a)}）${d.o[d.a]}。`
              });
            }
          }
        }
        // Pull reading comprehension question from existing bank
        const bq = step?.banks?.question?.[3] || step?.banks?.question?.[0];
        if (bq) {
          readQs.push({
            tag: '閱讀素養',
            source: `${bookName(m.book)}・${m.unit}`,
            missionId: m.id,
            missionTitle: m.title,
            book: m.book,
            unit: m.unit,
            prompt: bq.prompt,
            scene: bq.scene || '',
            options: bq.options.map(o => o.text),
            correct: bq.correct,
            why: bq.options[bq.correct].feedback
          });
        }
      }
    };
    addRest(scopeList);
    if (comp.length < 3 || readQs.length < 3) addRest(missions);
    const merged = [
      ...ph.slice(0, 3),
      ...rh.slice(0, 2),
      ...shuffle(comp).slice(0, 3),
      ...shuffle(readQs).slice(0, 2)
    ];
    return shuffle(merged).slice(0, count);
  }

  function buildMatchBoard(missions, scopeList, pairCount = 6) {
    const pool = [];
    const seen = new Set();
    const addFrom = list => {
      for (const m of list) {
        const k = m.steps[0]?.knowledge;
        if (!k) continue;
        for (const idm of (k.idioms || [])) {
          if (!seen.has(idm.w) && idm.d.length >= 4) {
            seen.add(idm.w);
            pool.push({ id: 'p_' + pool.length, w: idm.w, d: idm.d, src: `${bookName(m.book)}・${m.unit}`, kind: '成語' });
          }
        }
        for (const gl of (k.glossary || [])) {
          if (!seen.has(gl.w) && gl.d.length >= 3 && gl.w.length <= 16) {
            seen.add(gl.w);
            pool.push({ id: 'p_' + pool.length, w: gl.w, d: gl.d, src: `${bookName(m.book)}・${m.unit}`, kind: '詞義' });
          }
        }
      }
    };
    addFrom(scopeList);
    if (pool.length < pairCount) addFrom(missions);
    const chosen = shuffle(pool).slice(0, pairCount);
    return {
      pairs: chosen,
      left: shuffle(chosen.map(p => ({ id: p.id, text: p.w, kind: p.kind, src: p.src }))),
      right: shuffle(chosen.map(p => ({ id: p.id, text: p.d }))),
      selectedLeft: null,
      selectedRight: null,
      matched: new Set(),
      wrongFlash: null,
      moves: 0,
      combo: 0,
      bestCombo: 0,
      done: false,
      rewardGiven: false
    };
  }

  function gradeForScore(right, total) {
    const pct = total ? right / total : 0;
    if (pct >= 0.99) return { grade: 'A++', label: '精熟滿分！神探等級表現', cls: 'g-app' };
    if (pct >= 0.9) return { grade: 'A+', label: '精熟優秀！段考與會考穩穩拿分', cls: 'g-ap' };
    if (pct >= 0.8) return { grade: 'A', label: '精熟達標！再補幾個細節就能滿分', cls: 'g-a' };
    if (pct >= 0.7) return { grade: 'B++', label: '基礎穩固！把錯題收進鑑識室複習一次', cls: 'g-bpp' };
    if (pct >= 0.5) return { grade: 'B+', label: '漸入佳境！回頭翻翻字卡很快就能進階', cls: 'g-bp' };
    return { grade: 'B', label: '暖身完成！先看課本重點再來挑戰一次', cls: 'g-b' };
  }

  function startArenaMode(missions, mode) {
    const scopeList = collectScopeMissions(missions, arenaState.scope, arenaState.examTerm);
    arenaState.mode = mode;
    if (mode === 'match') {
      arenaState.session = buildMatchBoard(missions, scopeList, 6);
      return;
    }
    let questions = [];
    if (mode === 'phonetic') questions = buildPhoneticQuestions(missions, scopeList, 10);
    else if (mode === 'rhetoric') questions = buildRhetoricQuestions(missions, scopeList, 10);
    else if (mode === 'mock') questions = buildMockQuestions(missions, scopeList, 10);
    else if (mode === 'mistakes') {
      questions = profile.mistakes.slice(0, 10).map(m => ({
        mistakeId: m.id,
        tag: m.tag || '錯題重審',
        source: m.book ? `${bookName(m.book)}・${m.unit}` : m.missionTitle,
        missionId: m.missionId,
        missionTitle: m.missionTitle,
        book: m.book,
        unit: m.unit,
        prompt: m.prompt,
        scene: m.scene || '',
        options: m.options,
        correct: m.correct,
        why: m.why
      }));
    }
    arenaState.session = {
      mode,
      questions,
      cursor: 0,
      picks: questions.map(() => null),
      combo: 0,
      bestCombo: 0,
      finished: false,
      rewardGiven: false
    };
  }

  function scopeLabel(missions) {
    if (arenaState.scope.startsWith('case:')) {
      const m = missions.find(x => x.id === arenaState.scope.slice(5));
      return m ? `單課特訓：${bookName(m.book)} ${m.unit}` : '單課特訓';
    }
    const termName = ['', '第一次段考', '第二次段考', '第三次段考'][arenaState.examTerm] || '';
    const base = arenaState.scope === '全部' ? '國中全冊＋語文常識' : bookName(arenaState.scope);
    return termName ? `${base}・${termName}` : base;
  }

  function renderArenaPage(missions, headerHtml) {
    const scopeText = scopeLabel(missions);
    const singleCase = arenaState.scope.startsWith('case:')
      ? missions.find(x => x.id === arenaState.scope.slice(5))
      : null;

    if (arenaState.mode === 'menu' || !arenaState.session) {
      const scopeChips = ['全部', '七年級', '八年級', '九年級', '1上', '1下', '2上', '2下', '3上', '3下', '語文常識'];
      const isBookScope = /^[123]/.test(arenaState.scope);
      return `${headerHtml}
        <section class="arena-hero">
          <div class="arena-hero-text">
            <span class="arena-pill">${esc(scopeText)}</span>
            <h2>邊玩邊背！國中課本國文特訓基地</h2>
            <p>所有題目直接取材自國中國文六冊課本速講義與《語文常識百分百》——練完形音義、成語配對、課本修辭與會考模擬，每次破關都加 XP 並解鎖偵探勳章！</p>
            ${singleCase ? `<div class="arena-single-bar"><span>目前鎖定單課：<b>${esc(bookName(singleCase.book))} ${esc(singleCase.unit)}</b></span><button type="button" class="quiet" data-action="arenaScope" data-scope="全部">切換為全冊範圍</button><a class="quiet" href="#case/${esc(singleCase.id)}">回到本課案件</a></div>` : ''}
          </div>
          <div class="arena-quick-stats">
            <div><small>特訓通關</small><strong>${profile.arenaWins} 場</strong></div>
            <div><small>最高連擊</small><strong>${profile.bestCombo} 連</strong></div>
            <div><small>待審錯題</small><strong>${profile.mistakes.length} 題</strong></div>
            <div><small>最佳模擬</small><strong>${profile.mockBestGrade || '尚無'}</strong></div>
          </div>
        </section>

        <section class="arena-scope-box">
          <h3>步驟 1｜選擇練習範圍</h3>
          <div class="shelves">${scopeChips.map(s =>
            `<button type="button" class="shelf" data-action="arenaScope" data-scope="${esc(s)}" aria-pressed="${arenaState.scope === s}">${esc(bookName(s))}</button>`
          ).join('')}</div>
          ${isBookScope ? `<div class="term-bar"><span>段考範圍：</span>${[[0, '全冊'], [1, '第一次段考'], [2, '第二次段考'], [3, '第三次段考']].map(([val, lbl]) =>
            `<button type="button" class="q-chip" data-action="arenaTerm" data-term="${val}" aria-pressed="${arenaState.examTerm === val}">${lbl}</button>`
          ).join('')}</div>` : ''}
        </section>

        <section class="arena-modes">
          <h3>步驟 2｜挑選挑戰模式</h3>
          <div class="mode-grid">
            <article class="mode-card m-phonetic">
              <div class="mode-ico" aria-hidden="true">⚡</div>
              <h4>形音義閃電戰</h4>
              <p>10 題精選課本必考字音、字形與字詞辨析，連答觸發 Combo 升調音效！</p>
              <div class="mode-foot"><span>+25~40 XP</span><button type="button" class="primary" data-action="arenaStart" data-mode="phonetic">開始閃電戰</button></div>
            </article>
            <article class="mode-card m-match">
              <div class="mode-ico" aria-hidden="true">🧩</div>
              <h4>成語＆詞義配對板</h4>
              <p>翻找 6 組課本成語與古文注釋，左右點擊配對消除，挑戰最少步數三星通關！</p>
              <div class="mode-foot"><span>+30 XP</span><button type="button" class="primary" data-action="arenaStart" data-mode="match">進入配對板</button></div>
            </article>
            <article class="mode-card m-rhetoric">
              <div class="mode-ico" aria-hidden="true">🎨</div>
              <h4>修辭偵測雷達</h4>
              <p>直接出課本原句！快速判別譬喻、擬人、排比、對偶、誇飾、設問、借代等修辭。</p>
              <div class="mode-foot"><span>+25~40 XP</span><button type="button" class="primary" data-action="arenaStart" data-mode="rhetoric">啟動雷達</button></div>
            </article>
            <article class="mode-card m-mock">
              <div class="mode-ico" aria-hidden="true">🏆</div>
              <h4>段考＆會考實戰模擬</h4>
              <p>10 題混合實戰（形音義＋修辭＋成語＋課文綜合＋閱讀素養），考完頒發會考等第！</p>
              <div class="mode-foot"><span>+35~60 XP</span><button type="button" class="primary" data-action="arenaStart" data-mode="mock">進入模擬考</button></div>
            </article>
          </div>
          ${profile.mistakes.length ? `<div class="mistake-banner">
            <div><strong>📝 錯題鑑識室有 ${profile.mistakes.length} 道待重審案件</strong><p>把答錯過的題目再答對一次，立刻從錯題本結案並賺取 XP！</p></div>
            <button type="button" class="primary" data-action="arenaStart" data-mode="mistakes">立即重審錯題</button>
          </div>` : ''}
        </section>`;
    }

    // ---- Mode: Match Board ----
    if (arenaState.mode === 'match') {
      const b = arenaState.session;
      if (b.done) {
        const stars = b.moves <= 8 ? '★★★' : b.moves <= 11 ? '★★☆' : '★☆☆';
        return `${headerHtml}<section class="task-panel"><div class="task-inner ending">
          <div class="eyebrow"><span class="square"></span>配對通關<span class="sep">/</span>${esc(scopeText)}</div>
          <div class="star-burst">${stars}</div>
          <h2>成語＆詞義全數破譯！</h2>
          <p>總步數 <b>${b.moves}</b> 步 · 最高連擊 <b>${b.bestCombo}x</b> · 獲得 <b>+30 XP</b></p>
          <div class="match-summary">${b.pairs.map(p =>
            `<div class="match-row"><b>${esc(p.w)}</b><span>${esc(p.d)}</span><small>${esc(p.src)}</small></div>`
          ).join('')}</div>
          <div class="ending-nav">
            <button type="button" class="primary" data-action="arenaStart" data-mode="match">再玩一局新詞卡</button>
            <button type="button" class="quiet" data-action="arenaMenu">回特訓選單</button>
          </div>
        </div></section>`;
      }
      return `${headerHtml}<section class="task-panel"><div class="task-inner">
        <div class="arena-bar">
          <span class="arena-pill">🧩 成語＆詞義配對板 · ${esc(scopeText)}</span>
          <div class="arena-hud">
            <span>已完成 <b>${b.matched.size} / ${b.pairs.length}</b></span>
            <span>步數 <b>${b.moves}</b></span>
            ${b.combo >= 2 ? `<span class="combo-chip">🔥 ${b.combo} 連擊</span>` : ''}
            <button type="button" class="quiet mini-btn" data-action="arenaMenu">離開</button>
          </div>
        </div>
        <h2>左邊選一個詞語，右邊配對正確解釋！</h2>
        <div class="match-board">
          <div class="match-col">${b.left.map(item => {
            const done = b.matched.has(item.id);
            const sel = b.selectedLeft === item.id;
            const bad = b.wrongFlash && b.wrongFlash[0] === item.id;
            return `<button type="button" class="match-tile left${done ? ' done' : ''}${sel ? ' sel' : ''}${bad ? ' bad' : ''}" data-action="matchPick" data-side="L" data-id="${item.id}" ${done ? 'disabled' : ''}>
              <small>${esc(item.kind)}</small><strong>${esc(item.text)}</strong>
            </button>`;
          }).join('')}</div>
          <div class="match-col">${b.right.map(item => {
            const done = b.matched.has(item.id);
            const sel = b.selectedRight === item.id;
            const bad = b.wrongFlash && b.wrongFlash[1] === item.id;
            return `<button type="button" class="match-tile right${done ? ' done' : ''}${sel ? ' sel' : ''}${bad ? ' bad' : ''}" data-action="matchPick" data-side="R" data-id="${item.id}" ${done ? 'disabled' : ''}>
              <span>${esc(item.text)}</span>
            </button>`;
          }).join('')}</div>
        </div>
      </div></section>`;
    }

    // ---- Mode: Quiz (phonetic / rhetoric / mock / mistakes) ----
    const s = arenaState.session;
    const modeNames = { phonetic: '⚡ 形音義閃電戰', rhetoric: '🎨 修辭偵測雷達', mock: '🏆 段考＆會考實戰模擬', mistakes: '📝 錯題鑑識重審' };
    if (!s.questions.length) {
      return `${headerHtml}<section class="task-panel"><div class="task-inner ending">
        <h2>這個範圍目前沒有待練題目！</h2>
        <p>試試切換其他冊別或選擇「全部」範圍。</p>
        <button type="button" class="primary" data-action="arenaMenu">回特訓選單</button>
      </div></section>`;
    }

    if (s.finished) {
      const right = s.questions.filter((q, i) => s.picks[i] === q.correct).length;
      const total = s.questions.length;
      const xpGain = Math.max(15, right * 5 + (s.mode === 'mock' ? 10 : 0));
      const g = gradeForScore(right, total);
      // Category breakdown
      const byTag = {};
      s.questions.forEach((q, i) => {
        const b = byTag[q.tag] || (byTag[q.tag] = { ok: 0, total: 0 });
        b.total++;
        if (s.picks[i] === q.correct) b.ok++;
      });
      return `${headerHtml}<section class="task-panel"><div class="task-inner ending">
        <div class="eyebrow"><span class="square"></span>${modeNames[s.mode]}<span class="sep">/</span>結案成績單</div>
        <div class="grade-badge ${g.cls}">${g.grade}</div>
        <h2>答對 ${right} / ${total} 題 · ${g.label}</h2>
        <div class="result">特訓獎勵 +${xpGain} XP　·　本場最高連擊 ${s.bestCombo}x</div>
        <div class="tag-breakdown">${Object.entries(byTag).map(([tag, st]) =>
          `<div class="tag-row"><span>${esc(tag)}</span><progress value="${st.ok}" max="${st.total}"></progress><b>${st.ok}/${st.total}</b></div>`
        ).join('')}</div>
        <details class="case-review" open><summary>逐題回顧與詳解（錯題已自動收進錯題鑑識室）</summary>
          <ol class="review-list">${s.questions.map((q, i) => {
            const ok = s.picks[i] === q.correct;
            return `<li class="${ok ? 'ok' : 'no'}">
              <div class="rv-head"><span class="rv-mark">${ok ? '✓' : '✗'}</span><b>[${esc(q.tag)}] ${esc(q.source)}</b></div>
              <p>${multi(q.prompt)}${q.scene ? `<br><em>${esc(q.scene)}</em>` : ''}</p>
              <small>你的作答：${esc(q.options[s.picks[i]] ?? '未作答')} ｜ 正解：<b>${esc(q.options[q.correct])}</b></small>
              <p class="rv-why">${esc(q.why)}</p>
            </li>`;
          }).join('')}</ol>
        </details>
        <div class="ending-nav">
          <button type="button" class="primary" data-action="arenaStart" data-mode="${s.mode}">再挑戰一輪</button>
          <button type="button" class="quiet" data-action="arenaMenu">切換其他模式</button>
          <a class="quiet" href="#lobby">返回案件大廳</a>
        </div>
      </div></section>`;
    }

    const q = s.questions[s.cursor];
    const pick = s.picks[s.cursor];
    const answered = Number.isInteger(pick);
    const isGood = answered && pick === q.correct;

    return `${headerHtml}<section class="task-panel"><div class="task-inner">
      <div class="arena-bar">
        <span class="arena-pill">${modeNames[s.mode]} · ${esc(q.source)}</span>
        <div class="arena-hud">
          <span>第 <b>${s.cursor + 1} / ${s.questions.length}</b> 題</span>
          ${s.combo >= 2 ? `<span class="combo-chip">🔥 ${s.combo} 連擊</span>` : ''}
          <button type="button" class="quiet mini-btn" data-action="arenaMenu">離開</button>
        </div>
      </div>
      <progress class="arena-prog" value="${s.cursor + (answered ? 1 : 0)}" max="${s.questions.length}"></progress>
      <div class="q-tag-row"><span class="rhet-pill">${esc(q.tag)}</span><small>鍵盤可按 1–4 選答、Enter 下一題</small></div>
      <h2>${multi(q.prompt)}</h2>
      ${q.scene ? `<div class="paper record"><small>課文／閱讀材料</small><p>${multi(q.scene)}</p></div>` : ''}
      <div class="options">${q.options.map((opt, i) => {
        let cls = 'option';
        if (answered) {
          if (i === q.correct) cls += ' right';
          else if (i === pick) cls += ' wrong';
        }
        return `<button type="button" class="${cls}" data-action="arenaPick" data-i="${i}" ${answered ? 'disabled' : ''}><span>${String.fromCharCode(65 + i)}</span>${esc(opt)}</button>`;
      }).join('')}</div>
      ${answered ? `<div role="status" class="feedback ${isGood ? 'good' : 'retry'}"><div><b>${isGood ? (s.combo >= 3 ? `太神啦！${s.combo} 連擊正解！` : '判斷精準！') : '這題先記進錯題鑑識室，看解析馬上懂：'}</b><p>${esc(q.why)}</p></div></div>` : ''}
      <div class="task-actions">
        ${answered ? `<button type="button" class="primary" data-action="arenaNext">${s.cursor === s.questions.length - 1 ? '查看結案成績單' : '下一題 (Enter)'}</button>` : '<span class="muted-tip">請點選一個最恰當的答案</span>'}
      </div>
    </div></section>`;
  }

  function handleArenaAction(action, btn, missions, rerender) {
    if (action === 'arenaScope') {
      arenaState.scope = btn.dataset.scope;
      arenaState.examTerm = 0;
      arenaState.mode = 'menu';
      arenaState.session = null;
      rerender();
      return true;
    }
    if (action === 'arenaTerm') {
      arenaState.examTerm = Number(btn.dataset.term) || 0;
      rerender();
      return true;
    }
    if (action === 'arenaMenu') {
      arenaState.mode = 'menu';
      arenaState.session = null;
      rerender();
      return true;
    }
    if (action === 'arenaStart') {
      startArenaMode(missions, btn.dataset.mode);
      rerender(true);
      return true;
    }
    if (action === 'arenaPick' && arenaState.session && !arenaState.session.finished) {
      const s = arenaState.session;
      const idx = Number(btn.dataset.i);
      if (Number.isInteger(s.picks[s.cursor])) return true;
      s.picks[s.cursor] = idx;
      const q = s.questions[s.cursor];
      if (idx === q.correct) {
        s.combo += 1;
        if (s.combo > s.bestCombo) s.bestCombo = s.combo;
        recordCombo(s.combo);
        sfx.correct(s.combo);
        if (s.mode === 'phonetic') profile.phoneticCorrect += 1;
        if (s.mode === 'rhetoric') profile.rhetoricCorrect += 1;
        if (s.mode === 'mistakes' && q.mistakeId) resolveMistake(q.mistakeId);
        saveProfile();
      } else {
        s.combo = 0;
        sfx.wrong();
        recordMistake(q);
      }
      rerender();
      return true;
    }
    if (action === 'arenaNext' && arenaState.session) {
      const s = arenaState.session;
      if (s.cursor < s.questions.length - 1) {
        s.cursor += 1;
        rerender(true);
      } else {
        s.finished = true;
        if (!s.rewardGiven) {
          s.rewardGiven = true;
          const right = s.questions.filter((q, i) => s.picks[i] === q.correct).length;
          const xpGain = Math.max(15, right * 5 + (s.mode === 'mock' ? 10 : 0));
          if (s.mode === 'mock') {
            const g = gradeForScore(right, s.questions.length).grade;
            const order = ['', 'B', 'B+', 'B++', 'A', 'A+', 'A++'];
            if (order.indexOf(g) > order.indexOf(profile.mockBestGrade)) profile.mockBestGrade = g;
          }
          markDailyArena(xpGain);
          sfx.victory();
        }
        rerender(true);
      }
      return true;
    }
    if (action === 'matchPick' && arenaState.mode === 'match' && arenaState.session) {
      const b = arenaState.session;
      const side = btn.dataset.side;
      const id = btn.dataset.id;
      if (b.matched.has(id)) return true;
      b.wrongFlash = null;
      if (side === 'L') b.selectedLeft = (b.selectedLeft === id ? null : id);
      else b.selectedRight = (b.selectedRight === id ? null : id);

      if (b.selectedLeft && b.selectedRight) {
        b.moves += 1;
        if (b.selectedLeft === b.selectedRight) {
          b.matched.add(b.selectedLeft);
          b.combo += 1;
          if (b.combo > b.bestCombo) b.bestCombo = b.combo;
          recordCombo(b.combo);
          profile.idiomMatches += 1;
          saveProfile();
          b.selectedLeft = null;
          b.selectedRight = null;
          sfx.match();
          if (b.matched.size === b.pairs.length) {
            b.done = true;
            if (!b.rewardGiven) {
              b.rewardGiven = true;
              markDailyArena(30);
              sfx.victory();
            }
          }
        } else {
          b.combo = 0;
          b.wrongFlash = [b.selectedLeft, b.selectedRight];
          b.selectedLeft = null;
          b.selectedRight = null;
          sfx.wrong();
        }
      } else {
        sfx.flip();
      }
      rerender();
      return true;
    }
    return false;
  }

  function openCaseArena(missionId) {
    arenaState.scope = 'case:' + missionId;
    arenaState.examTerm = 0;
    arenaState.mode = 'menu';
    arenaState.session = null;
  }

  function openGlobalArena() {
    if (arenaState.scope.startsWith('case:')) {
      arenaState.scope = '全部';
      arenaState.mode = 'menu';
      arenaState.session = null;
    }
  }

  window.DETECTIVE_COACH = {
    getProfile: () => profile,
    sfx,
    rankForXp,
    computeBadges,
    recordMistake,
    resolveMistake,
    toggleMastered,
    isMastered,
    recordCombo,
    markDailyCase,
    dailyMission,
    availableNoteTabs,
    renderTextbookNotePanel,
    renderArenaPage,
    handleArenaAction,
    openCaseArena,
    openGlobalArena,
    getArenaState: () => arenaState,
    todayStr
  };
})();
