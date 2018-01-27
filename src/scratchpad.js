import React, { Component } from 'react';
import './App.css';


class App extends Component {
  render() {
    return (
      <div className="App">
        <iframe frameborder="0"
          scrolling="no"
          id="chat_embed"
          src="http://www.twitch.tv/embed/landail/chat"
          height="500"
          width="350">
        </iframe>
        Best
      </div>
    );
  }
}

export default App;

const userReducer = (state={}, actions) => {
  switch (actions.type) {
    case "CHANGE_NAME": {
      state = {...state, name: actions.payload}
      break
    }
    case "CHANGE_AGE": {
      state = {...state, age: actions.payload}
      break
    }
  }
  return state;
}

const tweetsReducer = (state={}, actions) => {
  return state;
}

const reducers = combineReducers({
  user: userReducer,
  tweets: tweetsReducer,
})

import React, { Component } from 'react'
import ReactHtmlParser from 'react-html-parser';
import { connect } from 'react-redux'
import moment from 'moment'
import twitch_emotes from '../emotes/twitch_emotes'
import bttv_emotes from '../emotes/bttv_emotes'

import '../App.css'
import { List, ListItem } from 'material-ui/List';

// Emotes
// http://static-cdn.jtvnw.net/emoticons/v1/356/3.0
let twitch_emotes_map = new Map()
for (let i = 0; i < twitch_emotes.length; i++) {
  twitch_emotes_map.set(twitch_emotes[i].code, `http://static-cdn.jtvnw.net/emoticons/v1/${twitch_emotes[i].id}/3.0`)
}

// http://cdn.betterttv.net/emote/{{id}}/{{image}}
let bttv_emotes_map = new Map()
for (let i = 0; i < bttv_emotes.length; i++) {
  bttv_emotes_map.set(bttv_emotes[i].code, `http://cdn.betterttv.net/emote/${bttv_emotes[i].id}/3x`)
}

import React, { Component } from 'react'
import ReactHtmlParser from 'react-html-parser';
import { connect } from 'react-redux'
import moment from 'moment'
import twitch_emotes from '../emotes/twitch_emotes'
import bttv_emotes from '../emotes/bttv_emotes'

import '../App.css'
import { List, ListItem } from 'material-ui/List';

// Emotes
// http://static-cdn.jtvnw.net/emoticons/v1/356/3.0
let twitch_emotes_map = new Map()
for (let i = 0; i < twitch_emotes.length; i++) {
  twitch_emotes_map.set(twitch_emotes[i].code, `http://static-cdn.jtvnw.net/emoticons/v1/${twitch_emotes[i].id}/3.0`)
}

// http://cdn.betterttv.net/emote/{{id}}/{{image}}
let bttv_emotes_map = new Map()
for (let i = 0; i < bttv_emotes.length; i++) {
  bttv_emotes_map.set(bttv_emotes[i].code, `http://cdn.betterttv.net/emote/${bttv_emotes[i].id}/3x`)
}

class Chat extends Component {
  constructor(props) {
    super(props)

    this.state = {
      messages: [],
      scrollToEnd: true,
      end: <div style={{ float: "left", clear: "both" }}
        ref={(el) => { this.messagesEnd = el; }}>
      </div>
    }
  }

