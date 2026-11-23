(function initCatalog(){
  'use strict';
  const books = {
    '1上':['7上','國文1上速講義_教用合併檔(115f319747).pdf'],
    '1下':['7下','國文1下速講義_教用合併檔(114f683552).pdf'],
    '2上':['8上','國文2上速講義_教用合併檔(115f295700).pdf'],
    '2下':['8下','國文2下速講義_教用合併檔(114f743357).pdf'],
    '3上':['9上','國文3上速講義_教用合併檔(115f372928).pdf'],
    '3下':['9下','國文3下速講義_教用合併檔(114f620844).pdf'],
    '修辭':['修辭','語文常識百分百-01第一單元修辭(115f295564).pdf'],
    '文法':['文法','語文常識百分百-02第二單元文法(115f295566).pdf'],
    '應用文':['應用文','語文常識百分百-03第三單元應用文（書信、柬帖、題辭）(115f295568).pdf'],
    '判別能力':['判別能力','語文常識百分百-04第四單元判別能力(115f295570).pdf'],
    '韻文與散文':['韻文與散文','語文常識百分百-05第五單元韻文與散文(115f295572).pdf']
  };
  function hash(text) {
    let result=2166136261;
    for (const ch of text) result=Math.imul(result^ch.charCodeAt(0),16777619);
    return result>>>0;
  }
  function choices(values,seed,explanation,hint) {
    const position = seed%values.length;
    const order = values.map((_,i)=> (i-position+values.length)%values.length);
    return {correct:position, options:order.map(i=>({text:values[i],feedback:i===0?explanation:hint}))};
  }
  const archive = {id:'original', title:'消失的校刊原稿', book:'經典長案', grade:'經典長案', unit:'三站連續調查', skill:'查證、書信與跨文本', steps:window.DETECTIVE_CASES};
  const ARCHIVE_KNOWLEDGE = {
    '經典長案／編輯室的三句留言': {
      author:'翰林第四冊自學選文延伸', genre:'媒體識讀與查證', source:'面對假訊息，其實我可以這麼做！',
      main:'閱讀校園與生活訊息時，先區分「目擊事實」、「轉述傳聞」與「個人猜測」，找出可回頭核對的憑據。',
      features:['目擊陳述會出現親歷動詞（如「親手」「看見」）與可驗證編號。','「聽說」「好像」屬轉述或推測，必須找到一手來源再下判斷。'],
      lines:[{q:'我親手把裝原稿的紅紙套交給圖書館櫃臺，簽收號是十二。',a:'同時具備當事人親歷動作與可查證編號，屬最可靠的第一手線索。'}],
      rhetoric:[], phonetics:[],
      glossary:[
        {w:'第一手消息',d:'由親歷者或主辦單位直接發布、附帶時間與憑據的資訊。'},
        {w:'轉述／傳聞',d:'經過他人轉告的說法（如「聽說」「據聞」），需要二次查證。'},
        {w:'推測語氣',d:'帶有「可能」「大概」「我猜」等詞語，僅能作假設而非定論。'}
      ], idioms:[], drills:[]
    },
    '經典長案／回條裡的「敝室」': {
      author:'翰林第四冊應用文延伸', genre:'應用文・書信與便條', source:'語文常識（一）應用文－書信、便條',
      main:'讀書信與便條時，先鎖定開頭稱謂（收信人）與結尾署名（寫信人），再依「貴／敝」「令／舍」辨別指向。',
      features:['「貴」尊稱對方單位（貴校、貴館）；「敝」謙稱己方單位（敝室、敝社）。','信中「我」永遠跟隨結尾署名者，而不是開頭稱呼對象。'],
      lines:[{q:'寄放在貴館的紅紙套，我已領回，帶到敝室登記。',a:'「貴館」指收信方圖書館，「敝室」指署名者小禾所屬的校史室。'}],
      rhetoric:[], phonetics:[],
      glossary:[
        {w:'貴館／貴校',d:'敬稱對方所屬的機構或單位。'},
        {w:'敝室／敝社',d:'謙稱自己所屬的單位或處所。'},
        {w:'啟封詞（鈞啟／台啟）',d:'寫在信封上請對方拆信的禮貌用語，依輩分區分，不可用「敬啟」。'}
      ], idioms:[], drills:[]
    },
    '經典長案／三只平抽櫃': {
      author:'115年教育會考素養延伸', genre:'雙文本統整與規則應用', source:'會考雙文本判讀實戰',
      main:'面對兩份以上資料時，先釐清每份文件負責的欄位，再把相同條件交集比對，避免遺漏關鍵限制。',
      features:['先確認物件名稱（原稿 vs 印樣），再核對狀態條件（已拍攝 vs 未拍攝）。','跨文本推論必須兩份資料各有一句證據互相扣合。'],
      lines:[{q:'紅套裡是手繪封面原稿，等候拍攝。／丙櫃收還沒拍攝的原件。',a:'「原稿＝原件」加上「等候拍攝＝還沒拍攝」，兩條件同時滿足才鎖定丙櫃。'}],
      rhetoric:[], phonetics:[],
      glossary:[
        {w:'雙文本比對',d:'把甲文的事實狀態對照乙文的分類規則，找出同時符合所有條件的答案。'},
        {w:'必要條件',d:'缺一不可的限制，漏看一個狀態詞（如「未拍攝」）就會選錯選項。'}
      ], idioms:[], drills:[]
    }
  };
  function detectExamTerm(book, unit) {
    if (!/^[123]/.test(book)) return 0;
    const isNineLower = book === '3下';
    const m = unit.match(/^第([一二三四五六七八九十]+)課/);
    if (m) {
      const n = {'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10}[m[1]] || 0;
      if (isNineLower) return n <= 2 ? 1 : n <= 4 ? 2 : 3;
      return n <= 4 ? 1 : n <= 7 ? 2 : 3;
    }
    if (unit.includes('語文常識一') || unit.includes('自學選文一')) return 1;
    if (unit.includes('語文常識二') || unit.includes('自學選文二')) return 2;
    return 3;
  }
  const cases = window.ACADEMY_DATA.map(row=>{
    const seed=hash(row.book+'／'+row.unit);
    const id='c'+seed.toString(36);
    const group=books[row.book];
    const decision=choices(row.options,seed,row.why,`再讀現場紀錄。先用「${row.skill}」這個方法檢查你的判斷，再找一句能排除另一選項的文字。`);
    const evidence=choices(row.evidence,hash(id+'evidence'),row.why,'找一項能直接解釋前一題答案的證據。只和事件同時出現的細節，還不足以支持判斷。');
    const grade=({'1':'七年級','2':'八年級','3':'九年級'})[row.book[0]]||'語文常識';
    const examTerm=detectExamTerm(row.book, row.unit);
    const step={title:row.title,teaser:row.scene.split(/[。！？\n]/)[0]+'。',lessonTitle:row.skill,
      notes:[{term:row.skill,body:row.note}],reference:`${group[1]} · PDF 第 ${row.page} 頁 · ${row.unit}。本案情境、題目與提示依教材概念自編。`,
      scene:row.scene,question:row.ask,options:decision.options,correct:decision.correct,evidenceQuestion:'哪一項證據能支持你的推理？',evidenceOptions:evidence.options,evidenceCorrect:evidence.correct,
      finding:row.finding,reward:40};
    return {id,title:row.title,book:row.book,grade,examTerm,unit:row.unit,skill:row.skill,page:row.page,file:group[1],steps:[step]};
  });
  const extras = new Map(window.ACADEMY_EXTRAS.map(row => [row.book + '／' + row.unit, row]));
  const sourceBank = new Map(window.DETECTIVE_BANK.map(row => [row.book + '／' + row.unit, row.items]));
  const extensions = new Map(window.DETECTIVE_EXTENSION.map(row => [row.book + '／' + row.unit, row]));
  const missions = [archive, ...cases];
  for (const mission of missions) {
    for (const step of mission.steps) {
      const unit = mission === archive ? step.title : mission.unit;
      const key = mission.book + '／' + unit;
      step.knowledge = (window.TEXTBOOK_KNOWLEDGE && window.TEXTBOOK_KNOWLEDGE[key]) || ARCHIVE_KNOWLEDGE[key] || null;
      step.art = window.DETECTIVE_DIRECTIONS.get(key);
      if (!step.art) throw new Error('缺少案件取景：' + key);
      step.opening = window.DETECTIVE_OPENINGS.get(key);
      if (step.opening?.length !== step.art.cast.length) throw new Error('缺少角色對白：' + key);
      step.speaker = step.art.cast[0].id;
      step.location = step.art.location;
      const extra = extras.get(key);
      if (!extra) throw new Error('缺少單元補充：' + key);
      const exercise = (fields, suffix) => ({
        prompt: fields[0], scene: extra.passage,
        ...choices(fields.slice(1,4), hash(key + suffix), fields[4], extra.pitfall)
      });
      step.notes.push({term:'判讀方法', body:extra.method}, {term:'例題拆解', body:extra.example}, {term:'容易混淆的地方', body:extra.pitfall});
      step.banks = {
        question: [{prompt:step.question, scene:step.scene, options:step.options, correct:step.correct}, exercise(extra.q1, '理解'), exercise(extra.q2, '應用')],
        evidence: [{prompt:step.evidenceQuestion, scene:step.scene, options:step.evidenceOptions, correct:step.evidenceCorrect}, exercise(extra.e, '舉證')]
      };
      const selected = sourceBank.get(key);
      if (selected?.length !== 2) throw new Error('選題不完整：' + key);
      selected.forEach(item => {
        const question = {
          sourceId:item.source, scene:item.context, prompt:item.prompt,
          ...choices(item.options, hash(key+'/'+item.source), item.why, '可以改選，或展開解析看看有哪些判斷依據。')
        };
        step.banks.question.push(question);
      });
      const extension = extensions.get(key);
      if (!extension) throw new Error('缺少調查材料：' + key);
      for (const field of ['q1', 'q2', 'e']) {
        const [prompt, correct, wrong1, wrong2, wrong3, why] = extension[field];
        const evidence = field === 'e';
        const hint = evidence ? '把各項字句放回材料裡，看看哪一句能直接支持要查證的說法。' : '回到閱讀材料，找出能支持選項的細節，再作判斷。';
        step.banks[evidence ? 'evidence' : 'question'].push({
          prompt, scene:extension.passage,
          ...choices([correct, wrong1, wrong2, wrong3], hash(key + '/補充/' + field), why, hint)
        });
      }
    }
  }
  window.ACADEMY_CATALOG={books,cases:missions};
})();
