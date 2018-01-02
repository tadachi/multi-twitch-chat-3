import web_safe_colors from '../web_safe_colors'

const max_length = web_safe_colors.length

// state={...} are default values
const channelReducer = (state = { channels: new Map() }, actions) => {
  switch (actions.type) {
    case 'JOIN_CHANNEL': {
      let new_channels = state.channels

      // Keep track of the color
      if (state.channels.get(actions.channel)) { // e.g '#werster, undefined, etc
        const color = state.channels.get(actions.channel).color
        console.log(color)
        new_channels = state.channels.set(actions.channel, {joined: true, color: color})
      } else {
        const new_color = web_safe_colors[randomIntFromInterval(0, max_length)]
        new_channels = state.channels.set(actions.channel, {joined: true, color: new_color})
      }
      
      state = { channels: new_channels }
      break;
    }
    case 'LEAVE_CHANNEL': {
      let new_channels = state.channels

      // Keep track of the color
      if (state.channels.get(actions.channel)) {
        const color = state.channels.get(actions.channel).color
        new_channels = state.channels.set(actions.channel, {joined: false, color: color})
      } else {
        const new_color = web_safe_colors[randomIntFromInterval(0, max_length)]
        new_channels = state.channels.set(actions.channel, {joined: false, color: new_color})
      }
      
      state = { channels: new_channels }
      break;
    }
    default: {
      return state
    }
  }
  return state
}

function randomIntFromInterval(min,max) {
    return Math.floor(Math.random()*(max-min+1)+min);
}

export default channelReducer