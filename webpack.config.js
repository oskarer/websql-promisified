var path = require('path');
var webpack = require('webpack');
var src_dir = path.resolve(__dirname, 'src');
var dist_dir = path.resolve(__dirname, 'dist');
module.exports = {
  entry: path.resolve(src_dir, 'index.js'),
  output: {
    path: dist_dir,
    filename: 'websql.js'
  },
  module: {
    loaders: [
      {
        loader: 'babel',
        test: src_dir,
        query: {
          presets: ['es2015'],
       }
      }
    ]
  },
};
