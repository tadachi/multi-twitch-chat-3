import React, { Component } from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import { joinChannel, leaveChannel } from '../actions/channelActions'

import { List, ListItem } from 'material-ui/List';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';

const COMPONENT_NAME = 'ChannelManager'

class ChannelManager extends Component {
  constructor(props) {
    super(props)

    this.state = {
      streams: new Map(),
      responseCache: null
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

        this.props.mtcEE.emitEvent(`updateStreamersEvent`);

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