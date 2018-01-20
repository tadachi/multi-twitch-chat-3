import { Component } from 'react'
import moment from 'moment'

// Clock.js
class Clock extends Component {
  constructor(props) {
    super(props)

    this.state = { date: moment().format('h:mm:ssA M/d/YYYY') }
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
      date: moment().format('h:mm:ssA M/d/YYYY')
    })
  }

  render() {
    return (
      this.state.date
    )
  }
}

export default Clock