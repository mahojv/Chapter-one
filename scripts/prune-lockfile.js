import fs from 'node:fs';

const pkgPath = 'package.json';
const lockPath = 'package-lock.json';

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.workspaces = ['apps/api', 'packages/types', 'packages/validation'];
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
if (lock.packages && lock.packages['']) {
  lock.packages[''].workspaces = ['apps/api', 'packages/types', 'packages/validation'];
}

if (lock.packages) {
  delete lock.packages['apps/mobile'];
  for (const key of Object.keys(lock.packages)) {
    if (key.startsWith('apps/mobile/')) {
      delete lock.packages[key];
    }
  }
}

fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
console.log('Successfully pruned lockfile for API Docker build context.');
