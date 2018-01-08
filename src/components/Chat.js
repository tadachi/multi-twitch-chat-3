import React, { Component } from 'react'
import ReactHtmlParser from 'react-html-parser';
import { connect } from 'react-redux'
import moment from 'moment'
import twitch_emotes from '../emotes/twitch_emotes'
import bttv_emotes from '../emotes/bttv_emotes'

import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';

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
      channel: 0
    }
    this.channel_counter = 0
    this.regex_channel = /\/\#\S+|\S+\ +/ //['/#Tod', /#Tod    '] OK ['#Tod', '#Tod  '] Not OK.
  }

  componentDidMount() {
    this.chatScroll.addEventListener('scroll', this.handleChatScroll.bind(this))
    let component = this

    this.props.client.on("part", (channel, username, self) => {
      this.forceUpdate()
    });

    this.props.client.on("join", (channel, username, self) => {
      if (username === this.props.client.username) {
        this.forceUpdate()
      }
    });

    this.props.client.on("chat", (channel, userstate, message, self) => {
      let m = `<span style="opacity: 0.8; font-size: 10px; font-weight: bold;">${moment().format('h:mm:ss')} ${channel}</span>
        <span style="color: ${userstate['color']}"> ${userstate['display-name']}</span>:
                ${component.parseForEmotes(message)}`
      // console.log(m)
      component.processMessage(channel, m)

      if (this.state.scrollToEnd) {
        component.scrollToBottom()
      }
    });
  }

  componentWillUnmount() {
    this.chatScroll.removeEventListener('scroll', this.handleChatScroll.bind(this))
  }

  processMessage(channel, message) {
    let backgroundColor = 'black'

    if (this.props.channels.get(channel)) {
      backgroundColor = { backgroundColor: this.props.channels.get(channel).color }
    }

    let new_messages = this.state.messages

    new_messages.push(
      <div style={{ ...ChatCSS.line, ...backgroundColor }} channel={channel} key={this.state.messages.length}>
        {ReactHtmlParser(message)}
      </div>
    )

    this.setState({
      messages: new_messages
    })
  }

  parse(message) {
    return message.replace(this.regex_channel, '') // Remove the '/#Macaw45', '/#Landail' etc from the message
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

  parseForChannel(message) {
    const m = message.match(this.regex_channel)
    if (m) {
      return m[0].substr(1)
    }
    return m
  }

  scrollToBottom() {
    this.messagesEnd.scrollIntoView({ behavior: "instant" })
  }

  sendMessage(event) {
    const message = this.messageInput.value
    let channel = ''
    let new_your_messages = this.state.your_messages
    let parsedMessage = ''

    if (event.key === 'Enter') {
      event.preventDefault() // Prevents newlines from occuring in the text area

      if (message === '') { return }
      channel = this.parseForChannel(message)
      if (channel === '#' || channel === undefined) { return }
      parsedMessage = this.parseForEmotes(message)

      let m = `<span style="opacity: 0.8; font-size: 10px; font-weight: bold;">${moment().format('h:mm:ss')} ${channel}</span>
        <span style="color: ${'white'}"> ${this.props.client.getUserName}</span>:
        ${parsedMessage}`

      if (parsedMessage !== '') {
        new_your_messages.push(parsedMessage)
        this.setState({
          your_messages: new_your_messages
        })
      }

      this.props.client.say(channel, this.parse(message)).then(function (data) {
        console.log(`${channel} ${this.parse(message)}`)
      }).catch(function (err) {
        console.log(err)
      });

      this.messageInput.value = ''
      console.log(this.state)
      return
    }
  }

  switchChannel(event) {
    // this.last_message = this.messageInput.value
    let temp_channels_array = Array.from(this.props.channels.keys())
    let temp_channels_joined = Array.from(this.props.channels.values())
    let channel = ''
    if (event.key === 'ArrowUp') {
      console.log(this.channel_counter)
      if (temp_channels_array.length !== temp_channels_joined.length) {
        throw Error('Channels length and joined are not aligned.')
      }
      if (temp_channels_array.length <= 0 || temp_channels_array.length <= 0) { return }
      if (this.channel_counter >= temp_channels_array.length) {
        this.channel_counter = 0
      }
      if (temp_channels_joined[this.channel_counter].joined === true) {
        channel = temp_channels_array[this.channel_counter]
        this.messageInput.value = `/${channel} `
      } else {
        this.messageInput = ''
      }

      this.channel_counter += 1
      return
    }

  }

  handleChatScroll() {
    if (this.chatScroll.scrollHeight - this.chatScroll.scrollTop === this.chatScroll.clientHeight) {
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

  handleChange = (event, index, value) => this.setState({channel: value});

  render() {
    const channels = Array.from(this.props.channels.keys()).sort() //['#destiny', '#twitchpresents', '#agdqmarathon'] sorts to ['#agdqmarathon', '#twitchpresents', #destiny]
    let joined_channels = []
    for (let i = 0; i < channels.length; i++) {
      if (this.props.channels.get(channels[i]).joined === true) {
        joined_channels.push(<MenuItem value={i} key={i} primaryText={channels[i]} />)
      }
    }
    return (
      <div style={ChatCSS.container}>
        <div style={ChatCSS.chat} ref={(el) => { this.chatScroll = el }} className={'scrollbar'} id={'chat'}>
          <div>
            {this.state.messages}
          </div>
          <div id={'endOfChat'} ref={(el) => { this.messagesEnd = el }}>
          </div>
        </div>
        {(channels.length > 0) ?
          <DropDownMenu style={ChatCSS.dropDown} listStyle={{padding:'0', margin: '0'}} value={this.state.channel} onChange={this.handleChange}>
            {joined_channels}
          </DropDownMenu> :
          <div></div>
        }
        {(this.state.scrollToEnd === false) ?
          <div style={ChatCSS.moreMessagesBelow} onClick={this.scrollToBottom.bind(this)} ref={(el) => { this.moreMessagesBelow = el; }} id={'moreMessagesBelow'}>
            <div style={{ display: 'inline-block', verticalAlign: 'middle', opacity: '1.0' }}>More Messages Below.</div>
          </div> :
          <div></div>
        }
        <textarea ref={(el) => { this.messageInput = el }} placeholder="Send a message.." style={ChatCSS.chatInput} onKeyPress={this.sendMessage.bind(this)} onKeyDown={this.switchChannel.bind(this)}>
        </textarea>
      </div>
    )
  }
}

// Specifies the default values for props:
Chat.defaultProps = {
  twitch_emotes_map: twitch_emotes_map,
  bttv_emotes_map: bttv_emotes_map
};

const w = 300
const h = 500
const mMB = 20
const cI = 40
const p = 20
const dD = 70

let ChatCSS = {
  container: {
    position: 'relative',
    width: `${w}px`,
    height: `${h}px`,
    padding: `${p}px ${p}px ${p}px ${p}px`,
    border: '1px solid DimGrey',
  },
  chat: {
    width: 'inherit',
    height: `${h - cI - dD}px`,
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
    top: `${h - mMB - p - 10 - dD}px`,
    left: `${p}px`,
    right: '0',
    bottom: '0',
    width: `${w - 2}px`,
    height: '20px',
    opacity: '.45',
    backgroundColor: 'black',
    border: '1px solid DimGrey',
    color: 'white',
    textAlign: 'center',
  },
  chatInput: {
    verticalAlign: 'top', // Fixes extra 6px gap
    width: `${w}px`,
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
    width: `${w/2}px`,
    padding: 0,
    marginTop: '10px',
  }
}

function mapStateToChat(state) {
  return {
    channels: state.channelsReducer.channels
  }
}

Chat = connect(mapStateToChat)(Chat)

export default Chat