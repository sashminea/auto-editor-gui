const { execSync } = require('child_process');
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
run('node create-folder.js');
run('npm run build');
run('npx electron .');