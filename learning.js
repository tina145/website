// ============================================================
// 学习视频 卡片墙数据
//
// 这个文件只放数据，页面渲染在 learning-render.js 里（那个必须排在 script.js 之后）。
// 本文件必须排在 script.js 之前加载。
// 改完这里，learning.html 就跟着变，不用动别的地方。
//
// 每条的字段：
//   title       视频标题                  —— 必填，没有 title 的条目会被整条忽略
//   up          UP主 / 作者               —— 可选
//   collection  分类                      —— 可选
//   date        发布时间（YYYY-MM-DD）    —— 可选
//   url         B站视频地址               —— 可选，填了整张卡就能点开（新窗口）；
//                                            留空则整张卡不可点、右下角显示「待填链接」，不会变死链
//   cover       封面图（仓库根目录文件名）—— 可选，留空按标题哈希生成渐变色块 + 首字
//   site        官网地址                  —— 可选，2026-10-06 加：填了卡片右下角多一个「官网 ↗」（新窗口）；
//                                            点卡片别处依旧是开 B站 视频，两个链接互不干扰
//   tags        标签数组                  —— 可选
//   note        备注                      —— 可选
//   sample      写 true 会挂一个「示例」角标 —— 填自己的内容时把这一行删掉
//
// 顺序就是页面上的显示顺序（没有排序功能）。
//
// 2026-10-04 新建本页（第 10 个分区）。第一条是 tina 给的 B站 地址，
// 字段全部取自那个视频页面本身（<title> / meta / 页面里的 __INITIAL_STATE__），没有编造。
// ============================================================

