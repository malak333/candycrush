import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/lilita-one/latin-400.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import App from './App'
import './App.css'

class ErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return <main className="recovery"><h1>A little sugar spill!</h1><p>Your saved progress is still here. Reload to get back to the sweets.</p><button className="primary" onClick={() => location.reload()}>Try again</button></main>
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><App /></ErrorBoundary></React.StrictMode>)
