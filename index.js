const debug = require('debug')('botium-connector-simple-socketio')
const _ = require('lodash')
const util = require('util')
var io = require('socket.io-client')

const Capabilities = {
}

class BotiumConnectorSimpleSocketIO {
  constructor ({ queueBotSays, caps }) {
    this.queueBotSays = queueBotSays
    this.caps = caps
  }

  Validate () {
    debug('Validate called')

    return Promise.resolve()
  }

  Build () {
    debug('Build called')
    this.socket = io.connect('http://localhost:3000', {reconnect: true})
    this.socket.on('chat message', (message) => {
      this.queueBotSays({ sender: 'bot', messageText: message.msg })
    })
    return Promise.resolve()
  }

  Start () {
    debug('Start called')

    return Promise.resolve()
  }

  UserSays ({messageText}) {
    debug('UserSays called')
    this.socket.emit('chat message', { user: 'me', msg: messageText });

    return Promise.resolve()
  }

  Stop () {
    debug('Stop called')

    return Promise.resolve()
  }

  Clean () {
    debug('Clean called')

    return Promise.resolve()
  }
}

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorSimpleSocketIO
}