window.LEARNING = [
  {
    // tina 2026-10-04 给的地址：https://www.bilibili.com/video/BV1bkvQBEEUz/
    // 标题照抄页面 <title>（去掉结尾的「_哔哩哔哩_bilibili」），竖线后面的「附原版CC字幕」也是标题自带。
    title: '哈佛大学CS50x 2026 哈佛大学计算机科学导论课程 2026版 双语字幕 4K HDR | 附原版CC字幕',
    // up（B站 UP主）2026-10-06 按 tina 要求**整条删掉**，卡片上不再显示 UP主名字。
    // 字段本身仍然有效（文件顶部有说明、AI生成视频那页也还在用），想显示回来就照 aigenvideo.js 那样写一行 up。
    collection: '计算机科学',       // 取自视频页面自己的标签（页面 tag 里有「计算机科学」）
    date: '2026-01-01',            // 页面 pubdate
    url: 'https://www.bilibili.com/video/BV1bkvQBEEUz/',
    cover: 'cover-cs50x-2026.webp',
    // 官网：CS50x 课程主页。2026-10-06 抓过，HTTP 200、页面 <title> 就是「CS50x 2026」，
    // 与视频标题里的「CS50x 2026」对得上（/x/2026/ 会 302 回 /x/，所以写这个短地址）。
    site: 'https://cs50.harvard.edu/x/',
    // 标签取自视频页面自己的 tags 数组。**2026-10-06 按 tina 要求删掉了其中的 B站 活动标签「公开课上B站」**，
    // 剩下这 7 个原顺序照抄（规则见 aigenvideo.js：bgm 自动配乐删、topic 里的 B站 活动删、old_channel 留）。
    tags: ['课程', '哈佛大学', '学习', '编程', '公开课', 'CS50x', '计算机科学'],
    // 备注（note）2026-10-06 也按 tina 要求整条删掉了（原本写的是「共 26 个分P，录制于 2025 秋；简介里写着
    // 课程主页 cs50.harvard.edu/x，课程素材是 CC BY-NC-SA 4.0 许可」）。字段本身仍然有效，想写回来随时加。
  },

  {
    // tina 2026-10-06 给的地址：https://www.bilibili.com/video/BV1GWLb65Erd/
    // 她指定「插在 CS50x 之后」，所以这一条排在**第 2 张卡**（数组下标 1），不是追加到最后。
    // 字段来源同下面那条北大离散数学：B站 对视频页整条路径风控 412，所以走接口
    // （x/web-interface/wbi/view + x/tag/archive/tags，都是 HTTP 200），响应原文缓存进
    // ~/web-verify/cache/BV1GWLb65Erd.json / .tags.json，自检逐字段核对。
    title: '【中英字幕】Harvard CS50P Python 编程入门课程 2022',
    collection: '计算机编程',          // 取自它自己的标签里的「计算机编程」
    date: '2026-05-21',               // 接口里的 pubdate 1779365116 → 北京时间 2026-05-21 20:05
    url: 'https://www.bilibili.com/video/BV1GWLb65Erd/',
    cover: 'cover-cs50p-python.webp', // 源图 1920×1080 **正好 16:9**，直接缩到 640×360（不用裁）
    // 它自己的标签一共 8 条，**全是正常话题、没有 B站 活动标签，所以一个都没删**：
    // 编程语言 / 计算机编程 / 中英字幕 / 公开课 / 入门课程 / 哈佛 / Python / cs50
    // 视频本体（都出自上面那份接口响应，但这页按规矩**不写备注**）：共 11 个分P、时长合计 57239 秒
    // ≈ 15 小时 54 分；UP主 JK19999；简介是「Harvard CS50P Python 编程入门课程 2022 自制中英字幕」。
    // 官网**暂时没挂**：候选 https://cs50.harvard.edu/python/ 已经验过（200，标题「CS50's Introduction to
    // Programming with Python」；/python/2022/ 会 302 回 /python/），tina 这一轮没发话，所以留着等她一句话。
    tags: ['编程语言', '计算机编程', '中英字幕', '公开课', '入门课程', '哈佛', 'Python', 'cs50'],
  },
  {
    // tina 2026-10-04 给的地址：https://www.bilibili.com/video/BV1J5PkzmEo4/
    title: '【2026·4K 双语】哈佛大学公开课《人工智能导论》with Python！入门深度学习的必修课！！ -机器学习/神经网络/新手小白',
    // up 同上：2026-10-06 按 tina 要求删掉，卡片上不显示 UP主（原本是「小微带你学AI」）。
    collection: '人工智能',         // 取自它自己的标签里的「人工智能」
    date: '2026-03-05',            // 页面 pubdate（UTC 2026-03-05T04:25:18Z，B站 显示北京时间 2026-03-05 12:25）
    url: 'https://www.bilibili.com/video/BV1J5PkzmEo4/',
    cover: 'cover-harvard-ai-intro.webp',
    // 官网：CS50's Introduction to Artificial Intelligence with Python。2026-10-06 抓过，HTTP 200，
    // 页面标题就是这个课名；这本课没有年份路径（/ai/2026/、/ai/2025/ 都是 404），所以用 /ai/。
    // 视频的 8 个分P（Search / Knowledge / Uncertainty / Optimization / Learning / Neural Networks / Language）
    // 正是这门课的 Lecture 0-6，能对上。
    site: 'https://cs50.harvard.edu/ai/',
    // 它自己的 tags 数组共 10 条，**全部是 old_channel 普通标签**（没有 bgm 自动配乐标签、也没有 B站 活动话题），
    // 所以一条没删，原顺序照抄。取标签的办法见 aigenvideo.js 里的说明：读 __INITIAL_STATE__ 的 tags 数组，别照抄 keywords meta。
    tags: ['哈佛大学', '学习', 'AI', '神经网络', '人工智能', '教程', '机器学习', '深度学习', 'Python', 'PyTorch'],
    // 这条按 tina 2026-10-04 的口径**没有写 note**（她当时让把 AI生成视频 那条的备注整条删掉）。
    // 页面本身能凑出的信息：共 **8 个分P**、时长合计 **45671 秒（约 12 小时 41 分）**、简介是公众号引流（gong.粽.号）。
    // 想给这条补一句备注，照上面第一条那样写 note 即可。
  },
  {
    // tina 2026-10-06 给的地址：https://www.bilibili.com/video/BV1cQ4y1C71r/
    // ⚠️ 抓这条的时候 B站 对**视频页整条路径**上了风控（HTTP 412，连本轮之前刚抓成功过的对照组
    //    BV1J5PkzmEo4 也一起 412；curl 与无头真 Chrome 都一样，换 UA / 带 cookie / 换代理都不行）。
    //    所以这条的字段**不是从页面 HTML 取的**，而是从 B站 自己的接口取的（真浏览器里同源 fetch，带 cookie）：
    //      · x/web-interface/wbi/view?bvid=…  → 标题 / owner / pubdate / 分P / duration / pic（HTTP 200）
    //      · x/tag/archive/tags?bvid=…       → 标签（HTTP 200）
    //      （注意：经典的 x/web-interface/view 那条老接口也是 412，能用的是 **wbi** 那条。）
    //    两份响应原文落在 /tmp/bili6-wbi.json、/tmp/bili6-tags.json，自检脚本拿它们逐字段核对（防编造）。
    // 标题照抄（这条标题本身就带【慕课+课堂实录】和【慕课更新完结】）。
    title: '【慕课+课堂实录】离散数学-北京大学-陈斌-字幕校对-【慕课更新完结】',
    collection: '离散数学',            // 取自它自己的标签里的「离散数学」
    date: '2021-09-25',               // 接口里的 pubdate 1632575036 → B站 显示的北京时间 2021-09-25 21:03
    url: 'https://www.bilibili.com/video/BV1cQ4y1C71r/',
    cover: 'cover-discrete-math-pku.webp',   // 源图 1728×1080（16:10），按卡片 object-fit:cover 的效果居中裁成 16:9
    // 官网：挂的是课程资料仓库。地址出自**这条视频自己的简介**（简介倒数第二段「课程资料：」下面那条），
    // 所以它是视频作者给的，不是我编的 —— 自检脚本会核「这个地址必须出现在接口返回的简介字节里」。
    // 2026-10-06 抓过：HTTP 200，页面标题「GitHub - chbpku/dmath: 离散数学课程」（简介里还有个
    // Gitee 镜像 gitee.com/chbpku/dmath，tina 让挂 GitHub，所以就用 GitHub 这条）。
    site: 'https://github.com/chbpku/dmath',
    // 它自己的标签一共只有 4 条：知识分享官 / 北京大学 / 学习 / 离散数学。
    // 「知识分享官」是 B站 的知识类活动标签，按既有规矩（不收 B站 活动标签）**删掉**。
    // tina 2026-10-06 已明确答复「不加」，所以这条就永久不收（自检脚本里也把它列进了禁止标签）。
    // 以后别再问、也别手滑加回来。
    // 顺便记一下这条视频本身的信息（都出自上面那份接口响应，但这页按规矩**不写备注**）：
    // 共 128 个分P、时长合计 131294 秒 ≈ 36 小时 28 分；简介是课程说明（面向非计算机专业理工科学生，
    // 讲数理逻辑/集合论/图论/抽象代数/形式语言与自动机）+ 课程资料地址 github.com/chbpku/dmath；播放 4.9 万。
    tags: ['北京大学', '学习', '离散数学'],
  },
];

// 以后要按分类筛（现在只有两条，所以页面还没做筛选栏）时，在这里预设置分类顺序，
// 写法照 karaoke.js 的 KARAOKE_COLLECTION_PRESETS。
// window.LEARNING_COLLECTION_PRESETS = ['计算机科学', '人工智能'];
