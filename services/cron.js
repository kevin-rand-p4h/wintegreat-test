const cron = require('node-cron')

module.exports = (task, { seconds, minutes, hour, dayOfMonth, month, dayOfWeek }) => {
  const cronConfig = `${seconds} ${minutes} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`
  console.log(`cronConfig: ${cronConfig}`)
  cron.schedule(cronConfig, task)
}