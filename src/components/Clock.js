import React, { Component } from 'react'
import moment from 'moment'

// Clock.js
class Clock extends Component {
  constructor(props) {
    super(props)

    this.state = { date: moment().format('h:mm:ss') }
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
      date: moment().format('h:mm:ss')
    })
  }

  render() {
    return (
      <h3>It is {this.state.date}</h3>
    )
  }
}

export default Clock