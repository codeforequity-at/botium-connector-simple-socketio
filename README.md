# Botium Connector for Socket.io Interface

[![NPM](https://nodei.co/npm/botium-connector-simple-socketio.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/botium-connector-simple-socketio/)

[![Codeship Status for codeforequity-at/botium-connector-simple-socketio](https://app.codeship.com/projects/6f06f496-45d9-4caf-bce5-c9e24cbd80e6/status?branch=master)](https://app.codeship.com/projects/425011)
[![npm version](https://badge.fury.io/js/botium-connector-simple-socketio.svg)](https://badge.fury.io/js/botium-connector-simple-socketio)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)]()


This is a [Botium](https://www.botium.ai) connector for testing your [Socket.io](https://socket.io/) chatbot interface.

__Did you read the [Botium in a Nutshell](https://medium.com/@floriantreml/botium-in-a-nutshell-part-1-overview-f8d0ceaf8fb4) articles? Be warned, without prior knowledge of Botium you won't be able to properly use this library!__

## How it works
Botium connects to the API of your Socket.io chatbot interface.

It can be used as any other Botium connector with all Botium Stack components:
* [Botium CLI](https://github.com/codeforequity-at/botium-cli/)
* [Botium Bindings](https://github.com/codeforequity-at/botium-bindings/)
* [Botium Box](https://www.botium.at)

## Requirements
* **Node.js and NPM**
* a **Socket.io interface**
* a **project directory** on your workstation to hold test cases and Botium configuration

## Install Botium and Socket.io-Connector

When using __Botium CLI__:

```
> npm install -g botium-cli
> npm install -g botium-connector-simple-socketio
> botium-cli init
> botium-cli run
```

When using __Botium Bindings__:

```
> npm install -g botium-bindings
> npm install -g botium-connector-simple-socketio
> botium-bindings init mocha
> npm install && npm run mocha
```

When using __Botium Box__:

_Already integrated into Botium Box, no setup required_

## Connecting Socket.io chatbot interface to Botium

Process is very simple, you have to know just the endpoint URL for your chatbot.
  
Create a botium.json with this URL in your project directory: 

```
{
  "botium": {
    "Capabilities": {
      "PROJECTNAME": "<whatever>",
      "CONTAINERMODE": "simple-socketio",
      "SIMPLESOCKETIO_ENDPOINTURL": "..."
    }
  }
}
```

Botium setup is ready, you can begin to write your [BotiumScript](https://botium-docs.readthedocs.io/) files.

## Supported Capabilities

Set the capability __CONTAINERMODE__ to __simple-socketio__ to activate this connector.

### SIMPLESOCKETIO_SERVER_MAJOR_VERSION
The major version of socket.io server package on the bot side

### SIMPLESOCKETIO_ENDPOINTURL
Socket.io Host Url

### SIMPLESOCKETIO_ENDPOINTPATH
Socket.io Endpoint Path - Default /socket.io

### SIMPLESOCKETIO_CLIENT_OPTIONS
Socket.io client options in json form according to their [documentation](https://socket.io/docs/v4/client-options/)

### SIMPLESOCKETIO_USE_WEBSOCKET_TRANSPORT
The default and the recommended value is true. When it's true than in the client options the websocket transport will be used:
`{transports: ['websocket']}`. We recommend to use websocket transport, because with long http polling, we had a fragile connection 
and it causes troubles in case of sticky session.

### SIMPLESOCKETIO_EMIT_SESSION_REQUEST_EVENT
This event is emitted in connect to receive a remoteId in 'session_confirm' event

### SIMPLESOCKETIO_SESSION_REQUEST_HOOK
Javascript commands which executed before emitting SIMPLESOCKETIO_EMIT_SESSION_REQUEST_EVENT. Global variables available: socketOptions, container, context, botium

### SIMPLESOCKETIO_COOKIE_AUTOFILL
When it's true in pollComplete event the cookies from the server are replicated in the extraHeaders property of client options

### SIMPLESOCKETIO_START_HOOK
Javascript commands which executed at the beginning of start function. Global variables available: socketOptions, container, context, botium

### SIMPLESOCKETIO_STOP_HOOK
Javascript commands which executed at the beginning of stop function. Global variables available: socketOptions, container, context, botium

### SIMPLESOCKETIO_USERSAYS_EVENT_HOOK
Javascript commands which executed before emitting SIMPLESOCKETIO_EVENT_USERSAYS. Global variables available: socketOptions, container, context, botium

### SIMPLESOCKETIO_BOTSAYS_EVENT_HOOK
Javascript commands which executed at the end of SIMPLESOCKETIO_EVENT_BOTSAYS function. Global variables available: socketOptions, container, context, botium

### SIMPLESOCKETIO_EVENT_USERSAYS
#me Event Name

### SIMPLESOCKETIO_SENDTEXT_FIELD
Payload Field for Text Input

### SIMPLESOCKETIO_SENDMEDIA_FIELD
Payload Field for Attachments Input

### SIMPLESOCKETIO_SENDBUTTON_FIELD
Payload Field for Button Input

### SIMPLESOCKETIO_EVENT_BOTSAYS
#bot Event Name

### SIMPLESOCKETIO_RECEIVETEXT_JSONPATH
[JSONPath expression](https://github.com/dchester/jsonpath) to extract Text Response

### SIMPLESOCKETIO_RECEIVEATTACHMENTS_JSONPATH
[JSONPath expression](https://github.com/dchester/jsonpath) to extract Attachments Response

### SIMPLESOCKETIO_RECEIVEBUTTONS_JSONPATH
[JSONPath expression](https://github.com/dchester/jsonpath) to extract Buttons Response

### SIMPLESOCKETIO_RECEIVECARDS_JSONPATH
[JSONPath expression](https://github.com/dchester/jsonpath) to extract Cards response

### SIMPLESOCKETIO_RECEIVECARD_CARD_TEXT_JSONPATH
[JSONPath expression](https://github.com/dchester/jsonpath) to extract Cards Text response

### SIMPLESOCKETIO_RECEIVECARD_CARD_SUBTEXT_JSONPATH
[JSONPath expression](https://github.com/dchester/jsonpath) to extract Cards Subtext response

### SIMPLESOCKETIO_RECEIVECARD_CARD_BUTTONS_JSONPATH
[JSONPath expression](https://github.com/dchester/jsonpath) to extract Cards Buttons response

### SIMPLESOCKETIO_RECEIVECARD_CARD_ATTACHMENTS_JSONPATH
[JSONPath expression](https://github.com/dchester/jsonpath) to extract Cards Attachments response


