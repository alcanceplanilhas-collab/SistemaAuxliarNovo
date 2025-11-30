import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import type { TblParametro } from '../types/supabase'
import Select from 'react-select'

interface LoginProps {
    onLoginSuccess: () => void
}

export function Login({ onLoginSuccess }: LoginProps) {
    const { login } = useAuth()
    const [companies, setCompanies] = useState<TblParametro[]>([])
    const [selectedCompany, setSelectedCompany] = useState<TblParametro | null>(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchCompanies()
    }, [])

    async function fetchCompanies() {
        try {
            const { data, error } = await supabase
                .from('tbl_parametro')
                .select('*')

            if (error) throw error
            setCompanies(data || [])
        } catch (error) {
            console.error('Error fetching companies:', error)
        }
    }

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()

        if (!selectedCompany) {
            setError('Por favor, selecione uma empresa')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await login(email, password, selectedCompany.id)
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
                {selectedCompany?.pathlogo && (
                    <div className="logo-container">
                        <img src={selectedCompany.pathlogo} alt="Logo" className="company-logo" />
                    </div>
                )}

                <h1>Sistema Auxiliar</h1>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Empresa:</label>
                        <Select
                            options={companies.map(c => ({
                                value: c.id,
                                label: `${c.id} :: ${c.empresa}`,
                                company: c
                            }))}
                            onChange={(option) => setSelectedCompany(option?.company || null)}
                            placeholder="Selecione a empresa"
                            isSearchable
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    padding: '0.2rem',
                                    fontSize: '1rem',
                                    borderRadius: '4px',
                                    border: '1px solid #ccc',
                                    backgroundColor: 'white'
                                }),
                                menu: (base) => ({
                                    ...base,
                                    backgroundColor: 'white',
                                    zIndex: 9999
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused ? '#2196f3' : 'white',
                                    color: state.isFocused ? 'white' : '#333',
                                    cursor: 'pointer',
                                    padding: '10px'
                                })
                            }}
                        />
                    </div>

                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Senha:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading} className="login-button">
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    )
}
