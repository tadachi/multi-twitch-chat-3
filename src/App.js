import React, { Component } from 'react'
import './App.css'
import tmi from 'tmi.js'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

// Components
import ChannelManager from './components/ChannelManager'
import Clock from './components/Clock'
import Chat from './components/Chat'

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
  }
}

let client = new tmi.client(options)

client.connect()

client.on("connected", function (address, port) {
  console.log(address + ':' + port)
});

// App.js
class App extends Component {

  render() {
    return (
      <div className="App">
        <Clock />
        <MuiThemeProvider>
          <ChannelManager client={client} oauth={oauth} />
        </MuiThemeProvider>
        <MuiThemeProvider>
          <Chat client={client} />
        </MuiThemeProvider>
      </div>
    )
  }
}

export default App;