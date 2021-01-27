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
        label: 'Payload Field for Attachments Input',
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
        name: 'SIMPLESOCKETIO_RECEIVETEXT_FIELD',
        label: 'Payload Field for Text Response',
        type: 'string',
        required: false
      },
      {
        name: 'SIMPLESOCKETIO_RECEIVEATTACHMENT_FIELD',
        label: 'Payload Field for Attachments Response',
        type: 'string',
        required: false
      }
    ]
  }
}
