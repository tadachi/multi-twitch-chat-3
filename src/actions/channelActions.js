export const JOIN_CHANNEL = 'JOIN_CHANNEL'
export const LEAVE_CHANNEL = 'LEAVE_CHANNEL'
export const REMOVE_CHANNEL = 'REMOVE_CHANNEL'


// Joins the channel
export function joinChannel(channel) {
  return {
    type: JOIN_CHANNEL,
    channel: channel
  }
}
// Leaves the channel
export function leaveChannel(channel) {
  return {
    type: LEAVE_CHANNEL,
    channel: channel
  }
}

export function removeChannel(channel) {
  return {
    type: REMOVE_CHANNEL,
    channel: channel
  }
}