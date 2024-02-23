const path = require('path');
const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common.js');

module.exports = merge(commonConfig, {
  mode: 'development',
  devServer: {
    static: [
      path.join(__dirname, 'example')
    ],
    compress: true,
    port: 9000,
    proxy: [{
      context: ['/print-v2/**'],
      target: 'http://localhost:18082',
      changeOrigin: true,
      pathRewrite: {
        '^/print-v2': '/print'
      }
    }, {
      context: ['/print-v3/**'],
      target: 'http://localhost:18083',
      changeOrigin: true,
      pathRewrite: {
        '^/print-v3': '/print'
      }
    }, {
      context: ['/print/pdf/**'],
      target: 'http://localhost:18082',
      changeOrigin: true,
      pathRewrite: {
        '^/print/pdf': '/print/pdf'
      }
    }, {
      context: ['/print/status/**'],
      target: 'http://localhost:18083',
      changeOrigin: true,
      pathRewrite: {
        '^/print/status': '/print/status'
      }
    }, {
      context: ['/print/report/**'],
      target: 'http://localhost:18083',
      changeOrigin: true,
      pathRewrite: {
        '^/print/report': '/print/report'
      }
    }]
  }
});
