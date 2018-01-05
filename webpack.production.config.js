const webpack = require('webpack');
const merge = require('webpack-merge');
const commonConfig = require('./webpack.common.config.js');

module.exports = merge(commonConfig, {
  devtool: false,
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      parallel: true
    })
  ]
});
