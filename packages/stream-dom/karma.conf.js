var path = require('path')

module.exports = function(config) {
  config.set({
    singleRun: true,

    files: [
      './node_modules/babel-polyfill/browser.js',
      'test/index.js',
      'test/eventing.js'
    ],

    frameworks: [ 'mocha' ],

    preprocessors: {
      'test/index.js': [ 'webpack', 'sourcemap' ],
      'test/eventing.js': [ 'webpack', 'sourcemap' ]
    },

    logLevel: config.LOG_INFO,

    reporters: [ 'spec' ],

    webpack: {
      devtool: 'inline-source-map',

      module: {
        loaders: [{
          test: /\.js$/,
          loader: 'babel',
          include: [ path.join(__dirname, 'test') ]
        }]
      },
      resolve: {
        modulesDirectories: [
          '',
          'node_modules'
        ],
        alias: {
          'stream-dom': path.join(__dirname, 'lib')
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
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-spec-reporter')
    ],

    browsers: [ 'Chrome', 'Firefox' ]
  })
}
