// Runs the release steps one after another, on any shell (PowerShell, cmd, bash).
// Usage: node scripts/release.js pack   -> unpacked app in release/win-unpacked (for testing)
//        node scripts/release.js dist   -> Windows installer in release/
const { execSync } = require('child_process');
const path = require('path');

const mode = process.argv[2];
if (mode !== 'pack' && mode !== 'dist') {
  console.error('Usage: node scripts/release.js <pack|dist>');
  process.exit(1);
}

const root = path.join(__dirname, '..');
const run = (label, cmd) => {
  console.log(`\n=== ${label} ===`);
  execSync(cmd, { cwd: root, stdio: 'inherit' });
};

try {
  run('1/4 Compile main.ts and preload.ts', 'npm run build');
  run('2/4 Build the frontend', 'npm run build:renderer');
  run('3/4 Prepare embedded Python', 'npm run prepare:python');
  run(
    '4/4 Package with electron-builder',
    mode === 'pack' ? 'npx electron-builder --dir' : 'npx electron-builder --win'
  );
  console.log('\nDone. Output is in the release folder.');
} catch {
  console.error('\nRelease step failed. Read the error above.');
  process.exit(1);
}