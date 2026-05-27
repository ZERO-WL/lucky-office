# 发布说明（Publishing Guide）

> 本文档面向 lucky-office 维护者，介绍如何把 8 个包发布到 npm。
> 命令默认在 `lucky-office/core/` 目录下执行。

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

> 包之间存在依赖：`@lucky-office/excel`、`@lucky-office/js-excel` 都依赖 `@lucky-office/exceljs`（通过 `workspace:*` 协议），因此 **必须先发布 `exceljs`，否则依赖方在 npm 上找不到对应版本**。

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

---

## 三、一键发布脚本

发布脚本位置：[core/script/publish-all.js](./script/publish-all.js)

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

## 四、推荐发布流程

### 首次发布

```powershell
cd d:\my-code\my-lucky-office\lucky-office\core

# 1. 干净构建 + dry-run 预演
pnpm run release:dry

# 2. 检查 dry-run 输出无报错后正式发布
pnpm run release         # 已配 Automation Token
# 或者
node script/publish-all.js --release --otp-prompt   # OTP 模式
```

### 后续版本发布

```powershell
# 1. 修改各包 package.json 的 version 字段（统一升）
# 2. git commit + git tag
git add .
git commit -m "release: v0.2.0"
git tag -a v0.2.0 -m "release: v0.2.0"
git push origin main --tags

# 3. 发布
cd d:\my-code\my-lucky-office\lucky-office\core
pnpm run release
```

### 仅发布单个包

```powershell
node script/publish-all.js --release --only=vue-excel --skip-build
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
- `lib/v3/index.js`、`lib/v3/index.css`
- `lib/index.d.ts`
- `lib/script/postinstall.js`、`switch-cli.js`、`utils.js`
- `lib/README.md`
- `package.json`、`LICENSE`、`README.md`

---

## 六、版本号管理建议

当前所有包都使用 `0.1.0`。后续推荐：

- **patch 升级**（修 bug、文档）：所有包 `0.1.0 → 0.1.1`
- **minor 升级**（加新 prop / 事件，向后兼容）：所有包 `0.1.0 → 0.2.0`
- **major 升级**（破坏性改动）：所有包 `0.1.0 → 1.0.0`

> 建议保持 8 个包**版本号同步升**，便于用户区分兼容性。如果以后想做精细化版本管理，可引入 [@changesets/cli](https://github.com/changesets/changesets)。

批量改版本号的脚本（PowerShell）：

```powershell
$newVersion = "0.2.0"
@(
  "exceljs", "vue-excel", "vue-docx", "vue-pdf", "vue-pptx",
  "js-excel", "js-docx", "js-pdf"
) | ForEach-Object {
  $pkg = "core\packages\$_\package.json"
  (Get-Content $pkg) -replace '"version":\s*"[^"]+"', """version"": ""$newVersion""" | Set-Content $pkg
  Write-Host "更新 $pkg → $newVersion"
}
```

---

## 七、常见问题

### Q1: `403 Forbidden ... Two-factor authentication ... required`

→ 见本文「方案 A」配置 Automation Token，或加 `--otp=<code>`。

### Q2: `403 Forbidden ... You do not have permission to publish`

→ 你的 npm 账号不是 `lucky-office` 组织成员，进 npm 网站把账号加到组织。

### Q3: 用户安装后报 `Cannot find module @lucky-office/exceljs@workspace:*`

→ 用了 `npm publish` 而不是 `pnpm publish`。pnpm 才会自动把 `workspace:*` 替换为已发布版本。本仓库的脚本始终用 `pnpm publish`，正常情况下不会遇到。如果误发了，吊销并重发：

```powershell
npm unpublish @lucky-office/excel@0.1.0 --force
# npm 政策：发布 72 小时内可以撤包
```

### Q4: 用户安装后报 `lib/script/postinstall.js not found`

→ 构建时 `copyScripts` 步骤失败。检查 `core/script/` 下三个文件齐全：`postinstall.js`、`switch-cli.js`、`utils.js`。

### Q5: 想发到内部 npm 镜像（私有源）

→ 修改各包 `publishConfig.registry` 字段，例如：

```json
"publishConfig": {
  "access": "public",
  "registry": "https://your-private-registry.com/"
}
```

并在 `~/.npmrc` 添加对应 registry 的 token。

---

## 八、相关链接

- [一键发布脚本源码](./script/publish-all.js)
- [npm Publishing Packages 文档](https://docs.npmjs.com/cli/commands/npm-publish)
- [pnpm publish 文档](https://pnpm.io/cli/publish)
- [npm 2FA 与 Automation Token](https://docs.npmjs.com/about-access-tokens)
