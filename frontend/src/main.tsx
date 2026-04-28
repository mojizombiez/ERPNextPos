import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import './i18n'

const container = document.getElementById('root')

const root = createRoot(container!)


// --- LOG SUPPRESSION LOGIC ---
const applyDebugMode = async () => {
    try {
        // @ts-ignore
        if (window.go && window.go.main && window.go.main.App) {
            // @ts-ignore
            const debugMode = await window.go.main.App.GetSetting('DebugMode');
            if (debugMode !== 'true') {
                console.log = () => {};
                console.info = () => {};
                console.debug = () => {};
                console.warn = () => {};
                // We keep console.error for critical failures
            }
        }
    } catch (e) {
        // Ignore errors during setting check
    }
}
applyDebugMode();

root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
)
