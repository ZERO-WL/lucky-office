# 发布说明（Publishing Guide）

> 本文档面向 lucky-office 维护者，介绍如何把 8 个包发布到 npm。
> changesets 命令在仓库根执行，本地一键脚本命令在 `lucky-office/core/` 目录下执行。

## 推荐流程概览

本仓库提供两套互补的发布流程：

| 流程 | 触发方式 | 适用场景 |
|---|---|---|
| **changesets 自动发布**（推荐） | 提 changeset → push 到 main → 合并 PR | 日常迭代、多人协作、自动维护 CHANGELOG |
| **一键脚本本地发布** | 在本地跑 `pnpm run release` | 紧急修复、无 GitHub Actions 时的兜底 |

> 两套流程指向同一组 npm 包，互不冲突。但同一版本号只能发一次，注意别两边同时发。

---

## 一、发布范围

| # | npm 包名 | 工作区路径 | 说明 |
|---|---|---|---|
| 1 | `@lucky-office/exceljs` | `core/packages/exceljs` | ExcelJS fork（被其它包依赖，**必须最先发**） |
| 2 | `@lucky-office/excel` | `core/packages/vue-excel` | Vue 3 Excel 预览组件 |
| 3 | `@lucky-office/docx` | `core/packages/vue-docx` | Vue 3 Word 预览组件 |
| 4 | `@lucky-office/pdf` | `core/packages/vue-pdf` | Vue 3 PDF 预览组件 |
| 5 | `@lucky-office/pptx` | `core/packages/vue-pptx` | Vue 3 PPT 预览组件 |
| 6 | `@lucky-office/js-excel` | `core/packages/js-excel` | 框架无关 Excel 预览库 |
| 7 | `@lucky-office/js-docx` | `core/packages/js-docx` | 框架无关 Word 预览库 |
| 8 | `@lucky-office/js-pdf` | `core/packages/js-pdf` | 框架无关 PDF 预览库 |

> 包之间存在依赖：`@lucky-office/excel`、`@lucky-office/js-excel` 都依赖 `@lucky-office/exceljs`（通过 `workspace:*` 协议），因此 **必须先发布 `exceljs`**。`pnpm publish` / `changeset publish` 都会自动按依赖图排序。

---

## 二、首次发布前准备

### 1. 注册 / 创建组织

