import React, { Component } from 'react'
import ReactHtmlParser from 'react-html-parser';
import { connect } from 'react-redux'
import moment from 'moment'
import twitch_emotes from '../emotes/twitch_emotes'
import bttv_emotes from '../emotes/bttv_emotes'
import MenuItem from 'material-ui/Menu/MenuItem';
import Select from 'material-ui/Select';


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
      channels: Array.from(this.props.channels.keys()).sort(),
      channel: 0,
    }
    this.last_channel_used = ''
    this.channels = []
    this.regex_channel = /\/\#\S+|\S+\ +/ //['/#Tod', /#Tod    '] OK ['#Tod', '#Tod  '] Not OK.
  }

  componentDidMount() {
    this.chatScroll.addEventListener('scroll', this.handleChatScroll.bind(this))

    this.props.client.on('join', (channel, username, self) => {
      if (username === this.props.client.username) {
        this.setState({
          channel: 0
        })
      }
    });

    this.props.client.on('part', (channel, username, self) => {
      this.setState({
        channel: 0
      })
    });

    this.timerID = setInterval(
      () => this.truncateMessages(),
      100000
    )

    this.props.client.on('chat', (channel, userstate, message, self) => {
      let m = `<span style="opacity: 0.8; font-size: 10px; font-weight: bold;">${moment().format('h:mm:ss')} ${channel}</span>
        <span style="color: ${userstate['color']}"> ${userstate['display-name']}</span>:
                ${this.parseForEmotes(message)}`
      // console.log(m)
      this.processMessage(channel, m)

      if (this.state.scrollToEnd) {
        this.scrollToBottom()
      }
    });

    window.addEventListener("resize", this.updateDimensions.bind(this));

    console.log(this.state.width)
    console.log(this.state.height)
  }

  componentWillUnmount() {
    // Clear listeners and intervals
    this.chatScroll.removeEventListener('scroll', this.handleChatScroll.bind(this))
    window.removeEventListener("resize", this.updateDimensions.bind(this));
    clearInterval(this.timerID);
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
    const new_msg_id = this.state.msg_id += 1
    if (this.props.channels.get(channel)) {
      backgroundColor = { backgroundColor: this.props.channels.get(channel).color }
    }

    let new_messages = this.state.messages

    new_messages.push(
      <div style={{ ...backgroundColor }} channel={channel} key={this.state.msg_id}>
        {ReactHtmlParser(message)}
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
        split_message[i] = `<img height="25" width="22" src=${twitch_emotes_map.get(code)} />`
      }
      if (this.props.bttv_emotes_map.has(code)) {
        split_message[i] = `<img height="25" width="22" src=${bttv_emotes_map.get(code)} />`
      }
    }

    return split_message.join(' ');
  }

  sendMessage(event) {
    const message = this.messageInput.value
    let channel = this.channels[this.state.channel]
    let new_your_messages = this.state.your_messages
    let parsedMessage = ''

    if (event.key === 'Enter') {
      event.preventDefault() // Prevents newlines from occuring in the text area

      if (message === '') { return }
      // channel = this.parseForChannel(message)
      // if (channel === '#' || channel === undefined) { return }
      // parsedMessage = this.parseForEmotes(message)

      let m = `<span style="opacity: 0.8; font-size: 10px; font-weight: bold;">${moment().format('h:mm:ss')} ${channel}</span>
        <span style="color: ${'white'}"> ${this.props.client.getUserName}</span>:
        ${parsedMessage}`

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
      return
    }
  }

  switchChannel(event) {
    // let temp_channels_array = Array.from(this.props.channels.keys())
    // let temp_channels_joined = Array.from(this.props.channels.values())
    // let channel = ''
    let new_c = this.state.channel

    if (event.key === 'ArrowUp') {
      if (this.state.channel < this.channels.length - 1) {
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
      if (this.state.channel < this.channels.length && this.state.channel > 0) {
        new_c -= 1
        this.setState({
          channel: new_c
        })
      } else {
        new_c = this.channels.length - 1
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
    // console.log(`${this.chatScroll.scrollHeight} - ${Math.ceil(this.chatScroll.scrollTop)} = ${this.chatScroll.scrollHeight - Math.ceil(this.chatScroll.scrollTop)} ?== ${this.chatScroll.clientHeight}`)
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

  render() {
    this.channels = Array.from(this.props.channels.keys()).sort() //['#destiny', '#twitchpresents', '#agdqmarathon'] sorts to ['#agdqmarathon', '#twitchpresents', #destiny]
    let joined_channels = []
    for (let i = 0; i < this.channels.length; i++) {
      if (this.props.channels.get(this.channels[i]).joined === true) {
        joined_channels.push(<option style={{ backgroundColor: 'black' }} value={i} key={this.channels[i]}>{this.channels[i]}</option>)
      }
    }
    // console.log(joined_channels)
    const drawerWidth = this.props.drawerWidth + 20
    const w = this.state.width - drawerWidth
    const h = this.state.height
    const chatH = 50

    const channelSelect = joined_channels.length > 0 ?
      <Select onChange={this.handleChange('channel')} style={{ color: 'white', width: '80%', }} value={this.state.channel} native>
        {joined_channels}
      </Select> :
      <Select style={{ color: 'white', width: '80%', cursor: 'not-allowed', }} value={this.state.channel} native disabled>
        {joined_channels}
      </Select>

    const textAreaChat = joined_channels.length > 0 ?
      <textarea style={{ color: 'white', width: '80%', height: `${chatH}px`, backgroundColor: 'black', resize: 'none', overflowX: 'hidden' }}
        ref={(el) => { this.messageInput = el }} placeholder={`Send a message to ${this.channels[this.state.channel]}..`}
        onKeyPress={this.sendMessage.bind(this)} onKeyDown={this.switchChannel.bind(this)}>
      </textarea> :
      <textarea style={{ color: 'white', width: '80%', height: `${chatH}px`, backgroundColor: 'black', resize: 'none', overflowX: 'hidden' }}
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
        <div style={{ textAlign: 'center', }}></div>
        <div style={{ display: 'flex', flexDirection: 'row', width: '100%', height: `${chatH}px` }}>
          <div style={{ flexGrow: 1, margin: '0px 0px 0px 40px' }}>
            {channelSelect}
          </div>
          <div style={{ flexGrow: 4, margin: '5px 5px 5px 5px' }}>
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