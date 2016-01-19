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

controller.hears('^What is the weather in (.*)', 'direct_message,direct_mention', function (bot, message) {
  var location = message.match[1]
  weather.get(location, function (error, msg) {
    if (error) return bot.reply(message, 'Uh oh! ' + error)
    bot.reply(message, msg)
  })
})

controller.hears('.*', 'direct_message,direct_mention', function (bot, message) {
  var wit = witbot.process(message.text, bot, message)

  wit.hears('hello', 0.53, function (bot, message, outcome) {
    bot.startConversation(message, function (_, convo) {
      convo.say('Good day!')
      convo.ask('May I fetch the weather for you?', function (response, convo) {
        witbot.process(response.text)
          .hears('yes', 0.5, function (outcome) {
            convo.ask('OK, for where then?', getWeather)
            convo.next()
          })
          .hears('no', 0.5, function (outcome) {
            convo.say('Fine then, well don\'t blame me if you get caught out in the cold')
            convo.next()
          })
          .otherwise(function (outcome) {
            convo.repeat()
            convo.next()
          })
      })
    })
  })

  wit.hears('weather', 0.5, function (bot, message, outcome) {
    console.log(outcome.entities.location)
    if (!outcome.entities.location || outcome.entities.location.length === 0) {
      bot.startConversation(message, function (_, convo) {
        convo.ask('I\'d love to give you the weather but for where?', getWeather)
        convo.next()
      })
      return
    }

    var location = outcome.entities.location[0].value
    weather.get(location, function (error, msg) {
      if (error) {
        bot.startConversation(message, function (_, convo) {
          convo.ask('Uh oh, there was a problem getting the weather. Where?', getWeather)
          convo.next()
        })
        return
      }
      bot.reply(message, msg)
    })
  })

  wit.otherwise(function (bot, message) {
    bot.reply(message, 'What is this nonesense you speak!?')
  })
})

function getWeather (response, convo) {
  weather.get(response.text, function (error, msg) {
    if (error) {
      convo.say('uh oh. ' + error)
      convo.say('where?')
      convo.repeat()
      convo.next()
    } else {
      convo.say(msg)
      convo.next()
    }
  })
}
