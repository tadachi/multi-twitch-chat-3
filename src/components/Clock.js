import React, { Component } from 'react'
import moment from 'moment'

// Clock.js
class Clock extends Component {
  constructor(props) {
    super(props)

    this.state = { date: moment().format('h:mm:ssA M/D/YYYY') }
  }

  componentDidMount() {

    this.timerID = setInterval(
      () => this.tick(),
      1000
    )
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {

    this.setState({
      date: moment().format('h:mm:ssA M/D/YYYY')
    })
  }

  render() {
    return (
      <div style={this.props.style}>{this.state.date}</div>
    )
  }
}

export default Clock