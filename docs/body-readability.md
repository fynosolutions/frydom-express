# 正文字体与可读性调整

2026-11-10，本地修改，未部署。用户确认优化正文；本轮不处理菜单结构、详情按钮或巨型标题。

- 修改 `src/styles/body-type.css`：英文正文使用仓库既有 DM Sans 400/500/600/700；字体元数据已核对，对应 font-3.ttf 至 font-6.ttf。
- 中文正文使用直立系统黑体，拉丁字符使用 DM Sans。标题、品牌字和导航保留既有展示字体角色。
- 正文基准 18px，英文行距 1.65、中文 1.8；英文长文宽度 65ch、中文 34em，并受容器限制。
- 说明文字、价格、表单及提示信息使用阅读字体；恢复粗体强调，价格使用等宽数字，去掉正文内小字描边。保留已有大号导语和海报文字尺寸。
- 无新增外部字体请求，使用本地字体及 font-display: swap。

验证：构建和 127 项静态检查通过；20 条路由在 320/390/768/1440px 下的 80 项现有页面检查通过。最后补齐表单提示字体后，复测中英文加盟页四种宽度的 8 项检查通过。

agent-browser / Edge 实测英文政策正文 18px / 29.7px、中文加盟正文 18px / 32.4px；320px 英文菜单所有价格块无内部宽度溢出；桌面正文 DM Sans 与标题 Mouse Memoirs 分离。720px 缩窄视口也未出现整页横向溢出（未等同完整真实浏览器缩放测试）。

Impeccable type 扫描前后均只有旧 `redesign.css` Fraunces 声明的风格警告，未新增警告；当前正文与英文标题均由其他字体覆盖。

截图与扫描结果：`.browser-review/body-type-20261110/`。主要截图：en-policy-mobile.png、zh-franchise-mobile.png、zh-form-mobile.png、en-menu-320.png、en-franchise-desktop.png。