1. 在 [npmjs.com](https://www.npmjs.com) 注册账号并验证邮箱
2. 创建组织 `lucky-office`：[https://www.npmjs.com/org/create](https://www.npmjs.com/org/create)
3. 把账号加为组织成员

### 2. 配置鉴权（推荐 Automation Token）

npm 已经强制对 publish 启用 2FA，二选一：

#### 方案 A：Automation Token（推荐，免输 OTP）

1. 浏览器登录 npm → 头像 → **Access Tokens** → **Generate New Token** → **Classic Token** → 选 **Automation**（自带 bypass 2FA）
2. 复制 Token（形如 `npm_xxxxxxxxx`，关闭页面后无法再查看）
3. 写入 **用户级** `~/.npmrc`（不要写到项目目录，避免泄露）：

   ```powershell
   $token = "粘贴你的Token"
   Add-Content -Path "$env:USERPROFILE\.npmrc" -Value "//registry.npmjs.org/:_authToken=$token"
   ```

4. 验证：

   ```powershell
   npm whoami --registry=https://registry.npmjs.org
   # 应输出你的用户名
   ```

#### 方案 B：每次发布交互输入 OTP

1. 在 npm 网站启用 **Two-Factor Authentication**（Auth & writes 模式）
2. 发布时通过 `--otp=123456` 或 `--otp-prompt` 提供 6 位动态码

### 3. 配置 GitHub Secret（用于自动发布）

仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**：

- **Name**：`NPM_TOKEN`
- **Value**：上一步签发的 Automation Token

> Actions 会用这个 token 鉴权，所以**强烈建议用 Automation Token 而不是普通 Classic Token**。

---

## 三、Changesets 工作流（推荐）

本仓库使用 [Changesets](https://github.com/changesets/changesets) 管理版本与 changelog。
配置：[../.changeset/config.json](../.changeset/config.json) — 8 个包通过 `fixed` 字段绑定为统一版本号。

### 3.1 日常开发：提 changeset

每次提交带变更代码时，一并描述本次改动：

```bash
# 在仓库根执行
cd d:\my-code\my-lucky-office\lucky-office
pnpm changeset
```

交互界面会让你：

1. 选哪些包受影响（按空格选中，回车确认）
   - 因为配了 `fixed`，选任意一个包都会让 8 个包一起升
2. 选 bump 级别：`major` / `minor` / `patch`
3. 写一段 markdown 描述

执行后会在 `.changeset/` 下生成一个 `xxx-yyy-zzz.md` 文件，**和代码改动一起 commit**：

```bash
git add .changeset/*.md src/...
git commit -m "feat(excel): 增加附件批量预览支持"
git push
```

### 3.2 自动开 Version PR

push 到 main 后，[GitHub Actions](../.github/workflows/release.yml) 中的 `changesets/action` 会：

1. 扫描 `.changeset/` 下所有未消化的 `.md` 文件
2. 自动开（或更新）一个标题为 **"chore(release): version packages"** 的 PR
3. PR 内容：
   - 删除已消化的 `.changeset/*.md`
   - 把每个 `core/packages/*/package.json` 的 `version` bump
   - 在每个包目录下生成 / 更新各自的 `CHANGELOG.md`

### 3.3 合并 PR → 自动发布

合并 "Version Packages" PR 后，Actions 会再次触发：

1. 检测到 `.changeset/` 已无未消化文件
2. 跑 `pnpm ci:release` = 构建所有包 + `changeset publish`
3. `changeset publish` 自动按依赖顺序 publish 到 npm（无需 `workspace:*` 替换烦恼）
4. 自动打 git tag `vX.Y.Z` 并推送

> 注意：本仓库**不再支持「推送 v* tag 自动发布」这种触发方式**。Release workflow 现在只监听 `push: branches: [main]` 与手动触发。tag 由 changesets 在合并 Version PR 后自动打，无需手工 `git tag`。

### 3.4 本地预演

发布前可以在本地预演：

```bash
# 1. 看当前 changeset 状态
pnpm changeset status

# 2. 演练 bump 后的版本号 + CHANGELOG（会真的修改文件，记得用 git stash 还原）
pnpm changeset version

# 3. 演练 publish（不真发）
pnpm changeset publish --dry-run
```

### 3.5 常见操作

| 需求 | 命令 |
|---|---|
| 添加 changeset | `pnpm changeset` |
| 查看待发布内容 | `pnpm changeset status` |
| 查看 verbose 状态 | `pnpm changeset status --verbose` |
| 删除一个 changeset 文件 | 直接 `rm .changeset/<name>.md` |
| 修改某个 changeset 描述 | 直接编辑 `.changeset/<name>.md` |
| 强制 bump 但不写 changelog | 创建空白 changeset，描述留空即可 |

---

## 四、本地一键发布脚本（兜底）

发布脚本：[core/script/publish-all.js](./script/publish-all.js)

### 已注册的 npm scripts（在 `core/package.json`）

| 命令 | 作用 |
|---|---|
| `pnpm run release:dry` | 全量 dry-run（不会真发，仅验证） |
| `pnpm run release` | 全量正式发布（包含构建） |
| `pnpm run release:only` | 跳过构建直接发布（lib 已构建过时使用） |

### 完整参数列表

```
node script/publish-all.js [options]

选项：
  --release           真正发布（默认是 dry-run）
  --skip-build        跳过 pnpm run lib 构建步骤
  --only=<pkg1,pkg2>  仅发布指定包（短名，如 exceljs,vue-excel）
  --otp=<code>        统一使用一个 6 位 OTP（适合所有包能在 30s 内发完）
  --otp-prompt        每个包发布前交互式输入 OTP
```

### 典型用法

```powershell
cd d:\my-code\my-lucky-office\lucky-office\core

# 1) Dry-run 预演
pnpm run release:dry

# 2a) Automation Token 模式：直接发
pnpm run release

# 2b) OTP 模式 - 一次性 OTP（动作要快）
node script/publish-all.js --release --otp=123456

# 2c) OTP 模式 - 逐个交互输入
node script/publish-all.js --release --otp-prompt

# 3) 中断后续发剩下的（不重发已发的）
node script/publish-all.js --release --skip-build --only=vue-pdf,vue-pptx,js-excel,js-docx,js-pdf

# 4) 仅发布单个包
node script/publish-all.js --release --only=vue-excel --skip-build
```

### 脚本工作流

```
Step 1: pnpm run lib       # 构建所有包（可用 --skip-build 跳过）
Step 2: 按依赖顺序串行 publish：
        exceljs → vue-excel → vue-docx → vue-pdf → vue-pptx
                → js-excel → js-docx → js-pdf
        任一包失败立即终止（process.exit(1)），不会破坏依赖图
```

---

## 五、发布后验证

### 1. 在 npm 网站确认

访问 https://www.npmjs.com/package/@lucky-office/excel ，应能看到刚发布的版本。

### 2. 在临时项目里安装验证

```powershell
mkdir D:\tmp-test; cd D:\tmp-test
npm init -y
npm install @lucky-office/excel vue@3
# 应自动拉取 @lucky-office/exceljs 作为传递依赖
```

### 3. 检查 tarball 内容

发布前可用 `npm pack --dry-run` 看实际打入 tarball 的文件列表：

```powershell
cd core/packages/vue-excel
npm pack --dry-run
```

应包含：
- `lib/index.js`、`lib/index.css`、`lib/index.d.ts`、`lib/README.md`
- `package.json`、`LICENSE`、`README.md`

---

## 六、常见问题

### Q1: `403 Forbidden ... Two-factor authentication ... required`

→ 见本文「方案 A」配置 Automation Token，或加 `--otp=<code>`。

### Q2: `403 Forbidden ... You do not have permission to publish`

→ 你的 npm 账号不是 `lucky-office` 组织成员，进 npm 网站把账号加到组织。

### Q3: 用户安装后报 `Cannot find module @lucky-office/exceljs@workspace:*`

→ 用了 `npm publish` 而不是 `pnpm publish` / `changeset publish`。本仓库的脚本始终用 pnpm，正常情况下不会遇到。如果误发了，吊销并重发：

```powershell
npm unpublish @lucky-office/excel@0.1.0 --force
# npm 政策：发布 72 小时内可以撤包
```

### Q4: 想发到内部 npm 镜像（私有源）

→ 修改各包 `publishConfig.registry` 字段，例如：

```json
"publishConfig": {
  "access": "public",
  "registry": "https://your-private-registry.com/"
}
```

并在 `~/.npmrc` 添加对应 registry 的 token。

---

## 七、相关链接

- [Changesets 配置](../.changeset/config.json)
- [一键发布脚本源码](./script/publish-all.js)
- [GitHub Actions Release Workflow](../.github/workflows/release.yml)
- [GitHub Actions CI Workflow](../.github/workflows/ci.yml)
- [Changesets 官方文档](https://github.com/changesets/changesets)
- [npm Publishing Packages 文档](https://docs.npmjs.com/cli/commands/npm-publish)
- [pnpm publish 文档](https://pnpm.io/cli/publish)
- [npm 2FA 与 Automation Token](https://docs.npmjs.com/about-access-tokens)
