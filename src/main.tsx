import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { StudioShell } from './features/landing/StudioShell'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StudioShell />
  </StrictMode>,
)