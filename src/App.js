import React, { Component } from 'react'
import ReactHtmlParser from 'react-html-parser';
import './App.css'
import tmi from 'tmi.js'
import moment from 'moment'
import axios from 'axios'
import twitch_emotes from './twitch_emotes'
import bttv_emotes from './bttv_emotes'

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import FlatButton from 'material-ui/FlatButton';

const oauth = 'ntzeiqkoi1nubmv2f4kxlieu27z7mb'
const client_id = 'gpa5zi9y5d70q9b2lcpcwvikp7mek0'

let twitch_emotes_map = new Map()
for (let i = 0; i < twitch_emotes.length; i++) {
  twitch_emotes_map.set(twitch_emotes[i].code, `http://static-cdn.jtvnw.net/emoticons/v1/${twitch_emotes[i].id}/3.0`)
}

let bttv_emotes_map = new Map()
for (let i = 0; i < bttv_emotes.length; i++) {
  bttv_emotes_map.set(bttv_emotes[i].code, `http://cdn.betterttv.net/emote/${bttv_emotes[i].id}/3x`)
}

// http://static-cdn.jtvnw.net/emoticons/v1/356/3.0
// http://cdn.betterttv.net/emote/{{id}}/{{image}}

let channels = ['#Maurice_33', '#TheBoyks']

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
  channels: channels
}

let client = new tmi.client(options)

client.connect()

client.on("connected", function (address, port) {
  console.log(address + ':' + port)
});

class App extends Component {
  render() {
    return (
      <div className="App">
        <Clock />
        <ChannelManager client={client} />
        <MuiThemeProvider>
          <FollowedStreams client={client} oauth={oauth} />
        </MuiThemeProvider>
        <Chat client={client} twitch_emotes_map={twitch_emotes_map} bttv_emotes_map={bttv_emotes_map} />

      </div>
    )
  }
}

class ChannelManager extends Component {
  constructor(props) {
    super(props)

    this.state = {
      channels: new Map()
    }
  }

  componentDidMount() {
    // let new_channels = this.state.channels
    // this.props.client.channels.map((channel) => {
    //   new_channels.set(channel, 
    //     <div key={channel}>
    //       {channel}
    //     </div>
    //   )
    // })

    // this.setState({
    //   channels: new_channels
    // })

    client.on("join", (channel, username, self) => {
      if (username === client.username) {
        let new_channels = this.state.channels
        new_channels.set(channel,
          <div key={channel}>
            {channel}
          </div>
        )
        this.setState({
          channels: new_channels
        })
      }
    })

    client.on("part", (channel, username, self) => {
      if (username === client.username) {
        let new_channels = this.state.channels
        new_channels.set(channel,
          <div key={channel}>
            {channel}
          </div>
        )
        this.setState({
          channels: new_channels
        })
      }
    })
  }

  render() {
    let html = Array.from(this.state.channels.values())
    return (
      <div style={ChannelManagerCSS.container}>
        {html}
      </div>
    )
  }
}

let ChannelManagerCSS = {
  container: {
    width: '150px',
    border: '1px solid black',
    paddingTop: '10px',
    paddingBottom: '10px'
  }
}

class FollowedStreams extends Component {
  constructor(props) {
    super(props)

    this.state = {
      streams: new Map(),
      channels: new Map()
    }
  }

  componentDidMount() {
    console.log(this.props.client)
    // Update current channels from client
    this.props.client.channels.map((channel) => {
      let updated_channels = this.state.channels.set(channel, true)
      this.setState({
        channels: updated_channels
      })
      return true
    })
    // console.log(`${a} ${moment().format('h:mm:ss:SSS')}`)
    // Listeners
    client.on("join", (channel, username, self) => {
      if (username === options.identity.username) {
        console.log(`${username} has joined ${channel}!`)
        let updated_channels = this.state.channels.set(channel, true)
        this.setState({
          channels: updated_channels
        })
        this.updateStreamers()
      }
    });
  }

