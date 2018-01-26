import React, { Component } from 'react'
import ReactHtmlParser from 'react-html-parser';
import { connect } from 'react-redux'
import moment from 'moment'
import axios from 'axios'
import '../App.css'

// Components
import ChatMenu from './ChatMenu'

// Material-ui
import Select from 'material-ui/Select'
import { blueGrey } from 'material-ui/colors'

// Utility
import twitch_emotes from '../emotes/twitch_emotes'
import bttv_emotes from '../emotes/bttv_emotes'
import { LOCAL_STORAGE, MESSAGES, } from '../util/localStorageWrapper'
import { arrayToJson, jsonToArray, } from '../util/JsonMapUtil'

String.prototype.removeHashtag = function () {
  return this.replace('#', "").toLowerCase();
}

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

// FFZ
let ffz_emotes_map = new Map()

async function getFFZEmotes(name) {
  let config = {
    url: `room/${name}`,
    method: 'get',
    baseURL: 'https://api.frankerfacez.com/v1/',
    params: { limit: 100 }
  }

  const req = await axios.request(config).then((response) => {
    return response
  }).catch((err) => {
    return undefined
  })

  return req
}

async function goFFZ(name) {
  const req = await getFFZEmotes(name)
    .then((response) => {
      if (response) {
        ffz_emotes_map.set(name, new Map())
        const data = Object.values(response.data.sets)[0].emoticons
        // console.log(data)
        for (const item of data) {
          // console.log(`${item.name} ${item.urls[1]}`)
          ffz_emotes_map.get(name).set(item.name, item.urls[1])
        }
        // console.log(ffz_emotes_map)
        return data
      } else {
        // console.log(ffz_emotes_map)
        return undefined
      }
    })

  return req
}

class Chat extends Component {
  constructor(props) {
    super(props)

    this.state = {
      // messages
      messages: [],
      your_messages: [],
      // UI
      scrollToEnd: true,
      width: window.innerWidth,
      height: window.innerHeight - 10,
      chatMenuOpen: false,
      // Channels
      channel: 0,
      joined_channels: []
    }
    this.msg_id = 0,
    this.messageCache = []
    this.regex_channel = /\/\#\S+|\S+\ +/ //['/#Tod', /#Tod    '] OK ['#Tod', '#Tod  '] Not OK.
  }

