const Service = require('../start/Service')

module.exports = function(opts,cmd) {
    process.env.NODE_ENV = 'production'

    const args = {
        config: opts.config,
        customWebpackPath: opts.customWebpackPath
    }
    const service = new Service(args)
    service.build()
}