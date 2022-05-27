const debug = require('debug')('botium-connector-simple-socketio')
const _ = require('lodash')
const { v4: uuidv4 } = require('uuid')
const jp = require('jsonpath')
const mime = require('mime-types')
const io2 = require('socket.io-client2')
const io3 = require('socket.io-client3')
const io4 = require('socket.io-client4')
const util = require('util')
const { getHook, executeHook } = require('botium-core').HookUtils

const Capabilities = {
  SIMPLESOCKETIO_SERVER_MAJOR_VERSION: 'SIMPLESOCKETIO_SERVER_MAJOR_VERSION',
  SIMPLESOCKETIO_CLIENT_OPTIONS: 'SIMPLESOCKETIO_CLIENT_OPTIONS',
  SIMPLESOCKETIO_ENDPOINTURL: 'SIMPLESOCKETIO_ENDPOINTURL',
  SIMPLESOCKETIO_ENDPOINTPATH: 'SIMPLESOCKETIO_ENDPOINTPATH',
  SIMPLESOCKETIO_EMIT_SESSION_REQUEST_EVENT: 'SIMPLESOCKETIO_EMIT_SESSION_REQUEST_EVENT',
  SIMPLESOCKETIO_EVENT_USERSAYS: 'SIMPLESOCKETIO_EVENT_USERSAYS',
  SIMPLESOCKETIO_EVENT_BOTSAYS: 'SIMPLESOCKETIO_EVENT_BOTSAYS',
  SIMPLESOCKETIO_SENDTEXT_FIELD: 'SIMPLESOCKETIO_SENDTEXT_FIELD',
  SIMPLESOCKETIO_SENDMEDIA_FIELD: 'SIMPLESOCKETIO_SENDMEDIA_FIELD',
  SIMPLESOCKETIO_SENDBUTTON_FIELD: 'SIMPLESOCKETIO_SENDBUTTON_FIELD',
  SIMPLESOCKETIO_RECEIVETEXT_JSONPATH: 'SIMPLESOCKETIO_RECEIVETEXT_JSONPATH',
  SIMPLESOCKETIO_RECEIVEATTACHMENTS_JSONPATH: 'SIMPLESOCKETIO_RECEIVEATTACHMENTS_JSONPATH',
  SIMPLESOCKETIO_RECEIVEBUTTONS_JSONPATH: 'SIMPLESOCKETIO_RECEIVEBUTTONS_JSONPATH',
  SIMPLESOCKETIO_RECEIVECARDS_JSONPATH: 'SIMPLESOCKETIO_RECEIVECARDS_JSONPATH',
  SIMPLESOCKETIO_RECEIVECARD_CARD_TEXT_JSONPATH: 'SIMPLESOCKETIO_RECEIVECARD_CARD_TEXT_JSONPATH',
  SIMPLESOCKETIO_RECEIVECARD_CARD_SUBTEXT_JSONPATH: 'SIMPLESOCKETIO_RECEIVECARD_CARD_SUBTEXT_JSONPATH',
  SIMPLESOCKETIO_RECEIVECARD_CARD_BUTTONS_JSONPATH: 'SIMPLESOCKETIO_RECEIVECARD_CARD_BUTTONS_JSONPATH',
  SIMPLESOCKETIO_RECEIVECARD_CARD_ATTACHMENTS_JSONPATH: 'SIMPLESOCKETIO_RECEIVECARD_CARD_ATTACHMENTS_JSONPATH',
  SIMPLESOCKETIO_START_HOOK: 'SIMPLESOCKETIO_START_HOOK',
  SIMPLESOCKETIO_SESSION_REQUEST_HOOK: 'SIMPLESOCKETIO_SESSION_REQUEST_HOOK',
  SIMPLESOCKETIO_USERSAYS_EVENT_HOOK: 'SIMPLESOCKETIO_USERSAYS_EVENT_HOOK',
  SIMPLESOCKETIO_BOTSAYS_EVENT_HOOK: 'SIMPLESOCKETIO_BOTSAYS_EVENT_HOOK',
  SIMPLESOCKETIO_STOP_HOOK: 'SIMPLESOCKETIO_STOP_HOOK',
  SIMPLESOCKETIO_COOKIE_AUTOFILL: 'SIMPLESOCKETIO_COOKIE_AUTOFILL'
}

const Defaults = {
  [Capabilities.SIMPLESOCKETIO_SERVER_MAJOR_VERSION]: '2',
  [Capabilities.SIMPLESOCKETIO_COOKIE_AUTOFILL]: true
}

