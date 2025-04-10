const babel = require('@babel/core');

module.exports = {
  process(src, filename) {
    const result = babel.transformSync(src, {
      filename,
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }]
      ],
      plugins: ['@babel/plugin-transform-modules-commonjs'],
      sourceMaps: 'inline',
      sourceFileName: filename,
    });
    return result.code;
  },
};
