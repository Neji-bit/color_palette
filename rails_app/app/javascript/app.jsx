import React from 'react'
import { createRoot } from 'react-dom/client'

class App extends React.Component {
  componentDidMount() {
  }
  render() {
    return (
      <div>
        Welcome a new App!
      </div>
    )
  }
}

init = () => {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

window.onload = () => {
  init()
}

