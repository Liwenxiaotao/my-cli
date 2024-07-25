const path = require('path');
const fs = require('fs')
const chain = require('webpack-chain')
const WebpackDevServer = require('webpack-dev-server')
const log = require('../utils/log')
const { getConfigFile, loadModule } = require('../utils')
const startPlugin = require('../../plugins/startPlugin')
const buildPlugin = require('../../plugins/buildPlugin')

const isProduction = process.env.NODE_ENV === 'production'

class Service {
    constructor(opts){
        this.args = opts
        this.config = {}
        this.hooks = {}
        this.plugins = []
        this.dir = process.cwd()
        this.webpackConfig = null
        this.internalValue = {}
    }
    async build() {
        await this.resolveConfig()
        await this.registerHooks()
        await this.emitHooks()
        await this.registerPlugins()
        await this.runPlugins()
        await this.initWebpack()
        await this.dobuild()
    }
    async start(){
        await this.resolveConfig()
        await this.registerHooks()
        await this.emitHooks()
        await this.registerPlugins()
        await this.runPlugins()
        await this.initWebpack()
        await this.startServer()
    }

    dobuild = async () => {
        let compiler;
        try {
            const webpack = require(this.webpack)
            const webpackConfig = this.webpackConfig.toConfig()
            log.verbose('webpackConfig', webpackConfig)
            compiler = webpack(webpackConfig, (err, stats) => {
                if (err) {
                    log.error('ERROR!', err)
                    process.exit(1)
                } else {
                    const res = stats.toJson({
                        all: true,
                        errors: true,
                        warnings: true,
                        timings: true
                    })
                    if (res.errors && res.errors.length) {
                        log.error('Complie Error')
                        res.errors.forEach(error => {
                            log.error('ERROR MESSAGE', error.message)
                        })
                    } else if (res.warnings && res.warnings.length){
                        log.warn('ERROR WARNING')
                        res.warning.forEach(warning => {
                            log.warn('WARN MESSAGE', warning.message)
                        })
                    } else {
                        log.info('COMPILE SUCCESSFUL!', `COMPILE FINISH ${res.time / 1000} S`)
                    }
                    process.exit(0)
                }
            })
        } catch (e) {
            log.error('error', e)
        } finally {
        }
    }

    startServer = async () => {
        let compiler;
        let devServer;
        let serverConfig;
        try {
            const webpack = require(this.webpack)
            const webpackConfig = this.webpackConfig.toConfig()
            compiler = webpack(webpackConfig, (err, stats) => {
                if (err) {
                    log.error('ERROR!', err)
                } else {
                    const res = stats.toJson({
                        all: true,
                        errors: true,
                        warnings: true,
                        timings: true
                    })
                    if (res.errors && res.errors.length) {
                        log.error('Complie Error')
                        res.errors.forEach(error => {
                            log.error('ERROR MESSAGE', error.message)
                        })
                    } else if (res.warnings && res.warnings.length){
                        log.warn('ERROR WARNING')
                        res.warning.forEach(warning => {
                            log.warn('WARN MESSAGE', warning.message)
                        })
                    } else {
                        log.info('COMPILE SUCCESSFUL!', `COMPILE FINISH ${res.time / 1000} S`)
                    }
                }
            })

            serverConfig = {
                port: this.args.port || 8080,
                host: this.args.host || '0.0.0.0',
                open: true
                // https: this.args.https || false,
              };
            // 4.0以上版本
            if (WebpackDevServer.getFreePort) {
                devServer = new WebpackDevServer(serverConfig, compiler)
            } else {
                devServer = new WebpackDevServer(compiler, serverConfig)
            }
            
            // 启动服务
            if (devServer.startCallback) {
                devServer.startCallback(() => {
                    log.info('WEBPACK-DEV-SERVER LAUNCH SUCCESSFULLY!')
                })
            } else {
                devServer.listen(serverConfig.port, serverConfig.host, (err) => {
                    if (err) {
                        log.error('WEBPACK-DEV-SERVER ERROR!');
                        log.error('ERROR MESSAGE', err.toString());
                      } else {
                        log.info('WEBPACK-DEV-SERVER LAUNCH SUCCESSFULLY!');
                      }
                })
            }
        } catch (e) {
            log.error('error', e)
        }
    }

