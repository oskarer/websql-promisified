module.exports = function (config) {
  var configuration = {
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'tests/*.js',
    ],
    preprocessors: {
      'tests/*-test.js': ['webpack', 'sourcemap'],
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    autoWatch: true,
    browsers: ['PhantomJS', 'Chrome'],
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox'],
      },
    },
    singleRun: false,
    concurrency: Infinity,
    webpack: {
      devtool: 'inline-source-map',
      module: {
        loaders: [
          {
            test: /\.js$/,
            loader: 'babel-loader',
            query: {
              presets: ['es2015', 'stage-3'],
            },
          },
        ],
      },
    },
    webpackMiddleware: {
      noInfo: true,
    },
  };
  if (process.env.TRAVIS) {
    configuration.browsers = ['Chrome_travis_ci', 'PhantomJS'];
    configuration.singleRun = true;
  }
  config.set(configuration);
};
