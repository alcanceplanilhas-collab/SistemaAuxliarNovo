import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import type { TblParametro } from '../types/supabase'
import Select from 'react-select'

export function CompanySelection() {
    const { setCompany, logout, user } = useAuth()
    const [companies, setCompanies] = useState<TblParametro[]>([])
    const [loading, setLoading] = useState(true)
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
            setError('Erro ao carregar empresas')
        } finally {
            setLoading(false)
        }
    }

    function handleCompanySelect(company: TblParametro) {
        setCompany(company)
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Selecione a Empresa</h1>
                <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
                    Bem-vindo, {user?.nome}
                </p>

                {loading ? (
                    <div className="loading-spinner">Carregando empresas...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <div className="form-group">
                        <Select
                            options={companies.map(c => ({
                                value: c.id,
                                label: `${c.id} :: ${c.empresa}`,
                                company: c
                            }))}
                            onChange={(option) => {
                                if (option?.company) {
                                    handleCompanySelect(option.company)
                                }
                            }}
                            placeholder="Selecione a empresa para continuar"
                            isSearchable
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    padding: '0.5rem',
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
