import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Artists from './components/Artists'
import About from './components/About'
import RainAmbience from './components/RainAmbience'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/artists" element={<Artists />} />
        <Route path="/about" element={<About />} />
      </Routes>
      <RainAmbience />
    </>
  )
}

export default App
