import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { SocketProvider } from './context/SocketContext'

import Components from './pages/Components'
import Main from './pages/Main'
import ManagerHub from './pages/ManagerHub'
import ManagerLogin from './pages/ManagerLogin'

function App() {

  return (
    <SocketProvider>
    <div className='min-h-screen w-full bg-background text-text'>
      <Router>
        <Routes>
          <Route path='/Components' element={<Components/>}/>
          <Route path='/' element={<Main/>}/>
          <Route path='/manager/:manager_ip/*' element={<ManagerHub/>}/>
        </Routes>
      </Router>
    </div>
    </SocketProvider>
  )
}

export default App
