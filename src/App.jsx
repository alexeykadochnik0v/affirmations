import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Favorites from './pages/Favorites'
import About from './pages/About'
import Useful from './pages/Useful'
import Contacts from './pages/Contacts'
import Donate from './pages/Donate'

function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/about" element={<About />} />
          <Route path="/useful" element={<Useful />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/donate" element={<Donate />} />
        </Routes>
      </main>
    </>
  )
}

export default App
