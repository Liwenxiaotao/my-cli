const detect = require('detect-port');
const Service = require('./Service')
const inquirer = require('inquirer').default;

(async function() {
    const params = process.argv.slice(2)
    const paramsObj = {}
    const DEFAULR_POST = 8000

    params.forEach(param => {
        const [key, value] = param.split(' ')
        paramsObj[key.replace('--', '')] = value
    })
    console.log(paramsObj)
    const {config = '', customWebpackPath = ''} = paramsObj
    let defaultPort = paramsObj['port'] || DEFAULR_POST
    defaultPort = parseInt(defaultPort, 10)

    try {
        // 检测端口号是否可用
        const newPort = await detect(defaultPort)
        if (newPort !== defaultPort) {
            const question = {
                type: 'confirm',
                name: 'answer',
                message: `Port ${defaultPort} is already in use. Use default port ${newPort} instead?`
            }
            const { answer } = await inquirer.prompt(question)
            if (!answer) {
                process.exit(1)
            }
        }
        const args = {
            port: newPort,
            config,
            customWebpackPath
        }
        process.env.NODE_ENV = 'development'
        const service = new Service(args)
        service.start()
    } catch(err) {
        console.error(err)
    }
})()
