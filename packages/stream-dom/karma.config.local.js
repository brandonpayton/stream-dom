const createBaseConfig = require(`./karma.config.base`).createBaseConfig

module.exports = function (config) {
  const baseConfig = createBaseConfig(config)

  config.set(Object.assign({}, baseConfig, {
    plugins: baseConfig.plugins.concat(
      require(`karma-chrome-launcher`)
    ),

    browsers: [ `Chrome` ]
  }))
}
