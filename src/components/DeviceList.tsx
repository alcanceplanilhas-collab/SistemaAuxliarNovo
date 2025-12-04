import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { Scanner } from './Scanner'
import type { TblDevice } from '../types/supabase'

interface DeviceListProps {
    almoxId: number | null
}

export function DeviceList({ almoxId }: DeviceListProps) {
    const [devices, setDevices] = useState<TblDevice[]>([])
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editForm, setEditForm] = useState({ serial: '', lacre: '' })
    const [scannerActive, setScannerActive] = useState(false)
    const [scannerTarget, setScannerTarget] = useState<'serial' | 'lacre' | null>(null)
    const [almoxDescription, setAlmoxDescription] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [searchField, setSearchField] = useState<'serial' | 'lacre'>('serial')
    const [searchMode, setSearchMode] = useState<'exact' | 'partial'>('partial')

    // Refs for focus management
    const serialInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (almoxId) {
            fetchDevices(almoxId)
        } else {
            setDevices([])
        }
    }, [almoxId])

    async function fetchDevices(id: number) {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('tbl_device')
                .select('*')
                .eq('iddevice', id)

            if (error) throw error

            // Sort: Empty serial/lacre first
            const sorted = (data || []).sort((a, b) => {
                const aEmpty = !a.serial || !a.lacre
                const bEmpty = !b.serial || !b.lacre
                if (aEmpty && !bEmpty) return -1
                if (!aEmpty && bEmpty) return 1
                return 0
            })

            setDevices(sorted)

            // Fetch Almox description
            const { data: almoxData } = await supabase
                .from('tbl_almox')
                .select('descricao')
                .eq('id', id)
                .single()

            if (almoxData) {
                setAlmoxDescription(almoxData.descricao)
            }
        } catch (error) {
            console.error('Error fetching devices:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditClick = (device: TblDevice) => {
        setEditingId(device.id)
        setEditForm({
            serial: device.serial || '',
            lacre: device.lacre || ''
        })
        setTimeout(() => serialInputRef.current?.focus(), 50)
    }

    const startScanner = (target: 'serial' | 'lacre') => {
        setScannerTarget(target)
        setScannerActive(true)
    }

    const stopScanner = () => {
        setScannerActive(false)
        setScannerTarget(null)
    }

    const checkDuplicate = async (text: string, type: 'serial' | 'lacre') => {
        // Check in current list first
        const existsInList = devices.some(d => d[type] === text && d.id !== editingId)
        if (existsInList) return true

        // Check in DB globally
        const { data } = await supabase
            .from('tbl_device')
            .select('id')
            .eq(type, text)
            .neq('id', editingId!) // Exclude current
            .maybeSingle()

        return !!data
    }

    const handleScanSuccess = async (decodedText: string) => {
        if (scannerTarget) {
            let finalText = decodedText
            // Remove leading zeros for lacre
            if (scannerTarget === 'lacre') {
                finalText = finalText.replace(/^0+/, '')
            }

            const isDuplicate = await checkDuplicate(finalText, scannerTarget)
            if (isDuplicate) {
                alert(`Este ${scannerTarget === 'serial' ? 'Serial' : 'Lacre'} já existe no sistema!`)
                return
            }

            setEditForm(prev => ({
                ...prev,
                [scannerTarget]: finalText
            }))
            stopScanner()
        }
    }

    const handleSave = async (id: number) => {
        try {
            // Validate for duplicates before saving
            if (editForm.serial) {
                const isDuplicateSerial = await checkDuplicate(editForm.serial, 'serial')
                if (isDuplicateSerial) {
                    alert('Este Serial já existe no sistema!')
                    return
                }
            }

            if (editForm.lacre) {
                const isDuplicateLacre = await checkDuplicate(editForm.lacre, 'lacre')
                if (isDuplicateLacre) {
                    alert('Este Lacre já existe no sistema!')
                    return
                }
            }

            const { error } = await supabase
                .from('tbl_device')
                .update({
                    serial: editForm.serial,
                    lacre: editForm.lacre
                })
                .eq('id', id)

            if (error) throw error

            // Optimistic update
            setDevices(devices.map(d => d.id === id ? { ...d, ...editForm } : d))
            setEditingId(null)

            // Re-sort to move filled items down
            const updatedDevices = devices.map(d => d.id === id ? { ...d, ...editForm } : d)
            const sorted = updatedDevices.sort((a, b) => {
                const aEmpty = !a.serial || !a.lacre
                const bEmpty = !b.serial || !b.lacre
                if (aEmpty && !bEmpty) return -1
                if (!aEmpty && bEmpty) return 1
                return 0
            })
            setDevices(sorted)

        } catch (error) {
            console.error('Error updating device:', error)
            alert('Erro ao salvar!')
        }
    }

    const performSearch = async () => {
        if (!almoxId) return
        setLoading(true)
        try {
            let query = supabase
                .from('tbl_device')
                .select('*')
                .eq('iddevice', almoxId)

            if (searchTerm) {
                if (searchField === 'lacre') {
                    // Lacre: always exact match
                    query = query.eq('lacre', searchTerm)
                } else {
                    // Serial: exact or partial
                    if (searchMode === 'exact') {
                        query = query.eq('serial', searchTerm)
                    } else {
                        query = query.ilike('serial', `%${searchTerm}%`)
                    }
                }
            }

            const { data, error } = await query

            if (error) throw error

            // Sort: Empty serial/lacre first
            const sorted = (data || []).sort((a, b) => {
                const aEmpty = !a.serial || !a.lacre
                const bEmpty = !b.serial || !b.lacre
                if (aEmpty && !bEmpty) return -1
                if (!aEmpty && bEmpty) return 1
                return 0
            })

            setDevices(sorted)
        } catch (error) {
            console.error('Error searching devices:', error)
            alert('Erro ao buscar dispositivos')
        } finally {
            setLoading(false)
        }
    }

    const filledCount = devices.filter(d => d.serial && d.lacre).length
    const totalCount = devices.length

    if (!almoxId) return null

    return (
        <div className="device-list-container">
            <div className="search-section" style={{ marginBottom: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <select
                        value={searchField}
                        onChange={(e) => {
                            setSearchField(e.target.value as 'serial' | 'lacre')
                            // Reset to exact mode when switching to lacre
                            if (e.target.value === 'lacre') {
                                setSearchMode('exact')
                            }
                        }}
                        style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db', minWidth: '100px' }}
                    >
                        <option value="serial">Serial</option>
                        <option value="lacre">Lacre</option>
                    </select>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={`Buscar por ${searchField === 'serial' ? 'Serial' : 'Lacre'}...`}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
                    />
                    {searchField === 'serial' && (
                        <select
                            value={searchMode}
                            onChange={(e) => setSearchMode(e.target.value as 'exact' | 'partial')}
                            style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}
                        >
                            <option value="partial">Parcial</option>
                            <option value="exact">Exato</option>
                        </select>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={performSearch}
                        style={{ flex: 1, background: '#3b82f6', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
                    >
                        Buscar
                    </button>
                    <button
                        onClick={() => {
                            setSearchTerm('')
                            fetchDevices(almoxId)
                        }}
                        style={{ flex: 1, background: '#9ca3af', color: 'white', padding: '0.5rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}
                    >
                        Limpar
                    </button>
                </div>
            </div>

            <div className="stats">
                <strong>Progresso: {filledCount} / {totalCount}</strong>
            </div>

            {loading ? (
                <p>Carregando dispositivos...</p>
            ) : (
                <div className="device-grid">
                    {devices.map((device) => (
                        <div
                            key={device.id}
                            className={`device-card ${(!device.serial || !device.lacre) ? 'pending' : 'completed'}`}
                            onClick={() => !editingId && handleEditClick(device)}
                        >
                            {editingId === device.id ? (
                                <div className="edit-form" onClick={(e) => e.stopPropagation()}>
                                    <h4>Editar Dispositivo #{device.id}</h4>

                                    {scannerActive ? (
                                        <div>
                                            <p>Escaneando {scannerTarget === 'serial' ? 'Serial' : 'Lacre'}...</p>
                                            <Scanner
                                                onScanSuccess={handleScanSuccess}
                                                onClose={stopScanner}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="form-group">
                                                <label>Serial:</label>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <input
                                                        ref={serialInputRef}
                                                        type="text"
                                                        value={editForm.serial}
                                                        onChange={(e) => setEditForm({ ...editForm, serial: e.target.value })}
                                                        placeholder="Digite ou escaneie"
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button onClick={() => startScanner('serial')} className="scanner">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="3" width="7" height="7" />
                                                            <rect x="14" y="3" width="7" height="7" />
                                                            <rect x="14" y="14" width="7" height="7" />
                                                            <rect x="3" y="14" width="7" height="7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label>Lacre:</label>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <input
                                                        type="text"
                                                        value={editForm.lacre}
                                                        onChange={(e) => setEditForm({ ...editForm, lacre: e.target.value })}
                                                        placeholder="Digite ou escaneie"
                                                        style={{ flex: 1 }}
                                                    />
                                                    <button onClick={() => startScanner('lacre')} className="scanner">
                                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="3" width="7" height="7" />
                                                            <rect x="14" y="3" width="7" height="7" />
                                                            <rect x="14" y="14" width="7" height="7" />
                                                            <rect x="3" y="14" width="7" height="7" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="actions">
                                                <button onClick={() => handleSave(device.id)}>Salvar</button>
                                                <button onClick={() => setEditingId(null)} className="cancel">Cancelar</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="device-info">
                                        <span><strong>ID:</strong> {device.id}</span>
                                        <span><strong>Serial:</strong> {device.serial || <span className="empty">Vazio</span>}</span>
                                        <span><strong>Lacre:</strong> {device.lacre || <span className="empty">Vazio</span>}</span>
                                        {almoxDescription && (
                                            <div className="product-description" style={{
                                                marginTop: '8px',
                                                fontSize: '0.85em',
                                                color: '#666',
                                                borderTop: '1px solid #eee',
                                                paddingTop: '4px',
                                                wordWrap: 'break-word',
                                                overflowWrap: 'break-word'
                                            }}>
                                                {almoxDescription}
                                            </div>
                                        )}
                                    </div>
                                    <div className="status-indicator">
                                        {(!device.serial || !device.lacre) ? '⚠️ Pendente' : '✅ OK'}
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
