import React from 'react';
import Drawer from 'material-ui/Drawer';
import { withStyles } from 'material-ui/styles'

let styles = ({
  paper: {
    backgroundColor: 'black',
    overflowY: 'hidden', // hide vertical
  }
})

class AppDrawer extends React.Component {
  render() {
    const classes = this.props.classes

    return (
      <Drawer
        classes={{paper: classes.paper}}
        type='persistent'
        anchor='left'
        open={this.props.open}
        docked='true'
      >
        <div style={this.props.style} id={'channels'}>
          {this.props.children}
        </div>
      </Drawer>
    )
  }
}

export default withStyles(styles)(AppDrawer)