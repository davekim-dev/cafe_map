// 앱의 시작점. 건드릴 일이 거의 없는 파일이에요. (담당: 공통)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter: 주소(/map, /owner 등)에 따라 다른 화면을 보여주게 해줌 */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
