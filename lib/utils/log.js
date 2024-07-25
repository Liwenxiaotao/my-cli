const log = require('npmlog')
const LOG_LEVERS = ['verbose', 'info', 'warn', 'error']
const logLever = LOG_LEVERS.includes(process.env.LOG_LEVER) ? process.env.LOG_LEVER : 'info'
log.level = logLever
module.exports = log