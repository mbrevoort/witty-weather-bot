var Botkit = require('botkit')
var Witbot = require('witbot')

var slackToken = process.env.SLACK_TOKEN
var witbot = Witbot(process.env.WIT_TOKEN)
var openWeatherApiKey = process.env.OPENWEATHER_KEY
var weather = require('./weather')(openWeatherApiKey)
var controller = Botkit.slackbot({ debug: false })

controller.spawn({ token: slackToken }).startRTM(function (err, bot, payload) {
  if (err) throw new Error('Error connecting to slack: ', err)
  console.log('Connected to Slack')
})

controller.hears('.*', 'direct_message,direct_mention', function (bot, message) {
  var wit = witbot.process(message.text, bot, message)

  wit.hears('weather', 0.5, function (bot, message, outcome) {
    if (!outcome.entities.location || outcome.entities.location.length === 0) {
      return bot.reply(message, 'You have to tell me *where* you want the weather')
    }

    var location = outcome.entities.location[0].value
    weather.get(location, function (error, msg) {
      if (error) return bot.reply(message, 'Uh oh, there was a problem getting the weather. ' + error)
      bot.reply(message, msg)
    })
  })

  wit.otherwise(function (bot, message) {
    bot.reply(message, 'What is this nonesense you speak!?')
  })
})
