const chokidar = require('chokidar')
const path = require('path')
const cp = require('child_process')
const { getConfigFile } = require('../utils')
const log = require('../utils/log')
let child;

function runServer(args) {
    const {config = '', customWebpackPath = ''} = args
    // 启动webpack服务
    const scriptPath = path.resolve(__dirname, './DevService.js')
    child = cp.fork(scriptPath, [
        '--port 3000',
         `--config ${config}`,
         `--customWebpackPath ${customWebpackPath}`
        ])
    // 子进程退出，主进程也退出
    child.on('exit', (code) => {
        if(code) {
            process.exit(code)
        }
    })
}

function onchange(opts) {
    child.kill()
    runServer(opts)
}

function runWatcher(opts) {
    // 监听 webpack配置文件修改
    // 重新启动 webpack-dev-server
    const configPath = getConfigFile()
    const watcher = chokidar.watch(configPath)
    watcher.on('change', () => {
        onchange(opts)
    })
}

module.exports = function(opts, cmd) {
    // 通过子进程启动webpack-dev-server服务
    // 子进程启动可以避免主进程受到影响
    // 子进程启动可以方便重启，解决配置修改后无法重启
    console.log(cmd.optsWithGlobals())
    console.log(opts)
    runServer(opts)

    // 监听配置修改
    runWatcher(opts)
}