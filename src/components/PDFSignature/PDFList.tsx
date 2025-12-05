import { useState, useEffect } from 'react'
import type { PDFDocument } from '../../types/supabase'
import './PDFSignature.css'

interface PDFListProps {
    pdfs: PDFDocument[]
    loading: boolean
    onSelectPDF: (pdf: PDFDocument) => void
    onUploadClick: () => void
}

type FilterType = 'all' | 'signed' | 'unsigned'

export function PDFList({ pdfs, loading, onSelectPDF, onUploadClick }: PDFListProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [filter, setFilter] = useState<FilterType>('all')
    const [filteredPDFs, setFilteredPDFs] = useState<PDFDocument[]>([])

    useEffect(() => {
        let result = [...pdfs]

        // Aplicar filtro de status
        if (filter === 'signed') {
            result = result.filter(pdf => pdf.signed)
        } else if (filter === 'unsigned') {
            result = result.filter(pdf => !pdf.signed)
        }

        // Aplicar busca
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase()
            result = result.filter(pdf =>
                pdf.file_name.toLowerCase().includes(term) ||
                pdf.ordem_id?.toLowerCase().includes(term)
            )
        }

        setFilteredPDFs(result)
    }, [pdfs, filter, searchTerm])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    }

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
                <div>Carregando PDFs...</div>
            </div>
        )
    }

    return (
        <div className="pdf-list">
            <div className="pdf-list-header">
                <h2 className="pdf-list-title">📄 Documentos PDF</h2>
                <button className="pdf-upload-button" onClick={onUploadClick}>
                    ⬆️ Enviar PDF
                </button>
            </div>

            <input
                type="text"
                className="pdf-search"
                placeholder="🔍 Buscar por nome ou ordem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="pdf-filters">
                <button
                    className={`filter-button ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    Todos ({pdfs.length})
                </button>
                <button
                    className={`filter-button ${filter === 'unsigned' ? 'active' : ''}`}
                    onClick={() => setFilter('unsigned')}
                >
                    Não assinados ({pdfs.filter(p => !p.signed).length})
                </button>
                <button
                    className={`filter-button ${filter === 'signed' ? 'active' : ''}`}
                    onClick={() => setFilter('signed')}
                >
                    Assinados ({pdfs.filter(p => p.signed).length})
                </button>
            </div>

            {filteredPDFs.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <div>
                        {searchTerm.trim() ?
                            'Nenhum documento encontrado com esse termo.' :
                            'Nenhum documento disponível. Faça upload do primeiro PDF!'
                        }
                    </div>
                </div>
            ) : (
                <div className="pdf-grid">
                    {filteredPDFs.map((pdf) => (
                        <div
                            key={pdf.id}
                            className={`pdf-card ${pdf.signed ? 'signed' : 'unsigned'}`}
                            onClick={() => onSelectPDF(pdf)}
                        >
                            <div className="pdf-card-status">
                                {pdf.signed ? '✅' : '⏳'}
                            </div>
                            <div className="pdf-card-icon">📄</div>
                            <div className="pdf-card-name">{pdf.file_name}</div>
                            {pdf.ordem_id && (
                                <div className="pdf-card-info">
                                    <strong>Ordem:</strong> {pdf.ordem_id}
                                </div>
                            )}
                            <div className="pdf-card-info">
                                <strong>Tamanho:</strong> {formatFileSize(pdf.file_size)}
                            </div>
                            <div className="pdf-card-info">
                                <strong>Upload:</strong> {formatDate(pdf.upload_date)}
                                {pdf.uploaded_by_name && ` - ${pdf.uploaded_by_name}`}
                            </div>
                            {pdf.signed && pdf.signature_date && (
                                <>
                                    <div className="pdf-card-info" style={{ color: '#4caf50' }}>
                                        <strong>Assinado em:</strong> {formatDate(pdf.signature_date)}
                                    </div>
                                    {pdf.signed_by_name && (
                                        <div className="pdf-card-info" style={{ color: '#4caf50', fontWeight: 600 }}>
                                            👤 Por: {pdf.signed_by_name}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
