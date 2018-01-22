import React, { Component } from 'react'
import ReactHtmlParser from 'react-html-parser';
import { connect } from 'react-redux'
import moment from 'moment'
import axios from 'axios'

// Material-ui
import Select from 'material-ui/Select';
import Settings from 'material-ui-icons/Settings'
import ClearAll from 'material-ui-icons/ClearAll'

// Utility
import twitch_emotes from '../emotes/twitch_emotes'
import bttv_emotes from '../emotes/bttv_emotes'

import '../App.css'
// import { List, ListItem } from 'material-ui/List';

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


let ffz_emotes_map = new Map()

async function getFFZ(name) {
  let config = {
    url: `room/${name}`,
    method: 'get',
    baseURL: 'https://api.frankerfacez.com/v1/',
    params: { limit: 100 }
  }
  
  const req = await axios.request(config).then((response) => {
    console.log(response.data.room)
    return response
  })

  return req
}

let response = getFFZ('landail')



class Chat extends Component {
  constructor(props) {
    super(props)

    this.state = {
      messages: [],
      your_messages: [],
      scrollToEnd: true,
      msg_id: 0,
      width: window.innerWidth,
      height: window.innerHeight - 10,
      channels: Array.from(props.channels.keys()).sort(),
      channel: 0,
      joined_channels: []
    }
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
      () => this.truncateMessages(),
      100000
    )

    this.props.client.on('chat', (channel, userstate, message, self) => {
      let m = <div style={{ marginLeft: '5px', padding: 0, }}>
        <span style={{
          opacity: '0.8', fontSize: '10px', fontWeight: 'bold',
          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>
          {moment().format('h:mm:ss')} {channel}
        </span>
        <span style={{ color: `${userstate['color']}`, marginLeft: '2px', }}>{userstate['display-name'] + ': '} </span>
        <span style={{}}>{this.parseForEmotes(message)}</span>
      </div>

      this.processMessage(channel, m)

      if (this.state.scrollToEnd) {
        this.scrollToBottom()
      }
    });

    window.addEventListener("resize", this.updateDimensions.bind(this));

    // mtcEE events
    let update = () => {
      this.setState({
        channels: Array.from(this.props.channels.keys()).sort(),
      })
      let new_joined_channels = []
      const channels = this.state.channels
      let i = 0
      for (const channel of channels) {
        if (this.props.channels.get(channel).joined)
          new_joined_channels.push(<option style={{ backgroundColor: 'black' }} value={i} key={channel}>{channel}</option>)
        i++
      }
      this.setState({
        channels: Array.from(this.props.channels.keys()).sort(),
        joined_channels: new_joined_channels
      })
      console.log(this.props.channels)
    }
    this.props.mtcEE.on('joinChannelEvent', (channel) => {
      update()
    })
    this.props.mtcEE.on('leaveChannelEvent', (channel) => {
      update()
    })
    this.props.mtcEE.on('updateStreamersByNetworkEvent', (channels) => {
      // Use the network event to leave/remove those channels when streamers go offline, 
      // console.log(channels)
    })
    this.props.mtcEE.on('updateStreamersByCache', (channels) => {
      console.log(channels)
    })

    // this.updateChannelsID = setInterval(
    //   () => {
    //     this.props.mtcEE.emit('sendJoinedChannelsEvent', [this.props.channels])
    //   },
    //   10000
    // )
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
    if (truncated_messages.length > 2000) {
      truncated_messages.splice(0, 1000)
      console.log(truncated_messages)

      this.setState({
        messages: truncated_messages
      })

    }
  }

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

  parseForEmotes(message) {
    let split_message = message.split(' ')
    for (let i in split_message) {
      const code = split_message[i]
      if (this.props.twitch_emotes_map.has(code)) {
        split_message[i] = `<img style='vertical-align: middle; padding: 1px;' height='30' width='26' src=${twitch_emotes_map.get(code)} />`
      }
      if (this.props.bttv_emotes_map.has(code)) {
        split_message[i] = `<img style='vertical-align: middle; padding: 1px;' height='30' width='26' src=${bttv_emotes_map.get(code)} />`
      }
    }
    return ReactHtmlParser(split_message.join(' '));
  }

  sendMessage(event) {
    const message = this.messageInput.value
    let channel = this.state.channels[this.state.channel]
    let new_your_messages = this.state.your_messages
    let parsedMessage = ''

    if (event.key === 'Enter') {
      event.preventDefault() // Prevents newlines from occuring in the text area

      if (message === '') { return }

      if (parsedMessage !== '') {
        new_your_messages.push(parsedMessage)
        this.setState({
          your_messages: new_your_messages
        })
      }

      this.props.client.say(channel, message).then(function (data) {
        console.log(`${channel} ${message}`)
      }).catch(function (err) {
        console.log(err)
      });

      this.messageInput.value = ''

      this.scrollToBottom()
      return
    }
  }

  switchChannel(event) {
    let new_c = this.state.channel

    if (event.key === 'ArrowUp') {
      if (this.state.channel < this.state.channels.length - 1) {
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
      if (this.state.channel < this.state.channels.length && this.state.channel > 0) {
        new_c -= 1
        this.setState({
          channel: new_c
        })
      } else {
        new_c = this.state.channels.length - 1
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
    this.messagesEnd.scrollIntoView({ behavior: "instant" })
  }

  clearChat() {
    const messages = []
    const msg_id = 0
    this.setState({
      messages: messages,
      msg_id: msg_id
    })
  }

  render() {
    const drawerWidth = this.props.drawerWidth + 20
    const w = this.state.width - drawerWidth
    const h = this.state.height
    const chatH = 55

    const channelSelect = this.state.joined_channels.length > 0 ?
      <Select onChange={this.handleChange('channel')} style={{ color: 'white', width: '100%', }} value={this.state.channel} native>
        {this.state.joined_channels}
      </Select> :
      null

    const textAreaChat = this.state.joined_channels.length > 0 ?
      <textarea style={{ color: 'white', width: '65%', minWidth: '150px', height: `${chatH}px`, backgroundColor: 'black', resize: 'none', overflowX: 'hidden' }}
        ref={(el) => { this.messageInput = el }} placeholder={`Send a message to ${this.state.channels[this.state.channel]}..`}
        onKeyPress={this.sendMessage.bind(this)} onKeyDown={this.switchChannel.bind(this)}>
      </textarea> :
      <textarea style={{ color: 'white', width: '65%', minWidth: '150px', height: `${chatH}px`, backgroundColor: 'black', resize: 'none', overflowX: 'hidden' }}
        ref={(el) => { this.messageInput = el }} placeholder={`Join a channel to chat!`} disabled
      >
      </textarea>

    return (
      <div style={{ ...this.props.style, ...{ position: 'relative', width: `${w}px`, height: `${h}px`, overflowX: 'hidden', overflowY: 'hidden', border: '1px solid white', } }}>
        <div style={{ width: `${w}`, height: `${h - chatH - 30}px`, overflowY: 'scroll', overflowX: 'hidden', }} ref={(el) => { this.chatScroll = el }} id={'chat'}>
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
          alignItems: 'center',
        }}>
          <div></div>
          <div>
            {/* <Settings /> */}
          </div>
          <div>
            {channelSelect}
          </div>
          <div>
            <ClearAll onClick={this.clearChat.bind(this)} />
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