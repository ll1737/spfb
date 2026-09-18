const path = require('path');
const fs = require('fs');

function getRuntimePaths({ isPackaged, appPath, resourcesPath }) {
  const repositoryRoot = isPackaged ? resourcesPath : path.resolve(appPath, '..');
  const workerDir = isPackaged
    ? path.join(resourcesPath, 'worker')
    : path.join(repositoryRoot, 'services', 'worker');
  const serverBinName = process.platform === 'win32' ? 'server.exe' : 'server';
  const serverCandidates = isPackaged
    ? [path.join(resourcesPath, 'backend', serverBinName)]
    : [
        path.join(repositoryRoot, 'backend-go', 'bin', serverBinName),
        path.join(repositoryRoot, 'backend', serverBinName)
      ];
  const serverExe = serverCandidates.find(p => fs.existsSync(p)) || serverCandidates[0];

  return {
    serverPath: serverExe,
    isGoServer: true,
    workerDir,
    workerMain: path.join(workerDir, 'main.py')
  };
}

module.exports = { getRuntimePaths };

