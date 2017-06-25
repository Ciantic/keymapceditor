var webpackConfig = require("./webpack.config");
var webpack = require("webpack");
var webpackDevConfig = require("./webpack.dev.config");

module.exports = function(config) {
    config.set({
        basePath: "",
        frameworks: ["mocha", "chai"], //, "sinon"],
        files: ["test/*.ts"],
        exclude: [],
        preprocessors: {
            "test/*.ts": ["webpack"],
        },
        webpack: webpackDevConfig,
        mime: {
            "text/x-typescript": ["ts"],
        },
        reporters: ["progress"],
        port: 9876,
        colors: true,
        autoWatch: true,
        browsers: ["Chrome"],
        // ["PhantomJS"], this does not work for me :( maybe it can't understand .ts extension
        singleRun: false,
        concurrency: Infinity,
    });
};
