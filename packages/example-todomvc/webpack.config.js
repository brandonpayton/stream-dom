module.exports = {
  entry: {
    'app': './src/app.js'
  },
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    sourceMapFilename: '[name].js.map',
    publicPath: '/js/',
    // NOTE: Specifying this because webpack-dev-middleware requires `path` to be anything other than the default empty string
    path: `${__dirname}/js/`
  },
  plugins: [],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: [ 'babel' ],
      include: __dirname,
      exclude: /node_modules/
    }]
  }
}
