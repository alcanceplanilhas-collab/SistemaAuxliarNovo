import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface LoginProps {
    onLoginSuccess: () => void
}

export function Login({ onLoginSuccess }: LoginProps) {
    const { login } = useAuth()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        setLoading(true)
        setError(null)

        try {
            await login(email, password)
            onLoginSuccess()

        } catch (error: any) {
            console.error('Login error:', error)
            let errorMessage = 'Erro ao fazer login'

            if (error.message) {
                if (error.message.includes('Invalid login credentials')) {
                    errorMessage = 'Email ou senha incorretos'
                } else if (error.message.includes('Usuário não encontrado')) {
                    errorMessage = 'Usuário não encontrado ou inativo. Verifique seu email.'
                } else {
                    errorMessage = error.message
                }
            } else if (error.error_description) {
                errorMessage = error.error_description
            }

            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Sistema Auxiliar</h1>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            autoComplete="off"
                        />
                    </div>

                    <div className="form-group">
                        <label>Senha:</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="new-password"
                                style={{ paddingRight: '45px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    fontSize: '0.85rem',
                                    color: '#666'
                                }}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading} className="login-button">
                        {loading ? 'Validando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    )
}
