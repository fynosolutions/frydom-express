# 加盟表单契约

来源：本次下载的 `sources/pages/en__franchise.html`、`sources/pages/franchise.html`。按 HTML 注释实际解析，每种语言仅一个活跃表单和完整提交处理器；注释中的旧表单没有启用。

```text
POST https://api.hsforms.com/submissions/v3/integration/submit/244594952/076c2dbe-f5cb-46b7-a711-09d2dfd0f430
Content-Type: application/json
```

| 表单/归因项 | 请求字段 | 要求 |
| --- | --- | --- |
| 姓名 | `name` | 必填，trim 后非空 |
| 电话 | `phone` | 必填，提示国家代码，不猜地区 |
| 微信 | `wechat` | 选填 |
| 邮箱 | `email` | 选填，填写时检查格式 |
| 留言 | `note` | 选填 |
| 来源 | `traffic_source` | 保留归因类别；未知为 Other |
| 首次 UTM | `utm_source`、`utm_medium`、`utm_campaign` | sessionStorage，保留字段名 |
| 来源页 | `referrer_url` | 初次 referrer，不公开输出 |
| 页面上下文 | `context.pageUri`、`context.pageName` | 当前页面 URL、标题 |

公共配置来源为 `src/data/site.json.forms`，不包含私密凭证。

## 行为

标签与输入关联，姓名/电话/邮箱的错误定位到对应输入，状态使用 aria-live。输入与错误状态在重试时正确更新。提交中按钮禁用并有 in-flight 防重保护；15 秒超时或请求失败保留输入；只有 HTTP 成功才清空并提示成功。提示与当前语言一致。

按钮在处理器绑定后才启用。无 JavaScript 时保持禁用，表单使用 POST，提供真实品牌邮箱联系，不通过默认 GET 将个人信息写入 URL。

归因保留原 sessionStorage 的 `initial_source`、`initial_utm_*`、`initial_referrer`。在首次进入任意页面时记录，防止从首页到加盟页丢失 UTM。域名匹配支持 `chatgpt.com` 与原 `chat.openai.com`；Gemini 在通用 Google 之前匹配，修复原顺序造成的误归因。sessionStorage 被禁用时回退到当前访问上下文，不阻断表单。

## 追踪与预览

保留 Meta Pixel `4404293963139526`。仅正式 HTTPS 域名加载追踪与允许真实提交。每次页面访问只有一次 PageView，成功提交后一次 Lead；Lead 仅有来源类别，不含姓名、电话、邮箱、微信或留言。

本地/其他预览域名明确阻止正式投递，填写内容保留并提示邮件联系。自动化模拟通过本地测试模式与网络拦截调用同一请求路径，所有测试响应本地生成。模拟正式域名的测试也完全拦截页面、API 和 Pixel，不访问真实 CRM，不发送正式 Lead。

## 验证状态

已模拟验证：必填、选填邮箱、双提交、成功、HTTP 500、网络失败、预览阻止投递、首次归因跨页保留、存储受限、成功 Lead 数量与无个人数据分析事件。

**尚未验证真实 CRM 收件与生产 CORS/接口投递。** 没有向正式表单制造测试线索。上线时需使用项目指定的测试配置与运营方核对。
