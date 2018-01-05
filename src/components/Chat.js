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
      your_messages: [],
      scrollToEnd: true,
      end: <div style={{ float: "left", clear: "both" }}
        ref={(el) => { this.messagesEnd = el; }}>
      </div>
    }
  }

  componentDidMount() {
    this.chatScroll.addEventListener('scroll', this.handleChatScroll.bind(this))
    // document.getElementById('chat').addEventListener('scroll', this.handleChatScroll)
    let component = this
    this.props.client.on("chat", (channel, userstate, message, self) => {
      let m = `<span style="opacity: 0.8; font-size: 10px; font-weight: bold;">${moment().format('h:mm:ss')} ${channel}</span>
        <span style="color: ${userstate['color']}"> ${userstate['display-name']}</span>:
                ${component.parseForEmotes(message)}`
      // console.log(m)
      const backgroundColor = { backgroundColor: this.props.channels.get(channel).color }

      let new_messages = component.state.messages

      new_messages.push(
        <div style={{ ...ChatCSS.line, ...backgroundColor }} channel={channel} key={component.state.messages.length}>
          {ReactHtmlParser(m)}
        </div>
      )

      component.setState({
        messages: new_messages
      })

      if (this.state.scrollToEnd) {
        component.scrollToBottom()
      }
    });
  }

  componentWillUnmount() {
    this.chatScroll.removeEventListener('scroll', this.handleChatScroll.bind(this))
    // document.getElementById('chat').removeEventListener('scroll', this.handleChatScroll)
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
    this.messagesEnd.scrollIntoView({ behavior: "instant" })
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

  render() {
    // const isScrollToEnd = this.state.scrollToEnd

    // let scrollToEndButton = null;
    // if (!isScrollToEnd && ) {
    //   scrollToEndButton =
    //     <div style={ChatCSS.moreMessagesBelow} onClick={this.scrollToBottom.bind(this)} ref={(el) => { this.moreMessagesBelow = el; }} id={'moreMessagesBelow'}>
    //       More Messages Below.
    //     </div>
    // } else {
    //   scrollToEndButton = null
    // }

    return (
      <div style={ChatCSS.container}>
        <div style={ChatCSS.chat} ref={(el) => { this.chatScroll = el; }} className={'scrollbar'} id={'chat'}>
          <div>
            {this.state.messages}
          </div>
          <div id={'endOfChat'} ref={(el) => { this.messagesEnd = el; }}>
          </div>
        </div>
        {(this.state.scrollToEnd === false) ?
          <div style={ChatCSS.moreMessagesBelow} onClick={this.scrollToBottom.bind(this)} ref={(el) => { this.moreMessagesBelow = el; }} id={'moreMessagesBelow'}>
            <div style={{ display: 'inline-block', verticalAlign: 'middle', opacity: '1.0'}}>More Messages Below.</div>
          </div> :
          <div></div>
        }

        <textarea placeholder="Send a message.." style={ChatCSS.chatInput}></textarea>
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
const p = 40

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
    height: `${h - cI}px`,
    backgroundColor: 'black',
    overflowY: 'scroll',
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
    top: `${h - mMB - 10}px`,
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
    width: `${w - 6}px`,
    height: '40px',
    overflow: 'hidden',
    resize: 'none',
    backgroundColor: 'black',
    color: 'white',
    border: '1px solid DimGrey',
  }
}

function mapStateToChat(state) {
  return {
    channels: state.channelsReducer.channels
  }
}

Chat = connect(mapStateToChat)(Chat)

export default Chat