  async updateStreamers() {
    let config = {
      url: 'streams/followed',
      method: 'get',
      baseURL: 'https://api.twitch.tv/kraken',
      headers: { 'Accept': 'application/vnd.twitchtv.v5+json', 'Authorization': `OAuth ${this.props.oauth}` },
      params: { limit: 100 }
    }

    const a = await axios.request(config)
      .then((response) => {
        // console.log(response.data.streams)
        let new_streams = this.state.streams
        response.data.streams.map((stream) => {
          new_streams.set(
            `#${stream.channel.display_name}`,
            <div style={FollowedStreamsCSS.element} key={stream._id}>
              <div style={FollowedStreamsCSS.streamerName}>#{stream.channel.display_name}</div>
              <div style={FollowedStreamsCSS.gameName}>{stream.game}</div>
              <div style={FollowedStreamsCSS.viewers}>{stream.viewers}</div>
              {(this.state.channels.get(`#${stream.channel.display_name.toLowerCase()}`) === true) ?
                <FlatButton label='Leave' onClick={this.leave.bind(this, `#${stream.channel.display_name.toLowerCase()}`)} /> :
                <FlatButton label='Join' onClick={this.join.bind(this, `#${stream.channel.display_name.toLowerCase()}`)} />}
            </div>
          )
          return true
        })

        this.setState({
          streams: new_streams,
        })
        // console.log(`a ${moment().format('h:mm:ss:SSS')}`)
        return true
      })
    return a
  }

  join(channel) {
    this.props.client.join(channel).then((data) => {
      let updated_channels = this.state.channels.set(channel, true)
      this.setState({
        channels: updated_channels
      })
      console.log(this.state.channels)
      console.log(`${this.props.client.username} has joined ${data}`)
      this.updateStreamers()
    }).catch(function (err) {
      console.error(err)
    });
  }

  leave(channel) {
    this.props.client.part(channel).then((data) => {
      let updated_channels = this.state.channels.set(channel, false)
      this.setState({
        channels: updated_channels
      })
      console.log(this.state.channels)
      console.log(`${this.props.client.username} has left ${data}`)
      this.updateStreamers()
    }).catch(function (err) {
      console.error(err)
    });
  }

  render() {
    let html = Array.from(this.state.streams.values())
    return (
      <div style={FollowedStreamsCSS.container}>
        <button onClick={this.updateStreamers.bind(this)}>Refresh</button>
        {html}
      </div>
    )
  }
}

let FollowedStreamsCSS = {
  container: {
    width: '150px',
    paddingTop: '10px',
    paddingBottom: '10px'
  },
  element: {
    border: '1px solid black',
    display: 'flex',
    flexDirection: 'column',
  },
  streamerName: {
    fontSize: '12px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  gameName: {
    fontSize: '11px',
    fontStyle: 'italic',
    opacity: '0.8',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  viewers: {
    fontSize: '9px',
    opacity: '0.8'
  }
}

class Chat extends Component {
  constructor(props) {
    super(props)
    this.state = { messages: [] }

  }

  componentDidMount() {
    let component = this
    this.props.client.on("chat", function (channel, userstate, message, self) {
      let m = `<span style="opacity: 0.8; font-size: 10px; font-weight: bold;">${moment().format('h:mm:ss')}</span>
        <span style="color: ${userstate['color']}"> ${userstate['display-name']}</span>:
                ${component.parseForEmotes(message)}`
      console.log(m)
      let new_messages = component.state.messages.push(
        <div style={ChatCSS.line} key={component.state.messages.length}>
          {ReactHtmlParser(m)}
        </div>
      )
      component.setState({
        mesasges: new_messages
      })
    });
  }

  parseForEmotes(message) {
    let split_message = message.split(' ')
    for (let i in split_message) {
      const code = split_message[i]
      if (this.props.twitch_emotes_map.has(code)) {
        split_message[i] = `<img height="25" width="22" src=${twitch_emotes_map.get(code)} />`
      }
      if (this.props.bttv_emotes_map.has(code)) {
        split_message[i] = `<img height="25" width="22" src=${bttv_emotes_map.get(code)} />`
      }
    }

    return split_message.join(' ');
  }

  render() {
    return (
      <div style={ChatCSS.container}>
        {this.state.messages}
      </div>
    )
  }
}

let ChatCSS = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '500px',
    paddingTop: '10px',
    paddingLeft: '10px'
  },
  line: {
    border: '1px solid black',
    paddingTop: '3px',
    paddingLeft: '10px',
    paddingBottom: '3px',
    wordWrap: 'break-word'
  }
}

class Clock extends Component {
  constructor(props) {
    super(props)
    this.state = { date: moment().format('h:mm:ss') }
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    )
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    this.setState({
      date: moment().format('h:mm:ss')
    })
  }

  render() {
    return (
      <h3>It is {this.state.date}</h3>
    )
  }

}
export default App;
