# 日日精读 · 公共英语精读网站

免登录，面向六级与考研英语阅读。所有人共享公共课程，答题、计时、错题、收藏、词汇和笔记只保存在各自浏览器。无数据库、无统计跟踪、无前端 API 密钥。

本项目基于找到的上一版“日日精读”源码继续完善，保留原界面、Day 1、逐段翻译、全文翻译、词汇、长难句、写作和最后讲解。新增 JSON 公共课库、计时、更新检测、版本化备份、可视化课程编辑、Netlify 配置及 GitHub Actions。未替你创建 GitHub 仓库、上传代码、连接账号或部署。

## 1. 本地查看（不需要 API 密钥）

安装 Node.js 22 或以上版本（官方安装包包含 npm）。在包含 `package.json` 的文件夹打开终端：

```sh
npm run check
npm run build
npm start
```

打开 `http://127.0.0.1:4173`。本项目没有第三方 npm 依赖，不需要 `npm install`。若端口被占用，PowerShell 可运行 `$env:PORT='4187'; npm start`。

`dist/` 是可以直接托管的静态网站。双击 HTML 可能无法读取 JSON、更新或稳定存储，请用本地 HTTP 服务或 HTTPS 线上地址。没有 Service Worker，未承诺断网可用。

## 2. 创建你自己的公开 GitHub 仓库

1. 登录 GitHub，新建仓库，例如 `daily-reading-studio`，选择 **Public**。已有完整项目时不要另外生成 README 或许可证，以免首次推送冲突。
2. 解压 ZIP，进入 `reading-studio`，确认根目录能看到 `package.json`、`netlify.toml`、`site.config.json`、`content/`、`dist/` 和隐藏目录 `.github/workflows/`。不要只上传 `dist/`。
3. 可用 GitHub Desktop：添加本地仓库后 Publish repository，确认公开；也可按下面命令推送，将仓库地址替换为自己的：

```sh
git init
git add .
git commit -m "Initial public reading website"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/daily-reading-studio.git
git push -u origin main
```

4. 在 GitHub 仓库检查 `.github/workflows/ci.yml` 和 `daily.yml` 是否存在。Actions 中的 **Validate project** 应通过。
5. 将 `site.config.json` 的 `repositoryUrl` 改为真实仓库网址。代码与随附原创模拟课程采用 MIT 许可；分享前请复核示例材料，勿上传无授权真题或整篇转载文章。

## 3. 连接 Netlify，GitHub 更新自动上线

1. 登录 Netlify，选择从 Git 导入项目，连接 GitHub，授权访问上述仓库。
2. 生产分支选 `main`。Base directory 留空；Build command 为 `npm run check && npm run build`；Publish directory 为 `dist`。`netlify.toml` 已包含这些设置和 Node 22。
3. 启动部署，在 Deploys 中等待 **Published**，打开它提供的 HTTPS 公共网址。首次验证后可在 Netlify 修改站点子域名或配置自己的域名。
4. 此后向 `main` 推送修改，Netlify 会自动构建并发布；校验失败的构建不会替换上一个成功版本。
5. 推荐先提交 PR，查看 CI 与 Netlify Deploy Preview，再合并到 `main`。

Netlify Drop 只适合临时上传 `dist/` 预览；要持续随 GitHub 更新，请用 Git 导入连接。外部账号、域名及平台套餐由你自己管理，费用与限制以平台当时显示为准。

## 4. 启用每天自动更新

`daily.yml` 每天 UTC 22:17 执行，对应次日北京时间 **06:17**，也支持 Actions → **Daily course** → **Run workflow**。必须在默认分支执行；建议默认分支保持 `main`。GitHub 定时任务可能延迟；公开仓库长期无活动时可能停用定时任务，不能保证准点发布。

### 先配置发布通道（queue 模式不需 AI 密钥）

1. 在 Netlify 的 Project configuration → Build & deploy / Continuous deployment → Build hooks 创建钩子，分支选 `main`。界面命名可能随版本变化，找到 **Build hooks** 即可。
2. 复制钩子 URL，在 GitHub Settings → Secrets and variables → Actions → Secrets 新增 `NETLIFY_BUILD_HOOK`。**不要把钩子 URL 写进源码、Issue 或小红书。**
3. GitHub Settings → Actions → General → Workflow permissions 允许 Actions 写入仓库；工作流已声明 `contents: write`。组织策略或分支保护若禁止机器人直推，需要按你的管理政策调整（或手工通过 PR 发布），不可绕过。
4. 保持默认 `COURSE_MODE=queue` 即可。手动运行一次。若当天已存在课程，运行会跳过出题并请求 Netlify 构建，这是正常的。
5. 随附 **1 篇已发布 Day 1 + 1 篇待发布原创示例**。下一次在没有当日课程的日期运行时会消耗队列示例。请先复核其题意和译文，并持续补充 `content/queue/`；队列耗尽将明确失败，不会把旧文换日期冒充新课。

