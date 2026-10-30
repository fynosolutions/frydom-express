# 静态托管与上线检查

## 当前发布：2026-10-31

- Vercel 项目：`wei34/frydom-express`；状态 READY。
- 公开地址：https://frydom-express.vercel.app 。
- 部署 ID：`dpl_CaXAZeHX7BpJQobqe3h5dPDgMucj`。
- 部署地址：https://frydom-express-pxmne2amz-wei34.vercel.app 。
- 站点源码提交：`fc316b2`（Update bilingual website, menu, ordering and partner experience）。
- 包含 1015 新菜单、完整活动海报与双语说明、手机点餐/导航、门店电话和 11:00–22:00 营业时段、加盟分组及 Angus Beef Cheeseburger Combo 首页主图。
- 构建与 127 项静态检查通过。136 项浏览器测试中 135 项首次通过；英文加盟页一次初始化等待超时，随后连续复测 3 次通过。
- 发布后匿名 HTTP 检查 9 个页面/资源均为 200，确认主图、菜单各 35 款、营业时段、加盟分组、活动文字与 PDF 已更新；记录见 `docs/qa/production-http-20261031.json`。
- 原 `frydomexpress.com` 域名未迁移；本轮更新现有 Vercel 站点。

以下为历史发布记录与托管说明。


已于 2026-10-28 发布当前版本至 Vercel 生产项目 `wei34/frydom-express`，状态 READY。公开地址：https://frydom-express.vercel.app 。部署 ID：`dpl_44yH3U9kPDNoqy597avAKXNjz6W8`。

本次追加修复：中英文 Wings 全部 7 款统一显示 Small $5.95 / Large $11.25；选中文字改为红底奶油色字，解决红底红字不可读问题。经典鸡翅标题取消固定 6 块标注，以配合大小份规格，未推断每份块数。

本次发布包含 Patty & Bun 参考风格改版、三个活动及详情页、中英文各 12 个新增菜单条目、中文得意黑字体。发布前 137 项静态检查和 36 项中文页面/视口检查通过。公网直接访问首页、中英文菜单、活动页和字体文件均返回 HTTP 200，已确认新增菜单及活动内容。检查记录见 `docs/qa/production-http-20261028.json`。

原 `frydomexpress.com` 域名未绑定或迁移，canonical 与站点地图继续指向原正式域名。加盟表单与统计仍只在原正式域名启用；Vercel 域名可通过页面提供的邮箱联系。

Vercel 配置为根目录 `vercel.json`，使用 `npm ci` 安装、`npm run build` 构建，发布 `dist/`。`.vercelignore` 排除开发报告、快照、交付压缩包、依赖和本地环境文件。后续更新执行：

```powershell
npx --yes vercel@latest deploy --prod --yes --project frydom-express --scope wei34
```

静态产物仍为项目根目录 `dist/` 的内容。

## 路径契约

- `/` 中文；`/en/` 英文；两者不得互相覆盖。
- 原 `.html` 文件直接返回对应内容，不重定向到首页。
- `/index.html` 单跳 301 到 `/`，`/en/index.html` 单跳 301 到 `/en/`。
- 原中文支持路径 `/fuwu.html`。
- 未知路径返回 HTTP 404，内容为 `404.html`，不要使用 SPA fallback。
- 生产 `robots.txt`、`sitemap.xml` 返回 200 和正确文本类型。

## Nginx 等效示例

以下仅作路径部署模板；域名证书、实际 root、WAF 与现有访问控制需按真实托管环境配置。

```nginx
server {
    listen 443 ssl;
    server_name frydomexpress.com;
    root /var/www/frydomexpress;
    index index.html;

    location = /index.html { return 301 /; }
    location = /en/index.html { return 301 /en/; }
    location / { try_files $uri $uri/ =404; }
    error_page 404 /404.html;
    location = /404.html { internal; }

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
}
```

托管平台支持 `_redirects` 与 `_headers` 时，可使用构建输出的文件；否则自行配置同义规则。`scripts/serve.mjs` 的 noindex 响应头只用于本地预览，不复制到生产。

## 上线后另行核验

1. 确认 DNS/SSL、真实路径、单跳重定向和 404；检查 CDN 未缓存旧 HTML。
2. 检查正式 HTML 与响应头没有 noindex/nosnippet 限制。
3. 核对公开内容请求没有登录墙、交互挑战或错误 403；不擅自取消整站防护。
4. 检查 sitemap、canonical、双向 hreflang、JSON-LD 与可见事实。
5. 在项目指定测试配置中验证 HubSpot 收到线索，并核对成功/失败、Lead 归因。
6. 使用 Schema.org/Google Rich Results Test 做线上补充检查，区分不支持富结果与数据错误。
7. 由账号所有者提交 Search Console/Bing Webmaster Tools，另行记录索引与 AI 引用表现。

未取得经营方核实的价格、营业星期、门店电话和订单服务，继续按内容问题台账处理。
