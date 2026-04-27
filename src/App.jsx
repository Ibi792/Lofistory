import { Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Artists from './components/Artists'
import About from './components/About'
import Header from './components/Header'
import RainAmbience from './components/RainAmbience'

function App() {
  return (
    <>
      <Header />
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