class BotiumConnectorSimpleSocketIO {
  constructor ({ queueBotSays, caps }) {
    this.queueBotSays = queueBotSays
    this.caps = caps
    this.connectorSessionId = null
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
    this.socketOptions = {}
    if (this.caps[Capabilities.SIMPLESOCKETIO_CLIENT_OPTIONS]) {
      this.socketOptions = Object.assign({}, this.socketOptions, this.caps[Capabilities.SIMPLESOCKETIO_CLIENT_OPTIONS])
    }

    if (this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTPATH]) {
      this.socketOptions.path = this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTPATH]
    }
  }

  async Start () {
    debug('Start called')
    if (this.connectorSessionId != null) {
      throw new Error(`The previous connector session (${this.connectorSessionId}) is not stopped and clean yet.`)
    }
    this.connectorSessionId = uuidv4()
    debug(`Start called, (connector session id generated: ${this.connectorSessionId})`)
    this.view = {
      container: this,
      context: {},
      botium: {
        conversationId: uuidv4().replace(/-/g, ''),
        stepId: null
      }
    }

    await executeHook(this.caps, this.startHook, Object.assign({ socketOptions: this.socketOptions }, this.view))

    if (this.caps[Capabilities.SIMPLESOCKETIO_SERVER_MAJOR_VERSION] === '2') {
      this.socket = io2(this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTURL], this.socketOptions)
    } else if (this.caps[Capabilities.SIMPLESOCKETIO_SERVER_MAJOR_VERSION] === '3') {
      this.socket = io3(this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTURL], this.socketOptions)
    } else if (this.caps[Capabilities.SIMPLESOCKETIO_SERVER_MAJOR_VERSION] === '4') {
      this.socket = io4(this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTURL], this.socketOptions)
    } else {
      throw new Error('SIMPLESOCKETIO_SERVER_MAJOR_VERSION capability is wrong or not defined')
    }

    this.socket.on('disconnect', (reason) => {
      this._debug(`Received 'disconnect' event, reason: ${reason}`)
    })
    this.socket.on(this.caps[Capabilities.SIMPLESOCKETIO_EVENT_BOTSAYS], async (message) => {
      this._debug(`Bot response, (sessionId: ${_.get(this, 'view.context.remoteId')})`)
      const buttons = []
      const media = []
      const cards = []

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
          this._debug(`found response media: ${util.inspect(media)}`)
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
          this._debug(`found response buttons: ${util.inspect(buttons)}`)
        }
      }

      if (this.caps[Capabilities.SIMPLESOCKETIO_RECEIVECARDS_JSONPATH]) {
        const _getText = (responseCardText) => {
          if (responseCardText) {
            const texts = _.isArray(responseCardText) ? _.flattenDeep(responseCardText) : [responseCardText]
            if (texts.length > 1) {
              this._debug(`more than one text found for card: ${util.inspect(texts)}`)
            }
            if (texts.length > 0) {
              return texts[0]
            }
          }
        }

        const responseCards = jp.query(message, this.caps[Capabilities.SIMPLESOCKETIO_RECEIVECARDS_JSONPATH])
        if (responseCards) {
          (_.isArray(responseCards) ? _.flattenDeep(responseCards) : [responseCards]).forEach(c => {
            const card = { }
            if (this.caps[Capabilities.SIMPLESOCKETIO_RECEIVECARD_CARD_TEXT_JSONPATH]) {
              card.text = _getText(jp.query(c, this.caps[Capabilities.SIMPLESOCKETIO_RECEIVECARD_CARD_TEXT_JSONPATH]))
            }
            if (this.caps[Capabilities.SIMPLESOCKETIO_RECEIVECARD_CARD_SUBTEXT_JSONPATH]) {
              card.subtext = _getText(jp.query(c, this.caps[Capabilities.SIMPLESOCKETIO_RECEIVECARD_CARD_SUBTEXT_JSONPATH]))
            }

            if (this.caps[Capabilities.SIMPLESOCKETIO_RECEIVECARD_CARD_BUTTONS_JSONPATH]) {
              const cardButtons = []
              const responseCardButtons = jp.query(c, this.caps[Capabilities.SIMPLESOCKETIO_RECEIVECARD_CARD_BUTTONS_JSONPATH])
              if (responseCardButtons) {
                (_.isArray(responseCardButtons) ? _.flattenDeep(responseCardButtons) : [responseCardButtons]).forEach(b =>
                  cardButtons.push({
                    text: b
                  })
                )
              }
              if (cardButtons.length > 0) {
                card.buttons = [...cardButtons]
              }
            }

            if (this.caps[Capabilities.SIMPLESOCKETIO_RECEIVECARD_CARD_ATTACHMENTS_JSONPATH]) {
              const cardMedia = []
              const responseCardAttachment = jp.query(c, this.caps[Capabilities.SIMPLESOCKETIO_RECEIVECARD_CARD_ATTACHMENTS_JSONPATH])
              if (responseCardAttachment) {
                (_.isArray(responseCardAttachment) ? _.flattenDeep(responseCardAttachment) : [responseCardAttachment]).forEach(m => {
                  if (m && _.isString(m)) {
                    cardMedia.push({
                      mediaUri: m,
                      mimeType: mime.lookup(m) || 'application/unknown'
                    })
                  }
                })
              }
              if (cardMedia.length > 0) {
                card.media = [...cardMedia]
              }
            }

            if (_.keys(card).length > 0) {
              cards.push(card)
            }
          })
          this._debug(`found response cards: ${util.inspect(cards)}`)
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
          const botMsg = { sourceData: message, messageText, media, buttons, cards }
          await executeHook(this.caps, this.responseHook, Object.assign({ botMsg, messageTextIndex }, this.view))
          botMessages.push(botMsg)
        }
      }

      if (!hasMessageText) {
        const botMsg = { messageText: '', sourceData: message, media, buttons, cards }
        const beforeHookKeys = Object.keys(botMsg)
        await executeHook(this.caps, this.responseHook, Object.assign({ botMsg }, this.view))
        const afterHookKeys = Object.keys(botMsg)
        if (beforeHookKeys.length !== afterHookKeys.length || !!(botMsg.messageText && botMsg.messageText.length > 0) || botMsg.media.length > 0 || botMsg.buttons.length > 0 || botMsg.cards.length > 0) {
          botMessages.push(botMsg)
        }
      }

      for (const botMsg of botMessages) {
        this.queueBotSays(botMsg)
      }
    })

    const startPromises = []
    if (this.caps[Capabilities.SIMPLESOCKETIO_COOKIE_AUTOFILL]) {
      startPromises.push(
        new Promise((resolve) => {
          let resolved = false
          let counter = 0
          this.socket.io.on('open', () => {
            this._debug('Received \'open\' event')
            this.socket.io.engine.transport.on('pollComplete', () => {
              if (resolved) {
                return
              }
              this._debug('Received \'pollComplete\' event')
              counter++
              if (counter >= 3) {
                this._debug('Failed to find cookies during \'pollComplete\' event')
                resolve()
              }
              const request = this.socket.io.engine.transport.pollXhr.xhr
              const cookieHeader = request.getResponseHeader('set-cookie')
              if (!cookieHeader) {
                return
              }
              let cookie = _.get(this.socket.io.opts, 'extraHeaders.cookie')
              cookieHeader.forEach(cookieString => {
                cookie = cookie ? `${cookie}; ${cookieString}` : cookieString
              })
              this._debug(`Cookies after 'pollComplete': ${cookie}`)
              this.socket.io.opts.extraHeaders = {
                cookie: cookie
              }
              resolve()
              resolved = true
            })
          })
        })
      )
    }

    startPromises.push(
      new Promise((resolve, reject) => {
        let resolved = false
        this.socket.on('connect', async () => {
          this._debug('Received \'connect\' event')
          if (this.caps[Capabilities.SIMPLESOCKETIO_EMIT_SESSION_REQUEST_EVENT]) {
            const sessionRequestData = {}
            await executeHook(this.caps, this.sessionRequestHook, Object.assign({ sessionRequestData }, this.view))
            this.socket.emit(this.caps[Capabilities.SIMPLESOCKETIO_EMIT_SESSION_REQUEST_EVENT], (sessionRequestData))

            this.socket.on('session_confirm', (remoteId) => {
              this._debug(`session_confirm:${this.socket.id} session_id:${remoteId}`)
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
          this._debug(`Received 'connect_error' event, err: ${err}`)
          if (resolved) return
          reject(new Error(`Connection to ${this.caps[Capabilities.SIMPLESOCKETIO_ENDPOINTURL]} failed: ${err.message}`))
          resolved = true
        })
      })
    )

    return Promise.all(startPromises)
  }

  async UserSays (msg) {
    this._debug(`UserSays called (sessionId: ${_.get(this, 'view.context.remoteId')})`)
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
    this._debug(`User request body: ${util.inspect(args, false, null, true)}`)
    this.socket.emit(this.caps[Capabilities.SIMPLESOCKETIO_EVENT_USERSAYS], args)
  }

  async Stop () {
    this._debug(`Stop called (sessionId: ${_.get(this, 'view.context.remoteId')})`)
    await executeHook(this.caps, this.stopHook, Object.assign({ socket: this.socket }, this.view))
    await this._closeSocket()
  }

  async Clean () {
    this._debug(`Clean called (sessionId: ${_.get(this, 'view.context.remoteId')})`)
    this.connectorSessionId = null
    await this._closeSocket()
  }

  async _closeSocket () {
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  _debug (message) {
    debug(`${this.connectorSessionId}: ${message}`)
  }
}

module.exports = BotiumConnectorSimpleSocketIO
