import { useEffect, useState } from 'react'
import Select from 'react-select'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase'
import type { TblAlmox } from '../types/supabase'

interface AlmoxSelectProps {
    onSelect: (almoxId: number | null) => void
}

export function AlmoxSelect({ onSelect }: AlmoxSelectProps) {
    const { company } = useAuth()
    const [almoxes, setAlmoxes] = useState<TblAlmox[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchAlmoxes()
    }, [])

    async function fetchAlmoxes() {
        setLoading(true)
        setError(null)
        try {
            console.log('Fetching almoxes...')
            const { data, error } = await supabase
                .from('tbl_almox')
                .select('*')
                .eq('idstatus_operacional', 1)

            if (error) {
                console.error('Supabase error:', error)
                throw error
            }

            console.log('Data received:', data)
            if (!data || data.length === 0) {
                console.warn('No data found for idstatus_operacional=1')
            }

            setAlmoxes(data || [])
        } catch (error: any) {
            console.error('Error fetching almoxes:', error)
            setError(error.message || 'Erro ao buscar dados')
        } finally {
            setLoading(false)
        }
    }

    if (error) {
        return (
            <div className="almox-select-container error">
                <p style={{ color: 'red' }}>Erro: {error}</p>
                <button onClick={fetchAlmoxes}>Tentar Novamente</button>
            </div>
        )
    }

    return (
        <div className="almox-select-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%' }}>
                {company?.pathlogo && (
                    <img
                        src={company.pathlogo}
                        alt="Logo da Empresa"
                        style={{
                            maxHeight: '80px',
                            maxWidth: '200px',
                            marginBottom: '1rem',
                            objectFit: 'contain',
                            display: 'block',
                            margin: '0 auto 1rem auto'
                        }}
                    />
                )}
                <label htmlFor="almox-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Selecione a Nota Fiscal:</label>
                <Select
                    id="almox-select"
                    options={almoxes.map(almox => ({
                        value: almox.id,
                        label: `${almox.notafiscal}::${almox.lote}::${almox.descricao}`
                    }))}
                    onChange={(option) => onSelect(option ? option.value : null)}
                    isDisabled={loading}
                    isClearable
                    placeholder="-- Selecione --"
                    noOptionsMessage={() => "Nenhuma opção encontrada"}
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
                            padding: '10px',
                            fontSize: '0.95rem'
                        }),
                        singleValue: (base) => ({
                            ...base,
                            color: '#333'
                        }),
                        placeholder: (base) => ({
                            ...base,
                            color: '#999'
                        }),
                        input: (base) => ({
                            ...base,
                            color: '#333'
                        })
                    }}
                />
                {loading && <span>Carregando...</span>}
                {!loading && almoxes.length === 0 && (
                    <span style={{ fontSize: '0.8em', color: '#666' }}>Nenhuma nota fiscal aberta encontrada.</span>
                )}
            </div>
        </div>
    )
}
