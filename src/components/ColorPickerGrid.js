import React, { Component } from 'react'
import web_safe_colors from '../web_safe_colors'

const len = web_safe_colors.length

class ColorPickerGrid extends Component {

  render() {
    let a = []
    for (let color of web_safe_colors) {
      const style = {backgroundColor: color}
      a.push(<div style={{...ColorPickerGrid.item,...style}} key={color}></div>)
    }

    return (
      <div style={ColorPickerGridCSS.container}>
        {a}
      </div>
    )
  }
}

let ColorPickerGridCSS = {
  container: {
    display: 'grid',
    gridTemplateColumns: '20px '.repeat(12),
    gridTemplateRows: '20px '.repeat(len),
    gridRowGap: '5px',
    gridColumnGap: '5px'
  },
  item: {
    border: '1px solid white',
  }
}

export default ColorPickerGrid