  componentDidMount() {
    this.chatScroll.addEventListener('scroll', this.handleChatScroll.bind(this))

    this.props.client.on('join', (channel, username, self) => {
      if (username === this.props.client.username) {
        let new_c = this.state.channel
        if (new_c > 0) {
          this.setState({
            channel: new_c
          })
        } else {
          this.setState({
            channel: 0
          })
        }

        this.setState({
          channels: Array.from(this.props.channels.keys()).sort()
        })
      }
    });

    this.props.client.on('part', (channel, username, self) => {
      let new_c = this.state.channel

      if (new_c > 0) {
        this.setState({
          channel: new_c
        })
      } else {
        this.setState({
          channel: 0
        })
      }

      this.setState({
        channels: Array.from(this.props.channels.keys()).sort()
      })
    });

    this.truncateTimerID = setInterval(
      () => {
        this.truncateMessages()
      },
      60000
    )

    let m = (channel, userstate, message, time) => {
      return <div style={{ marginLeft: '5px', padding: 0, }}>
        <span style={{
          opacity: '0.8', fontSize: '10px', fontWeight: 'bold',
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>
          {time} {channel}
        </span>
        <span style={{ color: `${userstate['color']}`, marginLeft: '2px', }}>{userstate['display-name'] + ': '} </span>
        <span style={{}}>{this.parseForEmotes(message, channel.removeHashtag())}</span>
      </div>
    }

    let processMessage = (channel, message, opacity = 1) => {
      let color = blueGrey[900]
      this.msg_id = this.msg_id + 1
      this.props.channels.get(channel) ?
        color = this.props.channels.get(channel).color :
        color = blueGrey[900]

      return <div style={{ backgroundColor: color, opacity: opacity }} channel={channel} key={this.msg_id}>
        {message}
      </div>
    }

    //Load past messages
    if (LOCAL_STORAGE.getItem(MESSAGES)) {
      const messageArrayObj = jsonToArray(LOCAL_STORAGE.getItem(MESSAGES))
      let new_messages = this.state.messages
      for (const obj of messageArrayObj) {
        const channel = obj.channel
        const userstate = obj.userstate
        const message = obj.message
        const time = obj.time

        const msg = m(channel, userstate, message, time)
        const new_message = processMessage(channel, msg, 0.75)
        new_messages.push(new_message)
      }

      this.setState({
        messages: new_messages
      })

    }

    this.saveMessagesID = setInterval(
      () => {
        if (this.state.messages !== null) {
          LOCAL_STORAGE.setItem(MESSAGES, arrayToJson(this.messageCache))
        }
      },
      10000 // 10 seconds
    )

    this.props.client.on('chat', (channel, userstate, message, self) => {
      const time = moment().format('h:mm:ss')

      // Save messages incase user exits
      const messageObj = { channel: channel, userstate: userstate, message: message, time: time }
      this.messageCache.push(messageObj)
      // Step 1
      const msg = m(channel, userstate, message, time)
      // Step 2
      const new_message = processMessage(channel, msg)
      // Step 3
      let new_messages = this.state.messages
      new_messages.push(new_message)

      this.setState({
        messages: new_messages
      })

      if (this.state.scrollToEnd) {
        this.scrollToBottom()
      }
    });

    window.addEventListener("resize", this.updateDimensions.bind(this));

    // mtcEE events
    let update = () => {
      const channels = Array.from(this.props.channels.keys()).sort()
      let new_joined_channels = []
      let new_channels = []
      let i = 0
      let c = this.state.channel
      for (const channel of channels) {
        if (this.props.channels.get(channel).joined === true) {
          new_channels.push(channel)
          new_joined_channels.push(<option style={{ backgroundColor: 'black' }} value={i} key={channel}>{channel}</option>)
          i++
        }
      }
      if (c > new_joined_channels.length) {
        c = 0
      }
      this.setState({
        channels: new_channels,
        joined_channels: new_joined_channels,
        channel: c
      })
    }
    this.props.mtcEE.on('joinChannelEvent', (channel) => {
      goFFZ(channel.removeHashtag())
      update()
    })
    this.props.mtcEE.on('leaveChannelEvent', (channel) => {
      update()
    })
    this.props.mtcEE.on('updateStreamersByNetworkEvent', (channels) => {
      // Use the network event to leave/remove those channels when streamers go offline, 
    })
    this.props.mtcEE.on('updateStreamersByCache', (channels) => {
    })
  }

  componentWillUnmount() {
    // Clear listeners and intervals
    this.chatScroll.removeEventListener('scroll', this.handleChatScroll.bind(this))
    window.removeEventListener("resize", this.updateDimensions.bind(this));
    clearInterval(this.truncatetimerID);
    clearInterval(this.updateChannelsID);
  }

  updateDimensions() {
    const new_w = window.innerWidth
    const new_h = window.innerHeight - 10
    this.setState({
      width: new_w,
      height: new_h,
    })
  }

  truncateMessages() {
    const truncated_messages = this.state.messages
    if (truncated_messages.length > 400) {
      truncated_messages.splice(0, 300)
      console.log(truncated_messages)

      this.setState({
        messages: truncated_messages
      })

    }
  }

  parseForEmotes(message, channel) {
    let split_message = message.split(' ')
    for (let i in split_message) {
      const code = split_message[i]
      if (this.props.twitch_emotes_map.has(code)) {
        split_message[i] = `<img style='vertical-align: middle; padding: 1px;' height='38' src=${twitch_emotes_map.get(code)} />`
      }
      if (this.props.bttv_emotes_map.has(code)) {
        split_message[i] = `<img style='vertical-align: middle; padding: 1px;' height='38' src=${bttv_emotes_map.get(code)} />`
      }
      if (ffz_emotes_map.has(channel)) {
        // console.log(ffz_emotes_map)
        if (ffz_emotes_map.get(channel).has(code)) {
          split_message[i] = `<img style='vertical-align: middle; padding: 1px;' height='38' src=${ffz_emotes_map.get(channel).get(code)} />`
        }
      }
    }
    return ReactHtmlParser(split_message.join(' '));
  }

  sendMessage(event) {
    const message = this.messageInput.value
    let channel = this.state.joined_channels[this.state.channel].key
    let new_your_messages = this.state.your_messages
    let parsedMessage = ''

    if (event.key === 'Enter') {
      event.preventDefault() // Prevents newlines from occuring in the text area

      if (message === '') { return }

      if (parsedMessage !== '') {
        new_your_messages.push(parsedMessage)
      }

      this.props.client.say(channel, message).then((data) => {
        this.scrollToBottom()
        console.log(`${channel} ${message}`)
      }).catch((err) => {
        console.log(err)
      });

      this.messageInput.value = ''
    }
  }

  switchChannel(event) {
    let new_c = this.state.channel

    if (event.key === 'ArrowUp') {
      if (this.state.channel < this.state.joined_channels.length - 1) {
        new_c += 1
        this.setState({
          channel: new_c
        })
      } else {
        new_c = 0
        this.setState({
          channel: new_c
        })
      }
    }
    if (event.key === 'ArrowDown') {
      if (this.state.channel < this.state.joined_channels.length && this.state.channel > 0) {
        new_c -= 1
        this.setState({
          channel: new_c
        })
      } else {
        new_c = this.state.joined_channels.length - 1
        this.setState({
          channel: new_c
        })
      }
    }
  }

  handleChange = name => event => {
    // console.log(event.target.value)
    this.setState({ [name]: event.target.value });
  };

  handleChatScroll() {
    // console.log(this.chatScroll.scrollHeight )
    if (this.chatScroll.scrollHeight - Math.ceil(this.chatScroll.scrollTop) <= this.chatScroll.clientHeight) {
      this.setState({
        scrollToEnd: true
      })
      this.scrollToBottom()
    } else {
      if (this.state.scrollToEnd !== false) {
        this.setState({
          scrollToEnd: false
        })
      }
    }
  }

  scrollToBottom() {
    this.setState({
      scrollToEnd: true
    })
    const chat = document.getElementById('chat');
    chat.scrollTop = chat.scrollHeight;
    // this.messagesEnd.scrollIntoView({ behavior: "instant" })
  }

  clearChat() {
    const messages = []
    this.msg_id = 0
    // Remove past saved twitch chat messages on clear
    LOCAL_STORAGE.removeItem(MESSAGES)
    this.setState({
      messages: messages,
    })
  }

  handleChatMenuOpen() {
    console.log('test')
    this.setState({ chatMenuOpen: !this.state.chatMenuOpen });
  }

  render() {
    const drawerWidth = this.props.drawerWidth + 20
    const w = this.state.width - drawerWidth
    const h = this.state.height
    const chatH = 45

    const channelSelect = this.state.joined_channels.length > 0 ?
      <Select onChange={this.handleChange('channel')} style={{ color: 'white', width: '100%', }} value={this.state.channel} native>
        {this.state.joined_channels}
      </Select> :
      null

    const textAreaChat = this.state.joined_channels.length > 0 ?
      <textarea style={{ color: 'white', width: '65%', minWidth: '150px', height: `${chatH}px`, backgroundColor: 'black', resize: 'none', overflowX: 'hidden' }}
        ref={(el) => { this.messageInput = el }} placeholder={`Send a message to ${this.state.joined_channels[this.state.channel].key}..`}
        onKeyPress={this.sendMessage.bind(this)} onKeyDown={this.switchChannel.bind(this)}>
      </textarea> :
      <textarea style={{ color: 'white', width: '65%', minWidth: '150px', height: `${chatH}px`, backgroundColor: 'black', resize: 'none', overflowX: 'hidden' }}
        ref={(el) => { this.messageInput = el }} placeholder={`Join a channel to chat!`} disabled>
      </textarea>

    return (
      <div style={{ ...this.props.style, ...{ position: 'relative', width: `${w}px`, height: `${h}px`, overflowX: 'hidden', overflowY: 'hidden', border: '1px solid white', } }}>
        <div style={{ borderBottom: '1px solid white', width: `${w}`, height: `${h - chatH - 30}px`, overflowY: 'scroll', overflowX: 'hidden', }} ref={(el) => { this.chatScroll = el }} id={'chat'}>
          <div>
            {this.state.messages}
          </div>
          <div id={'endOfChat'} ref={(el) => { this.messagesEnd = el }}>
          </div>
        </div>
        {/* More messages below modal box */}
        {(this.state.scrollToEnd === false) ?
          <div style={{ display: 'inline-block', position: 'absolute', top: `${h - chatH - 60}px`, left: `${w / 2.5}px`, opacity: '0.85', backgroundColor: 'grey', padding: 10, }}
            onClick={this.scrollToBottom.bind(this)} ref={(el) => { this.moreMessagesBelow = el; }} id={'moreMessagesBelow'}>
            <div>More Messages Below.</div>
          </div> :
          <div></div>
        }
        {/* Chat input */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '10px 25px 135px 25px 1fr',
          gridColumnGap: '1rem',
          marginTop: '5px',
          // border: '1px solid white'
        }}>
          <div></div>
          <div></div>
          <div style={{ marginTop: '5px' }}>
            {channelSelect}
          </div>
          <div style={{ marginTop: '13px' }}>
            <ChatMenu clearChat={this.clearChat.bind(this)}/>
            {/* <ClearAll onClick={this.clearChat.bind(this)} /> */}
          </div>
          <div>
            {textAreaChat}
          </div>
        </div>
      </div >
    )
  }
}

// Specifies the default values for props:
Chat.defaultProps = {
  twitch_emotes_map: twitch_emotes_map,
  bttv_emotes_map: bttv_emotes_map,
};

function mapStateToChat(state) {
  return {
    channels: state.channelsReducer.channels
  }
}

Chat = connect(mapStateToChat)(Chat)

export default Chat