const path = require('path');

module.exports = {
    entry: './src/index.ts',
    target: 'node',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
    },
    externals: {
        'sqlite3': 'commonjs sqlite3',
        'express': 'commonjs express',
        'body-parser': 'commonjs body-parser',
        'child_process': 'commonjs child_process',
        'util': 'commonjs util'
    },
    node: {
        __dirname: false,
        __filename: false
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        port: 8080,
        hot: true,
    },
}; 