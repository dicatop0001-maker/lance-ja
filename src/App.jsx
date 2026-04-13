import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './Login'
import Home from './Home'
import NovoLeilao from './NovoLeilao'
import DetalhesLeilao from './DetalhesLeilao'
import MeusLeiloes from './MeusLeiloes'
import VendedorPerfil from './VendedorPerfil'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/novo" element={<NovoLeilao />} />
        <Route path="/leilao/:id" element={<DetalhesLeilao />} />
        <Route path="/meus-leiloes" element={<MeusLeiloes />} />
        <Route path="/vendedor/:sellerId" element={<VendedorPerfil />} />
      </Routes>
    </Router>
  )
}

export default App