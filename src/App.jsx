import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './Login'
import Home from './Home'
import NovoLeilao from './NovoLeilao'
import NovoAnuncio from './NovoAnuncio'
import DetalhesLeilao from './DetalhesLeilao'
import MeusLeiloes from './MeusLeiloes'
import VendedorPerfil from './VendedorPerfil'
import Vitrine from './Vitrine'
import EditarLeilao from './EditarLeilao'
import EditarAnuncio from './EditarAnuncio'
import MeusAnuncios from './MeusAnuncios'


function App() {
    return (
          <BrowserRouter>
                <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/home" element={<Home />} />
                        <Route path="/novo" element={<NovoLeilao />} />
                        <Route path="/anuncio" element={<NovoAnuncio />} />
                        <Route path="/leilao/:id" element={<DetalhesLeilao />} />
                        <Route path="/meus-leiloes" element={<MeusLeiloes />} />
                        <Route path="/vendedor/:sellerId" element={<VendedorPerfil />} />
                        <Route path="/vitrine" element={<Vitrine />} />
                        <Route path="/editar-leilao/:id" element={<EditarLeilao />} />
                        <Route path="/editar-anuncio/:id" element={<EditarAnuncio />} />
                                        <Route path="/meus-anuncios" element={<MeusAnuncios />} />
                </Routes>
          </BrowserRouter>
        )
}


export default App

