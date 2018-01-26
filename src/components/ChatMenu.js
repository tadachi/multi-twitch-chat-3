import React from 'react';
import { connect } from 'react-redux'
// Material-ui
import Button from 'material-ui/Button';
import TextField from 'material-ui/TextField';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from 'material-ui/Dialog'
import Settings from 'material-ui-icons/Settings'
import Delete from 'material-ui-icons/Delete';
import Icon from 'material-ui/Icon';
import { withStyles } from 'material-ui/styles';
// Util
import { LOCAL_STORAGE, CHANNELS } from '../util/localStorageWrapper'
import { jsonToMap } from '../util/JsonMapUtil'

class ChatMenu extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      open: false,
    }
  }

  handleClickOpen = () => {
    this.setState({ open: true });
  }

  handleClose = () => {
    this.setState({ open: false });
  }

  componentDidMount() {

  }

  test() {
    console.log(this.props.channels)
    console.log(jsonToMap(LOCAL_STORAGE.getItem(CHANNELS)))
  }

  render() {

    return (
      <div>
        <Settings style={{ cursor: 'pointer', color: 'lightgrey' }} onClick={this.handleClickOpen} />
        <Dialog
          open={this.state.open}
          onClose={this.handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Settings</DialogTitle>
          <DialogContent>
            {/* <DialogContentText>
              To subscribe to this website, please enter your email address here. We will send
              updates occationally.
            </DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Email Address"
              type="email"
              fullWidth
            /> */}
            <Button raised dense color={'primary'} onClick={this.props.clearChat.bind(this)}>
              Clear My Chat
              <Delete />
            </Button>
          </DialogContent>
          {/* <DialogContent>
            <Button raised onClick={this.test.bind(this)}>
              Test
            </Button>
          </DialogContent> */}
          <DialogActions>
            <Button raised onClick={this.handleClose}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
}

function mapStateToChatMenu(state) {
  return {
    channels: state.channelsReducer.channels
  }
}

ChatMenu = connect(mapStateToChatMenu)(ChatMenu)

export default (ChatMenu)