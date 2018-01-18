import { Component } from 'react'
import moment from 'moment'

// Clock.js
class Clock extends Component {
  constructor(props) {
    super(props)

    this.state = { date: moment().format('h:mm:ss A') }
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
      date: moment().format('h:mm:ss A')
    })
  }

  render() {
    return (
      this.state.date
    )
  }
}

export default Clock