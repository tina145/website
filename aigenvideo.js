// ============================================================
// AI生成视频 卡片墙数据
//
// 这个文件只放数据，页面渲染在 aigenvideo-render.js 里（那个必须排在 script.js 之后）。
// 本文件必须排在 script.js 之前加载。
// 改完这里，aigenvideo.html 就跟着变，不用动别的地方。
//
// 字段与 learning.js（学习视频）完全一致，两页是同一套卡片墙做法：
//   title       视频标题                  —— 必填，没有 title 的条目会被整条忽略
//   up          UP主 / 作者               —— 可选
//   collection  分类                      —— 可选
//   date        发布时间（YYYY-MM-DD）    —— 可选
//   url         B站视频地址               —— 可选，填了整张卡就能点开（新窗口）；
//                                            留空则整张卡不可点、右下角显示「待填链接」，不会变死链
//   cover       封面图（仓库根目录文件名）—— 可选，留空按标题哈希生成渐变色块 + 首字
//   tags        标签数组                  —— 可选
//   note        备注                      —— 可选
//   sample      写 true 会挂一个「示例」角标 —— 填自己的内容时把这一行删掉
//
// 顺序就是页面上的显示顺序（没有排序功能）。
//
// 2026-10-04 新建本页（第 11 个分区）。第一条是 tina 给的 B站 地址，
// 字段全部取自那个视频页面本身（<title> / meta / 页面里的 __INITIAL_STATE__），没有编造。
// ============================================================

window.AI_GEN_VIDEOS = [
  {
    // tina 2026-10-04 给的地址：https://www.bilibili.com/video/BV12kae6WEPT/
    // 标题照抄页面 <title>（去掉结尾的「_哔哩哔哩_bilibili」）。
    title: 'Opus5.5一句话核爆考研408统考 动画MV',
    up: 'Bemly_',                  // 视频 owner（页面 __INITIAL_STATE__ 里的 owner.name）
    collection: 'MV',              // 取自视频页面自己的标签（页面 tag 里有「MV」）
    date: '2026-09-28',            // 页面 pubdate（UTC 2026-09-27T16:24:09Z，B站 显示的北京时间是 09-28 00:24）
    url: 'https://www.bilibili.com/video/BV12kae6WEPT/',
    cover: 'cover-opus5-5-mv.webp',
    // 标签取自视频页面自己的标签（keywords meta）。**两条 B站 自己硬塞的标签都按 tina 要求删掉了**：
    // ① 自动识别的音乐标签「发现《I Don't Want to Live Forever (Workout Gym Mix)》」；
    // ② 活动推广标签「新学期多点新知识」（2026-10-04 删）。
    // 剩下这 9 个原样照抄，一个没加也没减。**以后加视频也照这个来：B站 自动加的音乐标签和活动标签都不要收进来。**
    tags: ['MV', '大学', '考研', '计算机', '学习', '数据结构', '核爆', '数据库', '408'],
    // 备注（note）字段 2026-10-04 按 tina 要求删掉了 —— 卡片上不再显示任何备注。
    // 字段本身仍然有效（learning.js / 本文件顶部都有说明），以后想给某条加一句备注随时可以写回来。
  },

  // ---- tina 2026-10-04 给的另外两条（她只给了地址，字段全部从视频页面本身取）----
  // ⚠️ 本轮发现更靠谱的取标签办法：用页面 __INITIAL_STATE__ 里的 **tags 数组**，
  //    别再照抄 keywords meta —— meta 里混着标题本身、B站 自动加的音乐标签（「音乐」「AI音乐」）、
  //    以及「哔哩哔哩 / bilibili / B站 / 弹幕」这类站点样板词，容易收脏。
  //    tags 数组每条都带 tag_type：**bgm = B站 自动配的 BGM 标签（删）**、
  //    **topic = 话题标签（要看是不是 B站 活动，活动就删）**、old_channel = 普通标签（留）。
  //    回头看第一条（BV12kae6WEPT）的 tags 数组，恰好就是 bgm「发现《I Don't Want to Live Forever…》」+ topic「新学期多点新知识」被 tina 点名删掉，规则完全对得上。
  {
    // tina 2026-10-04 给的地址：https://www.bilibili.com/video/BV1H8av6HEYs/
    title: '震惊瘫坐！Opus 5.5生成-从现在看过去-AI简史',
    up: '铼夏LAYccc',              // 页面 videoData.owner.name
    collection: '动画',            // 取自它自己的标签里的「动画」
    date: '2026-09-28',            // 页面 pubdate（UTC 2026-09-27T23:14:21Z，B站 显示北京时间 2026-09-28 07:14）
    url: 'https://www.bilibili.com/video/BV1H8av6HEYs/',
    cover: 'cover-opus55-jianshi.webp',
    // 它自己的 tags 数组共 5 条，没有 bgm、没有 B站 活动，全部原样保留。
    tags: ['Claude', '人工智能', '学习', '动画', 'AI'],
  },
  {
    // tina 2026-10-04 给的地址：https://www.bilibili.com/video/BV18ta86EEHb/
    title: '吓哭了Opus5.5 AGI概念MV',
    up: '白雪仅当雪白',            // 页面 videoData.owner.name
    collection: 'MV',              // 取自它自己的标签里的「MV」
    date: '2026-09-27',            // 页面 pubdate（UTC 2026-09-27T09:47:56Z，B站 显示北京时间 2026-09-27 17:47）
    url: 'https://www.bilibili.com/video/BV18ta86EEHb/',
    cover: 'cover-opus55-agi-mv.webp',
    // 它自己的 tags 数组共 7 条，按上面那条规则删掉了 1 条 B站 活动标签「B站AI无限竞技场」（tag_type=topic），
    // 剩下 6 条原样保留（「音乐」是普通 old_channel 标签，不是「发现《曲名》」那种自动音乐标签，所以留着）。
    tags: ['AI', 'MV', '音乐', 'Pdoom', 'AGI', 'Opus'],
  },
];

// 以后要按分类筛（现在只有三条，所以页面还没做筛选栏）时，在这里预设置分类顺序，
// 写法照 karaoke.js 的 KARAOKE_COLLECTION_PRESETS。
// window.AI_GEN_VIDEO_COLLECTION_PRESETS = ['MV', '短片'];
