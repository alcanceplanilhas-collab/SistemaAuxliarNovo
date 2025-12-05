import { useState, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import './PDFSignature.css'

// Configurar worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
    pdfUrl: string
    fileName: string
    onClose: () => void
    onSign?: () => void
    isSigned?: boolean
}

export function PDFViewer({ pdfUrl, fileName, onClose, onSign, isSigned }: PDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0)
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [scale, setScale] = useState<number>(1.0)

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages)
        setPageNumber(1)
    }

    function goToPrevPage() {
        setPageNumber(page => Math.max(1, page - 1))
    }

    function goToNextPage() {
        setPageNumber(page => Math.min(numPages, page + 1))
    }

    function zoomIn() {
        setScale(s => Math.min(2.0, s + 0.2))
    }

    function zoomOut() {
        setScale(s => Math.max(0.5, s - 0.2))
    }

    useEffect(() => {
        // Ajustar escala inicial para mobile
        const updateScale = () => {
            if (window.innerWidth < 768) {
                setScale(0.8)
            } else {
                setScale(1.0)
            }
        }

        updateScale()
        window.addEventListener('resize', updateScale)
        return () => window.removeEventListener('resize', updateScale)
    }, [])

    return (
        <div className="pdf-viewer">
            <div className="pdf-viewer-header">
                <div className="pdf-viewer-title">
                    📄 {fileName}
                </div>
                <div className="pdf-viewer-actions">
                    {!isSigned && onSign && (
                        <button
                            className="pdf-viewer-button sign-button"
                            onClick={onSign}
                        >
                            ✍️ Assinar
                        </button>
                    )}
                    {isSigned && (
                        <span style={{ padding: '0.5rem', color: '#4caf50', fontWeight: 'bold' }}>
                            ✅ Assinado
                        </span>
                    )}
                    <button
                        className="pdf-viewer-button"
                        onClick={onClose}
                    >
                        ✖️ Fechar
                    </button>
                </div>
            </div>

            <div className="pdf-viewer-content">
                <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <div>Carregando PDF...</div>
                        </div>
                    }
                    error={
                        <div style={{ padding: '2rem', color: '#d32f2f' }}>
                            ❌ Erro ao carregar PDF. Tente novamente.
                        </div>
                    }
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        className="pdf-page-container"
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                    />
                </Document>
            </div>

            <div className="pdf-viewer-controls">
                <button
                    className="pdf-control-button"
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                >
                    ◀ Anterior
                </button>

                <span className="pdf-page-info">
                    Página {pageNumber} de {numPages}
                </span>

                <button
                    className="pdf-control-button"
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                >
                    Próxima ▶
                </button>

                <button
                    className="pdf-control-button"
                    onClick={zoomOut}
                    disabled={scale <= 0.5}
                >
                    🔍−
                </button>

                <span className="pdf-page-info">
                    {Math.round(scale * 100)}%
                </span>

                <button
                    className="pdf-control-button"
                    onClick={zoomIn}
                    disabled={scale >= 2.0}
                >
                    🔍+
                </button>
            </div>
        </div>
    )
}
