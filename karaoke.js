// ============================================================
// 卡拉OK 歌单数据
//
// 这个文件只放数据，页面渲染在 script.js 的 initKaraokeList() 里。
// 改完这个文件，karaoke.html 就跟着变，不用动别的地方。
// 必须排在 script.js 之前加载。
//
// 每条的字段：
//   title       曲名                      —— 必填，没有 title 的条目会被整条忽略
//   artist      歌手 / 原唱                —— 可选
//   source      出处（动画 / 游戏 / 电视剧）—— 可选
//   collection  所属合集 / 歌单            —— 可选，页面会按它自动生成筛选按钮
//   url         B站视频地址               —— 可选，填了整条就能点开（新窗口）；
//                                            留空则显示「待填链接」，不会变成死链接
//   tags        标签数组（['日语','高音']） —— 可选
//   note        备注                      —— 可选
//   sample      写 true 会挂一个「示例」角标 —— 填自己的内容时把这一行删掉
//
// 顺序就是页面上的显示顺序（没有排序功能）。
// 点条目打开的是 url 那个视频，不是合集封面，所以每条尽量填「那一首」的地址。
//
// 2026-09-24：tina 要求把「填词翻唱」统一改成「翻唱」，所以 tags 与 source 两处都改成了「翻唱」。
// 前两条视频的简介里其实写着「填词：我 / 翻唱：我」（确实是填词翻唱），这里是**她的取舍、不是笔误**，
// 以后加歌也一律写「翻唱」，别再改回「填词翻唱」。
// ============================================================

