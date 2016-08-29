const path = require('path')

const customLaunchers = {
  sl_chrome: {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'Windows 7',
    version: '35'
  },
  sl_firefox: {
    base: 'SauceLabs',
    browserName: 'firefox',
    version: '48'
  },
  sl_ie_11: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '11'
  }
}

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
      require('karma-sauce-launcher'),
      require('karma-spec-reporter')
    ],

    sauceLabs: {
      testName: 'Web App Unit Tests'
    },
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),

  })
}
