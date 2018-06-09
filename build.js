let infoJsonDownloader = require("./build_download_infojson");
let webpack = require("webpack");
var WebpackDevServer = require("webpack-dev-server");
let webpackGetConfig = require("./webpack.config");
let webpackGetDevConfig = require("./webpack.dev.config");
let fs = require("fs");

const main = async (
    /** @type {{
    development: boolean,
    clearInfoJsonCache: boolean
}} */ opts
) => {
    let infoJsons = await infoJsonDownloader.getInfoJsonMap(opts.clearInfoJsonCache);

    await new Promise((resolver, rejecter) => {
        if (opts.development) {
            // Fix for Windows and path
            // https://github.com/webpack/webpack/issues/2362#issuecomment-266288636
            var WarnCaseSensitiveModulesPlugin = require("webpack/lib/WarnCaseSensitiveModulesPlugin");
            WarnCaseSensitiveModulesPlugin.prototype.apply = function() {};

            // Read config and start the server
            var config = webpackGetDevConfig(JSON.stringify(infoJsons));
            var compiler = webpack(config);
            var server = new WebpackDevServer(compiler, {
                hot: true,
                contentBase: "src/",
                publicPath: config.output.publicPath,
                before(app) {
                    // Replace index.html with dynamic version
                    app.use((req, res, next) => {
                        if (req.originalUrl === "/") {
                            let cnt = fs
                                .readFileSync("./src/index.html", "utf8")
                                .replace(
                                    `<%= htmlWebpackPlugin.options._infoJsonContent %>`,
                                    JSON.stringify(infoJsons)
                                );
                            res.status(202).send(cnt);
                        } else {
                            next();
                        }
                    });
                },
            });

            server.listen(6002, "localhost", function(err) {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(
                    "Listening at http://localhost:6002. Please wait, I'm building things for you..."
                );
            });
        } else {
            webpack(webpackGetConfig(JSON.stringify(infoJsons)), (err, stats) => {
                if (err || stats.hasErrors()) {
                    console.error(err);
                    rejecter("Webpack failed with errors.");
                } else {
                    console.log(
                        "Webpack completed successfully in",
                        stats.endTime - stats.startTime,
                        "ms."
                    );
                    resolver(stats);
                }
            });
        }
    });
};

// Ran as an individual script
if (require.main === module) {
    (async () => {
        try {
            await main({
                development: process.argv.indexOf("--development") !== -1,
                clearInfoJsonCache: process.argv.indexOf("--clear-cache") !== -1,
            });
        } catch (err) {
            console.error(err);
            console.error("Died with error code 1");
            process.exit(1);
        }
        console.log("Done, no errors");
    })();
}