window.KARAOKE = [
  {
    // 第一条：tina 2026-09-24 给的地址。
    // 下面这些字段全部取自那个视频页面本身（标题、UP主、简介里写的原曲与题材），没有编造。
    // 标题里的空格是 UP主 排版时的写法，照抄了；搜的时候得搜「耀」「圣素」这种片段。
    title: '耀 上 圣 素',
    artist: 'Luminous_J',          // 视频作者 = 简介里写「填词：我 / 翻唱：我」的那个人
    source: '游戏王 翻唱（原曲：YOASOBI「アドレナ」）',
    collection: '游戏王',          // 合集：页面顶部「全部合集」旁边会多一个「游戏王」筛选按钮
    url: 'https://www.bilibili.com/video/BV1W1ec6cE8K/',
    tags: ['游戏王', '翻唱'],
  },
  {
    // tina 2026-09-24 给的地址。字段同样取自视频页面本身。
    // 简介：填词/翻唱/视频都是 UP主 自己，内容基于直播时观众发的弹幕总结，
    // 所以简介里那几句「本人没有玩过游戏王…没看过卡片效果」是 UP主 自己写的免责声明，照实留着。
    title: '卡通通卡卡卡通',
    artist: 'Luminous_J',
    source: '游戏王 翻唱（原曲：葉月ゆら「シャイニング☆アブラカタブラ」）',
    collection: '游戏王',
    url: 'https://www.bilibili.com/video/BV1DMoxBwE9y/',
    tags: ['游戏王', '翻唱'],
  },
  {
    // tina 2026-09-24 给的地址。这首简介里只写了「翻唱」（没有填词），标签用「翻唱」；
    // 卡图是用游戏王制卡器 LD 生成的，所以仍归「游戏王」合集。
    title: 'ShaDdoll -噬 暗 影 依 团-',
    artist: 'Luminous_J',
    source: '游戏王 翻唱（原曲：清風明月「SoulStone -闇喰イサァカス団-」）',
    collection: '游戏王',
    url: 'https://www.bilibili.com/video/BV1wzSuBHE2m/',
    tags: ['游戏王', '翻唱'],
  },
  {
    // tina 2026-09-24 给的地址。字段取自视频页面本身：标题、UP主「しらたまOfficial」，
    // 简介原文是「生日纪念上尝试唱了宝石学院的OP『君とのミチシルベ』卷心菜社公式→cabbage-soft.com/products/jewelry/」
    //（引号里那句是页面原文，页面写的是「宝石学院」；本站统一用中文名「宝石心学园」+ 厂商「卷心菜社」，
    //  2026-09-24 按 tina 要求改的，别改回日文名「きゃべつそふと」）。
    // 这是新分类「galgame」下的第一首：宝石心学园 = 卷心菜社（きゃべつそふと）的作品，
    // 也就是本站 galgame 收藏里那部《霞流宝石心》。
    title: '【しらたま】君とのミチシルベ',
    artist: 'しらたまOfficial',    // UP主 本人就是唱的人（视频标题里的【しらたま】）
    source: '宝石心学园 OP 翻唱（原曲：KyoKa「君とのミチシルベ」）',
    collection: 'galgame',
    url: 'https://www.bilibili.com/video/BV1B94y1p7pk/',
    tags: ['宝石心学园', '卷心菜社', '翻唱'],
  },
  {
    // tina 2026-09-24 给的地址。这条**不是翻唱**，是「纯K投屏」（带歌词字幕的 KTV 投屏视频），
    // 放的是原唱 佐咲紗花 的版本；UP主「下俣愛裏」只是做投屏的人、不是歌手，
    // 所以 artist 写歌手（字段定义本来就是「歌手 / 原唱」），没有照抄 UP主。
    // 「Will of Adamant」是宝石心学园的 2nd OP —— 依据有两处：视频自己的标签里就写着
    // ジュエリー・ハーツ・アカデミア / 宝石心学园（**页面自己用的就叫「宝石心学园」**，
    // 跟 tina 2026-09-24 要求的写法一致），官方站 cabbage-soft.com/products/jewelry/ 也对得上。
    title: '【纯K投屏】Will of Adamant - 佐咲紗花',
    artist: '佐咲紗花',
    source: '宝石心学园 2nd OP（原唱：佐咲紗花）',
    collection: 'galgame',
    url: 'https://www.bilibili.com/video/BV1fV4y1q7rZ/',
    tags: ['宝石心学园', '卷心菜社', '纯K投屏'],
  },
  {
    // tina 2026-09-24 给的地址。同为「纯K投屏」，放的是原唱 uniy 的版本（UP主 只是做投屏的人）。
    // 作品判定：视频自己的标签里写着 ジュエリー・ハーツ・アカデミア / 宝石心学园 / カラオケ。
    // 「插入歌」这个身份不在视频页面里，是查官方站专辑曲目（cabbage-soft.com/products/jewelry/
    // 里写作「Rising Fomalhaut／vocal：uniy」）和 ErogameScape（music=16317，标为挿入歌）得到的。
    title: '【纯K投屏】Rising Fomalhaut - uniy',
    artist: 'uniy',
    source: '宝石心学园 插入歌（原唱：uniy）',
    collection: 'galgame',
    url: 'https://www.bilibili.com/video/BV1Kr4y1Z7pr/',
    tags: ['宝石心学园', '卷心菜社', '纯K投屏'],
  },
  {
    // tina 2026-09-24 给的地址。这条是**姐妹作** ジュエリー・ナイツ・アルカディア（不是宝石心学园）：
    // 曲名后面的括号里视频自己就写着「OP1」，歌手 uniy。
    // 中文名用「月映宝石乡」——本站 galgame 收藏里那部《月映宝石乡 -星沈碧落万物喑-》就是它。
    // ⚠️ 视频标签里那个「宝石心学院」是 UP主 自己贴错了（那是宝石心学园的别译），别跟着抄。
    title: '【纯k投屏】Addict of justice-uniy（ジュエリー・ナイツ・アルカディアOP1 ）',
    artist: 'uniy',
    source: '月映宝石乡 OP1（原唱：uniy）',
    collection: 'galgame',
    url: 'https://www.bilibili.com/video/BV1UmQ5YZEpF/',
    tags: ['月映宝石乡', '卷心菜社', '纯K投屏'],
  },
  {
    // tina 2026-09-24 给的地址。同上那条的 OP2（标题里自己写着），歌手 Ceui。
    title: '【纯k投屏】Tragedy Night-Ceui（ジュエリー・ナイツ・アルカディアOP2）',
    artist: 'Ceui',
    source: '月映宝石乡 OP2（原唱：Ceui）',
    collection: 'galgame',
    url: 'https://www.bilibili.com/video/BV1j8RHYNEaK/',
    tags: ['月映宝石乡', '卷心菜社', '纯K投屏'],
  },
];

// 合集筛选栏里排在最前、且保持这里写的先后顺序（留空数组就按数据里的数量从多到少排）
// 这里写的合集名，只有在歌单里真有条目用它时才会生成按钮；
// 没写进这里、但条目用到的合集，会自动排在后面。
window.KARAOKE_COLLECTION_PRESETS = ['游戏王', 'galgame'];
