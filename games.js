// ============================================================
// galgame 收藏清单 —— 数据都在这里，改这个文件就能更新页面
//
// 字段说明：
//   title   作品名（必填）
//   brand   品牌 / 制作组，可以不填 ""
//   year    发售年份，填数字；不确定就写 null
//   score   我的评分，0~10 可带小数；没打分写 null
//   status  状态，只能填这五个之一：
//             "cleared"  已通关
//             "playing"  在玩
//             "paused"   搁置
//             "wishlist" 想玩
//             "dropped"  弃了
//   tags    标签数组，随便写，只作为卡片上的展示标签（筛选栏按厂商，不按标签）
//   cover   封面图片路径，留空 "" 会自动生成色块封面
//   note    一句话感想，可以留空
//   sample  true 表示这是示例数据，卡片上会标「示例」；换成自己的条目时删掉这一行
// ============================================================

// 筛选栏里固定显示的厂商按钮：即使暂时还没有对应作品，这几个按钮也会一直摆在那儿。
// 想再固定几个厂商，往数组里加名字就行；作品数据里出现的其它厂商会自动补进筛选栏。
window.GAL_BRAND_PRESETS = ["卷心菜社", "窗社"];

window.GALGAMES = [
  {
    title: "CLANNAD",
    brand: "Key",
    year: 2004,
    score: 9.5,
    status: "cleared",
    tags: ["泣きゲー", "学园", "纯爱", "ADV"],
    cover: "",
    note: "示例条目。把这条删掉，换成你自己真正玩过的作品吧。",
    sample: true,
  },
  {
    title: "STEINS;GATE",
    brand: "5pb. / Nitroplus",
    year: 2009,
    score: 10,
    status: "cleared",
    tags: ["SF", "悬疑", "多周目", "ADV"],
    cover: "",
    note: "示例条目。注意这里的感想别照抄，写自己的话才有意思。",
    sample: true,
  },
  {
    title: "Fate/stay night",
    brand: "TYPE-MOON",
    year: 2004,
    score: 8.5,
    status: "cleared",
    tags: ["奇幻", "战斗", "NVL"],
    cover: "",
    note: "示例条目。brand 里写什么，上面厂商栏就会多出哪个按钮。",
    sample: true,
  },
];