  componentDidMount() {
    let component = this
    this.props.client.on("chat", (channel, userstate, message, self) => {
      let m = `<span style="opacity: 0.8; font-size: 10px; font-weight: bold;">${moment().format('h:mm:ss')} ${channel}</span>
        <span style="color: ${userstate['color']}"> ${userstate['display-name']}</span>:
                ${component.parseForEmotes(message)}`
      // console.log(m)
      const backgroundColor = { backgroundColor: this.props.channels.get(channel).color }

      let new_messages = component.state.messages

      new_messages.push(
        <ListItem style={{ ...ChatCSS.line, ...backgroundColor }} channel={channel} key={component.state.messages.length}>c
          {ReactHtmlParser(m)}
        </ListItem>
      )
      component.setState({
        messages: new_messages
      })
      component.scrollToBottom()
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

  scrollToBottom() {
    if (this.state.scrollToEnd) {
      const last = this.state.messages.length - 1
      // console.log(last)
      // console.log(this.state.messages.length)
      // console.log(this.state.messages[last])
      // this.state.messages[last].key.scrollIntoView({ behavior: "smooth" })
      // console.log('test')
      // this.messagesEnd.scrollIntoView({ behavior: "smooth" })
    }
  }

  render() {
    return (
      
      <List style={ChatCSS.container} className={'scrollbar'} id={'style-3'}>
        {this.state.messages}
      </List>
    )
  }
}

// Specifies the default values for props:
Chat.defaultProps = {
  twitch_emotes_map: twitch_emotes_map,
  bttv_emotes_map: bttv_emotes_map
};

let ChatCSS = {
  container: {
    width: 'auto',
    height: '300px',
    // marginLeft: '10px',
    // marginBottom: '10px',
    backgroundColor: 'black',
    overflowY: 'scroll'
  },
  line: {
    // border: '1px solid white',
    wordWrap: 'break-word',
  }
}

function mapStateToChat(state) {
  return {
    channels: state.channelsReducer.channels
  }
}

Chat = connect(mapStateToChat)(Chat)

export default Chat

import React, { Component } from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import { joinChannel, leaveChannel } from '../../actions/channelActions'

import { List, ListItem } from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';

const COMPONENT_NAME = 'ChannelManager' 

/**
 * ChannelManager
 * 
 * TODO
 * 
 * Manages channels.
 */
class ChannelManager extends Component {
  constructor(props) {
    super(props)

    this.state = {
      streams: new Map(),
      responseCache: null,
    }
  }

  componentDidMount() {
    // Initial updateStreamers
    this.updateStreamers()

    // Listeners
    this.props.client.on("join", (channel, username, self) => {
      if (username === this.props.client.username) {
        console.log(`${username} has joined ${channel}!`)
      }
    });

    this.timerID = setInterval(
      () => this.updateStreamers(),
      300000
    )

    setTimeout(() => {
      this.join('#TwitchPresents'.toLowerCase())
      this.join('#landail'.toLowerCase())
    }, 4000)
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  async updateStreamers() {
    let config = {
      url: 'streams/followed',
      method: 'get',
      baseURL: 'https://api.twitch.tv/kraken',
      headers: { 'Accept': 'application/vnd.twitchtv.v5+json', 'Authorization': `OAuth ${this.props.oauth}` },
      params: { limit: 100 }
    }

    const req = await axios.request(config)
      .then((response) => {

        this.setState({
          responseCache: response,
        })

        let new_streams = new Map()

        response.data.streams.map((stream) => {
          let joined = false
          let color = { backgroundColor: '#000000' } // Default is black

          if (this.props.channels.has(`#${stream.channel.display_name.toLowerCase()}`)) {
            const ch = this.props.channels.get(`#${stream.channel.display_name.toLowerCase()}`)
            joined = ch.joined
            joined === true ? color.backgroundColor = ch.color : color.backgroundColor = '#000000'
          }

          new_streams.set(
            `#${stream.channel.display_name}`,
            <ListItem style={{ ...ChannelManagerCSS.element, ...color }} key={stream._id}>
              <div style={ChannelManagerCSS.streamerName}>#{stream.channel.display_name}</div>
              {(stream.game !== '' && stream.game !== undefined) ?
                <div style={ChannelManagerCSS.gameName}>{stream.game}</div> :
                <div style={ChannelManagerCSS.gameName}>N/A</div>}
              <div style={ChannelManagerCSS.viewers}>{stream.viewers}</div>
              {(joined === true) ?
                <FlatButton label='Leave' secondary={true} onClick={this.leave.bind(this, `#${stream.channel.display_name.toLowerCase()}`)} /> :
                <FlatButton label='Join' primary={true} onClick={this.join.bind(this, `#${stream.channel.display_name.toLowerCase()}`)} />}
            </ListItem>
          )
          return true
        })

        this.setState({
          streams: new_streams,
        })

        this.props.mtcEE.emitEvent(`updateStreamersByNetworkEvent`);

        return true
      })
    return req
  }

  updateStreamersByCache() {
    let new_streams = new Map()

    if (this.state.responseCache) {
      this.state.responseCache.data.streams.map((stream) => {
        let joined = false
        let color = { backgroundColor: '#000000' } // Default is black

        if (this.props.channels.has(`#${stream.channel.display_name.toLowerCase()}`)) {
          const ch = this.props.channels.get(`#${stream.channel.display_name.toLowerCase()}`)
          joined = ch.joined
          joined === true ? color.backgroundColor = ch.color : color.backgroundColor = '#000000'
        }

        new_streams.set(
          `#${stream.channel.display_name}`,
          <ListItem style={{ ...ChannelManagerCSS.element, ...color }} key={stream._id}>
            <div style={ChannelManagerCSS.streamerName}>#{stream.channel.display_name}</div>
            <div style={ChannelManagerCSS.gameName}>{stream.game}</div>
            <div style={ChannelManagerCSS.viewers}>{stream.viewers}</div>
            {(joined === true) ?
              <FlatButton label='Leave' secondary={true} onClick={this.leave.bind(this, `#${stream.channel.display_name.toLowerCase()}`)} /> :
              <FlatButton label='Join' primary={true} onClick={this.join.bind(this, `#${stream.channel.display_name.toLowerCase()}`)} />}
          </ListItem>
        )

        this.setState({
          streams: new_streams,
        })

        return true
      })
    }

    this.props.mtcEE.emitEvent(`updateStreamersByCacheEvent`);
  }

  join(channel) {
    this.props.client.join(channel).then((data) => {

      this.props.dispatch(joinChannel(channel))

      this.updateStreamersByCache()

    }).catch(function (err) {
      console.error(err)
    });

    this.props.mtcEE.emitEvent('joinChannelByNetworkEvent', {component: COMPONENT_NAME, channel: channel})
  }

  leave(channel) {
    this.props.client.part(channel).then((data) => {

      this.props.dispatch(leaveChannel(channel))

      this.updateStreamers()

    }).catch(function (err) {
      console.error(err)
    });

    this.props.mtcEE.emitEvent('leaveChannelEvent', {component: COMPONENT_NAME, channel: channel})
  }

  render() {
    let html = Array.from(this.state.streams.values())
    return (
      <div>
        <RaisedButton onClick={this.updateStreamers.bind(this)}>Refresh</RaisedButton>
        <List style={ChannelManagerCSS.container}>
          {html}
        </List>
      </div>
    )
  }
}

let ChannelManagerCSS = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: '10px',
    paddingBottom: '10px'
  },
  element: {
    border: '1px solid white',
    width: '150px',
    color: 'white'
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

function mapStateToChannelManager(state) {
  return {
    channels: state.channelsReducer.channels
  }
}

ChannelManager = connect(mapStateToChannelManager)(ChannelManager)

export default ChannelManager

<AppBar style={{ ...appBar, ...onExpanded }}
title={<Button label={'Multi-Twitch-Chat'} style={whiteFont} />}
onLeftIconButtonClick={this.handleDrawerOpen.bind(this)}
iconElementRight={<Button label={<Clock style={whiteFont} />} />}
>
</AppBar>

const content = {
  fontSize: 20,
  paddingTop: '64px',
  border: '1px solid red',
}

const appBar = {
  backgroundColor: '#000000',
  border: '1px solid white',
  left: 0,
  width: 'auto',
  right: 0,
  position: 'fixed',
}

const whiteFont = {
  color: 'white',
}

const expanded = {
  left: '255px',
  // paddingLeft: '255px'
}

<div style={content}>

<TopAppBar></TopAppBar>

<AppDrawer open={this.state.drawerOpen}>
  <ChannelManager client={client} oauth={oauth} mtcEE={MultiTwitchChatEE} />
</AppDrawer>
{/* <Chat style={{ ...onExpanded }} client={client} mtcEE={MultiTwitchChatEE} /> */}
</div>
{/* <ColorPickerGrid>
</ColorPickerGrid> */}

const h = '500' // height
const mMB = 20 // moreMessagesBar
const cI = 40 // chatInput
const p = 20 // padding
const dD = 70 // dropDown


let ChatCSS = {
  container: {
    position: 'relative',
    width: `${width}px`,
    height: `${h}px`,
    padding: `${p}px ${p}px ${p}px ${p}px`,
    border: '1px solid DimGrey',
  },
  chat: {
    width: `${width}px`,
    height: `${h - cI}px`,
    backgroundColor: 'black',
    overflowY: 'scroll',
    border: '1px solid DimGrey',
  },
  line: {
    paddingTop: '5px',
    paddingBottom: '5px',
    // border: '1px solid white',
    wordWrap: 'break-word',
  },
  moreMessagesBelow: {
    display: 'inline-block',
    position: 'absolute',
    top: `${h - mMB - p - 10}px`,
    left: `${p}px`,
    right: '0',
    bottom: '0',
    width: `${width - 2}px`,
    height: '20px',
    opacity: '.45',
    backgroundColor: 'black',
    border: '1px solid DimGrey',
    color: 'white',
    textAlign: 'center',
  },
  chatInput: {
    verticalAlign: 'top', // Fixes extra 6px gap
    width: `${width}px`,
    height: '40px',
    overflow: 'hidden',
    resize: 'none',
    backgroundColor: 'black',
    color: 'white',
    border: '1px solid DimGrey',
    padding: 0,
    margin: 0,
  },
  dropDown: {
    backgroundColor: 'white',
    width: `${width / 2}px`,
    padding: 0,
    marginTop: '10px',
  }
}

import React, { Component } from 'react'
import Button from 'material-ui/Button'
import axios from 'axios'
import { connect } from 'react-redux'
import { CommunicationDialerSip } from 'material-ui/svg-icons';

class LoginButton extends Component {
  constructor(props) {
    super(props)

    this.url = `https://api.twitch.tv/kraken/oauth2/authorize
?client_id=${this.props.client_id}
&redirect_uri=http://localhost:3000
&response_type=token+id_token
&scope=openid+chat_login
&state=c3ab8aa609ea11e793ae92361f002671`
  }

  render() {
    return (
      <div>
        <a href={this.url}><Button style={{ ...this.props.style }} raised color="primary">Login With Twitch</Button></a>
      </div>
    )
  }

}

export default LoginButton

this.updateChannelsID = setInterval(
  () => {
    this.setState({
      channels: Array.from(this.props.channels.keys()).sort()
    })
    let new_joined_channels = this.state.joined_channels
    for (let i = 0; i < this.state.channels.length; i++) {
      if (this.props.channels.get(this.state.channels[i]).joined === true) {
        joined_channels.push(<option style={{ backgroundColor: 'black' }} value={i} key={this.state.channels[i]}>{this.state.channels[i]}</option>)
      }
    }
    this.setState({
      channels: Array.from(this.props.channels.keys()).sort()
    })
  }, 10000
)

processMessage(channel, message) {
  let backgroundColor = 'black'
  let new_msg_id = this.state.msg_id + 1
  if (this.props.channels.get(channel)) {
    backgroundColor = { backgroundColor: this.props.channels.get(channel).color }
  }

  let new_messages = this.state.messages

  new_messages.push(
    <div style={{ ...backgroundColor }} channel={channel} key={this.state.msg_id}>
      {message}
    </div>
  )

  this.setState({
    msg_id: new_msg_id,
    messages: new_messages
  })
}

console.log(LOCAL_STORAGE.getItem(MESSAGES))
console.log(typeof (LOCAL_STORAGE.getItem(MESSAGES)))
console.log(LOCAL_STORAGE.getItem(MESSAGES).size)
console.log(jsonToArray(LOCAL_STORAGE.getItem(MESSAGES)))
const messageArrayObj = jsonToArray(LOCAL_STORAGE.getItem(MESSAGES))

const logOut = this.state.oAuth ?
<div><a href={`https://api.twitch.tv/kraken/oauth2/revoke?client_id=${client_id}&token=${this.state.oAuth}`}>Log Out</a></div> :
null

        // this.join('#TwitchPresents')
        // this.join('#Cirno_TV')
        // this.join('#destiny')
        // this.join('#playhearthstone')
        // this.join('#Avilo')
        // this.join('#werster')
        // this.join('#artosis')
        
        // this.join('#icarusFW')
        // this.join('#Pasky')
        // this.join('#Metako')
        // this.join('#landail')
        // this.join('#DarkSaber2k')
        // this.join('#maurice_33')
        // this.join('#Aquas')
        // this.join('#Fiercekyo')
        // this.join('#mulsqi')
        // this.join('#bafael')
        // this.join('#theboyks')
        // this.join('#Raikou')
        // this.join('#perpetualmm')
        // this.join('#Bingchang')
        // this.join('#frokenok')
        // this.join('#vultus')
        // this.join('#neohart')
        // this.join('#zetsubera')
        // this.join('#procplays')
        // this.join('#lazerlong')
        // this.join('#testrunner')
        // this.join('#jiseed')
        // this.join('#xxxindyxxx')
        // this.join('#narcissawright')
        // this.join('#Goati_')
        // this.join('#TheLCC')
        // this.join('#azureseishin')
        // this.join('#pykn')
        // this.join('#jiggeh')
        // this.join('#chuboh')
        // this.join('#UFotekkie')
        // this.join('#Ty2358')
        // this.join('#sakegeist')
        // this.join('#klaige')
        // this.join('#Go1den')
        // this.join('#capnclever')
        // this.join('#omnigamer')
        // this.join('#sylux98')
        // this.join('#swordsmankirby')
        // this.join('#Macaw45')
        // this.join('#freddeh')
        // this.join('#ghou02')
        // this.join('#tterraj42')
        // this.join('#superKing13')
        // this.join('#CavemanDCJ')
        // this.join('#yagamoth')
        // this.join('#shadowJacky')
        // this.join('#Jenja23')