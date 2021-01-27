const debug = require('debug')('botium-connector-simple-socketio')
const _ = require('lodash')
const io = require('socket.io-client')

const Capabilities = {
  SIMPLESOCKETIO_ENDPOINTURL: 'SIMPLESOCKETIO_ENDPOINTURL',
  SIMPLESOCKETIO_ENDPOINTPATH: 'SIMPLESOCKETIO_ENDPOINTPATH',
  SIMPLESOCKETIO_EVENT_USERSAYS: 'SIMPLESOCKETIO_EVENT_USERSAYS',
  SIMPLESOCKETIO_EVENT_BOTSAYS: 'SIMPLESOCKETIO_EVENT_BOTSAYS',
  SIMPLESOCKETIO_SENDTEXT_FIELD: 'SIMPLESOCKETIO_SENDTEXT_FIELD',
  SIMPLESOCKETIO_SENDMEDIA_FIELD: 'SIMPLESOCKETIO_SENDMEDIA_FIELD',
  SIMPLESOCKETIO_RECEIVETEXT_FIELD: 'SIMPLESOCKETIO_RECEIVETEXT_FIELD',
  SIMPLESOCKETIO_RECEIVEATTACHMENT_FIELD: 'SIMPLESOCKETIO_RECEIVEATTACHMENT_FIELD'
}
const Defaults = {
}

class BotiumConnectorSimpleSocketIO {
  constructor ({ queueBotSays, caps }) {
    this.queueBotSays = queueBotSays
    this.caps = caps
  }

  async Validate () {
    this.caps = Object.assign({}, Defaults, this.caps)

    if (!this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTURL]) throw new Error('SIMPLESOCKETIO_ENDPOINTURL capability required')
    if (!this.caps[Capabilities.SIMPLESOCKETIO_EVENT_USERSAYS]) throw new Error('SIMPLESOCKETIO_EVENT_USERSAYS capability required')
    if (!this.caps[Capabilities.SIMPLESOCKETIO_EVENT_BOTSAYS]) throw new Error('SIMPLESOCKETIO_EVENT_BOTSAYS capability required')
  }

  async Build () {
    debug('Build called')
    this.socketOptions = {
      forceNew: true
    }
    if (this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTPATH]) {
      this.socketOptions.path = this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTPATH]
    }
  }

  async Start () {
    debug('Start called')

    this.socket = io(this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTURL], this.socketOptions)
    this.socket.on('disconnect', (reason) => {
      debug(`Received 'disconnect' event, reason: ${reason}`)
    })
    this.socket.on(this.caps[Capabilities.SIMPLESOCKETIO_EVENT_BOTSAYS], (message) => {
      const botMsg = {
        sender: 'bot',
        sourceData: message
      }
      if (this.caps[Capabilities.SIMPLESOCKETIO_RECEIVETEXT_FIELD]) {
        botMsg.messageText = _.get(message, this.caps[Capabilities.SIMPLESOCKETIO_RECEIVETEXT_FIELD])
      }

      if (this.caps[Capabilities.SIMPLESOCKETIO_RECEIVEATTACHMENT_FIELD]) {
        const dataUri = message[this.caps[Capabilities.SIMPLESOCKETIO_RECEIVEATTACHMENT_FIELD]]
        if (dataUri && _.isString(dataUri) && dataUri.startsWith('data:')) {
          const mimeType = dataUri.substring(5, dataUri.indexOf(';'))
          const base64 = dataUri.substring(dataUri.indexOf(',') + 1)
          botMsg.attachments = [{
            mimeType,
            base64
          }]
        }
      }

      this.queueBotSays(botMsg)
    })

    return new Promise((resolve, reject) => {
      let resolved = false
      this.socket.on('connect', () => {
        debug('Received \'connect\' event')
        if (resolved) return
        resolve()
        resolved = true
      })
      this.socket.on('connect_error', (err) => {
        debug(`Received 'connect_error' event, err: ${err}`)
        if (resolved) return
        reject(new Error(`Connection to ${this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTURL]} failed: ${err.message}`))
        resolved = true
      })
    })
  }

  async UserSays (msg) {
    debug('UserSays called')
    const args = {
    }
    if (this.caps[Capabilities.SIMPLESOCKETIO_SENDTEXT_FIELD]) {
      _.set(args, this.caps[Capabilities.SIMPLESOCKETIO_SENDTEXT_FIELD], msg.messageText)
    }
    if (this.caps[Capabilities.SIMPLESOCKETIO_SENDMEDIA_FIELD]) {
      if (msg.media && msg.media.length > 0) {
        const media = msg.media[0]
        if (!media.buffer) {
          return Promise.reject(new Error(`Media attachment ${media.mediaUri} not downloaded`))
        }
        _.set(args, this.caps[Capabilities.SIMPLESOCKETIO_SENDMEDIA_FIELD], `data:${media.mimeType};base64,${media.buffer.toString('base64')}`)

        if (!msg.attachments) {
          msg.attachments = []
        }
        msg.attachments.push({
          name: media.mediaUri,
          mimeType: media.mimeType,
          base64: media.buffer.toString('base64')
        })
      }
    }

    msg.sourceData = {
      event: this.caps[Capabilities.SIMPLESOCKETIO_EVENT_USERSAYS],
      args
    }

    this.socket.emit(this.caps[Capabilities.SIMPLESOCKETIO_EVENT_USERSAYS], args)
  }

  async Stop () {
    debug('Stop called')
    await this._closeSocket()
  }

  async Clean () {
    debug('Clean called')
    await this._closeSocket()
  }

  async _closeSocket () {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }
}

module.exports = BotiumConnectorSimpleSocketIO
