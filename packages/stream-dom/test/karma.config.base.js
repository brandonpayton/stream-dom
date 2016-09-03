const path = require('path')

module.exports.createBaseConfig = function createBaseConfig(config) {
  return {
    singleRun: true,

    files: [
      '../node_modules/babel-polyfill/browser.js',
      './index.js',
      './eventing.js'
    ],

    frameworks: [ 'mocha' ],

    preprocessors: {
      './index.js': [ 'webpack', 'sourcemap' ],
      './eventing.js': [ 'webpack', 'sourcemap' ]
    },

    logLevel: config.LOG_INFO,

    reporters: [ 'spec' ],

    webpack: {
      devtool: 'inline-source-map',

      module: {
        loaders: [{
          test: /\.js$/,
          loader: 'babel',
          include: [ path.normalize(`${__dirname}/../test`) ]
        }]
      },
      resolve: {
        modulesDirectories: [
          '',
          'node_modules'
        ],
        alias: {
          'stream-dom': path.normalize(`${__dirname}/../lib`)
        },
        extensions: [ '', '.js' ]
      }
    },

    webpackMiddleware: {
      // Display no info to console (only warnings and errors)
      noInfo: true
    },

    plugins: [
      require('karma-webpack'),
      require('karma-sourcemap-loader'),
      require('karma-mocha'),
      require('karma-spec-reporter')
    ]
  }
}
