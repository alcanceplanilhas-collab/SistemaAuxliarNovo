import { useEffect, useState, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../supabase'
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

    // Refs for focus management
    const serialInputRef = useRef<HTMLInputElement>(null)
    const scannerRef = useRef<Html5Qrcode | null>(null)

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

    const startScanner = async (target: 'serial' | 'lacre') => {
        setScannerTarget(target)
        setScannerActive(true)

        try {
            const html5QrCode = new Html5Qrcode('scanner-region')
            scannerRef.current = html5QrCode

            await html5QrCode.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                (decodedText) => {
                    setEditForm(prev => ({
                        ...prev,
                        [target]: decodedText
                    }))
                    stopScanner()
                },
                () => {
                    // Error callback (can be ignored for continuous scanning)
                }
            )
        } catch (err) {
            console.error('Error starting scanner:', err)
            alert('Erro ao iniciar scanner. Verifique as permissões da câmera.')
            setScannerActive(false)
        }
    }

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop()
                scannerRef.current.clear()
            } catch (err) {
                console.error('Error stopping scanner:', err)
            }
        }
        setScannerActive(false)
        setScannerTarget(null)
    }

    const handleSave = async (id: number) => {
        try {
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

    const filledCount = devices.filter(d => d.serial && d.lacre).length
    const totalCount = devices.length

    if (!almoxId) return null

    return (
        <div className="device-list-container">
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
                                            <div id="scanner-region" style={{ width: '100%' }}></div>
                                            <button onClick={stopScanner} className="cancel">Cancelar Scanner</button>
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
