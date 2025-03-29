import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Components from './pages/Components'
import Main from './pages/Main'
import ManagerHub from './pages/ManagerHub'
import ServerPage from './pages/ServerPage'

function App() {

  return (
    <div className='min-h-screen w-full bg-background text-text'>
      <Router>
        <Routes>
          <Route path='/Components' element={<Components/>}/>
          <Route path='/cluster' element={<ServerPage/>}/>
          <Route path='/' element={<Main/>}/>
          <Route path='/manager/:ip/*' element={<ManagerHub/>}/>
        </Routes>
      </Router>
    </div>
  )
}

export default App
