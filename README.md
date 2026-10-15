# 体态实验室 FitPosture

一个把「肌肉解剖 + 训练动作 + 体态问题 + 症状反查」串起来的 Web 应用。
核心是浏览器里的可交互 3D 人体模型：点哪块肌肉，就告诉这块肌肉怎么练、练哪个亚部、
用什么器械，以及它紧张或无力时会把身体带成什么样。

在线体验：<https://308d9bd5bfc44df28d80127d98af73e1.app.workbuddy.host>

## 它能干什么

**从肌肉出发** —— 首页 3D 模型支持旋转、缩放、点选。选中一块肌肉，右侧给出它的
起止点、功能、常见训练目标（增肌 / 力量 / 耐力 / 柔韧）对应的动作清单，
还能继续下钻到亚部（比如三角肌的前束 / 中束 / 后束）。

**从体态出发** —— 7 类常见体态问题（圆肩含胸、头前伸、驼背、骨盆前倾、膝超伸、
膝内扣、扁平足）。每个问题按「哪些肌肉紧张、哪些肌肉无力」建模，点开详情页会在
3D 模型上**双色点亮**：紧张肌橙红 `#ff7043`，无力肌蓝 `#42a5f5`，并配四步方案
（放松 → 拉伸 → 激活 → 强化）和自测方法。

**从症状出发** —— 26 条常见不适（脖子僵、下背痛、跑步膝、网球肘、鼠标手……）。
搜索支持口语（输「鼠标手」能找到腕管那条）。详情页**先分诊再给方案**：
问你疼了多久、程度如何、有没有外伤，然后分支——该先看医生的就直接说先看医生，
急性期的先给处理原则，常规情况才给完整训练方案。相关肌肉会在 3D 模型上
**紫色 `#a855f7`** 点亮，与前两种颜色区分。

三条路径互相连通：体态页会列出「它可能表现为这些不适」，肌肉页会列出
「这块肌肉出问题时，常见是这样」。

## 技术栈

- **前端**：React 18 + TypeScript + Vite，状态用 zustand，路由 react-router-dom
- **3D**：three.js + @react-three/fiber + @react-three/drei，模型为 Draco 压缩的 glTF
- **后端**：Express + `node:sqlite`（Node 原生 SQLite）+ JWT，TypeScript 直接由 Node 原生剥离执行
- **样式**：Tailwind CSS

## 本地运行

需要 Node **>= 22.5**（用到 `node:sqlite` 与 TypeScript 原生剥离）。

```bash
npm install

# 两条命令分两个终端跑
node node_modules/vite/bin/vite.js --port 5173   # 前端
node --experimental-sqlite server/index.ts        # 后端，默认 :3000
```

打开 <http://localhost:5173>。首次启动会自动建 SQLite 库与 JWT 密钥，无需配置。

> `npm run dev:all` 在 Windows 的 Git Bash 下会挂（`spawn('npx')` 报 ENOENT），
> 用上面两条命令代替。

## 部署

部署产物是单端口服务：同一个 Express 进程既托管前端静态文件，也提供 `/api`。

```bash
npx vite build            # 可省略，打包脚本检测到 dist 落后会自动补
node scripts/40-build-deploy.mjs
```

生成 `deploy/` 目录后整体发布。它会在打包前先从线上拉一份数据库快照存为
`deploy/server/data/seed.json` 随包发布——云平台重建容器会丢掉数据库文件，
服务端启动发现空库就自动恢复，用户数据不会察觉地消失过。

注意 `.deploy-config.json`（含管理令牌）与 `server/data/` 都在 `.gitignore` 里，
不要提交。

## 目录结构

```
src/kb/          知识库：muscles / exercises / postures / symptoms
src/three/       3D 场景、模型加载、高亮着色
src/features/    页面：home / muscle / posture / symptom / me / auth
server/          Express 路由与数据访问
scripts/         构建、模型处理、打包脚本
.scripts/        本地验证脚本（e2e、知识库校验）
```

## 免责声明

内容是运动科学与康复常识的整理，**不构成医疗建议**。疼痛持续、加重或伴随
麻木无力时请就医——应用里每条症状都列了需要警惕的信号，遇到它们会直接建议你先看医生。
