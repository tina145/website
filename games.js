// ============================================================
// galgame 收藏清单 —— 数据都在这里，改这个文件就能更新页面
//
// 字段说明：
//   title   作品名（必填）
//   brand   品牌 / 制作组，可以不填 ""
//   year    发售年份，填数字；不确定就写 null
//   score   我的评分，0~10 可带小数；没打分写 null
//   status  状态。**目前不在页面上显示**（状态筛选栏、卡片徽章、统计条里的通关数已于 2026-09-23 全部移除），
//             只在数据里留着备案。以后想恢复显示，取值是这五个之一：
//             "cleared"  已通关
//             "playing"  在玩
//             "paused"   搁置
//             "wishlist" 想玩
//             "dropped"  弃了
//   tags    标签数组，随便写，只作为卡片上的展示标签（筛选栏按厂商，不按标签）
//   cover   封面图片路径，留空 "" 会自动生成色块封面。
//             仓库根目录的 cover-*.webp 是这些作品的封面图，**版权归原厂商所有**
//             （きゃべつそふと / まどそふと / CRYSTALiA / ωstar / くまのみそふと），此处仅作个人收藏展示用。
//             规格：3:4 竖图（480×640，源图偏小的那两张不放大），WebP。
//             美少女万华镜那 7 张取自 VNDB 的官方盒绘（v8038 / v11071 / v14240 /
//             v14365 / v19182 / v27057 / v44184），源图都是竖版，居中裁成 3:4。
//             くまのみそふと 那 2 张：第 1 部用官方站的竖版「発売中」海报（905×1280），
//             第 2 部官方站只有横版主视觉，用的是 VNDB 那张 1000×857，居中裁成 3:4。
//   site    官网链接。填了，卡片上「厂商 · 年份」右边就会出现一个「官网 ↗」并可点击；
//             留空 "" 就完全不显示这个链接。注意月映宝石乡那部填的是域名根
//             （cabbage-soft.com），因为厂商把根路径给了当时的主推作品，以后出新作可能会被换掉。
//   note    一句话感想，可以留空
//   sample  可选。写 true 会在卡片角上标「示例」（用来标临时占位的条目）；正式条目不要写这一行
// ============================================================

// 筛选栏里固定显示的厂商按钮：即使暂时还没有对应作品，这几个按钮也会一直摆在那儿。
// 想再固定几个厂商，往数组里加名字就行；作品数据里出现的其它厂商会自动补进筛选栏。
window.GAL_BRAND_PRESETS = ["卷心菜社", "窗社"];

window.GALGAMES = [
  {
    title: "霞流宝石心 -壮志凌云振寰宇-",
    brand: "卷心菜社",
    year: 2022,
    score: null,
    tags: [],
    cover: "cover-jewelry-hearts.webp",
    site: "https://cabbage-soft.com/products/jewelry/",
    note: "",
  },
  {
    title: "月映宝石乡 -星沈碧落万物喑-",
    brand: "卷心菜社",
    year: 2025,
    score: null,
    tags: [],
    cover: "cover-jewelry-nights.webp",
    site: "https://cabbage-soft.com/",
    note: "",
  },
  {
    title: "常轨脱离Creative",
    brand: "窗社",
    year: 2020,
    score: null,
    tags: [],
    cover: "cover-hamidashi.webp",
    site: "https://madosoft.net/hamidashi/",
    note: "",
  },
  {
    title: "越界恋人！！",
    brand: "水晶社",
    year: 2026,
    score: null,
    tags: [],
    cover: "cover-totsu-lovers.webp",
    site: "https://crystalia.amusecraft.com/totsulover/",
    note: "",
  },

  // ---- 美少女万华镜系列（ωstar，2026-10-04 加入整套 7 部，按发售顺序排）----
  // 中文名取自 VNDB 的 zh-Hans 标题（v14365 / v27057 / v44184 标 official，其余为社区译名）。
  // 第 3 条《かつて少女だった君へ》是 2.5 的番外篇，官方站已没有它的产品页，site 留空。
  {
    title: "美少女万华镜 -被诅咒之传说少女-",
    brand: "ωstar",
    year: 2011,
    score: null,
    tags: [],
    cover: "cover-mangekyou-1.webp",
    site: "https://www.omega-star.jp/bimanhtml/index.html",
    note: "",
  },
  {
    title: "美少女万华镜 -勿忘草与永远的少女-",
    brand: "ωstar",
    year: 2012,
    score: null,
    tags: [],
    cover: "cover-mangekyou-2.webp",
    site: "https://www.omega-star.jp/biman2html/index.html",
    note: "",
  },
  {
    title: "美少女万华镜 外传 -献给曾经是少女的你-",
    brand: "ωstar",
    year: 2014,
    score: null,
    tags: [],
    cover: "cover-mangekyou-2_5.webp",
    site: "",
    note: "",
  },
  {
    title: "美少女万华镜 -神明所创造的少女们-",
    brand: "ωstar",
    year: 2015,
    score: null,
    tags: [],
    cover: "cover-mangekyou-3.webp",
    site: "https://www.omega-star.jp/biman3html/index.html",
    note: "",
  },
  {
    title: "美少女万华镜 -罪与罚的少女-",
    brand: "ωstar",
    year: 2017,
    score: null,
    tags: [],
    cover: "cover-mangekyou-4.webp",
    site: "https://www.omega-star.jp/biman4html/index.html",
    note: "",
  },
  {
    title: "美少女万华镜 -理与迷宫的少女-",
    brand: "ωstar",
    year: 2020,
    score: null,
    tags: [],
    cover: "cover-mangekyou-5.webp",
    site: "https://www.omega-star.jp/biman5html/open.html",
    note: "",
  },
  {
    title: "美少女万华镜异闻 雪女",
    brand: "ωstar",
    year: 2024,
    score: null,
    tags: [],
    cover: "cover-mangekyou-ibun.webp",
    site: "https://www.omega-star.jp/ibun/index.html",
    note: "",
  },

  // ---- くまのみそふと（KUMANOMI SOFTWARE，AMUSECRAFT 旗下，2026-10-04 加入）----
  // 按 tina 的选择只收已发售的 2 部。第 3 部《転性魔王さまは勇者に勝てない！２》
  // 官方站写着 2026-11-20 发售、目前还没有封面图，等发售后再补。
  // 中文名取 VNDB 的 zh-Hans 标题（这两部都有官方中文版，对应 release r136102 / r136749）。
  {
    title: "性转魔王敌不过勇者",
    brand: "くまのみそふと",
    year: 2024,
    score: null,
    tags: [],
    cover: "cover-tenmao.webp",
    site: "https://kumanomi-soft.amusecraft.com/tenmao/index.html",
    note: "",
  },
  {
    title: "神明的选择！老师超适合当女孩子！",
    brand: "くまのみそふと",
    year: 2025,
    score: null,
    tags: [],
    cover: "cover-kamichu.webp",
    site: "https://kumanomi-soft.amusecraft.com/kamichu/index.html",
    note: "",
  },
];
