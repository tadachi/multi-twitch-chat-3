import React, { Component } from 'react'
import './App.css'
import tmi from 'tmi.js'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

// Components
import ChannelManager from './components/ChannelManager'
import Clock from './components/Clock'
import Chat from './components/Chat'
import ColorPickerGrid from './components/ColorPickerGrid'

import EventEmitter from 'wolfy87-eventemitter'
import moment from 'moment'

const oauth = 'ntzeiqkoi1nubmv2f4kxlieu27z7mb'
// const client_id = 'gpa5zi9y5d70q9b2lcpcwvikp7mek0'

// tmi.js client
let options = {
  options: {
    debug: false
  },
  connection: {
    reconnect: true
  },
  identity: {
    username: 'tak_ada',
    password: 'oauth:ntzeiqkoi1nubmv2f4kxlieu27z7mb'
  },
}

let client = new tmi.client(options)

client.connect()

client.on("connected", function (address, port) {
  console.log(address + ':' + port)
});

client.on("disconnected", (reason) => {
  console.log(`disconnected from server. Reason: ${reason}`)
});

// Multi-twitch-chat 3 event system (mtc)

let MultiTwitchChatEE = new EventEmitter()

function updateStreamersByCacheEvent() {
  console.log(`[${moment().format('h:mm:ss A')}] Updated streamers list by cache.`);
}

function updateStreamersEvent() {
  console.log(`[${moment().format('h:mm:ss A')}] Updated streamers by network.`);
}

MultiTwitchChatEE.addListener('updateStreamersByCacheEvent', updateStreamersByCacheEvent);
MultiTwitchChatEE.addListener('updateStreamersByNetworkEvent', updateStreamersEvent);

/*
updateStreamersByCacheEvent
updateStreamersByNetworkEvent
joinChannelEvent
leaveChannelEvent
*/

class App extends Component {

  render() {
    return (
      <div className="App">
        <Clock />
        <MuiThemeProvider>
          <ChannelManager client={client} oauth={oauth} mtcEE={MultiTwitchChatEE} />
        </MuiThemeProvider>
        <MuiThemeProvider>
          <Chat client={client} mtcEE={MultiTwitchChatEE}/>
        </MuiThemeProvider>
        <ColorPickerGrid>
        </ColorPickerGrid>
      </div>
    )
  }
}


export default App;