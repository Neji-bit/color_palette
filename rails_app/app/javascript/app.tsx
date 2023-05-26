import React from 'react'
import { createRoot } from 'react-dom/client'

class App extends React.Component {
  componentDidMount() {
  }
  render() {
    return (
      <>
        <div id="cover_left" />
        <Backboard/>
        <div id="cover_right" />
      </>
    )
  }
}

//  ページの背景板。
class Backboard extends React.Component {
  render() {
    return (
      <div id="backboard"
      >
        <BasicColors/>
        <Saturations/>
        <Brightnesses/>
      </div>
    )
  }
}

//  概念上の「色」。
class Color {
  static codeToRgb = (code) => {
    let result = []
    result.push(parseInt(code.substring(1, 3), 16))
    result.push(parseInt(code.substring(3, 5), 16))
    result.push(parseInt(code.substring(5, 7), 16))
    return result
  }

  static rgbToCode = (rgb) => {
    let result = "#"
    rgb.forEach((c) => {result += c.toString(16).padStart(2, '0')})
    return result
  }

  //  色の混合。
  //  left, right はカラーコードを指定。
  //  ratio で比率（leftの濃さ）を指定。
  static mix(left: string, right: string, ratio: number = 0.5) {
    let l = this.codeToRgb(left)
    let r = this.codeToRgb(right)
    let rgb = []
    l.forEach((_, i) => { rgb.push(Math.floor((l[i] * ratio + r[i] * (1.0 - ratio)))) })
    return this.rgbToCode(rgb)
  }
}

//  基本色パネル
class BasicColors extends React.Component {
  constructor(props) {
    super(props)
    this.state = {id: "basic_colors"}
    _react[this.state.id] = this
  }
  static clicked = (e) => {
    console.log(Color.mix("#ffffff", "#000000", 0.1))
    let index = _pickedColors.includes(undefined) ? _pickedColors.indexOf(undefined) : (_pickedColors.length - 1)
    let color = _basicColors[e.currentTarget.dataset.colornum]
    _pickedColors[index] = color
    _react.saturations.forceUpdate()
    _react.brightnesses.forceUpdate()
  }

  render() {
    let colors = []
    _basicColors.forEach((c, i) => {
      colors.push(
        <div key={c}
          className={"cell"}
          style={{background: c}}
          data-colornum={i}
          onClick={BasicColors.clicked}
        />)
    })
    return (
      <div id={this.state.id}
      >
        {colors}
      </div>
    )
  }
}

//  彩度パネル
class Saturations extends React.Component {
  constructor(props) {
    super(props)
    this.state = {id: "saturations"}
    _react[this.state.id] = this
  }
  static series = (code: string) => {
    let baseColor = "#7f7f7f"
    let result = [1.0, 0.8, 0.6, 0.4, 0.2]
    return result.map((r) => {return Color.mix(code, baseColor, r)})
  }
  render() {
    let colors = []
    Array(4).fill().forEach((_, i) => {
      let color = _pickedColors[i] || "#ffffff";
      [color, ...Saturations.series(color)].forEach((c, n) => {
        console.log(c)
        colors.push(
          <div key={`${i}${n}`}
            className={"cell"}
            style={{background: c || "#000000"}}
          />
        )
      })
    })
    return (
      <div id={this.state.id}
      >
        {colors}
      </div>
    )
  }
}

//  明度パネル
class Brightnesses extends React.Component {
  constructor(props) {
    super(props)
    this.state = {id: "brightnesses"}
    _react[this.state.id] = this
  }
  static series = (code: string) => {
    let baseColor = ["#ffffff", "#ffffff", code, "#000000", "#000000"]
    let result = [0.5 * 1 / 3, 0.5 * 2 / 3, 0.5, 0.5 * 2 / 3, 0.5 * 1 / 3]
    return result.map((r, i) => {return Color.mix(code, baseColor[i], r)})
  }
  render() {
    let colors = []
    Array(4).fill().forEach((_, i) => {
      let color = _pickedColors[i] || "#7f7f7f";
      [color, ...Brightnesses.series(color)].forEach((c, n) => {
        colors.push(
          <div key={`${i}${n}`}
            className={"cell"}
            style={{background: c || "#000000"}}
          />)
      })
    })
    return (
      <div id={this.state.id}
      >
        {colors}
      </div>
    )
  }
}


//  簡易ホットリロード処理。
class Hotreload {
  static init = () => {
    this.filepath = []
    this.filepath.push(`${location.origin}/${document.head.querySelector("script").attributes["src"].value}`)
    this.filepath.push(`${location.origin}/${document.head.querySelector("link").attributes["href"].value}`)
    this.timerIds = []
  }
  static enable = () => {
    if(!this.status()) return
    this.filepath.forEach((p) => {
      this.timerIds.push(setInterval(() => {this.hotreload(p)}, 1000))
    })
  }
  static disable = () => {
    this.timerIds.forEach((i) => {
      clearInterval(i)
    })
    this.timerIds = []
  }
  static status = () => {
    return !(this.timerIds.length)
  }
  static hotreload = (target_path) => {
    fetch(target_path, {method: "HEAD"})
    .then((res) => {
      if(!res.ok) {
        location.reload()
      }
    })
  }
}

init = () => {
  Hotreload.init()
  Hotreload.enable()

  _basicColors = [
    "#e60012", "#eb6100", "#f39800", "#fcc800",
    "#fff100", "#cfdb00", "#8fc31f", "#22ac38",
    "#009944", "#009b6b", "#009e96", "#00a0c1",
    "#00a0e9", "#0086d1", "#0068b7", "#00479d",
    "#1d2088", "#601986", "#920783", "#be0081",
    "#e4007f", "#e5006a", "#e5004f", "#e60033",
  ]

  _brightnesses = [
    "#ffffff", "#bbbbbb", "#777777", "#333333", "#000000"
  ]
  _saturations = [
    "#ffffff", "#dddddd", "#bbbbbb", "#999999", "#777777"
  ]
  _pickedColors = Array(4).fill()

  window._react = {}
  _react = window._react

  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

window.onload = () => {
  init()
}

