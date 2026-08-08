import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

if (!window.Capacitor?.isNativePlatform?.()) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: false })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
