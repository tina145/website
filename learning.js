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
    up: 'Digital_Life',            // 视频 owner（页面 __INITIAL_STATE__ 里的 owner.name）
    collection: '计算机科学',       // 取自视频页面自己的标签（页面 tag 里有「计算机科学」）
    date: '2026-01-01',            // 页面 pubdate
    url: 'https://www.bilibili.com/video/BV1bkvQBEEUz/',
    cover: 'cover-cs50x-2026.webp',
    // 标签全部照抄视频页面自己的标签，一个没加也一个没减（原顺序）
    tags: ['公开课上B站', '课程', '哈佛大学', '学习', '编程', '公开课', 'CS50x', '计算机科学'],
    // 下面这句里的三条信息都来自页面本身：meta description 说「共计26条视频」，
    // 简介第一行写着 cs50.harvard.edu/x 与「录制于2025秋」，末行写着课程的 CC BY-NC-SA 4.0 许可。
    note: '共 26 个分P，录制于 2025 秋；简介里写着课程主页 cs50.harvard.edu/x，课程素材是 CC BY-NC-SA 4.0 许可。',
  },
];

// 以后要按分类筛（现在只有一条，所以页面还没做筛选栏）时，在这里预设置分类顺序，
// 写法照 karaoke.js 的 KARAOKE_COLLECTION_PRESETS。
// window.LEARNING_COLLECTION_PRESETS = ['计算机科学', '编程'];
