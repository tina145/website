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
//             仓库根目录的 cover-*.webp 是这四部作品的官方封面图，**版权归原厂商所有**
//             （きゃべつそふと / まどそふと / CRYSTALiA），此处仅作个人收藏展示用。
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
];
