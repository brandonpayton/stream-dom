module.exports.createBaseConfig = function createBaseConfig (config) {
  return {
    singleRun: true,

    files: [
      `node_modules/babel-polyfill/browser.js`,
      `test/**/*.js`
    ],

    frameworks: [ `mocha` ],

    preprocessors: {
      'test/**/*.js': [ `webpack`, `sourcemap` ]
    },

    logLevel: config.LOG_INFO,

    reporters: [ `spec` ],

    client: {
      mocha: {
        ui: `tdd`
      }
    },

    webpack: {
      devtool: `inline-source-map`,

      module: {
        loaders: [{
          test: /\.js$/,
          loader: `babel`,
          include: [
            `${__dirname}/src`,
            `${__dirname}/test`,
            `${__dirname}/test-util}`
          ],
          query: {
            presets: [ `es2015`, `es2016` ]
          }
        }]
      },
      resolve: {
        modulesDirectories: [
          ``,
          `node_modules`
        ],
        extensions: [ ``, `.js` ]
      }
    },

    webpackMiddleware: {
      // Display no info to console (only warnings and errors)
      noInfo: true
    },

    plugins: [
      require(`karma-webpack`),
      require(`karma-sourcemap-loader`),
      require(`karma-mocha`),
      require(`karma-spec-reporter`)
    ]
  }
}
