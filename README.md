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

### SIMPLESOCKETIO_ENDPOINTURL
Socket.io Host Url

### SIMPLESOCKETIO_ENDPOINTPATH
Socket.io Endpoint Path - Default /socket.io

### SIMPLESOCKETIO_EVENT_USERSAYS
#me Event Name

### SIMPLESOCKETIO_SENDTEXT_FIELD
Payload Field for Text Input

### SIMPLESOCKETIO_SENDMEDIA_FIELD
Payload Field for Attachments Input

### SIMPLESOCKETIO_EVENT_BOTSAYS
#bot Event Name

### SIMPLESOCKETIO_RECEIVETEXT_FIELD
Payload Field for Text Response

### SIMPLESOCKETIO_RECEIVEATTACHMENT_FIELD
Payload Field for Attachments Response