import React, { Component } from 'react'

class ColorPickerGrid extends Component {
  render() {
    return (
      <div style={ColorPickerGridCSS.container}>
        <div style={ColorPickerGridCSS.item}>1</div>
        <div>2</div>
        <div>3</div>
        <div>4</div>
        <div>5</div>
        <div>6</div>
        <div>7</div>
        <div>8</div>
        <div>9</div>
      </div>
    )
  }
}

let ColorPickerGridCSS = {
  container: {
    display: 'grid',
    gridTemplateColumns: '150px 20px 150px 20px 150px',
    gridTemplateRows: 'auto 20px auto 20px auto',
  },
  item: {
    border: '1px solid white',
  }
}

export default ColorPickerGrid