执行顺序：准备课程 → JSON Schema 与语义结构检查 → 应用测试 → 生成静态课库 → 提交 GitHub → 请求 Netlify 构建。Netlify 收到钩子只代表“开始构建”，实际上线以 Deploys 的 Published 为准。

同一天重跑不会重复发布。Git 推送冲突会停止，重新运行会从最新仓库开始。钩子失败时课程提交可能已经成功：修复 Secret 后重跑，即使当天课程已存在，也会再次请求构建。

### 可选 AI 模式（需要单独的 API 账号、额度和可用模型）

GitHub **Secrets** 中设置 `OPENAI_API_KEY`，**Variables** 中设置 `OPENAI_MODEL`（填你的 API 账号可访问、支持 Responses API 与 JSON Schema 输出的模型 ID）。没有内置密钥或默认模型，不代表所有地区与账号均可使用。ChatGPT 订阅不等于已配置此项目的 API 凭证。

| Variable | 取值 | 行为 |
| --- | --- | --- |
| `COURSE_MODE` | `queue`（默认） | 从 `approved` 队列取一篇，分配日期和序号，检查后发布。没有 AI 费用。 |
| `COURSE_MODE` | `draft` | 调用 API 生成原创草稿并检查，保存 Actions artifact；不提交、不发布。 |
| `COURSE_MODE` | `auto` | 生成草稿，再调用 API 审核一次；两次检查均通过后提交并请求部署。 |
| `AUTO_PUBLISH_AI` | `true` | 使用 `auto` 的显式开关；未设置时在调用 API 前停止。 |
| `COURSE_TOPIC` | 可选主题 | 如“community learning”。不填时从教育、环境、社区或工作等一般主题生成。 |

建议先用 `draft`：下载 Actions 运行底部的 `course-draft-and-review` artifact，打开其中 `draft.json` 人工核对，再将它包装为队列条目发布。Artifacts 保留 14 天。API 错误、截断、拒绝、结构错误或审核不通过都会阻止发布；不自动重试收费调用。`auto` 正常每期调用两次 API，可能产生费用；请在服务商控制台设置预算并监测。

自动检查涵盖：350–850 词、5 道题、4 个不同选项、0–3 答案、四项解析、原文连续引文、对应译文段数、词汇/长难句/表达/复盘完整、日期和重复内容。自动审核不能保证唯一答案、翻译、难度或原创性绝对正确；面向公众分享时建议保留人工复核，AI 自动发布内容有明显来源标识。生成器不联网采集新闻，不承诺最新事实。

## 5. 你的人工管理与发布权限

**所有源文件都属于你自己的仓库，可随时修改。** GitHub 仓库 Owner/Collaborator 的写权限决定谁能更改公共网站；访客不需要账号，却不能通过网页改掉线上课程。没有藏在前端的“管理员密码”。

- 课程编辑页：线上网址后加 `/editor.html`，或“课程与备份” → **打开课程编辑工作台**。可视化修改标题、正文、逐段译文、题目选项与解析、词汇、长难句、表达和讲解；也可打开本地 JSON 或使用高级 JSON 调整条目数量。修改只在页面内存中，请及时下载。
- 下载 **课程 JSON**：放入 `content/lessons/唯一id.json`，用于直接发布。`date` 为上线日期，`day` 和日期不能与其他公共课重复。
- 下载 **待审队列文件**：放入 `content/queue/`，默认 `status: draft`。审校后改为 `approved`，每日任务按文件名排序取第一篇，发布时分配实际 `date` 与 `day`。
- 改网站名、说明、开源链接：编辑根目录 `site.config.json`；下次构建生成 `dist/site-config.json`。
- 改颜色、字体和布局：编辑 `dist/styles.css`。改页面结构和交互：`dist/index.html`、`dist/app.js`。
- 本地发布：运行 `npm run check`、`npm run build`，提交并推送。公共课程源文件是 `content/lessons/`，不要直接编辑生成的 `dist/lessons.js`、`dist/courses.json`。
- 也可以在 GitHub 网页编辑 `site.config.json`、已有课程或上传新增课程 JSON 后提交到 main；CI 和 Netlify 都会重新构建源码。网页编辑不会自动回写仓库里的生成文件，本地下载预览前请运行 `npm run build`。
- 已发布课程的正文、题序、选项与答案不要在原 id 下改动，以免旧成绩失去依据。纠错时复制为新的 id（如 `day-1-revised`），在 README/更新记录说明替代关系。旧课程和学习历史保留。
- 误发布后在 Netlify Deploys 选择上一个成功版本回滚，同时在 GitHub revert 错误提交，避免下次构建覆盖回滚结果。
- 邀请协作者：在 GitHub 仓库 Settings → Collaborators 添加受信任人员；只想收集反馈可用 Issues，不必给写权限。

