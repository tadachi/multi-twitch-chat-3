import React, { Component } from 'react'
import './App.css'
import tmi from 'tmi.js'
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';

// Components
import TopAppBar from './components/TopAppBar'
import AppDrawer from './components/AppDrawer'
import ChannelManager from './components/AppDrawerComponents/ChannelManager'
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

function updateStreamersNetworkEvent() {
  console.log(`[${moment().format('h:mm:ss A')}] Updated streamers by network.`);
}

MultiTwitchChatEE.addListener('updateStreamersByCacheEvent', updateStreamersByCacheEvent);
MultiTwitchChatEE.addListener('updateStreamersByNetworkEvent', updateStreamersNetworkEvent);

/*
updateStreamersByCacheEvent
updateStreamersByNetworkEvent
joinChannelEvent
leaveChannelEvent
*/

const drawerWidth = 200

let drawer = {
  width: drawerWidth,
  backgroundColor: 'black',
  overflowY: 'scroll',
  overflowX: 'hidden',
}

const expanded = {
  left: `${drawerWidth + 2}px`,
  // paddingLeft: '255px'
}

const theme = createMuiTheme({
  palette: {
    type: 'dark', // Switching the dark mode on is a single property value change.
  },
});

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      drawerOpen: true
    }
  }

  handleDrawerOpen() {
    this.setState({ drawerOpen: !this.state.drawerOpen });
  }

  render() {
    const onExpanded = this.state.drawerOpen === true ? expanded : ''

    return (
      <MuiThemeProvider theme={theme}>
        <div id={'container'} >
          <AppDrawer style={drawer} open={this.state.drawerOpen}>
            <ChannelManager client={client} oauth={oauth} mtcEE={MultiTwitchChatEE} />
          </AppDrawer>
          <Chat style={{ ...onExpanded }} client={client} mtcEE={MultiTwitchChatEE} drawerWidth={drawerWidth} />
        </div>
      </MuiThemeProvider>
    )
  }
}

export default App;