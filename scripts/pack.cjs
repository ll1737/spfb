const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release', '智域-win32-x64');
const electronDist = path.join(rootDir, 'node_modules', 'electron', 'dist');

console.log('🚀 1. 构建前端与 Go 后端...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

console.log('🧹 2. 清理并准备发布目录...');
if (fs.existsSync(path.join(rootDir, 'release'))) {
  try {
    fs.rmSync(path.join(rootDir, 'release'), { recursive: true, force: true });
  } catch (e) {}
}
fs.mkdirSync(releaseDir, { recursive: true });

function copyDir(src, dest, filter) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (filter && !filter(srcPath, entry.name)) continue;
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, filter);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('⚡ 3. 组装 Electron 运行环境...');
copyDir(electronDist, releaseDir, (p, name) => name !== 'default_app.asar');

const oldExe = path.join(releaseDir, 'electron.exe');
const newExe = path.join(releaseDir, '智域.exe');
if (fs.existsSync(oldExe)) {
  fs.renameSync(oldExe, newExe);
}

console.log('📦 4. 打包业务程序与资源到 resources/app...');
const appDir = path.join(releaseDir, 'resources', 'app');
fs.mkdirSync(appDir, { recursive: true });

copyDir(path.join(rootDir, 'dist'), path.join(appDir, 'dist'));
copyDir(path.join(rootDir, 'electron'), path.join(appDir, 'electron'));

const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const minimalPkg = {
  name: pkg.name,
  productName: "智域",
  version: pkg.version,
  description: pkg.description,
  main: 'electron/main.cjs'
};
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(minimalPkg, null, 2));

const backendDest = path.join(appDir, 'backend');
fs.mkdirSync(backendDest, { recursive: true });
fs.copyFileSync(path.join(rootDir, 'backend-go', 'bin', 'server.exe'), path.join(backendDest, 'server.exe'));
copyDir(path.join(rootDir, 'backend-go', 'configs'), path.join(backendDest, 'configs'));

copyDir(
  path.join(rootDir, 'services', 'worker'),
  path.join(appDir, 'worker'),
  (fullPath, name) => !name.includes('cache') && !name.endsWith('.pyc')
);

console.log('✅ 5. 打包完成！');
console.log(`📁 桌面端可执行程序路径: ${newExe}`);
