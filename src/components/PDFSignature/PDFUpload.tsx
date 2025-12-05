import { useState, useRef } from 'react'
import './PDFSignature.css'

interface PDFUploadProps {
    onUpload: (file: File) => Promise<void>
    onClose: () => void
}

export function PDFUpload({ onUpload, onClose }: PDFUploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [dragOver, setDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const validateFile = (file: File): boolean => {
        if (file.type !== 'application/pdf') {
            alert('Apenas arquivos PDF são permitidos.')
            return false
        }

        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            alert('O arquivo deve ter no máximo 10MB.')
            return false
        }

        return true
    }

    const handleFileSelect = (file: File) => {
        if (validateFile(file)) {
            setSelectedFile(file)
        }
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)

        const file = e.dataTransfer.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(true)
    }

    const handleDragLeave = () => {
        setDragOver(false)
    }

    const handleUpload = async () => {
        if (!selectedFile) return

        setUploading(true)
        setProgress(0)

        try {
            // Simular progresso
            const progressInterval = setInterval(() => {
                setProgress(p => {
                    if (p >= 90) {
                        clearInterval(progressInterval)
                        return 90
                    }
                    return p + 10
                })
            }, 200)

            await onUpload(selectedFile)

            clearInterval(progressInterval)
            setProgress(100)

            // Fechar após um breve delay
            setTimeout(() => {
                onClose()
            }, 500)
        } catch (error) {
            console.error('Upload error:', error)
            alert('Erro ao fazer upload do PDF. Tente novamente.')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="upload-modal-overlay" onClick={onClose}>
            <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
                <h2 className="upload-modal-title">Enviar PDF</h2>

                {!selectedFile ? (
                    <div
                        className={`upload-dropzone ${dragOver ? 'dragover' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="upload-icon">📁</div>
                        <div className="upload-text">
                            Arraste um arquivo PDF aqui
                        </div>
                        <div className="upload-subtext">
                            ou clique para selecionar
                        </div>
                        <div className="upload-subtext" style={{ marginTop: '0.5rem' }}>
                            (Máximo: 10MB)
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileInputChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                ) : (
                    <div>
                        <div style={{
                            padding: '1rem',
                            background: '#f9f9f9',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '2rem' }}>📄</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold' }}>{selectedFile.name}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </div>
                                </div>
                            </div>
                        </div>

                        {uploading && (
                            <div className="upload-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="progress-text">
                                    Enviando... {progress}%
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="upload-modal-actions">
                    {selectedFile && !uploading && (
                        <button
                            className="pdf-viewer-button"
                            onClick={() => setSelectedFile(null)}
                        >
                            Escolher outro
                        </button>
                    )}
                    <button
                        className="pdf-viewer-button"
                        onClick={onClose}
                        disabled={uploading}
                    >
                        Cancelar
                    </button>
                    {selectedFile && (
                        <button
                            className="pdf-viewer-button sign-button"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            {uploading ? 'Enviando...' : 'Enviar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
