const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.blockList = [
  /\.#bin\//,
  /\.#cache\//,
  /\.#git\//,
  /\.#hg\//,
  /\.#pnpm\//,
  /\.#yarn\//,
  /\.#flow\//,
  /\.#vs_code\//,
  /\.#idea\//,
  /\.#tmp\//,
  /\.#temp\//,
  /\.#log\//,
  /\.#logs\//,
  /\.#svn\//,
  /\.#docs\//,
  /\.#node_modules\//,
];

module.exports = config;