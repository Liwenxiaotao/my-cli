#!/usr/bin/env node
checkDebug()

const { Command }= require('commander');
const pkg = require('../package.json')
const checkNode = require('../lib/checkNode')
const startServer = require('../lib/start/startServer')
const buildServer = require('../lib/build/build');
const { argv } = require('process');

const program = new Command()

const MIN_NODE_VERSION = '8.9.0';

function checkDebug() {
    if (process.argv.indexOf('--debug') > -1 || process.argv.indexOf('-d') > -1) {
        process.env.LOG_LEVER = 'verbose'
    } else {
         process.env.LOG_LEVER = 'info'
    }
}

(async function() {
    try {
        if (!checkNode(MIN_NODE_VERSION)) {
            throw new Error(`Please upgrate your node version to v ${MIN_NODE_VERSION}`)
        }
    } catch (error) {
        console.log(error.message)
    }
    program.version(pkg.version)

    program
        .command('start')
        .description('start my-build server')
        .allowUnknownOption()
        .option('-c, --config <config>', '配置文件路径')
        .option('--custom-webpack <customWebpackPath>', '自定义webpack路径')
        .action(startServer)


    program
        .command('build')
        .description('build my-build project')
        .allowUnknownOption()
        .option('-c, --config <config>', '配置文件路径')
        .option('--custom-webpack <customWebpackPath>', '自定义webpack路径')
        .action(buildServer)

    
    program.option('-d, --debug', '开启调试模式')

    program.parse()  
})()




