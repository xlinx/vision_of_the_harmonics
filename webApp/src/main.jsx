import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {MemoryRouter} from "react-router-dom";

createRoot(document.getElementById('root')).render(
    <MemoryRouter>
  <StrictMode>
    <App />
  </StrictMode>
        </MemoryRouter>,
)
