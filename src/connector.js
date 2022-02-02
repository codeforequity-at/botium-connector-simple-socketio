const debug = require('debug')('botium-connector-simple-socketio')
const _ = require('lodash')
const { v4: uuidv4 } = require('uuid')
const jp = require('jsonpath')
const mime = require('mime-types')
const io = require('socket.io-client')
const util = require('util')
const { getHook, executeHook } = require('botium-core').HookUtils

const Capabilities = {
  SIMPLESOCKETIO_ENDPOINTURL: 'SIMPLESOCKETIO_ENDPOINTURL',
  SIMPLESOCKETIO_ENDPOINTPATH: 'SIMPLESOCKETIO_ENDPOINTPATH',
  SIMPLESOCKETIO_AUTH_TOKEN: 'SIMPLESOCKETIO_AUTH_TOKEN',
  SIMPLESOCKETIO_EMIT_SESSION_REQUEST_EVENT: 'SIMPLESOCKETIO_EMIT_SESSION_REQUEST_EVENT',
  SIMPLESOCKETIO_EVENT_USERSAYS: 'SIMPLESOCKETIO_EVENT_USERSAYS',
  SIMPLESOCKETIO_EVENT_BOTSAYS: 'SIMPLESOCKETIO_EVENT_BOTSAYS',
  SIMPLESOCKETIO_SENDTEXT_FIELD: 'SIMPLESOCKETIO_SENDTEXT_FIELD',
  SIMPLESOCKETIO_SENDMEDIA_FIELD: 'SIMPLESOCKETIO_SENDMEDIA_FIELD',
  SIMPLESOCKETIO_SENDBUTTON_FIELD: 'SIMPLESOCKETIO_SENDBUTTON_FIELD',
  SIMPLESOCKETIO_RECEIVETEXT_JSONPATH: 'SIMPLESOCKETIO_RECEIVETEXT_JSONPATH',
  SIMPLESOCKETIO_RECEIVEATTACHMENTS_JSONPATH: 'SIMPLESOCKETIO_RECEIVEATTACHMENTS_JSONPATH',
  SIMPLESOCKETIO_RECEIVEBUTTONS_JSONPATH: 'SIMPLESOCKETIO_RECEIVEBUTTONS_JSONPATH',
  SIMPLESOCKETIO_START_HOOK: 'SIMPLESOCKETIO_START_HOOK',
  SIMPLESOCKETIO_SESSION_REQUEST_HOOK: 'SIMPLESOCKETIO_SESSION_REQUEST_HOOK',
  SIMPLESOCKETIO_USERSAYS_EVENT_HOOK: 'SIMPLESOCKETIO_USERSAYS_EVENT_HOOK',
  SIMPLESOCKETIO_BOTSAYS_EVENT_HOOK: 'SIMPLESOCKETIO_BOTSAYS_EVENT_HOOK',
  SIMPLESOCKETIO_STOP_HOOK: 'SIMPLESOCKETIO_STOP_HOOK'

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

    this.startHook = getHook(this.caps, this.caps[Capabilities.SIMPLESOCKETIO_START_HOOK])
    this.sessionRequestHook = getHook(this.caps, this.caps[Capabilities.SIMPLESOCKETIO_SESSION_REQUEST_HOOK])
    this.requestHook = getHook(this.caps, this.caps[Capabilities.SIMPLESOCKETIO_USERSAYS_EVENT_HOOK])
    this.responseHook = getHook(this.caps, this.caps[Capabilities.SIMPLESOCKETIO_BOTSAYS_EVENT_HOOK])
    this.stopHook = getHook(this.caps, this.caps[Capabilities.SIMPLESOCKETIO_STOP_HOOK])
  }

  async Build () {
    debug('Build called')
    this.socketOptions = {
      forceNew: true
    }
    if (this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTPATH]) {
      this.socketOptions.path = this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTPATH]
    }
    if (this.caps[Capabilities.SIMPLESOCKETIO_AUTH_TOKEN]) {
      this.socketOptions.auth = {
        token: this.caps[Capabilities.SIMPLESOCKETIO_AUTH_TOKEN]
      }
    }
  }

  async Start () {
    debug('Start called')
    this.view = {
      container: this,
      context: {},
      botium: {
        conversationId: uuidv4().replace(/-/g, ''),
        stepId: null
      }
    }

    await executeHook(this.caps, this.startHook, Object.assign({ socketOptions: this.socketOptions }, this.view))

    this.socket = io(this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTURL], this.socketOptions)
    this.socket.on('disconnect', (reason) => {
      debug(`Received 'disconnect' event, reason: ${reason}`)
    })
    this.socket.on(this.caps[Capabilities.SIMPLESOCKETIO_EVENT_BOTSAYS], async (message) => {
      const buttons = []
      const media = []

      if (this.caps[Capabilities.SIMPLESOCKETIO_RECEIVEATTACHMENTS_JSONPATH]) {
        const responseMedia = jp.query(message, this.caps[Capabilities.SIMPLESOCKETIO_RECEIVEATTACHMENTS_JSONPATH])
        if (responseMedia) {
          (_.isArray(responseMedia) ? _.flattenDeep(responseMedia) : [responseMedia]).forEach(m => {
            if (m && _.isString(m)) {
              media.push({
                mediaUri: m,
                mimeType: mime.lookup(m) || 'application/unknown'
              })
            }
          })
          debug(`found response media: ${util.inspect(media)}`)
        }
      }

      if (this.caps[Capabilities.SIMPLESOCKETIO_RECEIVEBUTTONS_JSONPATH]) {
        const responseButtons = jp.query(message, this.caps[Capabilities.SIMPLESOCKETIO_RECEIVEBUTTONS_JSONPATH])
        if (responseButtons) {
          (_.isArray(responseButtons) ? _.flattenDeep(responseButtons) : [responseButtons]).forEach(b =>
            buttons.push({
              text: b
            })
          )
          debug(`found response buttons: ${util.inspect(buttons)}`)
        }
      }

      const botMessages = []
      let hasMessageText = false
      if (this.caps[Capabilities.SIMPLESOCKETIO_RECEIVETEXT_JSONPATH]) {
        const responseTexts = jp.query(message, this.caps[Capabilities.SIMPLESOCKETIO_RECEIVETEXT_JSONPATH])
        const messageTexts = (_.isArray(responseTexts) ? _.flattenDeep(responseTexts) : [responseTexts])
        for (const [messageTextIndex, messageText] of messageTexts.entries()) {
          if (!messageText) continue

          hasMessageText = true
          const botMsg = { sourceData: message, messageText, media, buttons }
          await executeHook(this.caps, this.responseHook, Object.assign({ botMsg, messageTextIndex }, this.view))
          botMessages.push(botMsg)
        }
      }

      if (!hasMessageText) {
        const botMsg = { messageText: '', sourceData: message, media, buttons }
        const beforeHookKeys = Object.keys(botMsg)
        await executeHook(this.caps, this.responseHook, Object.assign({ botMsg }, this.view))
        const afterHookKeys = Object.keys(botMsg)
        if (beforeHookKeys.length !== afterHookKeys.length || !!(botMsg.messageText && botMsg.messageText.length > 0) || botMsg.media.length > 0 || botMsg.buttons.length > 0) {
          botMessages.push(botMsg)
        }
      }

      for (const botMsg of botMessages) {
        this.queueBotSays(botMsg)
      }
    })

    return new Promise((resolve, reject) => {
      let resolved = false
      this.socket.on('connect', async () => {
        debug('Received \'connect\' event')
        if (this.caps[Capabilities.SIMPLESOCKETIO_EMIT_SESSION_REQUEST_EVENT]) {
          const sessionRequestData = {}
          await executeHook(this.caps, this.sessionRequestHook, Object.assign({ sessionRequestData }, this.view))
          this.socket.emit(this.caps[Capabilities.SIMPLESOCKETIO_EMIT_SESSION_REQUEST_EVENT], (sessionRequestData))

          this.socket.on('session_confirm', (remoteId) => {
            debug(`session_confirm:${this.socket.id} session_id:${remoteId}`)
            this.view.context.remoteId = remoteId
            if (resolved) return
            resolve()
            resolved = true
          })
        } else {
          if (resolved) return
          resolve()
          resolved = true
        }
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
    this.view.botium.stepId = uuidv4()
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
    if (this.caps[Capabilities.SIMPLESOCKETIO_SENDBUTTON_FIELD]) {
      if (msg.buttons && msg.buttons.length > 0) {
        _.set(args, this.caps[Capabilities.SIMPLESOCKETIO_SENDBUTTON_FIELD], msg.buttons[0].payload || msg.buttons[0].text)
      }
    }

    msg.sourceData = {
      event: this.caps[Capabilities.SIMPLESOCKETIO_EVENT_USERSAYS],
      args
    }

    await executeHook(this.caps, this.requestHook, Object.assign({ socketArgs: args, msg }, this.view))
    this.socket.emit(this.caps[Capabilities.SIMPLESOCKETIO_EVENT_USERSAYS], args)
  }

  async Stop () {
    debug('Stop called')
    await executeHook(this.caps, this.stopHook, Object.assign({ socket: this.socket }, this.view))
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
