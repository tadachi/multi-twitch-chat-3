import React, { Component } from 'react'
import { connect } from 'react-redux'
import axios from 'axios'
import { joinChannel, leaveChannel } from '../../actions/channelActions'

import { withStyles } from 'material-ui/styles'
import IconButton from 'material-ui/IconButton'
import AddCircleOutline from 'material-ui-icons/AddCircleOutline'
import HighlightOff from 'material-ui-icons/HighlightOff'

const COMPONENT_NAME = 'ChannelManager'

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
      // this.join('#TwitchPresents')
      // this.join('#Cirno_TV')
      // this.join('#Goati_')
      // this.join('#TheLCC')
      // this.join('#Avilo')
      // this.join('#landail')
      // this.join('#werster')
      this.join('#Aquas')
      this.join('#Fiercekyo')
      this.join('#Raikou')
      this.join('#vultus')
      this.join('#neohart')
      this.join('#zetsubera')
      this.join('#procplays')
      this.join('#azureseishin')
      this.join('#pykn')
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
        let new_streams = new Map()

        this.setState({
          responseCache: response,
        })

        response.data.streams.map((stream) => {
          const displayName = `#${stream.channel.display_name}`
          const game = stream.game
          const viewers = stream.viewers
          const status = stream.channel.status

          let joined = false
          if (this.props.channels.has(displayName.toLowerCase())) {
            joined = this.props.channels.get(displayName.toLowerCase()).joined
            // joined === true ? color.backgroundColor = ch.color : color.backgroundColor = '#000000'
          }

          const button = joined ?
            <IconButton className='material-icons' classes={{ root: this.props.classes.iconButton }}>
              <HighlightOff classes={{ root: this.props.classes.leaveIcon }} onClick={this.leave.bind(this, displayName.toLowerCase())} />
            </IconButton> :
            <IconButton className='material-icons' classes={{ root: this.props.classes.iconButton }}>
              <AddCircleOutline classes={{ root: this.props.classes.joinIcon }} onClick={this.join.bind(this, displayName.toLowerCase())} />
            </IconButton>

          new_streams.set(
            displayName,
            <div style={ChannelManagerCSS.item} key={displayName.toLowerCase()}>
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
            </div >
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
        const displayName = `#${stream.channel.display_name}`
        const game = stream.game
        const viewers = stream.viewers
        const status = stream.channel.status

        let joined = false

        if (this.props.channels.has(displayName.toLowerCase())) {
          joined = this.props.channels.get(displayName.toLowerCase()).joined
          // joined === true ? color.backgroundColor = ch.color : color.backgroundColor = '#000000'
        }

        const button = joined ?
          <IconButton className='material-icons' classes={{ root: this.props.classes.iconButton }}>
            <HighlightOff classes={{ root: this.props.classes.leaveIcon }} onClick={this.leave.bind(this, displayName.toLowerCase())} />
          </IconButton> :
          <IconButton className='material-icons' classes={{ root: this.props.classes.iconButton }}>
            <AddCircleOutline classes={{ root: this.props.classes.joinIcon }} onClick={this.join.bind(this, displayName.toLowerCase())} />
          </IconButton>

        new_streams.set(
          displayName,
          <div style={ChannelManagerCSS.item} key={displayName.toLowerCase()}>
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
          </div >
        )
        return true
      })

      this.setState({
        streams: new_streams,
      })

      this.props.mtcEE.emitEvent(`updateStreamersByCacheEvent`);
    }


  }

  join(channel) {
    this.props.client.join(channel).then((data) => {

      this.props.dispatch(joinChannel(channel.toLowerCase()))

      this.updateStreamersByCache()

    }).catch(function (err) {
      console.error(err)
    });

    this.props.mtcEE.emitEvent('joinChannelByNetworkEvent', { component: COMPONENT_NAME, channel: channel })
  }

  leave(channel) {
    this.props.client.part(channel).then((data) => {

      this.props.dispatch(leaveChannel(channel))

      this.updateStreamersByCache()

    }).catch(function (err) {
      console.error(err)
    });

    this.props.mtcEE.emitEvent('leaveChannelEvent', { component: COMPONENT_NAME, channel: channel })
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
  container: {
  },
  item: {
    backgroundColor: 'black',
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