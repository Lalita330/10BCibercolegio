import { HashRouter, Route, Routes } from 'react-router-dom'
import EmbeddedPage from './components/EmbeddedPage'
import Layout from './components/Layout'
import { embedPages } from './data/site'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import SchedulePage from './pages/SchedulePage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          {embedPages.map((page) => (
            <Route key={page.path} path={page.path} element={<EmbeddedPage page={page} />} />
          ))}
          <Route path="horario" element={<SchedulePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
