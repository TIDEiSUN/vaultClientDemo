const webpack = require('webpack');
const path = require('path');

module.exports = {
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
  entry: path.join(__dirname, 'src', 'app-client.js'),
  output: {
    path: path.join(__dirname, 'src', 'static', 'js'),
    filename: 'bundle.js'
  },
  module: {
    loaders: [
    {
      test: /https-proxy-agent|jayson/,
      loader: 'null-loader'
    }, {
      test:  /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
      query: {
        cacheDirectory: 'babel_cache',
        presets: ['react', 'es2015']
      }
    }, {
      test: /\.json$/,
      loader: 'json-loader'
    }
    
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: { warnings: false },
      mangle: true,
      sourceMap: process.env.NODE_ENV === 'production',
      beautify: true
    }),
    new webpack.NormalModuleReplacementPlugin(/^ws$/, './wswrapper'),
    new webpack.NormalModuleReplacementPlugin(/^\.\/wallet$/, './wallet-web'),
    new webpack.NormalModuleReplacementPlugin(/^.*setup-api$/,'./setup-api-web')
  ]
};
