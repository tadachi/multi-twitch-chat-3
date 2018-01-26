import React, { Component } from 'react'
import './App.css'
import { MuiThemeProvider, createMuiTheme } from 'material-ui/styles';
// Components
import LoginButton from './components/LoginButton'
import AppDrawer from './components/AppDrawer'
import ChannelManager from './components/AppDrawerComponents/ChannelManager'
import Chat from './components/Chat'
import Clock from './components/Clock'
import UserPaper from './components/UserPaper'
// import ColorPickerGrid from './components/ColorPickerGrid'
// Material-ui
import Paper from 'material-ui/Paper';
// Utilities
import tmi from 'tmi.js'
import axios from 'axios'
import EventEmitter from 'wolfy87-eventemitter'

const client_id = 'gpa5zi9y5d70q9b2lcpcwvikp7mek0'

// Multi-twitch-chat 3 event system (mtc)
let MultiTwitchChatEE = new EventEmitter()

/*
loginByTwitchEvent
updateStreamersByCacheEvent
updateStreamersByNetworkEvent
joinChannelEvent
leaveChannelEvent
sendJoinedChannelsEvent
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
      drawerOpen: true,
      client: null,
      oAuth: null,
      user_logo: null,
      name: null,
    }

    this.options = {
      options: {
        debug: false
      },
      connection: {
        reconnect: true
      },
      identity: {
        username: '',
        password: ''
      },
    }
  }

  handleDrawerOpen() {
    this.setState({ drawerOpen: !this.state.drawerOpen });
  }

  componentDidMount() {
    // tmi.js client
    if (getParams(document.location.hash)['access_token']) {
      const token = getParams(document.location.hash)['access_token']
      this.getUserObject(token).then((response) => {
        if (response.status === 200) {
          this.options.identity.username = response.data.name
          this.options.identity.password = token
          this.setState({
            oAuth: token,
            client: new tmi.client(this.options),
            user_logo: response.data.logo,
            name: response.data.name,
          })
          this.state.client.connect()
        } else {
          throw Error(response)
        }
      })
    }
  }

  async getUserObject(oauth) {
    let config = {
      url: 'user',
      method: 'get',
      baseURL: 'https://api.twitch.tv/kraken',
      headers: {
        'Accept': 'application/vnd.twitchtv.v5+json',
        'Client-Id': client_id,
        'Authorization': `OAuth ${oauth}`
      },
    }

    const req = await axios.request(config).then((response) => {
      return response
    })

    return req
  }

  render() {
    const onExpanded = this.state.drawerOpen === true ? expanded : ''

    const login = this.state.oAuth ?
      null :
      <LoginButton client_id={client_id} style={loginButton} color={'primary'} />


    const channelManager = this.state.client ?
      <ChannelManager client={this.state.client} client_id={client_id} oAuth={this.state.oAuth} mtcEE={MultiTwitchChatEE} loggedIn={true} /> :
      null

    const chat = this.state.client ?
      <Chat style={{ ...onExpanded }} client={this.state.client} mtcEE={MultiTwitchChatEE} drawerWidth={drawerWidth} /> :
      null

    const user = this.state.oAuth ?
      <UserPaper name={this.state.name} img={this.state.user_logo} /> :
      null

    return (
      <MuiThemeProvider theme={theme}>
        <div id={'container'} >
          <AppDrawer style={drawer} open={this.state.drawerOpen}>
            <Paper style={paperStyle}>
              <Clock />
              {login}
              {user}
            </Paper>
            {channelManager}
          </AppDrawer>
          {chat}
        </div>
      </MuiThemeProvider>
    )
  }
}

const getParams = query => {
  if (!query) {
    return {};
  }

  return (/^[?#]/.test(query) ? query.slice(1) : query)
    .split('&')
    .reduce((params, param) => {
      let [key, value] = param.split('=');
      params[key] = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
      return params;
    }, {});
}

const paperStyle = {
  backgroundColor: 'black',
  border: '1px solid white',
  margin: '2%',
  padding: '2%',
  color: 'white',
}

const loginButton = {
  width: '100%',
}

export default App;