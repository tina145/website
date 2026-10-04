# tina 的个人网站

星夜主题的纯静态个人站，用原生 HTML / CSS / JavaScript 写成——**没有框架、没有构建步骤、没有依赖**。克隆下来起个服务器就是完整站点。

线上地址：**https://tina-9yg.pages.dev**

## 页面

| 地址 | 文件 | 内容 |
| --- | --- | --- |
| `/` | `index.html` | 首页：Hero + 分区概览卡片 |
| `/about` | `about.html` | 关于我 + 兴趣 |
| `/gal` | `gal.html` | galgame 收藏 |
| `/yugioh` | `yugioh.html` | 游戏王：历史 / OCG 环境 |
| `/minigames` | `minigames.html` | 小游戏：2048 / 五子棋 / 俄罗斯方块 |
| `/karaoke` | `karaoke.html` | 卡拉OK 歌单，每条指向一条 B站视频 |
| `/apikey` | `apikey.html` | 常用 AI 平台官方入口 |
| `/aihistory` | `aihistory.html` | AI 发展历程时间线 |
| `/learning` | `learning.html` | 学习视频卡片墙，点一张打开 B站 |
| `/aigenvideo` | `aigenvideo.html` | AI 生成视频卡片墙，点一张打开 B站 |
| `/contact` | `contact.html` | 联系方式 |

带 `.html` 的地址（例如 `/about.html`）由 Cloudflare Pages 用 308 跳到上表的干净地址。

## 文件结构

每个页面结构相同：顶栏（窄屏出汉堡菜单）+ 左侧导航（宽屏）+ 正文 + 页脚。

- **样式与通用脚本**：`style.css`、`script.js`（汉堡菜单 + 滚动淡入）
- **数据源**——改内容只改这些，不用碰 HTML：
  - `games.js` → galgame 列表
  - `karaoke.js` → 卡拉OK 歌单
  - `yugioh.js` → 游戏王时间线
  - `aihistory.js` → AI 发展历程时间线
  - `learning.js` → 学习视频卡片墙
  - `aigenvideo.js` → AI 生成视频卡片墙
- **渲染脚本**：`yugioh-render.js`、`aihistory-render.js`、`learning-render.js`、`aigenvideo-render.js`
- **游戏**：`game2048.js`、`gamegomoku.js`、`gametetris.js`（三个互相独立）
- **素材**：`avatar.png`、`bg.webp` / `bg-mobile.webp`（整页固定背景，桌面 / 竖屏各一张）、`cover-*.webp`、`og-image.jpg`、favicon 与社交图标

### 脚本加载顺序（重要）

数据源必须排在 `script.js` **之前**，渲染脚本排在**之后**：

```
gal.html        → games.js      → script.js
karaoke.html    → karaoke.js    → script.js
yugioh.html     → yugioh.js     → script.js → yugioh-render.js
aihistory.html  → aihistory.js  → script.js → aihistory-render.js
learning.html   → learning.js   → script.js → learning-render.js
aigenvideo.html → aigenvideo.js → script.js → aigenvideo-render.js
minigames.html  → script.js     → game2048.js → gamegomoku.js → gametetris.js
```

顺序错了页面就是空白。

## 本地预览

`file://` 直接双击打开也能看，但相对路径和跳转行为跟线上不一致，建议起个本地服务器：

```bash
python -m http.server 8000
# 或者
npx serve .
```

然后访问 http://localhost:8000 。

## 部署

Cloudflare Pages 绑定本仓库，**push 到 `master` 就自动构建上线**，通常十几秒到一分钟。没有构建命令、没有环境变量，Pages 直接把这堆静态文件发布出去。

## 许可

代码以 **MIT 许可**开源，全文见 `LICENSE`。

图片素材（`avatar.png`、`bg.png` / `bg.webp` / `bg-mobile.webp`、`cover-*.webp`、`og-image.jpg`、`favicon.ico` / `favicon-32.png`、`apple-touch-icon.png`、`icon-*.png` / `icon-*.ico`）是个人素材，**不随 MIT 一并授权**，转载或商用前请先联系。
