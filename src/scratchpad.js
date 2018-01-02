import React, { Component } from 'react';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <iframe frameborder="0"
          scrolling="no"
          id="chat_embed"
          src="http://www.twitch.tv/embed/landail/chat"
          height="500"
          width="350">
        </iframe>
        Best
      </div>
    );
  }
}

export default App;

const userReducer = (state={}, actions) => {
  switch (actions.type) {
    case "CHANGE_NAME": {
      state = {...state, name: actions.payload}
      break
    }
    case "CHANGE_AGE": {
      state = {...state, age: actions.payload}
      break
    }
  }
  return state;
}

const tweetsReducer = (state={}, actions) => {
  return state;
}

const reducers = combineReducers({
  user: userReducer,
  tweets: tweetsReducer,
})

scrollToBottom() {
  if (this.scrollToEnd) {
    this.messagesEnd.scrollIntoView({ behavior: "smooth" })
  }
}

          /* {this.state.messages},
        <div style={{ float: "left", clear: "both" }}
          ref={(el) => { this.messagesEnd = el; }}>
        </div> */