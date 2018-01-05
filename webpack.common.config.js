const path = require('path');

module.exports = {
  entry: {
    'print-manager-example': './example/print-manager-example.js',
  },

  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].js'
  },

  module: {
    loaders: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  }
};
