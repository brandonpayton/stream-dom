const path = require('path')

module.exports = {
  entry: {
    'app': './src/index.js'
  },
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    sourceMapFilename: '[name].js.map',
    publicPath: '/js/',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }
    ]
  }
}
