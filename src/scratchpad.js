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