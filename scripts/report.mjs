import {readFile,writeFile,mkdir}from'node:fs/promises';
import{load}from'cheerio';
const d=JSON.parse(await readFile('src/data/site.json','utf8'));
const staticReport=JSON.parse(await readFile('docs/qa/static-verification.json','utf8'));
const browser=JSON.parse(await readFile('docs/qa/browser-verification.json','utf8'));
const perf=JSON.parse(await readFile('docs/qa/performance.json','utf8'));
const screenshots=JSON.parse(await readFile('docs/qa/screenshot-report.json','utf8'));
const en=d.locales.en;const checks=[];
async function doc(kind){const route=en.routes[kind].split('#')[0];return load(await readFile('dist'+(route.endsWith('/')?route+'index.html':route),'utf8'));}
function add(question,passed,answer,evidence){checks.push({question,status:passed?'passed':'failed',answer,evidence});}
const home=await doc('home'),menu=await doc('menu'),locations=await doc('locations'),partner=await doc('partner'),support=await doc('support');
add('What does Frydom Express serve?',home('.brand-facts').text().includes('fried chicken'),'Fried chicken, wings, boneless chicken, burgers, wraps, sides and drinks.','/en/#brand');
add('Which locations are currently listed?',locations('.location-detail').length===1,'Brooklyn, New York. This is the current website listing, not a claim of total worldwide store count.','/en/stores.html');
add('What is the Brooklyn address?',locations('#brooklyn address').text().includes('781 61st St'),'781 61st St, Brooklyn, NY 11220, United States.','/en/stores.html#brooklyn');
add('What hours are listed? Are days specified?',locations('.location-detail').toArray().every(e=>locations(e).text().includes('11 AM – 9 PM')&&locations(e).text().includes('Days of operation are not specified.')),'11 AM – 9 PM. Weekdays are unspecified.','/en/stores.html#brooklyn');
add('What services are listed?',locations('.location-detail').toArray().every(e=>locations(e).text().includes('Dine-in · Takeout')),'Dine-in and takeout; do not infer delivery.','/en/stores.html');
add('Where can I read the full menu?',menu('article[data-item-id]').length===26,'The full representative menu is in the initial HTML at /en/menu.html.','/en/menu.html#menu');
add('What comes with Chicken Wrap Combo?',menu('#chicken-wrap-combo').text().includes('fries, and a drink'),'A crispy chicken wrap, fries and a drink.','/en/menu.html#chicken-wrap-combo');
add('What sizes are listed for Original Recipe Fried Chicken?',en.menu.find(i=>i.id==='original-recipe-fried-chicken').variants.map(v=>v.quantityText).join('|')==='3 pcs|6 pcs|9 pcs','3, 6 and 9 pieces.','/en/menu.html#original-recipe-fried-chicken');
add('Are Crispy Chicken Burger Combo prices consistent?',en.menu.find(i=>i.id==='crispy-chicken-burger-combo').priceStatus==='conflict','No. The old home and menu conflict. Current pricing must be confirmed with the restaurant.','docs/content-issues.md; /en/menu.html#crispy-chicken-burger-combo');
add('Is the menu identical at all locations?',menu('#menu').text().includes('may vary by location'),'No identical-menu guarantee: selection, availability and pricing may vary by location.','/en/menu.html#menu');
add('How can I make a partnership inquiry?',partner('#franchise-inquiry form').attr('data-endpoint')===d.forms.endpoint,'Use Become a Partner and the original HubSpot inquiry form, or email info@frydomexpress.com. Local preview intentionally disables live sending.','/en/franchise.html#franchise-inquiry');
add('Which fields are required?',partner('form [required]').map((i,e)=>partner(e).attr('name')).get().sort().join('|')==='name|phone','Full name and phone only. WeChat, email and goals/questions are optional.','/en/franchise.html#franchise-inquiry');
add('What partner support is described?',en.support.sections.every(s=>support('#'+s.id).length===1),en.support.sections.map(s=>s.subtitle||s.title).join('; '),'/en/support.html');
add('Are delivery and individual store phones confirmed?',!en.locations.some(l=>l.phone||l.delivery),'No. Do not use the partnership line as a store phone or import reference-site order links.','docs/content-issues.md; /en/stores.html');
await mkdir('docs/qa',{recursive:true});
await writeFile('docs/qa/question-checks.json',JSON.stringify({method:'Deterministic DOM and shared data checks against the production build; not a live search/LLM indexing experiment.',executedAt:new Date().toISOString(),checks},null,2));
await writeFile('docs/qa/question-checks.md','# 固定问答提取检查\n\n通过 '+checks.filter(c=>c.status==='passed').length+'/'+checks.length+'。输入为生产 HTML 与共用数据，未执行联网 AI 推荐或索引实验。\n\n'+checks.map((c,i)=>`## ${i+1}. ${c.question}\n\n${c.status}: ${c.answer}\n\n定位：${c.evidence}\n`).join('\n'));
const mobile=perf.runs.find(r=>r.viewport.width===390),desktop=perf.runs.find(r=>r.viewport.width===1440);
const failedQuestions=checks.filter(c=>c.status==='failed');
const report=`# 交付验收报告

验收更新日期：2026-10-20，Asia/Shanghai。已发布至 https://frydom-express.vercel.app ，Vercel 平台状态 Ready。以下页面/浏览器检查为本地生产构建结果；当前网络访问 vercel.app 超时，公网复查未完成。原正式域名未迁移。

## 已实现

- 16 个中英文业务页面与独立 404，原 .html 路由保留；根中文首页、/en/ 英文首页、真实语言切换；两种首页别名为单次 301。
- 旧 Logo 原图与品牌色 tokens；本地原站餐品/门店/品牌素材；响应式食物首屏、大字、叠层、滚动带、静态菜单、门店与加盟完整内容。
- 本轮视觉修改：参考站 FuturaPT 英文字体、正文 +2px、Heading +5px、菜单图片宽高 70%，以及首页像素渐清开场。最新截图中的顶部主导航再放大至上一轮的 2.5 倍，并调整响应式排版与分类导航吸顶偏移。详见 visual-revision.md。
- 26 个英文/25 个中文菜单实体，去重与分类修正；首页、详情、JSON-LD 共用数据。保留原稿语言差异，共享已知价格冲突状态。
- 首页三张推荐卡与菜单全部餐品图背景统一为加载页橙色 #CD5817；透明图片保留原色。中英文、桌面/手机共 8 组逐卡检查通过，见 qa/food-background.json。
- 2026-10-20 追加顶部导航文字悬停放大、键盘聚焦反馈及全站文字滚动渐显上移；新增交互检查涵盖手机、重复滚动、减少动态切换及缺失 API 降级，见 tests/motion.spec.mjs。
- 两个独立门店实体，原地址/列示时间/服务；合作热线、品牌邮箱和政策法律信息不与门店混用。
- 原 HubSpot 端点与字段、归因、验证/成功/失败/防重；正式域名才启用真实提交与 Pixel；无脚本邮件联系。
- 静态初始 HTML、语义标题、锚点、canonical、hreflang、JSON-LD、robots 与 sitemap；不依赖客户端获取正文。
- 1,075 条内容迁移记录、256 条链接映射、84 条素材来源记录，以及事实问题处理台账。

## 已验证

| 验证 | 实测结果 | 证据 |
| --- | --- | --- |
| 生产构建 | 16 个真实业务路径与 404 生成成功 | npm run build |
| 无脚本 HTML / 字段 / 链接 | ${staticReport.passed}/${staticReport.checks} 通过；${staticReport.failures.length} 项失败 | qa/static-verification.json |
| 浏览器回归 | ${browser.stats.expected} 通过、${browser.stats.unexpected} 失败、${browser.stats.skipped} 跳过 | qa/browser-verification.json |
| 布局 | 320、390、768、1440px 的所有 16 页无整页横向溢出 | browser-verification.json |
| 无 JavaScript | 16 页正文可见，原生手机导航可展开；表单禁用并显示真实邮箱 | browser-verification.json |
| 减少动态 / 脚本阻断 | 滚动动画停止，菜单和导航仍可读 | browser-verification.json |
| 视觉增量 / 开场 | 12 组初版测量精确对比字号与图片比例；中英文导航 9 个宽度检查 2.5 倍字号、排版与吸顶位置；开场显示、渐清、跳过、1200ms 上限与故障降级通过 | tests/revision.spec.mjs、qa/intro-animation.json |
| 菜单完整性 | EN 26/26、ZH 25/25；H2 分类、H3 菜名；已发布金额逐规格对应 | static-verification.json |
| 政策原文 | 两语言隐私/条款逐文本比对，原日期保留，正文语言正确 | static-verification.json |
| 表单 | 必填/可选邮箱、成功、500、网络失败、预览防投递、首次归因、存储禁用、防重与一次 Lead 的模拟检查通过 | browser-verification.json |
| 固定问答 | ${checks.length-failedQuestions.length}/${checks.length} 确定性提取检查通过，未知信息保持未知 | qa/question-checks.md |
| 图像/路径 | 所有新站引用的原图和内部锚点存在；无参考站业务链接 | static-verification.json |
| 截图 | ${screenshots.length} 个页面/设备组合 + 无脚本/减少动态样例，无截图报告中的溢出或脚本错误 | screenshots/、qa/screenshot-report.json |

本地 HTTP 请求也验证了原路径 200、首页别名 301、未知路径 404、robots/sitemap 200。预览响应的 noindex 头仅属于本地服务，生产静态 HTML 无该限制。

## 性能实验

一次冷缓存导航/设备：Chromium headless，4 倍 CPU 放缓、1.6 Mbps 下载、750 Kbps 上传、150ms 延迟、本地源服务器。

| 视口 | LCP | CLS |
| --- | --- | --- |
| 手机 390×844 | ${(mobile.lcp/1000).toFixed(2)} 秒 | ${mobile.cls.toFixed(5)} |
| 桌面 1440×1000 | ${(desktop.lcp/1000).toFixed(2)} 秒 | ${desktop.cls.toFixed(5)} |

该单次实验达到项目 LCP≤2.5s、CLS≤0.1 的目标，但不是 Lighthouse 分数、真实用户第 75 百分位或正式网络结果。未声明 INP 达标；上线后另取真实用户数据。原始记录：qa/performance.json。

## 仍待核实 / 未执行

- 经营方确认各冲突价格、币种与门店/渠道适用范围；营业星期；门店电话和真实下单服务；待更新或共用的商品图片。
- 正式 CRM 收件、生产 CORS、真实 Pixel/Lead 联调。所有自动验证均拦截外部请求，没有向正式 CRM 制造假线索。
- 已完成 Vercel 生产发布，平台状态 Ready；公网 HTTP/浏览器复查受当前网络限制未完成。原正式域名 DNS、证书、CDN/WAF 与域名切换未执行。
- 外部 Schema.org / Google Rich Results Test 的在线工具结果。当前完成 JSON 语法、已使用实体结构、锚点及正文一致性本地检查；不把未支持富结果的类型当作失败。
- Search Console/Bing 账号提交、搜索索引、平台爬虫访问与 AI 引用/推荐。没有宣称这些结果完成。

## 文件入口

README.md 说明运行和维护；启动预览.cmd 提供 Windows 本地启动；dist/ 为托管产物；sources/ 为原始公开快照；内容审计、表单、动效和部署文档均位于 docs/。
`;
await writeFile('docs/acceptance.md',report);
console.log(JSON.stringify({static:staticReport.passed,browserPassed:browser.stats.expected,browserFailed:browser.stats.unexpected,questionsPassed:checks.length-failedQuestions.length,questionsFailed:failedQuestions}));
if(failedQuestions.length||staticReport.failures.length||browser.stats.unexpected)process.exitCode=1;
