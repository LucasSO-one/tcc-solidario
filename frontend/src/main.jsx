import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Fontes self-hosted: Fraunces com todos os eixos (inclui SOFT) e Plus Jakarta Sans variável
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/plus-jakarta-sans";
import "./styles/main.scss";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
