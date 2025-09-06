import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Favorites from './pages/Favorites'
import About from './pages/About'
import Useful from './pages/Useful'
import Article from './pages/Article'
import RequireAdmin from './admin/RequireAdmin'
import AdminLayout from './pages/admin/AdminLayout'
import ArticlesAdmin from './pages/admin/ArticlesAdmin'
import RolesAdmin from './pages/admin/RolesAdmin'
import Contacts from './pages/Contacts'
import Donate from './pages/Donate'
import Auth from './pages/Auth'

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
          <Route path="/useful/:id" element={<Article />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<ArticlesAdmin />} />
            <Route path="articles" element={<ArticlesAdmin />} />
            <Route path="roles" element={<RolesAdmin />} />
          </Route>
        </Routes>
      </main>
    </>
  )
}

export default App
