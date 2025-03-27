import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Components from './pages/Components'

function App() {
  return (
    <div className='min-h-screen w-full bg-background text-text'>
      <Router>
        <Routes>
          <Route path='/' element={<Components/>}/>
        </Routes>
      </Router>
    </div>
  )
}

export default App
