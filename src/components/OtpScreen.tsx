import { useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'

export function OtpScreen() {
    const { user, verifyOtp, logout } = useAuth()
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showOtp, setShowOtp] = useState(false)

    // Determine if we need to register or verify OTP
    const needsRegistration = !user?.otp || user.otp.trim() === ''

    async function handleRegisterOtp(e: React.FormEvent) {
        e.preventDefault()

        if (!user) {
            setError('Erro no processo de autenticação')
            return
        }

        // Validate OTP format (5 characters)
        if (otp.length !== 5) {
            setError('O código OTP deve ter exatamente 5 caracteres')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Save OTP to database
            const { error: updateError } = await supabase
                .from('tbl_usuario')
                .update({ otp: otp })
                .eq('id', user.id)

            if (updateError) throw updateError

            // Mark OTP as verified
            verifyOtp()

        } catch (error: any) {
            console.error('OTP registration error:', error)
            setError(error.message || 'Erro ao cadastrar código OTP')
        } finally {
            setLoading(false)
        }
    }

    async function handleOtpVerification(e: React.FormEvent) {
        e.preventDefault()

        if (!user) {
            setError('Erro no processo de autenticação')
            return
        }

        setLoading(true)
        setError(null)

        try {
            // Validate OTP
            if (user.otp !== otp) {
                throw new Error('Código OTP incorreto')
            }

            // Mark OTP as verified
            verifyOtp()

        } catch (error: any) {
            console.error('OTP validation error:', error)
            setError(error.message || 'Código OTP incorreto')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Sistema Auxiliar</h1>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
                    Bem-vindo, {user?.nome}
                </p>

                {needsRegistration ? (
                    <form onSubmit={handleRegisterOtp}>
                        <div className="form-group">
                            <label>Cadastre seu Código OTP:</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showOtp ? 'text' : 'password'}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Digite 5 caracteres"
                                    required
                                    autoFocus
                                    autoComplete="off"
                                    maxLength={5}
                                    style={{ letterSpacing: '4px', paddingRight: '45px', fontSize: '1.2rem', textAlign: 'center' }}
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
                            <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block', lineHeight: '1.4' }}>
                                ⚠️ <strong>Importante:</strong> Este código será usado para acessar o sistema.<br />
                                Escolha um código de <strong>4 números e 1 letra no final</strong> (ex: 7392K) que você possa lembrar facilmente.
                            </small>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" disabled={loading} className="login-button">
                            {loading ? 'Cadastrando...' : 'Cadastrar e Continuar'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpVerification}>
                        <div className="form-group">
                            <label>Código OTP:</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showOtp ? 'text' : 'password'}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Digite o código OTP"
                                    required
                                    autoFocus
                                    autoComplete="off"
                                    style={{ letterSpacing: '2px', paddingRight: '45px' }}
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
                            {loading ? 'Verificando...' : 'Continuar'}
                        </button>
                    </form>
                )}

                <button
                    onClick={logout}
                    style={{
                        marginTop: '2rem',
                        background: 'transparent',
                        color: '#666',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        width: '100%'
                    }}
                >
                    Sair / Trocar conta
                </button>
            </div>
        </div>
    )
}
