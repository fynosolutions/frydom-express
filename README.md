# Frydom Express 新官网

2026-10-31 已发布至 https://frydom-express.vercel.app ：当前版本包含 1015 菜单（中英文各 8 类、35 款）、完整活动海报与双语说明、手机点餐/导航、11:00–22:00 营业时段、门店电话、加盟内容分组及 Angus Beef Cheeseburger Combo 首页主图。见 [顾客体验调整](docs/customer-experience-update.md)；历史记录中的旧菜单数量与时间以当前数据为准。

2026-10-28：已按确认方案完成 Patty & Bun 参考风格改版，采用红色/奶油色、复古字体、精简导航、三列菜单与活动总览。Frydom 原文字和图片保留，长品牌内容移至故事页。当前本地版本及验证说明见 [改版记录](docs/patty-bun-redesign.md)；下方历史视觉参数以该记录为准。本轮已于 2026-10-28 发布至 https://frydom-express.vercel.app，含三个活动、菜单补充与中文得意黑字体。

中英文完整静态网站。保留旧站 Logo 图标、品牌配色、真实餐品和门店素材、原业务路由与 HubSpot 加盟渠道；以更醒目的餐饮排版、滚动文字、食物图层和轻量动效呈现。

## 代码仓库

GitHub 私有仓库：[fynosolutions/frydom-express](https://github.com/fynosolutions/frydom-express)。线上地址：[Frydom Express](https://frydom-express.vercel.app)。

首次从仓库获取后执行：

```powershell
git clone https://github.com/fynosolutions/frydom-express.git
cd frydom-express
npm ci
npm run build
npm run preview
```

依赖、构建输出、本地环境文件与交付压缩包不提交 Git。当前 Vercel 通过 CLI 发布；后续更新命令与发布记录见 `docs/deployment.md`。

## 本地查看

在 Windows 双击项目根目录的 **`启动预览.cmd`**。保留打开的命令窗口，然后访问：

- 中文首页：<http://127.0.0.1:4321/>
- 英文首页：<http://127.0.0.1:4321/en/>

也可以在此目录打开 PowerShell，执行：

```powershell
npm run preview
```

当前工作目录已经安装依赖并完成构建。`dist/` 是可部署的静态产物，不要通过双击 HTML 文件的 `file://` 模式查看，因为资源使用站点根路径。

本地预览返回 `X-Robots-Tag: noindex, nofollow`，阻止正式 CRM 投递和 Meta 追踪。页面会清楚提示预览状态，不能把本地未发送的线索显示为提交成功。生产域名 `https://frydomexpress.com` 或 `https://www.frydomexpress.com` 下，表单使用旧站真实端点。

## 安装与开发

Node.js 22.12+；本次实际使用 Node.js 24.16.0、Astro 7.4.0。精确依赖由 `package-lock.json` 固定。

```powershell
npm ci
npm run dev
npm run build
npm test
npm run test:browser
```

- `dev` 用于修改源码。Astro 的开发期英文首页可能显示为 `/en`；最终 `/en/` 与 `.html` 兼容验收以生产构建和 `npm run preview` 为准。
- `build` 静态生成所有页面；随后把 Astro 文件格式输出的 `en.html` 移到 `en/index.html`，确保旧站 `/en/` 首页有效，生成 sitemap、robots、重定向和响应头配置。
- `test` 检查生产 HTML、菜单、字段、实体、语言、政策原文、资源和所有内部链接。
- `test:browser` 使用 Playwright 检查 16 页的四种宽度、无脚本、交互和表单模拟。需要已安装 Chromium；可设置 `PLAYWRIGHT_EXECUTABLE_PATH` 指向浏览器。没有本地浏览器时按 Playwright 官方方式安装 `npx playwright install chromium`。
- 构建入口主动禁用 Astro telemetry，不要求向用户配置目录写入设置。

## 修改内容

**`src/data/site.json` 是唯一运行时内容来源**。这是可直接编辑的文件，不需要后台账号。

| 修改内容 | 位置 |
| --- | --- |
| 菜品名称、描述、规格、价格与图片 | `locales.en.menu`、`locales.zh.menu` |
| 门店地址、列示时间、服务 | `locales.en.locations`、`locales.zh.locations` |
| 品牌故事、总部支持、加盟正文 | 对应语言的 `story`、`support`、`partner` |
| 原版政策全文与日期 | 对应语言 `pages.privacy`、`pages.terms` |
| 品牌 Logo 与联系资料 | `brand` |
| 表单端点与字段记录 | `forms` |
| 配色、字号、响应式布局 | `src/styles/global.css` |
| 页面布局和界面短文案 | `src/components/`、`src/lib/site.ts` |
| 动效、归因与表单行为 | `src/scripts/site.ts` |

同语言首页推荐、完整菜单及 Schema 共用同一组菜品实体；门店首页摘要和详情共用门店对象。两种语言分别保留原稿差异。相同菜品的已知价格冲突共用不确定状态。

菜单金额保持原站 `$` 符号。没有业务依据时 `currency` 保持 `null`，不自动补 USD 或输出 Offer。核实某个套餐价格后，更新其 `priceStatus`、对应 variant 的 `price`/`status`、来源与适用门店/渠道；同 ID 的两种语言都要检查。缺失价格不填 0；缺少营业星期不扩写每天营业。

内容修改后运行 `npm run build` 和 `npm test`；涉及表单、导航或布局时再运行浏览器测试。历史快照保留在 `sources/`。`npm run migrate` 会**从快照重新生成并覆盖** `src/data/site.json`，仅用于重建初始迁移，日常改价不要运行。

## 原路由

| 页面 | 英文 | 中文 |
| --- | --- | --- |
| 首页 | `/en/` | `/` |
| 品牌故事 | `/en/about-us.html` | `/about-us.html` |
| 菜单 | `/en/menu.html` | `/menu.html` |
| 门店 | `/en/stores.html` | `/stores.html` |
| 加盟合作 | `/en/franchise.html` | `/franchise.html` |
| 总部支持 | `/en/support.html` | `/fuwu.html` |
| 隐私政策 | `/en/privacy-policy.html` | `/privacy-policy.html` |
| 服务条款 | `/en/terms-of-service.html` | `/terms-of-service.html` |

`/en/index.html`、`/index.html` 分别兼容重定向到语言首页。未知路径返回真正 404。

## 静态托管

仅上传 `dist/` 的内容，不上传 `sources/`、开发文档或依赖。主域名继续使用 `frydomexpress.com`；canonical 和 sitemap 已使用正式域名。

- 托管需支持目录首页、原 `.html` 文件，以及真实 404。不要配置全站 SPA 回退到首页。
- `_redirects`、`_headers` 为支持该约定的静态平台提供兼容配置；其他平台需配置等效规则。Nginx 示例见 `docs/deployment.md`。
- 生产静态产物没有 `noindex`。预览的 `X-Robots-Tag` 由本地服务添加，不能带到生产。
- CDN/WAF、防机器人策略、HTTP→HTTPS、域名 DNS 和正式 CRM 投递，需要在实际托管环境另行验收。
- 原域名之外的 staging 域名默认禁用正式表单投递和 Pixel。若未来要使用新正式域名，需同步修改站点配置、canonical/实体 URL、爬虫文件和 `productionHost` 规则。

## 交付与状态

- `docs/acceptance.md`：验收结果、性能数据和未验证边界。
- `docs/discovery.md`：来源、真实路由、色值与旧站差异。
- `docs/content-migration.csv`、`link-map.csv`、`asset-manifest.csv`：迁移台账。
- `docs/content-issues.md`：未核实价格、营业星期、图片等问题。
- `docs/form-contract.md`：原服务字段和模拟验证方式。
- `docs/motion-spec.md`：动效来源、实现与降级。
- `docs/screenshots/`：各页桌面和手机截图，以及无脚本、减少动态示例。
- `docs/qa/`：可复查的 JSON 报告、正文提取与固定问答结果。

已部署到 Vercel：https://frydom-express.vercel.app ，项目 `wei34/frydom-express`，平台状态 Ready。2026-10-28 公网首页、中英文菜单、活动页及字体资源 HTTP 检查通过。部署细节见 `docs/deployment.md`。

原正式域名未迁移；CRM 真实投递、Search Console 提交和搜索/AI 平台收录尚未验证。Vercel 域名上的加盟咨询使用页面邮箱，正式表单仍限原域名启用。

## 本轮视觉修改

- 2026-10-20：顶部导航悬停/键盘聚焦时平滑放大 10%；全站正文在滚动进入视口时分组渐显上移。触屏无需悬停；减少动态设置会停用并取消正在播放的效果。实现参数见 `docs/motion-spec.md`。
- 首页三张推荐餐品卡与完整菜单的图片背景统一使用加载页橙色 `#CD5817`。保留透明餐品素材并取消正片叠底，维持食物原色；首页编号改为浅色。中英文、桌面和手机的逐卡检查见 `docs/qa/food-background.json`。
- 根据最新截图，顶部主导航文字再放大至修改前的 2.5 倍：桌面 32.5px、中等屏幕 30px、手机展开菜单 42.5px。桌面导航独立一行并支持换行；菜单分类吸顶位置随实际页头高度更新。
- 菜单及首页推荐卡片内餐品图片的宽、高均为初版的 70%；首屏主图保持原构图。
- 所有可编辑英文文字切换为参考站实际使用的 **FuturaPT**，包含 Book、Medium、Bold、ExtraBold 四个字重。本地文件位于 `public/assets/fonts/reference/`，公开来源记录为 `sources/reference/font-manifest.json`。中文使用原系统字库回退。
- 在初版每个响应式字号基础上：正文 +2px，H1–H4 等 Heading +5px。窄屏长词与网格已调整；页脚装饰品牌大字单独按可视宽度排版。
- 中英文首页均有“LOADING… + 餐品图片像素渐清 + 淡出”开场。每次重新进入/刷新首页播放，约 1120ms 自动结束；1200ms 故障兜底；可点击跳过或按 Escape。减少动态和无 JavaScript 时直接显示正文。
- `docs/screenshots/home-opening.gif` 为动效预览，`docs/qa/intro-animation.json` 为逐阶段记录，`tests/revision.spec.mjs` 对比初版测量值验证精确增量与图片比例。

技术参考：[Astro 配置](https://docs.astro.build/en/reference/configuration-reference/)、[Astro 路由](https://docs.astro.build/en/guides/routing/)。
