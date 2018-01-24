import React, { Component } from 'react'
// Redux
import { joinChannel, leaveChannel } from '../../actions/channelActions'
import { connect } from 'react-redux'
// Material-ui
import { withStyles } from 'material-ui/styles'
import Paper from 'material-ui/Paper';
import IconButton from 'material-ui/IconButton'
import AddCircleOutline from 'material-ui-icons/AddCircleOutline'
import HighlightOff from 'material-ui-icons/HighlightOff'
// Utilties
import axios from 'axios'
import {jsonToMap} from '../../JsonMapUtil'
import {LOCAL_STORAGE, CHANNELS} from '../../localStorageWrapper'

String.prototype.clean = function () {
  return this.replace(/ /g, "_").toLowerCase();
}

const styles = {
  iconButton: {
    width: '15px',
    height: '15px',
  },
  joinIcon: {
    width: '20px',
    height: '20px',
  },
  leaveIcon: {
    color: 'red',
    width: '20px',
    height: '20px',
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
      50000
    )
    this.updateStreamersCachedTimerID = setInterval(
      () => {
        this.updateStreamersByCache()
      },
      5000
    )

    setTimeout(() => {
      if (this.state.loggedIn) {
        console.log(jsonToMap(localStorage.getItem(CHANNELS)))
        // this.join('#TwitchPresents')
        // this.join('#Cirno_TV')
        // this.join('#destiny')
        // this.join('#playhearthstone')
        // this.join('#Avilo')
        // this.join('#werster')

        this.join('#icarusFW')
        this.join('#Pasky')
        this.join('#Metako')
        this.join('#landail')
        this.join('#DarkSaber2k')
        this.join('#maurice_33')
        this.join('#Aquas')
        this.join('#Fiercekyo')
        this.join('#mulsqi')
        this.join('#bafael')
        this.join('#theboyks')
        this.join('#artosis')
        this.join('#Raikou')
        this.join('#perpetualmm')
        this.join('#Bingchang')
        this.join('#frokenok')
        this.join('#vultus')
        this.join('#neohart')
        this.join('#zetsubera')
        this.join('#procplays')
        this.join('#lazerlong')
        this.join('#testrunner')
        this.join('#jiseed')
        this.join('#xxxindyxxx')
        this.join('#narcissawright')
        this.join('#Goati_')
        this.join('#TheLCC')
        this.join('#azureseishin')
        this.join('#pykn')
        this.join('#jiggeh')
        this.join('#chuboh')
        this.join('#UFotekkie')
        this.join('#Ty2358')
        this.join('#sakegeist')
        this.join('#klaige')
        this.join('#Go1den')
        this.join('#capnclever')
        this.join('#omnigamer')
        this.join('#sylux98')
        this.join('#swordsmankirby')
        this.join('#Macaw45')
        this.join('#freddeh')
        this.join('#ghou02')
        this.join('#tterraj42')
        this.join('#superKing13')
      }
    }, 4000)

    //mtcEE events
    // Sync this.props.channels with network streams
    this.props.mtcEE.on('updateStreamersByNetworkEvent', (streams) => {
      if(this.props.channels) {
        console.log(this.props.channels)
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
          if (stay === false) {
            console.log(joined)
            console.log(`Leaving ${channel_key} because it went offline`)
            this.leave(channel_key.clean())
          }
        }
      }
    })
    // this.props.mtcEE.on('sendJoinedChannelsEvent', (joined_channels) => {
    // })
  }

  componentWillUnmount() {
    clearInterval(this.updateStreamersTimerID);
    // clearInterval(this.updateStreamersCachedTimerID);
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
      .catch(function (err) {
        return undefined
      })
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
      // Remove channels that are offline.
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