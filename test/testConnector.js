const Connector = require('../index').PluginClass

const client = new Connector({
  queueBotSays: ({sender, messageText}) => {
    console.log('Answer: ' + messageText)
  },
  caps: {}
})

client.Validate()

client.Build()
  .then(() => client.Start())
  .then(() => client.UserSays({messageText: 'First test message'}))
  .then(() => client.UserSays({messageText: 'Second test message'}))