## 6. 学习记录和迁移

课程为网站静态资源，所有访客都可读取，也能看到答案；适合自主练习，不是保密考试平台。网页没有收集成绩的接口。

- 同设备、同浏览器、同域名下，刷新或第二天回来可继续学习。不同用户设备的记录互不共享。
- 计时需手动开始；隐藏页面、切换课程、离开学习页或提交会暂停。每 5 秒与暂停时保存，异常关闭最多可能丢失最后几秒；重新练习将本轮用时归零，保留历史用时。
- 浏览器里另一标签页写入时，本页同步记录并暂停计时；为避免同时编辑冲突，请用一个标签页学习。
- “课程与备份”导出包含计时、成绩、错题、词汇、收藏、笔记和课程快照的 v2 JSON；选择备份后先校验，点击 **确认替换并恢复** 才覆盖记录。v1 旧备份也支持，但旧备份中若缺少对应课程，需先导入该课程。
- 更换域名、浏览器或设备前先导出，再在新网址导入。清理站点数据、隐私模式或存储失败可能丢失记录。
- 小红书内置浏览器和手机系统浏览器通常有独立存储。建议固定用同一个浏览器；不要承诺从小红书跳出后成绩会自动迁移。
- 每次打开、恢复页面前台、每 5 分钟，以及手动检查时都会尝试读取公共课库。旧课程不被在线替换；新课程加入课库。没有当天新课时展示最近一期，并明确标注课程日期。
- localStorage 键沿用 `daily-reading-v1`，兼容旧项目。在不同域名上部署仍需要导出导入，不能自动读取原网址的记录。

## 7. 发到小红书前

1. 必须分享 Netlify 的正式 **HTTPS 网址**，`127.0.0.1` 是你电脑的本地预览，其他人无法访问。
2. 用手机打开正式网址做完一次，刷新确认记录保留，测试导出/恢复。再用另一个浏览器确认它从空白记录开始。
3. 用小红书内置浏览器实测一次。若导出下载受限，引导读者用系统浏览器打开并固定使用。
4. 确认 GitHub 仓库 Public、开源链接正确，第一篇课程完整，工作流和 Netlify 最新一次构建成功。
5. 首发建议写“持续更新/计划每日更新”，在每日任务实际稳定运行并有充足课程来源后再强调每日新课；不要承诺考试提分结果。
6. 可使用 `docs/小红书分享文案.md`，填入真实公共网址和仓库地址。暂未替你向小红书发帖。

## 文件结构

```text
site.config.json          网站名与开源链接
dist/                     静态网站与课程编辑工作台
content/lessons/           已发布课程 JSON（唯一数据源）
content/queue/             待审/已审课程队列
schemas/lesson.schema.json 标准 JSON Schema
scripts/                  构建、校验、日更、API 草稿、Netlify 钩子
tests/                    无需联网的测试和独立课程夹具
.github/workflows/        CI 与每日更新
netlify.toml              Netlify 构建、缓存及安全头
docs/                     分享文案与交付验证说明
```

### 官方参考

- [Netlify 从 Git 持续部署](https://docs.netlify.com/deploy/create-deploys/)
- [Netlify Build hooks](https://docs.netlify.com/build/configure-builds/build-hooks/)
- [GitHub GITHUB_TOKEN 触发限制](https://docs.github.com/en/actions/concepts/security/github_token)（因此日更任务自行检查并显式调用 Netlify 钩子）
- [GitHub 定时任务说明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
