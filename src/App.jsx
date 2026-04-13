import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './Login'
import Home from './Home'
import NovoLeilao from './NovoLeilao'
import DetalhesLeilao from './DetalhesLeilao'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/novo" element={<NovoLeilao />} />
        <Route path="/leilao/:id" element={<DetalhesLeilao />} />
      </Routes>
    </Router>
  )
}

export default App