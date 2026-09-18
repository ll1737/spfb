const path = require('path');
const fs = require('fs');

function getRuntimePaths({ isPackaged, appPath, resourcesPath }) {
  const repositoryRoot = isPackaged ? resourcesPath : path.resolve(appPath, '..');
  const workerDir = isPackaged
    ? path.join(resourcesPath, 'worker')
    : path.join(repositoryRoot, 'services', 'worker');
  const serverCandidates = isPackaged
    ? [path.join(resourcesPath, 'backend', 'server.exe')]
    : [
        path.join(repositoryRoot, 'backend-go', 'bin', 'server.exe'),
        path.join(repositoryRoot, 'backend', 'server.exe')
      ];
  const serverExe = serverCandidates.find(p => fs.existsSync(p)) || serverCandidates[0];

  return {
    serverPath: serverExe,
    isGoServer: serverExe.endsWith('.exe'),
    workerDir,
    workerMain: path.join(workerDir, 'main.py')
  };
}

module.exports = { getRuntimePaths };

