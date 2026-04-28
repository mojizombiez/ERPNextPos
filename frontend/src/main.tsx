import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import './i18n'

const container = document.getElementById('root')

const root = createRoot(container!)


// --- GLOBAL FONT INITIALIZATION ---
const applyGlobalFont = async () => {
    try {
        // @ts-ignore
        if (window.go && window.go.main && window.go.main.App) {
            // @ts-ignore
            const fontId = await window.go.main.App.GetSetting('SelectedFont');
            if (fontId) {
                const fonts = [
                    { id: 'kanit', family: "'Kanit', sans-serif" },
                    { id: 'prompt', family: "'Prompt', sans-serif" },
                    { id: 'noto-sans-thai', family: "'Noto Sans Thai', sans-serif" },
                    { id: 'chakra-petch', family: "'Chakra Petch', sans-serif" },
                    { id: 'sarabun', family: "'TH Sarabun New', sans-serif" },
                ];
                const font = fonts.find(f => f.id === fontId);
                if (font) {
                    document.documentElement.style.setProperty('--font-family', font.family);
                }
            }
        }
    } catch (e) {
        // Ignore errors
    }
}
applyGlobalFont();

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
