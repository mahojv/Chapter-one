const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Encontrar la raíz del proyecto (apps/mobile) y la raíz del monorepo
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Monitorear cambios en todos los archivos del monorepo
config.watchFolders = [workspaceRoot];

// 2. Permitir a Metro resolver paquetes node_modules tanto en apps/mobile como en la raíz del monorepo
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
