import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

if (!window.Capacitor?.isNativePlatform?.()) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        updateSW(true)
      },
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
