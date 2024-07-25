const fg = require('fast-glob')
const path = require('path')
const fs = require('fs')
const DEFAULT_CONFIG_NAME = ['my-config.(js|json|mjs)']

function getConfigFile({cwd = process.cwd()} = {}) {
    const [configFile] = fg.sync(DEFAULT_CONFIG_NAME, { cwd, absolute: true })
    return configFile
}

async function loadModule(modulePath) {
    let newPath = modulePath
    if (modulePath.indexOf('/') > -1 || modulePath.indexOf('.') > -1) {
        newPath = path.isAbsolute(modulePath) ? modulePath : path.resolve(modulePath)
    }
    // 寻找路径， 会去node_modules下寻找
    newPath = require.resolve(newPath, {
        paths: [path.resolve(process.cwd(), 'node_modules')]
    })
    if (newPath && fs.existsSync(newPath)) {
        const isMjs = newPath.endsWith('mjs')
        if (isMjs) {
            return (await import(newPath)).default
        } else {
            return require(newPath)
        }
    }
    return null
}

module.exports = {
    getConfigFile,
    loadModule
}