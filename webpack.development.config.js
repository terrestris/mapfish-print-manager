const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common.config.js');

module.exports = merge(commonConfig, {
  mode: 'development',
  devServer: {
    static: './example',
    compress: true,
    port: 9000,
    proxy: {
      '/print-v2/**': {
        target: {
          host: '127.0.0.1',
          port: 18082
        },
        pathRewrite: {
          '^/print-v2': '/print'
        }
      },
      '/print-v3/**': {
        target: {
          host: '127.0.0.1',
          port: 18083
        },
        pathRewrite: {
          '^/print-v3': '/print'
        }
      },
      '/print/pdf/**': {
        target: {
          host: '127.0.0.1',
          port: 18082
        },
        pathRewrite: {
          '^/print/pdf': '/print/pdf'
        }
      },
      '/print/status/**': {
        target: {
          host: '127.0.0.1',
          port: 18083
        },
        pathRewrite: {
          '^/print/status': '/print/status'
        }
      },
      '/print/report/**': {
        target: {
          host: '127.0.0.1',
          port: 18083
        },
        pathRewrite: {
          '^/print/report': '/print/report'
        }
      }
    }
  }
});
