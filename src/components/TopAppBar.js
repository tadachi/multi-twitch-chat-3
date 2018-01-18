import React from 'react';
import AppBar from 'material-ui/AppBar'
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import MenuIcon from 'material-ui-icons/Menu';
import Typography from 'material-ui/Typography';

export default class TopAppBar extends React.Component {

  render() {
    return (
      <AppBar position="static">
        <Toolbar>
          <IconButton color="contrast" aria-label="Menu">
            <MenuIcon />
          </IconButton>
          <Typography type="title">
            Title
        </Typography>
          <Button color="contrast">Login</Button>
        </Toolbar>
      </AppBar>
    )
  }
}