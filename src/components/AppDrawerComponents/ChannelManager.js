import React, { Component } from 'react'
// Redux
import { joinChannel, leaveChannel, addChannel } from '../../actions/channelActions'
import { connect } from 'react-redux'
// Material-ui
import { withStyles } from 'material-ui/styles'
import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton'
import AddCircleOutline from 'material-ui-icons/AddCircleOutline'
import HighlightOff from 'material-ui-icons/HighlightOff'
// Utilties
import axios from 'axios'
import { jsonToMap } from '../../util/JsonMapUtil'
import { LOCAL_STORAGE, CHANNELS } from '../../util/localStorageWrapper'
import moment from 'moment'

String.prototype.clean = function () {
  return this.replace(/ /g, "_").toLowerCase();
}

const styles = {
  iconButton: {
    width: '15px',
    height: '15px',
  },
  joinIcon: {
    color: 'white',
    width: '20px',

  },
  leaveIcon: {
    color: 'red',
    width: '20px',
  }
}

/**
 * ChannelManager
 * 
 * Manages channels.
 */
class ChannelManager extends Component {
  constructor(props) {
    super(props)

    this.state = {
      streams: new Map(),
      responseCache: null,
      loggedIn: false,
    }
  }

  componentDidMount() {
    // Listeners
    this.props.client.on("join", (channel, username, self) => {
      if (username === this.props.client.username) {
        console.log(`${username} has joined ${channel}!`)
      }
    });

    this.props.client.on("connected", (address, port) => {
      this.setState({
        loggedIn: true
      })
      console.log(address + ':' + port)
      // Initial updateStreamers
      this.updateStreamers()
    });

    this.props.client.on("disconnected", (reason) => {
      this.setState({
        loggedIn: false
      })
      console.log(`disconnected from server. Reason: ${reason}`)
    });

    this.updateStreamersTimerID = setInterval(
      () => {
        if (this.state.loggedIn) {
          this.updateStreamers()
        }
      },
      120000 // 2 minutes or 120 seconds
    )
    this.updateStreamersCachedTimerID = setInterval(
      () => {
        this.updateStreamersByCache()
      },
      5000 // 5 seconds
    )

    setTimeout(() => {
      if (this.state.loggedIn) {
        if (LOCAL_STORAGE.getItem(CHANNELS)) {
          console.log(jsonToMap(LOCAL_STORAGE.getItem(CHANNELS)))
          try {
            const channels = jsonToMap(LOCAL_STORAGE.getItem(CHANNELS))
            for (const [k, v] of channels.entries()) {
              if (v.joined === true) {
                this.join(k) // k => #TwitchPresents'...
              } else {
                this.props.dispatch(addChannel(k))
              }
            }
          } catch (error) {
            console.log(error)
          }
        }
      }
    }, 5000)

    // mtcEE events
    // Sync this.props.channels with network streams
    this.props.mtcEE.on('updateStreamersByNetworkEvent', (streams) => {
      if (this.props.channels) {
        for (const [channel_key, value] of this.props.channels.entries()) {
          const joined = value.joined
          let stay = true
          for (const stream of streams) {
            if (channel_key === stream) {
              stay = true
              break
              // Everything is good
            } else {
              stay = false
            }
          }
          if (stay === false && joined === true) {
            console.log(`[${moment().format('h:mm:ss')}] Leaving ${channel_key} because it went offline`)
            this.leave(channel_key.clean())
          }
        }
      }
    })
  }

  componentWillUnmount() {
    clearInterval(this.updateStreamersTimerID);
    clearInterval(this.updateStreamersCachedTimerID);
  }

  async updateStreamers() {
    let config = {
      url: 'streams/followed',
      method: 'get',
      baseURL: 'https://api.twitch.tv/kraken',
      headers: { 'Accept': 'application/vnd.twitchtv.v5+json', 'Authorization': `OAuth ${this.props.oAuth}` },
      params: { limit: 100 }
    }

    const req = await axios.request(config)
      .then((response) => {
        let new_streams = new Map()

        this.setState({
          responseCache: response,
        })

        response.data.streams.map((stream) => {
          const displayName = `#${stream.channel.display_name}`
          const name = `#${stream.channel.name.clean()}`
          const game = stream.game
          const viewers = stream.viewers
          const status = stream.channel.status
          let joined = false
          let color = '#000000'

          if (this.props.channels.has(name)) {
            joined = this.props.channels.get(name).joined
            joined === true ? color = this.props.channels.get(name).color : color = '#000000'
          }

          const button = joined ?
            <IconButton className='material-icons' classes={{ root: this.props.classes.iconButton }}>
              <HighlightOff classes={{ root: this.props.classes.leaveIcon }} onClick={this.leave.bind(this, name)} />
            </IconButton> :
            <IconButton className='material-icons' classes={{ root: this.props.classes.iconButton }}>
              <AddCircleOutline classes={{ root: this.props.classes.joinIcon }} onClick={this.join.bind(this, name)} />
            </IconButton>

          new_streams.set(
            name.clean(),
            <Paper style={{ ...ChannelManagerCSS.item, backgroundColor: color }} key={name}>
              <div style={ChannelManagerCSS.streamer}>{displayName}</div>
              <div style={{ textAlign: 'right', fontSize: '10px' }} >
                {button}
              </div>
              {(stream.game !== '' && stream.game !== undefined) ?
                <div style={ChannelManagerCSS.game}>{game}</div> :
                <div style={ChannelManagerCSS.game}>N/A</div>}
              <div></div>
              <div style={ChannelManagerCSS.status}>{status}</div>
              <div style={ChannelManagerCSS.viewers}>{viewers}</div>
            </Paper>
          )
          return new_streams
        })

        this.setState({
          streams: new_streams,
        })

        this.props.mtcEE.emitEvent(`updateStreamersByNetworkEvent`, [Array.from(new_streams.keys())]);

        return this.state.streams
      }).catch(function (err) {
        console.log(err)
        return undefined
      })

    return req
  }

