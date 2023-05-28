import React from 'react'
import { createRoot } from 'react-dom/client'

class App extends React.Component {
  static initialize = () => {
    pages.querySelector('[data-pagenum="0"]').click()
    _react.basic_colors.forceUpdate()
  }
  componentDidMount() {
    App.initialize()
  }
  componentDidUpdate() {
    App.initialize()
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

//  クリップボード
class Clipboard {
  static write = (data) => {
    setTimeout(async () => await navigator.clipboard.writeText(data))
  }
  static read = (callback) => {
    navigator.clipboard?.readText().then((data) => {
      callback(data)
    })
  }
}

//  ページの背景板。
class Backboard extends React.Component {
  static mouseUp = (e) => {
    Erase.disable()
    ColorInfo.disable()
  }
  static touchEnd = (e) => {
    this.mouseUp(e)
  }
  render() {
    return (
      <div id="backboard"
        onMouseUp={Backboard.mouseUp}
        onTouchEnd={Backboard.touchEnd}
      >
        <div id="top">
          <BasicColors/>
        </div>
        <div id="middle">
          <Gradation/>
          <PickedColors/>
        </div>
        <div id="bottom">
          <Console/>
        </div>
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
    let index = null
    if(_pickedColors.includes(undefined)) {
      index = _pickedColors.indexOf(undefined)
    } else {
      _currentPickedColor = null
      _react.picked_colors.forceUpdate()
      return
    } 
    _currentPickedColor = index
    let color = _basicColors[e.currentTarget.dataset.colornum]
    let tmp = new PickedColorCell({baseColor: color, actualColor: color, saturation: 0, brightness: 0})
    _pickedColors[index] = tmp
    PickedColorCell.dataSave()
    _react.gradation.setState({color: color})
    _react.picked_colors.forceUpdate()
    _react.basic_colors.forceUpdate()
  }

  render() {
    let colors = []
    let selected = _pickedColors.filter(c => c).map(c => c.baseColor)
    let currentCode = _pickedColors[_currentPickedColor]?.baseColor
    _basicColors.forEach((c, i) => {
      let classes = ["cell"]
      let count = selected.filter(s => s == c).length
      if(selected.includes(c)) classes.push("selected")
      if(c == currentCode) classes.push("current")
      colors.push(
        <div key={c}
          className={classes.join(" ")}
          style={{background: c}}
          data-colornum={i}
          onClick={BasicColors.clicked}
        >
          {1 < count ? count : null}
        </div>)
    })
    return (
      <div id={this.state.id}
      >
        {colors}
      </div>
    )
  }
}

class Gradation extends React.Component {
  constructor(props) {
    super(props)
    this.state = {id: "gradation", color: "#ffffff"}
    _react[this.state.id] = this
  }
  static pickColor = (e) => {
    let cell = Util.getElement(e.nativeEvent.pageX, e.nativeEvent.pageY)
    if(!cell || !cell.classList.contains("cell--gradation")) return
    if(isNaN(_currentPickedColor) || _currentPickedColor == null) return
    if(e.buttons == 0) return
    let currentPickedColor = _pickedColors[_currentPickedColor]
    let actualColor = cell.style.background
    let array = actualColor.replace(/[^0-9,]/g, "").split(",").map((n) => {return parseInt(n)})
    let saturation = cell.dataset.saturation
    let brightness = cell.dataset.brightness
    currentPickedColor.update({actualColor: Color.rgbToCode(array), saturation: saturation, brightness: brightness})
    _react.picked_colors.forceUpdate()
    _react.gradation.forceUpdate()
  }
  static mouseDown = (e) => { this.pickColor(e) }
  static mouseMove = (e) => { this.pickColor(e) }
  static touchStart = (e) => { this.pickColor(e) }
  static touchMove = (e) => { this.pickColor(e) }
  render() {
    let grid = [];
    let actives = _pickedColors.filter(p => p).map(p => `${p.saturation}_${p.brightness}`)
    let currentPickedColorPoint = (((x) => {return x ? `${x.saturation}_${x.brightness}` : null})(_pickedColors[_currentPickedColor]))
    "0123456789abcdef".split("").forEach((n, i) => {
      let baseColor = Color.mix("#000000", "#ffffff", (1.0 * i/ 15))
      "0123456789abcdef".split("").forEach((o, j) => {
        let actualColor = Color.mix(baseColor, this.state.color, (1.0 * j/ 15))
        let classes = ["cell--gradation"]
        if(actives.includes(`${i}_${j}`)) classes.push("pointer")
        if(currentPickedColorPoint == `${i}_${j}`) classes.push("current")
        grid.push((
          <div key={`${i}_${j}`}
            className={classes.join(" ")}
            style={{background: actualColor}}
            data-saturation={i}
            data-brightness={j}
          />
        ))
      })
    })
    return (
      <div id={this.state.id}
        onMouseDown={Gradation.mouseDown}
        onMouseMove={Gradation.mouseMove}
        onTouchStart={Gradation.touchStart}
        onTouchMove={Gradation.touchMove}
      >
        {grid}
        <ColorInfo/>
      </div>
    )
  }
}

class Util {
  static getElement = (x, y) => {
    if(!(x && y)) return null
    return document.elementFromPoint(x, y)
  }
}

class ColorInfo extends React.Component {
  constructor(props) {
    super(props)
    this.state = {id: "color_info"}
    _react[this.state.id] = this
  }
  static show = () => {
    color_info.classList.remove("hidden")
  }
  static enable = () => {
    if(!_colorInfoTimer) _colorInfoTimer = setTimeout(ColorInfo.show, 500)
  }
  static disable = () => {
    clearTimeout(_colorInfoTimer)
    _colorInfoTimer = null
    color_info.classList.add("hidden")
  }
  render() {
    let code = _pickedColors[_currentPickedColor]?.actualColor
    let rgb = code ? Color.codeToRgb(code) : null
    let label = code ? (
      <div>
        {code} <br/>
        {rgb ? `RGB(${rgb.join(", ")})` : null}
      </div>
    ) : null
    return(
      <div id={this.state.id}
        className={"hidden"}
      >
        {label}
      </div>
    )
  }
}

class Erase extends React.Component {
  constructor(props) {
    super(props)
    this.state = {id: "erase"}
    _react[this.state.id] = this
  }
  static erase = () => {
    erase.classList.remove("hidden")
  }
  static enable = () => {
    if(!_eraseTimer) _eraseTimer = setTimeout(Erase.erase, 500)
  }
  static disable = () => {
    clearTimeout(_eraseTimer)
    _eraseTimer = null
    document.getElementById("erase")?.classList.add("hidden")
  }
  static mouseUp = (e) => {
    _pickedColors[_currentPickedColor] = undefined
    _currentPickedColor = null
    _react.picked_colors.forceUpdate()
    _react.gradation.forceUpdate()
    PickedColorCell.dataSave()
    Erase.disable()
    ColorInfo.disable()
    _react.gradation.setState({color: "#ffffff"})
    _react.basic_colors.forceUpdate()
    e.stopPropagation()
  }
  render() {
    let classes = ["hidden", `position--${_currentPickedColor}`]
    return (
      <div id={this.state.id}
        className={classes.join(" ")}
      >
        <i
          className={"fa-sharp fa-solid fa-trash fa-2x"}
          onMouseUp={Erase.mouseUp}
        />
      </div>
    )
  }
}

class PickedColors extends React.Component {
  constructor(props) {
    super(props)
    this.state = {id: "picked_colors"}
    _react[this.state.id] = this
  }
  static clicked = (e) => {
    let cell = Util.getElement(e.clientX, e.clientY)
    if(!cell) return
  }
  static mouseDown = (e) => {
    let cell = Util.getElement(e.nativeEvent.pageX, e.nativeEvent.pageY)
    if(!cell || !cell.classList.contains("cell--picked")) return
    _mouseDownedPickedCellNum = cell.dataset.pickednum
    _mouseUpedPickedCellNum = null
    _react.picked_colors.forceUpdate()
    let color = _pickedColors[cell.dataset.pickednum]?.baseColor
    if(color) {
      _currentPickedColor = cell.dataset.pickednum
      _react.gradation.setState({color: color})
      _react.basic_colors.forceUpdate()
      Erase.enable()
      ColorInfo.enable()
    } else {
      _currentPickedColor = null
      _react.gradation.setState({color: "#ffffff"})
      _react.basic_colors.forceUpdate()
    }
  }
  static mouseMove = (e) => {
    if(document.getElementById("erase")?.classList.contains("hidden")) Erase.disable()
    if(document.getElementById("color_info")?.classList.contains("hidden")) ColorInfo.disable()
  }
  static mouseUp = (e) => {
    let cell = Util.getElement(e.nativeEvent.pageX, e.nativeEvent.pageY)
    if(!cell || !cell.classList.contains("cell--picked")) return
    let pickednum = cell.dataset.pickednum
    if(_mouseDownedPickedCellNum != pickednum) {
      let l = _pickedColors[_mouseDownedPickedCellNum]
      let r = _pickedColors[pickednum]
      let tmp = r
      _pickedColors[pickednum] = l
      _pickedColors[_mouseDownedPickedCellNum] = tmp
      _react.picked_colors.forceUpdate()
    }
    PickedColorCell.dataSave()
  }
  static touchStart = (e) => {
    this.mouseDown(e)
  }
  static touchMove = (e) => {
    this.mouseMove(e)
  }
  static touchEnd = (e) => {
    //  iPhone用ルート。
    //  iPhoneでは
    //    色にタッチ > 出てきたゴミ箱にスライド > 指を離す
    //  をすると、最初の「色」でtouchEndが発生する。
    //  PC Chrome では上記の動きをすると Erase の mouseUp が発生する。
    //  そのため、ここで「指を離した際の座標で部品を確認」し、ゴミ箱だったらEraseに送る。
    let x = e.nativeEvent.pageX
    let y = e.nativeEvent.pageY
    let target = Util.getElement(x, y)
    if(target.classList.contains("fa-trash")) {
      Erase.mouseUp(e)
      return
    }
    this.mouseUp(e)
  }
  render() {
    let colors = []
    _pickedColors.forEach((c, i) => {
      colors.push((
        <div key={i}
          className={`cell--picked${i == _currentPickedColor ? " current" : ""}`}
          style={{background: c?.actualColor}}
          data-pickednum={i}
        >
          {(i == _currentPickedColor) ? <Erase/> : null}
        </div>
      ))
    })
    return (
      <div id={this.state.id}
        onClick={PickedColors.clicked}
        onMouseDown={PickedColors.mouseDown}
        onMouseMove={PickedColors.mouseMove}
        onMouseUp={PickedColors.mouseUp}
        onTouchStart={PickedColors.touchStart}
        onTouchMove={PickedColors.touchMove}
        onTouchEnd={PickedColors.touchEnd}
      >
        {colors}
      </div>
    )
  }
}

class Pages extends React.Component {
  constructor(props) {
    super(props)
    this.state = {id: "pages"}
    _react[this.state.id] = this
  }
  static clicked = (e) => {
    _currentPage = e.currentTarget.dataset.pagenum
    let json = Storage.load(_currentPage)
    let data = JSON.parse(json) || Array(8).fill()
    _pickedColors = data.map((d) => {
      if(!d) return undefined
      return new PickedColorCell({
        brightness: d._brightness,
        saturation: d._saturation,
        baseColor: d._baseColor,
        actualColor: d._actualColor
      })
    })
    _react.picked_colors.forceUpdate()
    _react.gradation.setState({color: _pickedColors[_currentPickedColor]?.baseColor || "#ffffff"})
    _react.pages.forceUpdate()
    _react.basic_colors.forceUpdate()
  }
  render() {
    let pages = []
    Array(6).fill().forEach((_, i) => {
      let classes = ["page"]
      if(_currentPage == i) classes.push("current")
      pages.push(
        <div key={i}
          className={classes.join(" ")}
          onClick={Pages.clicked}
          data-pagenum={i}
        >
          {i + 1}
        </div>
      )
    })
    return (
      <div id={this.state.id}>
        {pages}
      </div>
    )
  }
}

class Console extends React.Component {
  constructor(props) {
    super(props)
    this.state = {id: "console"}
    _react[this.state.id] = this
  }
  static export = (e) => {
    Clipboard.write(_pickedColors.map((c) => {return c?.actualColor}).filter((c) => {return c}))
  }
  static import = (e) => {
    Clipboard.read((d) => {
      let array = d.split(",")
    })
  }
  render() {
    return (
      <>
        <Pages/>
        <div
          onClick={Console.export}
        >
          Export to Clipboard!
        </div>
        <div
          onClick={() => {location.reload()}}
        >
          Reset
        </div>
      </>
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
  //  モバイル対応。ブラウザの画面有効範囲の高さを取得しCSSへ渡す。
  document.documentElement.style.setProperty('--js--height', `${window.innerHeight}px`);
  document.documentElement.style.setProperty('--js--width', `${window.innerWidth}px`);

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
  _pickedColors = Array(8).fill()

  _currentPickedColor = null
  _mouseDownedPickedCellNum = null
  _currentPage = 0
  _eraseTimer = null
  _colorInfoTimer = null

  window._react = {}
  _react = window._react

  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

class PickedColorCell {
  constructor(props = {}) {
    this.brightness = false;
    ["brightness", "saturation", "baseColor" ,"actualColor"].forEach((e) => {
      this[e] = props[e]
    })
    this.autoSaveFlag = true
  }
  update = (props = {}) => {
    this.autoSaveFlag = false;
    ["brightness", "saturation", "baseColor" ,"actualColor"].forEach((e) => {
      this[e] = props[e] ? props[e] : this[e]
    })
    this.autoSaveFlag = true
    PickedColorCell.dataSave()
  }
  set brightness(value) { this._brightness = value; if(this.autoSaveFlag) PickedColorCell.dataSave() }
  set saturation(value) { this._saturation = value; if(this.autoSaveFlag) PickedColorCell.dataSave() }
  set baseColor(value) { this._baseColor = value; if(this.autoSaveFlag) PickedColorCell.dataSave() }
  set actualColor(value) { this._actualColor = value; if(this.autoSaveFlag) PickedColorCell.dataSave() }
  get brightness() {return this._brightness}
  get saturation() {return this._saturation}
  get baseColor() {return this._baseColor}
  get actualColor() {return this._actualColor}

  static dataSave = () => {
    let data = JSON.stringify(_pickedColors)
    Storage.save(_currentPage, data)
  }
}

class Storage {
  static STORAGE_ID = "color_palette"
  static save = (id, value) => {
    return localStorage.setItem(`${Storage.STORAGE_ID}_${id}`, value)
  }
  static load = (id) => {
    return localStorage.getItem(`${Storage.STORAGE_ID}_${id}`)
  }
}

window.onload = () => {
  init()
}

