var path = require('path');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.dev.config');

// Fix for Windows and path
// https://github.com/webpack/webpack/issues/2362#issuecomment-266288636
var WarnCaseSensitiveModulesPlugin = require('webpack/lib/WarnCaseSensitiveModulesPlugin');
WarnCaseSensitiveModulesPlugin.prototype.apply = function () {};

var compiler = webpack(config);
var server = new WebpackDevServer(compiler, {
    hot: true,
    contentBase: "src/",
    publicPath: config.output.publicPath
});

server.listen(6002, 'localhost', function(err) {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Listening at http://localhost:6002. Please wait, I'm building things for you...");
});