  updateStreamersByCache() {
    let new_streams = new Map()

    if (this.state.responseCache) {
      this.state.responseCache.data.streams.map((stream) => {
        const displayName = `#${stream.channel.display_name}`
        const name = `#${stream.channel.name.clean()}`
        const game = stream.game
        const viewers = stream.viewers
        const status = stream.channel.status
        let joined = false
        let color = '#000000'

        if (this.props.channels.has(name)) {
          joined = this.props.channels.get(name).joined
          joined === true ? color = this.props.channels.get(name).color : color = '#000000'
        }

        const button = joined ?
          <IconButton className='material-icons' classes={{ root: this.props.classes.iconButton }}>
            <HighlightOff classes={{ root: this.props.classes.leaveIcon }} onClick={this.leave.bind(this, name)} />
          </IconButton> :
          <IconButton className='material-icons' classes={{ root: this.props.classes.iconButton }}>
            <AddCircleOutline classes={{ root: this.props.classes.joinIcon }} onClick={this.join.bind(this, name)} />
          </IconButton>

        new_streams.set(
          name.clean(),
          <Paper style={{ ...ChannelManagerCSS.item, backgroundColor: color }} key={name}>
            <div style={ChannelManagerCSS.streamer}>{displayName}</div>
            <div style={{ textAlign: 'right', fontSize: '10px' }} >
              {button}
            </div>
            {(stream.game !== '' && stream.game !== undefined) ?
              <div style={ChannelManagerCSS.game}>{game}</div> :
              <div style={ChannelManagerCSS.game}>N/A</div>}
            <div></div>
            <div style={ChannelManagerCSS.status}>{status}</div>
            <div style={ChannelManagerCSS.viewers}>{viewers}</div>
          </Paper>
        )

        return new_streams
      })

      this.setState({
        streams: new_streams,
      })

      this.props.mtcEE.emitEvent(`updateStreamersByCacheEvent`, [Array.from(new_streams.keys())]);
    }
  }

  join(channel) {
    channel = channel.clean()
    if (this.state.streams.get(channel)) {
      this.props.client.join(channel).then((data) => {
        // Only join channels that are online
        this.props.dispatch(joinChannel(channel))

        this.updateStreamersByCache()

        this.props.mtcEE.emitEvent('joinChannelEvent', [channel])
      }).catch(function (err) {
        console.error(err)
      });
    } else {
      console.log(`${channel} not found/online. Will not join.`)
    }
  }

  leave(channel) {
    channel = channel.clean()
    if (this.props.channels.get(channel)) {
      this.props.client.part(channel).then((data) => {

        this.props.dispatch(leaveChannel(channel))

        this.updateStreamersByCache()

        this.props.mtcEE.emitEvent('leaveChannelEvent', [channel])
      }).catch(function (err) {
        console.error(err)
      });
    }
  }

  render() {
    let html = Array.from(this.state.streams.values())
    return (
      <div>
        {html}
      </div>
    )
  }
}

let ChannelManagerCSS = {
  item: {
    display: 'grid',
    gridTemplateColumns: '75% 25%',
    gridTemplateRows: '75% 25%',
    border: '1px solid white',
    margin: '2%',
    padding: '2%',
  },
  streamer: {
    fontSize: '12px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  game: {
    fontSize: '11px',
    fontStyle: 'italic',
    opacity: '0.8',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  viewers: {
    fontSize: '9px',
    opacity: '0.8',
    textAlign: 'right',
  },
  status: {
    fontSize: '10px',
    fontStyle: 'italic',
    opacity: '0.5',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
}


function mapStateToChannelManager(state) {
  return {
    channels: state.channelsReducer.channels
  }
}

ChannelManager = connect(mapStateToChannelManager)(ChannelManager)

export default withStyles(styles)(ChannelManager);