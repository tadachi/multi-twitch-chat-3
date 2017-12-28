import React, { Component } from 'react'
import ReactHtmlParser from 'react-html-parser';
import './App.css'
import tmi from 'tmi.js'
import moment from 'moment'
import axios from 'axios'
import twitch_emotes from './twitch_emotes'
import bttv_emotes from './bttv_emotes'

const oauth = 'ntzeiqkoi1nubmv2f4kxlieu27z7mb'
const client_id = 'gpa5zi9y5d70q9b2lcpcwvikp7mek0'

let twitch_emotes_map = new Map()
for (let i = 0; i < twitch_emotes.length; i++) {
  twitch_emotes_map.set(twitch_emotes[i].code, `http://static-cdn.jtvnw.net/emoticons/v1/${twitch_emotes[i].id}/3.0`)
}

console.log(bttv_emotes)

let bttv_emotes_map = new Map()
for (let i = 0; i < bttv_emotes.length; i++) {
  bttv_emotes_map.set(bttv_emotes[i].code, `http://cdn.betterttv.net/emote/${bttv_emotes[i].id}/3x`)
}

let streams = ['landail', 'procplays']
let channels = ['#landail', '#procplays']

// http://static-cdn.jtvnw.net/emoticons/v1/356/3.0
// http://cdn.betterttv.net/emote/{{id}}/{{image}}

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
        <FollowedStreams />
        <Chat client={client} twitch_emotes_map={twitch_emotes_map} bttv_emotes_map={bttv_emotes_map}/>
      </div>
    )
  }
}

class FollowedStreams extends Component {
  constructor(props) {
    super(props)

    this.state = {
      streams: null
    }
  }
  componentDidMount() {
    console.log(client_id)
    let config = {
      url: 'streams/followed',
      method: 'get',
      baseURL: 'https://api.twitch.tv/kraken',
      headers: { 'Accept': 'application/vnd.twitchtv.v5+json', 'Authorization': `OAuth ${oauth}`},
      params: { limit: 100 }
    }

    axios.request(config)
      .then((response) => {
        // console.log(response.data.streams)
        this.setState({
          streams: response.data.streams.map((stream) =>
            <div style={middle} key={stream._id}> 
              <div style={streamerName}>{stream.channel.display_name}</div> 
              <div style={gameName}>{stream.game}</div> 
              <div style={viewers}>{stream.viewers}</div>
            </div>
          )

        })
      })
  }
  render() {
    return (
      <div>
        {this.state.streams}
      </div>
    )
  }
}

const middle = {
  border: '1px solid black',
  display: 'flex',
  flexDirection: 'column'
}

const streamerName = {
  fontSize: '12px'
}

const gameName = {
  fontSize: '10px',
  fontStyle: 'italic',
  opacity: '0.8'
}

const viewers = {
  fontSize: '8px',
  opacity: '0.8'
}

class Chat extends Component {
  constructor(props) {
    super(props)
    this.state = { messages: [] }
    
  }

  componentDidMount() {
    let component = this
    this.props.client.on("chat", function (channel, userstate, message, self) {
      let m = `[${moment().format('h:mm:ss')}] ${userstate['display-name']}: ${component.parseForEmotes(message)}`
      console.log(m)
      let new_messages = component.state.messages.push(<div style={chatLine} key={component.state.messages.length}>{ReactHtmlParser(m)}</div>)
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
        split_message[i] = `<img class="emote" src="${twitch_emotes_map.get(code)}" />`
      }
      if (this.props.bttv_emotes_map.has(code)) {
        split_message[i] = `<img class="emote" src="${bttv_emotes_map.get(code)}" />`
      }
    }

    return split_message.join(' ');
  }

  render() {
    return (
      <div style={chatContainer}>
        {this.state.messages}
      </div>
    )
  }
}

const chatContainer = {
  display: 'flex',
  flexDirection: 'column'
}

const chatLine = {
  paddingTop: '3px',
  paddingLeft: '10px',
  paddingBottom: '3px'
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
      <h2>It is {this.state.date}</h2>
    )
  }

}
export default App;
