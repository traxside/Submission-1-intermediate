const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    port: 3000,
    client: {
      overlay: {
        errors: true,
        warnings: true,
      },
    },
    server: {
      type: 'https',
      // For custom certificates (optional):
      // options: {
      //   key: fs.readFileSync(path.join(__dirname, 'path/to/server.key')),
      //   cert: fs.readFileSync(path.join(__dirname, 'path/to/server.crt')),
      // }
    },
  },
});