    async initWebpack() {
        // 从config中获取 customWebpackPath 属性
        let { customWebpackPath } = this.args
        // customWebpachPath存在时，则使用该地址引用webpack
        if (customWebpackPath) {
            if (!path.isAbsolute(customWebpackPath)) {
                customWebpackPath = path.resolve(customWebpackPath)
            }
            if (fs.existsSync(customWebpackPath)) {
                this.webpack = require.resolve(customWebpackPath)
            }
        } else {
            // 否则使用node_modules 中的webpack
            this.webpack = require.resolve('webpack', {
                paths: [path.resolve(process.cwd(), 'node_modules')]
            })
        }
        log.verbose('webpack config', this.webpackConfig.toConfig())
    }

    async resolveConfig() {
        const { config } = this.args
        let configFilePath = ''
        if (config) {
            if (path.isAbsolute(config)) {
                configFilePath = config
            } else {
                configFilePath = path.resolve(process.cwd(), config)
            }
        } else {    
            configFilePath = getConfigFile({cwd: this.dir})
        }
        console.log(configFilePath)
        if (configFilePath && fs.existsSync(configFilePath)) {
            this.config = await loadModule(configFilePath)       
            log.info('config', this.config)
        } else {
            console.log('配置文件不存在， 终止执行')
            process.exit(1)
        }
        this.webpackConfig = new chain()
    }

    setValue = (key, value) => {
        this.internalValue[key] = value
    }
    
    getValue = (key) => {
        return this.internalValue[key]
    }

    async registerHooks() {
        const {hooks} = this.config
        if (hooks && hooks.length) {
            for (const hook of hooks) {
                const [key, fn] = hook
                if (key && fn) {
                    if (typeof fn === 'function') {
                        const isExist = this.hooks[key]
                        if (!isExist) {
                            this.hooks[key] = []
                        }
                        this.hooks[key].push(fn)
                    } else if (typeof fn === 'string') {
                        const f = await loadModule(fn)
                        if (f) {
                            const isExist = this.hooks[key]
                            if (!isExist) {
                                this.hooks[key] = []
                            }
                            this.hooks[key].push(f)
                        }
                    }
                }
            }
        }
    }

    emitHooks = (key) => {
        const hooks = this.hooks[key]
        if (hooks) {
           for (const fn of hooks) {
                try {
                    fn(this)
                } catch (e) {
                    log.error(e)
                }
           }
        }
    }

    async registerPlugins() {
        let { plugins } = this.config
        const buildPlugins = [isProduction ? buildPlugin : startPlugin]
        buildPlugins.forEach((module) => {
            this.plugins.push({ module })
        })
        if (typeof plugins === 'function') {
            plugins = plugins()
        }
        if (plugins) {
            if (Array.isArray(plugins)) {
                for (const plugin of plugins) {
                    if (typeof plugin === 'string') {
                        const module = await loadModule(plugin)
                        this.plugins.push({ module })
                    } else if (Array.isArray(plugin)) {
                        const [pluginPath, params] = plugin
                        const module = await loadModule(pluginPath)
                        this.plugins.push({ module,  params })
                    } else if (typeof plugin === 'function') {
                        this.plugins.push({ module:  plugin })
                    }
                }
            }
        }
    }

    runPlugins = async () => {
        for (const plugin of this.plugins) {
            const { module, params } = plugin
            if (!module) {
                continue
            }
            const api = {
                chainWebpack: this.webpackConfig,
                emitHooks: this.emitHooks,
                setValue: this.setValue,
                getValue: this.getValue,
                log
            }
            const options = {
                ...params
            }
            await module(api, options)
        }
    }
}

module.exports = Service