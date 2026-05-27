#!/usr/bin/env node
/**
 * lucky-office 一键发布脚本
 *
 * 功能：
 *   - 按依赖顺序串行 publish（exceljs 必须最先发，否则其它包的 workspace:* 协议替换失败）
 *   - 失败立即终止，避免依赖图破坏
 *   - 默认走 dry-run，传 --release 才会真发
 *   - 支持 --only=<pkg1,pkg2> 仅发部分包
 *   - 支持 --otp=<6位动态码> / --otp-prompt 处理 npm 2FA
 *
 * 用法：
 *   node script/publish-all.js                                     # 全量 dry-run
 *   node script/publish-all.js --release --otp=123456              # 用同一个 OTP 串行发完
 *   node script/publish-all.js --release --otp-prompt              # 每个包发布前交互式输入 OTP
 *   node script/publish-all.js --only=exceljs --release --otp=123456
 *
 * 前提：
 *   - 已 npm login 且账号在 @lucky-office 组织下
 *   - npm 账号已开启 2FA（"Auth & writes" 模式必须每次输入；"Auth only" 模式无需 OTP）
 *   - 或者：在 ~/.npmrc 写入 "Granular Access Token (bypass 2FA)"，从而无需 OTP
 */
const { execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

// 发布顺序：exceljs 必须最先（其它包通过 workspace:* 引用它）
const PUBLISH_ORDER = [
    'exceljs',
    'vue-excel',
    'vue-docx',
    'vue-pdf',
    'vue-pptx',
    'js-excel',
    'js-docx',
    'js-pdf',
];

const PACKAGES_DIR = path.resolve(__dirname, '../packages');

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        release: false,
        only: null,
        skipBuild: false,
        otp: null,
        otpPrompt: false,
    };
    for (const arg of args) {
        if (arg === '--release') opts.release = true;
        else if (arg === '--skip-build') opts.skipBuild = true;
        else if (arg === '--otp-prompt') opts.otpPrompt = true;
        else if (arg.startsWith('--otp=')) {
            opts.otp = arg.slice('--otp='.length).trim();
        } else if (arg.startsWith('--only=')) {
            opts.only = arg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean);
        }
    }
    return opts;
}

function color(code, str) {
    return `\x1b[${code}m${str}\x1b[0m`;
}
const green = (s) => color(32, s);
const yellow = (s) => color(33, s);
const red = (s) => color(31, s);
const cyan = (s) => color(36, s);

function run(cmd, cwd) {
    console.log(cyan(`> ${cmd}  ${cwd ? `(cwd=${path.basename(cwd)})` : ''}`));
    execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

// 同步读取一行输入（用于 --otp-prompt）
function promptSync(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function main() {
    const opts = parseArgs();

    const targets = opts.only
        ? PUBLISH_ORDER.filter((p) => opts.only.includes(p))
        : PUBLISH_ORDER;

    if (targets.length === 0) {
        console.error(red('没有匹配的包，请检查 --only 参数'));
        process.exit(1);
    }

    console.log(yellow('===== lucky-office 一键发布 ====='));
    console.log(`模式      : ${opts.release ? red('正式发布 (real publish)') : green('Dry-run (不会真发)')}`);
    console.log(`目标包    : ${targets.join(', ')}`);
    console.log(`跳过构建  : ${opts.skipBuild ? '是' : '否'}`);
    if (opts.release) {
        console.log(`OTP       : ${opts.otp ? '已通过 --otp 提供' : (opts.otpPrompt ? '每次发布前交互输入' : '未提供（若 npm 账号开启 2FA 会失败）')}`);
    }
    console.log('');

    // Step 1: 构建
    if (!opts.skipBuild) {
        console.log(yellow('===== Step 1: 构建所有包 ====='));
        run('pnpm run lib', path.resolve(__dirname, '..'));
        console.log(green('构建完成 ✅'));
        console.log('');
    } else {
        console.log(yellow('已跳过构建步骤（--skip-build）'));
    }

    // Step 2: 按顺序发布
    console.log(yellow('===== Step 2: 按依赖顺序发布 ====='));
    const dryRunFlag = opts.release ? '' : '--dry-run';

    for (const pkg of targets) {
        const cwd = path.join(PACKAGES_DIR, pkg);
        console.log(yellow(`\n--- [${pkg}] ---`));

        // 取本次要用的 OTP
        let otp = opts.otp;
        if (opts.release && opts.otpPrompt) {
            otp = await promptSync(`请输入 [${pkg}] 的 npm OTP（6 位动态码，留空跳过）: `);
        }
        const otpFlag = opts.release && otp ? `--otp=${otp}` : '';

        const cmd = `pnpm publish --access public --no-git-checks ${dryRunFlag} ${otpFlag}`
            .replace(/\s+/g, ' ')
            .trim();

        try {
            run(cmd, cwd);
            console.log(green(`✅ ${pkg} ${opts.release ? '已发布' : 'dry-run 通过'}`));
        } catch (e) {
            console.error(red(`❌ ${pkg} 发布失败：${e.message}`));
            console.error(red('提示：若是 2FA / 403 错误，请检查 OTP 是否过期或已使用，再用 --otp=<新 OTP> 续发未完成的包。'));
            process.exit(1);
        }
    }

    console.log('');
    console.log(green(`===== 全部完成 ${opts.release ? '🚀' : '(dry-run)'} =====`));
    if (!opts.release) {
        console.log(yellow('提示：以上为 dry-run 验证，加 --release 即可正式发布。'));
    }
}

main().catch((e) => {
    console.error(red(`未捕获错误: ${e.message}`));
    process.exit(1);
});
