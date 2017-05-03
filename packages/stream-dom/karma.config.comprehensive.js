const createBaseConfig = require('./karma.config.base').createBaseConfig

const customLaunchers = {
  sl_chrome: {
    base: 'SauceLabs',
    browserName: 'chrome',
    platform: 'Windows 7',
    version: '57'
  },
  sl_firefox: {
    base: 'SauceLabs',
    browserName: 'firefox',
    version: '52.0'
  },
  sl_ie_11: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '11'
  },
  sl_edge_14: {
    base: 'SauceLabs',
    browserName: 'MicrosoftEdge',
    platform: 'Windows 10',
    version: '14.14393'
  },
  sl_safari: {
    base: 'SauceLabs',
    browserName: 'safari',
    platform: 'macOS 10.12',
    version: '10.0'
  }
}

module.exports = function (config) {
  const baseConfig = createBaseConfig(config)

  config.set(Object.assign({}, baseConfig, {
    plugins: baseConfig.plugins.concat(
      require('karma-sauce-launcher')
    ),

    sauceLabs: {
      testName: 'Web App Unit Tests'
    },
    captureTimeout: 120000,
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers)
  }))
}
