/*eslint-env node */

var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: {
    'index': './src/index.js'
  },
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    sourceMapFilename: '[name].js.map',
    publicPath: '/static/',
    // NOTE: Specifying this because webpack-dev-middleware requires `path` to be anything other than the default empty string
    path: '/'
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  resolve: {
    alias: {
      'freeze-tag': path.join(__dirname, 'src')
    },
    extensions: ['', '.js']
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: [ 'babel' ],
      include: __dirname,
      exclude: /node_modules/
    }]
  }
}
