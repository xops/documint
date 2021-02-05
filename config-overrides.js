const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin"); //eslint-disable-line

module.exports = function override(config) {
  config.plugins.push(
    new MonacoWebpackPlugin({
      // available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
      languages: ["json"]
    })
  );
  //do stuff with the webpack config...
  return config;
}
