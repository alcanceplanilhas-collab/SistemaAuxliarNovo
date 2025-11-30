import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Login } from './components/Login'
import { AlmoxSelect } from './components/AlmoxSelect'
import { DeviceList } from './components/DeviceList'
import './App.css'

function AppContent() {
  const { user, company, loading, logout } = useAuth()
  const [selectedAlmoxId, setSelectedAlmoxId] = useState<number | null>(null)

  if (loading) {
    return <div className="loading-screen">Carregando...</div>
  }

  if (!user || !company) {
    return <Login onLoginSuccess={() => { }} />
  }

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>Sistema Auxiliar</h1>
          <div className="user-info">
            <span className="user-name">👤 {user.nome}</span>
            <span className="company-name">🏢 {company.empresa}</span>
            <button onClick={logout} className="logout-button">Sair</button>
          </div>
        </div>
      </header>

      <main>
        <section className="selection-area">
          <AlmoxSelect onSelect={setSelectedAlmoxId} />
        </section>

        {selectedAlmoxId && (
          <section className="device-area">
            <DeviceList almoxId={selectedAlmoxId} />
          </section>
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
