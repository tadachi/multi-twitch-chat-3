import React, { Component } from 'react'
import ReactHtmlParser from 'react-html-parser';
import { connect } from 'react-redux'
import moment from 'moment'
import twitch_emotes from '../emotes/twitch_emotes'
import bttv_emotes from '../emotes/bttv_emotes'

import '../App.css'
import {List, ListItem} from 'material-ui/List';

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
    }
  }

  componentDidMount() {
    let component = this
    this.props.client.on("chat", (channel, userstate, message, self) => {
      let m = `<span style="opacity: 0.8; font-size: 10px; font-weight: bold;">${moment().format('h:mm:ss')} ${channel}</span>
        <span style="color: ${userstate['color']}"> ${userstate['display-name']}</span>:
                ${component.parseForEmotes(message)}`
      console.log(m)
      const backgroundColor = { backgroundColor: this.props.channels.get(channel).color }
      console.log(component.state)
      let new_messages = component.state.messages
      new_messages.push(
        <ListItem style={{...ChatCSS.line,...backgroundColor}} channel={channel} key={component.state.messages.length}>
          {ReactHtmlParser(m)}
        </ListItem>
      )
      component.setState({
        messages: new_messages
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