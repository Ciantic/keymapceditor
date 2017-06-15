var path = require("path");
var packageJson = require(path.join(__dirname, 'package.json'));
var webpack = require('webpack');

var appDir = path.resolve(__dirname, "src");
var config = {
    entry: {
        vendors: [
            'react-hot-loader',
            // For react hot loader
            'react-hot-loader/patch',
        ].concat(Object.keys(packageJson.dependencies)),
        app: [
            'react-hot-loader',
            // For react hot loader
            'react-hot-loader/patch',
            // For module replacement
            'webpack-dev-server/client?http://localhost:6002',
            'webpack/hot/only-dev-server',
            path.join(__dirname, 'src', 'Index.hmr.tsx')
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: '[name].js',
        publicPath: "http://localhost:6002/assets/"
    },
    watch: true,
    module: {
        loaders: [
            { test: /\.tsx?$/, loaders: ['ts-loader'], include: appDir },
            { test: /\.css$/, exclude: /\.import\.css$/, loader: "style-loader!css", include: appDir },
            { test: /\.scss$/, exclude: /\.module\.scss$/, loader: "style-loader!css-loader!postcss-loader!sass-loader", include: appDir },
            { test: /\.module\.scss$/, loader: "style-loader!css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss-loader!sass-loader", include: appDir },
            { test: /\.svg$/, loader: 'svg-inline-loader' },
            {
                test: /\.(woff|woff2)$/,
                loader: 'url-loader',
                options: {
                    name: 'fonts/[hash].[ext]',
                    limit: 5000,
                    mimetype: 'application/font-woff',
                },
            },{
                test: /\.(ttf|eot)$/,
                loader: 'file-loader',
                options: {
                    name: 'fonts/[hash].[ext]',
                },
            },
            { test: /\.(jpg|png|gif)$/, loader: "file-loader?name=[name].[ext]", include: appDir }
        ]
    },
    devtool: 'inline-source-map',
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                'NODE_ENV': '"development"'
            }
        }),
        new webpack.HotModuleReplacementPlugin()
    ]
};

module.exports = config;
