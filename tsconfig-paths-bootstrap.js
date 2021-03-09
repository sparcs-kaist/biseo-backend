const tsconfig = require('./tsconfig.json');
const tsconfigPaths = require('tsconfig-paths');

const baseUrl = './dist';
tsconfigPaths.register({
  baseUrl,
  paths: tsconfig.compilerOptions.paths,
});
