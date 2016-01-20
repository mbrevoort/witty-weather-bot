var Botkit = require('botkit')
var slackToken = process.env.SLACK_TOKEN
var weather = require('./weather')(process.env.OPENWEATHER_KEY)
var controller = Botkit.slackbot({ debug: false })

controller.spawn({ token: slackToken }).startRTM(function (err, bot, payload) {
  if (err) throw new Error('Error connecting to slack: ', err)
  console.log('Connected to Slack')
})

controller.hears('^What is the weather in (.*)', 'direct_message,direct_mention', function (bot, message) {
  var location = message.match[1]
  weather.get(location, function (error, msg) {
    if (error) return bot.reply(message, 'Uh oh! ' + error)
    bot.reply(message, msg)
  })
})

controller.hears('^What is the magic word?', 'direct_message,direct_mention', function (bot, message) {
  bot.reply(message, 'Please, of course.')
  bot.reply(message, 'Who doesn\'t know that?.')
  bot.reply(message, 'That was a rhetorical question.')
})

controller.hears('.*', 'direct_message,direct_mention', function (bot, message) {
  bot.reply(message, 'Huh?')
})
