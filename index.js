const fs = require('fs')
const path = require('path')
const BotiumConnectorSimpleSocketIOClass = require('./src/connector')

const logo = fs.readFileSync(path.join(__dirname, 'logo.png')).toString('base64')

module.exports = {
  PluginVersion: 1,
  PluginClass: BotiumConnectorSimpleSocketIOClass,
  PluginDesc: {
    name: 'Generic Socket.io Interface',
    avatar: logo,
    provider: 'Botium',
    features: {
      sendAttachments: true,
      audioInput: true
    },
    capabilities: [
      {
        name: 'SIMPLESOCKETIO_SERVER_MAJOR_VERSION',
        label: 'Socket.io major version',
        description: 'The major version of socket.io server package on the bot side.',
        type: 'choice',
        required: true,
        choices: [
          {
            key: '2',
            name: 'v2'
          },
          {
            key: '3',
            name: 'v3'
          },
          {
            key: '4',
            name: 'v4'
          }
        ]
      },
      {
        name: 'SIMPLESOCKETIO_ENDPOINTURL',
        label: 'Socket.io Host Url',
        type: 'url',
        required: true
      },
      {
        name: 'SIMPLESOCKETIO_ENDPOINTPATH',
        label: 'Socket.io Endpoint Path',
        description: 'Default /socket.io',
        type: 'string',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_CLIENT_OPTIONS',
        label: 'Socket.io client-options',
        type: 'json',
        description: 'Define a client-option json object according to socket.io client-options documentation',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_EVENT_USERSAYS',
        label: '#me Event Name',
        type: 'string',
        required: true
      },
      {
        name: 'SIMPLESOCKETIO_SENDTEXT_FIELD',
        label: 'Payload Field for Text Input',
        type: 'string',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_SENDMEDIA_FIELD',
        label: 'Payload Field for Attachment Input',
        type: 'string',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_SENDBUTTON_FIELD',
        label: 'Payload Field for Button Input',
        type: 'string',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_EVENT_BOTSAYS',
        label: '#bot Event Name',
        type: 'string',
        required: true
      },
      {
        name: 'SIMPLESOCKETIO_RECEIVETEXT_JSONPATH',
        label: 'JSON-Path for text response',
        type: 'string',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_RECEIVEATTACHMENTS_JSONPATH',
        label: 'JSON-Path for media attachments',
        helper: 'Should return string or array of strings',
        type: 'string',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_RECEIVEBUTTONS_JSONPATH',
        label: 'JSON-Path for Quick-Reply Recognition',
        helper: 'Should return string or array of strings',
        type: 'string',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_START_HOOK',
        label: 'Start hook',
        helper: 'Start Hook',
        type: 'string',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_SESSION_REQUEST_HOOK',
        label: 'Session request hook',
        helper: 'Session request hook',
        type: 'string',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_USERSAYS_EVENT_HOOK',
        label: 'JSON-Path for Quick-Reply Recognition',
        helper: 'User says event Hook',
        type: 'string',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_BOTSAYS_EVENT_HOOK',
        label: 'JSON-Path for Quick-Reply Recognition',
        helper: 'Bot says event Hook',
        type: 'string',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_STOP_HOOK',
        label: 'JSON-Path for Quick-Reply Recognition',
        helper: 'Stop Hook',
        type: 'string',
        required: false
      }
    ]
  }
}
