// 每一站指定課文取景、案件實際調查處、兩名出場夥伴及卷宗物件。
(function configureScenes() {
  'use strict';
  const directions = new Map();
  const outdoor = new Set('campus track forest pond river harbor fields village station market festival oldtown cambridge flying-fish weir vintage-station storm gym'.split(' '));
  const period = new Set(['scroll','temple','balcony']);
  function add(book, lines) {
    for (const line of lines.trim().split('\n')) {
      const [unit, setting, vista, location, lead, partner, prop, detail] = line.split('|');
      const defaultLook = period.has(setting) ? 'period' : outdoor.has(setting) ? 'field' : 'everyday';
      const cast = [lead,partner].map(member => {
        const [id, look=defaultLook] = member.split('.');
        return {id,look};
      });
      directions.set(book+'／'+unit, {setting,vista,location,cast,prop,detail});
    }
  }
  add('經典長案', `
編輯室的三句留言|newsroom|校刊編輯室|編輯室|detective|inkcat|notebook|值日生的交接簿
回條裡的「敝室」|library|圖書館櫃臺|圖書館|inkcat|archivist|letter|夾在存根裡的回條
三只平抽櫃|archive|校史典藏室|校史室|archivist|detective|card|平抽櫃的收納卡
`);
  add('1上', `
第一課 夏夜|campus|夏夜的校園長廊|守夜值班室|reporter.field|inkcat.field|mic|熄燈後的校刊錄音
第二課 無心的錯誤|broadcast|午休廣播間|校園廣播室|reporter|detective|notebook|播音臺上的舊稿
第三課 母親的教誨|home|留燈的書桌|校慶布條工作室|artisan|archivist|brush|練字留下的畫筆
第四課 論語選|scroll|古書房的晨讀桌|圖書館還書臺|guide|archivist.everyday|book|值日生的交班簿
第五課 背影|vintage-station|舊時送別的月臺|校刊回憶採訪桌|reporter.field|detective.field|umbrella|收進櫃裡的舊雨具
第六課 心囚|classroom|觀察鳥群的教室窗邊|雨天觀察教室|ranger.field|detective|notebook|兩班的觀察紀錄
第七課 兒時記趣|pond|榕蔭下的淺水觀察點|操場水窪|ranger|inkcat|leaf|漂在水上的榕葉
第八課 朋友相交|classroom|社團教室的寫信角|推薦信整理桌|athlete|archivist|letter|三封推薦信草稿
第九課 音樂家與職籃巨星|track|運動場邊的練習區|校刊人物採訪組|athlete|reporter|notebook|兩位練習者的日誌
第十課 玫瑰淚|market|園遊會的兌換攤|園遊會服務臺|cook|detective.field|ticket|閉幕前的禮券
自學選文一 穿越時空讀故事──古代神話與寓言選|temple|寓言裡的鐘樓庭院|動物故事展|guide|inkcat.period|bell|寓言的報時鐘
自學選文二 貪睡的長頸鹿|track|接棒練習區|接力決賽紀錄席|athlete|reporter.field|medal|接力賽的決賽名牌
自學選文三 行動的水滴才能匯流大河|classroom|校舍走廊與窗口|校園走廊|archivist.field|ranger.field|map|積水位置記錄圖
語文常識一 標點符號使用法|broadcast|失物招領播音間|校園廣播室|reporter|archivist|mic|失物招領逐字稿
語文常識二 閱讀導航──策略運用與資訊檢索|library|圖書館借閱櫃臺|開館資訊查核桌|archivist|detective|clock|開館時間截圖
`);
  add('1下', `
第一課 聲音鐘|market|清晨開張的市場街|廣播社剪接室|reporter.field|cook|mic|市場街的三段音檔
第二課 孩子的鐘塔|station|末班車月臺|車站候車區|guide.field|reporter.field|ticket|長椅旁的候車票
第三課 紙船印象|home|搬家前的老宅|搬家物件登記處|artisan|detective|bell|搬家清單裡的銅鈴
第四課 小詩選|track|起跑線旁|動畫社分鏡桌|athlete|artisan.field|card|少了一格的分鏡卡
第五課 近體詩選|scroll|古詩展閱卷案|詩展編目桌|guide|archivist.period|scroll|詩展的兩卷詩稿
第六課 石虎是我們的龍貓|pond|池畔的生態觀察點|生態社調查站|ranger|reporter.field|lamp|池邊的路燈紀錄
第七課 五柳先生傳|scroll|五柳讀書處|徵文稿審讀桌|guide|artisan.period|book|舊書裡的自傳稿
第八課 摩登土產鳳梨酥|workshop|編織與包裝設計室|學生設計展|artisan|cook|bag|可拆洗的便當袋
第九課 謝天|track|獎牌頒發區|田徑賽頒獎臺|athlete|reporter.field|medal|跑者的獎狀
第十課 貓的天堂|village|屋外草地與院牆|寵物專欄採訪點|inkcat.field|ranger|notebook|小貓的觀察日記
自學選文一 搜神抓鬼趣──六朝志怪小說選|archive|志怪故事的藏書庫|文藝展閱稿處|inkcat.period|guide.period|book|少了一角的借書單
自學選文二 放天燈是傳統，還是為山林製造更多垃圾？|river|河畔放燈處|社區河燈會議|ranger|guide.field|lamp|河燈會的願望燈
自學選文三 越南安妮：新移民的歌仔戲人生|stage|歌仔戲班的排練臺|戲團訪談現場|performer.period|reporter|mask|戲班演出道具
語文常識一 漢字的結構|library|圖書館字卡櫃|自然觀察卡校對桌|archivist|guide.everyday|card|缺了字的天氣卡
語文常識二 漢字的流變與書法欣賞|scroll|書法展的臨帖桌|書法展陳列區|artisan.period|guide|brush|展桌上的書法筆
`);
  add('2上', `
第一課 田園之秋選|storm|秋雨將至的臺灣農田|攝影社田野工作站|ranger|reporter.field|camera|三段天候觀察紀錄
第二課 古詩選|harbor|未能出航的渡船碼頭|詩刊閱稿桌|guide.period|reporter.field|ticket|沒有寄出的渡船票
第三課 下雨天，真好|station|雨中的故鄉月臺|車站訪談整理處|detective.field|reporter.field|bell|月臺傳來的叫賣鈴
第四課 愛蓮說|pond|荷葉與蓮花池畔|社團標本展示臺|ranger|guide.period|compass|交接盒裡的指南針
第五課 生命中的碎珠|station|候車亭旁的樹影|校報候車觀察站|reporter.field|ranger|clock|五天的候車紀錄
第六課 鳥|cage|向山林敞開的籠窗|展場小說閱覽區|ranger|inkcat.field|leaf|園丁的飼養紀錄
第七課 張釋之執法|classroom|桌遊決賽裁判席|桌遊決賽教室|athlete|detective|ruler|決賽的規則量尺
第八課 找尋失落的水源|village|果園灌溉水路|果園口述史採訪點|ranger|guide.field|map|果園手繪水路圖
第九課 一棵開花的樹|oldtown|晚歸的巷口|有聲詩採集點|reporter.field|inkcat.field|lamp|巷口的燈光紀錄
第十課 畫的哀傷|river|河岸寫生處|校友速寫取景地|artisan.field|archivist.field|brush|河畔速寫的畫筆
自學選文一 六朝名士畫廊──世說新語選|scroll|六朝雅集的書案|古風短劇排練室|performer.period|guide.period|brush|濺上墨點的畫卷
自學選文二 一團人生|gallery|展館導覽集合處|展館訪談席|guide.everyday|reporter|card|導覽員的兩張自介卡
自學選文三 安藤忠雄：孤獨，也要讓夢想開花|workshop|建築模型工房|建築社模型桌|artisan|ranger.everyday|ruler|模型窗邊的比例尺
語文常識一 語法（上）詞類|archive|校史道具庫房|校史道具登記桌|archivist|artisan|notebook|校史道具清單
語文常識二 語法（下）句子|stage|劇團字幕控制席|劇團字幕排演室|performer|reporter|card|字幕機的角色卡
`);
  add('2下', `
第一課 運動家的風度|gym|排球決賽的室內球場|排球決賽紀錄席|athlete.everyday|detective.field|ball|決勝局的比賽用球
第二課 木蘭詩|temple|古風歸鄉戲的門樓|劇社古詩排演場|performer.period|guide.period|scroll|返鄉場的排演詩稿
第三課 管好舌頭|broadcast|廣播訓練室|校園廣播課|reporter|detective|mic|待比較的播音紀錄
第四課 我所知道的康橋|cambridge|康橋的垂柳與康河|旅行稿走讀站|ranger|artisan.field|map|受潮的河岸路線圖
第五課 陋室銘|scroll|雨聲裡的簡樸書室|老教室校稿桌|guide|archivist.period|card|門牌背面的短銘
第六課 森林最優美的一天|forest|苔蘚與白花的森林步道|自然社觀察小徑|ranger|detective.field|camera|步道觀察相機
第七課 飛魚|flying-fish|花蓮石梯坪的夜海|碼頭採訪站|reporter.field|ranger.field|notebook|記者的海上札記
第八課 空城計|temple|空城戲的古城門|密室短劇排練臺|performer.period|detective.period|mask|短劇裡的角色面具
第九課 汨羅江神|river|江神詩的臨水步道|校史詩展|guide.period|ranger.field|map|老路標的箭頭拓樣
第十課 科幻極短篇選|stage|熄燈後的劇場|科幻劇場機房|reporter|performer|mic|空劇場的掌聲錄音
自學選文一 軼事瑣聞大觀園──唐宋筆記選|workshop|剪紙師的手藝桌|社史工藝採訪處|artisan.period|guide.period|leaf|剪落的紙葉圖樣
自學選文二 面對假訊息，其實我可以這麼做！|newsroom|校園消息查核臺|班群公告查核桌|detective|reporter|card|缺少年份的公告截圖
自學選文三 進軍葛萊美的華人設計師──蕭青陽|workshop|唱片封套設計室|學生設計展桌|artisan|reporter|map|封套裡的錄音地圖
語文常識一 應用文──書信、便條|library|校友會收信櫃臺|校友會收件處|archivist|detective|letter|校友會收到的便條
語文常識二 應用文──題辭、柬帖|oldtown|沿街住商門面|社區送件路線|guide.everyday|archivist.field|card|三張待送的賀卡
`);
  add('3上', `
第一課 土|fields|稻穀鋪開的曬穀場|畢業刊物採訪處|ranger.field|reporter.field|camera|兩代人的曬場照片
第二課 詞選|temple|舊山門的石階|山門展題卡桌|guide.period|archivist.period|card|山門前的無署名題卡
第三課 與921說再見：20年的生命練習題|oldtown|重新開門的老街紙店|紙店口述訪談現場|reporter.field|artisan.everyday|mic|水痕牆前的訪談錄音
第四課 黃州突圍|scroll|逆境中寫作的書房|編刊人社史整理桌|archivist.period|guide.period|pen|編刊人的日誌筆跡
第五課 與宋元思書|river|石拱橋與遠岸亭|步道導覽錄音站|ranger.field|reporter.field|map|缺了站名的聲音地圖
第六課 一家手語餐廳的誕生|cafe|開放式取餐櫃臺|餐飲實習教室|cook|artisan|lamp|取餐櫃臺的叫號燈
第七課 我們的饕餮時代|market|食品販售區|校園福利社|cook.everyday|detective|notebook|糖果移架紀錄
第八課 生於憂患死於安樂|stage|投影熄滅的排演臺|校園劇社|performer|reporter|notebook|演員的舞臺日誌
第九課 射鵰英雄傳──智鬥書生|scroll|書生的解題書房|書展問答臺|guide.period|detective.period|card|書展的藏書章印樣
自學選文一 大明湖──清代章回小說|river|湖畔拱橋與遠亭|水岸速寫集合處|artisan.field|ranger.field|brush|湖邊的速寫筆
自學選文二 有關氣候變遷的難題|fields|準備留種的田地|園藝社種子櫃|ranger.field|cook.field|bag|園藝社的留種袋
自學選文三 活著，只為病人而生的醫師──范鳳龍|village|醫師走訪的村落|村民致謝相冊整理處|reporter.field|guide.field|camera|村民合編的相冊
語文常識 應用文──對聯|scroll|書案前的文房攤位|校展文房攤位|artisan.period|guide.period|scroll|掉落的兩張門聯
`);
  add('3下', `
第一課 元曲選|river|暮鐘裡的舊渡口|返鄉車票審稿處|guide.period|reporter.field|ticket|寫了小曲的返鄉票
第二課 石滬|weir|澎湖退潮後的石滬|校史展錄音席|ranger.field|archivist.everyday|shell|海岸單元的潮間帶標本
第三課 人不可以無癖|station|舊城的候車月臺|社區散步圖訪談處|guide.field|reporter.field|ticket|按站名整理的票根
第四課 鄒忌諷齊王納諫|cafe|進言故事裡的品湯桌|社團意見討論桌|cook|archivist|notebook|同桌的品湯意見
第五課 永不滿足，長保傻勁──賈伯斯的人生三堂課|broadcast|畢業演講剪輯臺|畢業演講剪輯室|reporter|detective|mic|兩段試播經歷
第六課 羅密歐與茱麗葉樓臺會|balcony|維洛納的樓臺庭院|劇社樓臺戲排練場|performer.period|reporter|mask|布幕後的角色面具
自學選文一 來龍去脈探掌故──歷代小品文賞讀|cafe|躲雨的老茶館|茶館手記整理桌|cook.period|guide.period|umbrella|店主修整的借用傘
自學選文二 來自西方的舶來品──博．物．館|gallery|博物館的建築陳列廳|博物館修復展區|artisan|guide.everyday|ruler|小戲臺的構件量尺
自學選文三 捍衛性別平權的鬥士──金斯伯格|track|校隊選拔場|校隊選拔紀錄席|athlete|reporter.field|card|匿名選拔報名卡
`);
  add('修辭', `
譬喻|pond|映著碎光的池面|星象社底片工作臺|ranger|reporter.field|camera|光影展底片袋
借代|lab|鏡片研究實驗室|實驗室講座簽到處|archivist.everyday|detective|flask|鏡片講座的實驗臺
轉化|campus|夜巡的教室外廊|校舍巡查點|inkcat.field|reporter.field|notebook|夜巡員的日誌
誇飾|classroom|放學後的課桌|班級作業登記桌|detective|archivist|book|桌上的七本講義
轉品|fields|雨後轉綠的土坡|詩展底稿校對處|artisan.field|ranger.field|camera|同一土坡的前後照片
感嘆|broadcast|有聲劇錄音間|廣播劇配音室|reporter|performer|mic|遺失場標的配音帶
摹寫|market|有烘烤香氣的市集|栗子市集|detective.field|cook.field|bag|市集裡的栗子紙袋
映襯|stage|燈暗下的禮堂|禮堂音效臺|performer|reporter|ticket|落在看臺的票根
倒反|library|打烊後的借閱室|借閱室值班桌|archivist|inkcat.everyday|letter|被歸入表揚夾的信
設問|gallery|再生紙展示廳|環保展服務臺|guide.everyday|artisan|letter|服務臺的三封回信
類疊|broadcast|朗讀收音室|朗讀稿校對臺|performer.everyday|reporter|mic|留有停頓的朗讀錄音
排比|workshop|手工海報製作桌|志工海報工作區|artisan|archivist|pen|底稿旁的排字筆
對偶|scroll|題寫對聯的書房|攝影展門口|guide.period|artisan.period|scroll|未配對的下聯
雙關|market|老市集修傘攤|志工修傘攤位|artisan.field|reporter.field|umbrella|兩人共撐的修補傘
層遞|stage|合唱表演看臺|體育館導播臺|reporter|performer|mic|三段掉標的現場錄音
回文|festival|夜市文字燈攤|文字遊戲攤|guide.field|performer.field|lamp|夜市的雙面燈牌
引用|newsroom|班刊編輯室|班刊社論桌|reporter|detective|pen|前任主編的桌牌
`);
  add('文法', `
字、詞、句子|lab|自然與生物標本室|生物社標本桌|ranger.everyday|archivist|card|分開的蝴蝶名牌
實詞|newsroom|口述稿校對桌|社務紀錄編輯室|archivist|reporter|notebook|待核對的社務紀錄
虛詞|bookshop|書攤的開放門面|雨天書攤|guide.everyday|detective.field|umbrella|被雨水沖淡的海報
複詞|gallery|聲音展互動廳|聲音展分類桌|reporter|guide.everyday|book|展桌旁的小字典
代詞性助詞|library|圖書館來信桌|還書回函桌|archivist|detective|letter|請求諒解的來信
四大句型|gallery|相片說明陳列牆|圖說編輯桌|artisan|archivist|camera|被貼錯的說明照片
詞性結構|classroom|短語接龍課桌|文字遊戲裁判席|detective|guide.everyday|card|四字短語接龍卡
`);
  add('應用文', `
信封與啟封詞|newsroom|校園收發工作桌|失物室收件桌|archivist|detective|letter|寫有兩個地址的信封
書信結構與用語|workshop|紙戲偶修整臺|展場紙偶工作區|artisan|performer|letter|紙偶箱底的殘信
敬稱與謙稱|workshop|畫框裝裱工作室|美術社收件席|archivist|artisan|card|兩家的畫框收件單
柬帖|stage|校園讀劇小劇場|戲劇社邀請處|performer|archivist|letter|週六讀劇會邀請柬
題辭與場合|bookshop|新開幕的街角書店|書店開幕收禮處|guide.everyday|archivist|card|兩份不同場合的賀卡
`);
  add('判別能力', `
季節線索|pond|荷花池與蟬聲樹蔭|四季展觀察點|ranger|artisan.field|leaf|無日期的荷塘素描
節慶風俗|river|節令競渡的河岸|節慶相簿整理處|athlete.period|guide.field|map|節慶活動河岸圖
人物線索|village|草廬所在的鄉間小路|三國人物展|guide.period|detective.period|scroll|少了姓名的人物展籤
年齡別稱|cafe|校友壽宴的茶席|校友宴報到桌|cook.period|guide.everyday|card|相差十歲的兩張席卡
`);
  add('韻文與散文', `
韻文源流|scroll|先秦歌謠展書案|古典詩歌展示櫃|guide.period|archivist.period|scroll|四言歌謠展簽
散文與史傳|archive|史館文獻庫房|校史館編目區|archivist.everyday|guide.period|book|兩種編法的史冊
小說類型|scroll|讀書人的舊書房|古典小說展區|guide.period|inkcat.period|book|功名記事展品說明
詩、詞、曲格律|workshop|古籍排印工作桌|典藏排印室|artisan.period|archivist.period|ruler|被裁短的排印稿
詞牌與題目|home|憶祖母的舊家廚房|詞作分類桌|archivist.period|cook.period|notebook|寫有小題的詞稿
唐代詩風|temple|山水畫意的古寺庭院|山水詩展廳|guide.period|ranger.period|brush|山水展的詩畫簽
唐宋古文八大家|gallery|古文八大家特展|八大家人物展臺|guide.period|archivist.period|scroll|三蘇人物關係卷
`);
  window.DETECTIVE_DIRECTIONS=directions;
})();
