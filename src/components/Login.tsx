import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import type { TblParametro, TblUsuario } from '../types/supabase'
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
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showOtp, setShowOtp] = useState(false)

    // Two-step authentication flow
    const [authStep, setAuthStep] = useState<'credentials' | 'otp'>('credentials')
    const [pendingUser, setPendingUser] = useState<TblUsuario | null>(null)

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

    async function handleCredentialsSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!selectedCompany) {
            setError('Por favor, selecione uma empresa')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Step 1: Validate email and password
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (authError) throw authError

            // Check if user exists and is active
            const { data: userData, error: userError } = await supabase
                .from('tbl_usuario')
                .select('*')
                .eq('email', email)
                .eq('status_operacional', 1)
                .single()

            if (userError || !userData) {
                await supabase.auth.signOut()
                throw new Error('Usuário não encontrado ou inativo')
            }

            // Store user data and move to OTP step
            setPendingUser(userData)
            setAuthStep('otp')

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

    async function handleOtpSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!pendingUser || !selectedCompany) {
            setError('Erro no processo de autenticação')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Step 2: Validate OTP
            if (pendingUser.otp !== otp) {
                throw new Error('Código OTP incorreto')
            }

            // Complete login
            await login(email, password, selectedCompany.id)
            onLoginSuccess()

        } catch (error: any) {
            console.error('OTP validation error:', error)
            setError(error.message || 'Código OTP incorreto')
        } finally {
            setLoading(false)
        }
    }

    function handleBackToCredentials() {
        setAuthStep('credentials')
        setPendingUser(null)
        setOtp('')
        setError(null)
        // Sign out from the temporary session
        supabase.auth.signOut()
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

                {authStep === 'credentials' ? (
                    <form onSubmit={handleCredentialsSubmit}>
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
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
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
                            {loading ? 'Validando...' : 'Continuar'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit}>
                        <div className="form-group">
                            <label>Código OTP:</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showOtp ? 'text' : 'password'}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.toUpperCase())}
                                    placeholder="Digite o código OTP"
                                    required
                                    autoFocus
                                    style={{ textTransform: 'uppercase', letterSpacing: '2px', paddingRight: '45px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOtp(!showOtp)}
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
                                    {showOtp ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                                Digite o código de autenticação fornecido
                            </small>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" disabled={loading} className="login-button">
                            {loading ? 'Verificando...' : 'Entrar'}
                        </button>

                        <button
                            type="button"
                            onClick={handleBackToCredentials}
                            style={{
                                marginTop: '0.5rem',
                                background: 'transparent',
                                color: '#666',
                                border: '1px solid #ddd'
                            }}
                        >
                            Voltar
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
