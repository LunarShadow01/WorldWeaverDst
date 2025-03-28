import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

import Components from './pages/Components'
import Main from './pages/Main'

function App() {
  return (
    <div className='min-h-screen w-full bg-background text-text'>
      <Router>
        <Routes>
          <Route path='/Components' element={<Components/>}/>
          <Route path='/' element={<Main/>}/>
        </Routes>
      </Router>
    </div>
  )
}

export default App
