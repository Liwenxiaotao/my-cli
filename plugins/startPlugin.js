const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');


module.exports = function(api, option) {
    const config = api.chainWebpack
    const cwd = process.cwd()
    // 构建模式
    config.mode('development')

    // 设置entry
    config.entry('index')
        .add(path.resolve(cwd, './src/index.js'))
        .end()
    // 设置output
    config.output
        .filename('js/[name].js')
        .path(path.resolve(cwd, 'dist'))

    // 设置loader
    config.module
        .rule('css')
            .test(/\.css$/)
            .exclude
                .add(/node_modules/)
                .end()
            .use('mini-css')
                .loader(MiniCssExtractPlugin.loader)
                .end()
            .use('css-loader')
                .loader('css-loader')
    
    config.module
        .rule('asset')
            .test(/\.(png|svg|jpg|jpeg|gif)$/i)
            .type('asset')
            .parser({
                dataUrlCondition: {
                    maxSize: 8 * 1024
                }
            })
    config.module.rule('asset').set('generator', {
        filename: 'images/[name].[hash:6][ext]'
    })

    config.plugin('HtmlWebpackPlugin')
        .use(HtmlWebpackPlugin, [{
            filename: 'index.html',
            template: path.resolve(cwd, './public/index.html'),
            chunks: ['index']
        }])
    
    config.plugin('CleanWebpackPlugin')
        .use(CleanWebpackPlugin, [])

    config.optimization
        .usedExports(true)
    
    config.watch(true)  // 文件监听
}