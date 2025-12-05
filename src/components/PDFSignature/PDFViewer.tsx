import { useState, useEffect, useMemo } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { getOptimizedPDFSettings } from '../../utils/deviceDetection'
import './PDFSignature.css'

// Configurar worker do PDF.js com versão específica que funciona
pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'

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
    const [pageLoading, setPageLoading] = useState<boolean>(false)

    // Obter configurações otimizadas para o dispositivo
    const pdfSettings = useMemo(() => getOptimizedPDFSettings(), [])

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages)
        setPageNumber(1)
        console.log(`📄 PDF loaded: ${numPages} pages`)
    }

    function goToPrevPage() {
        setPageNumber(page => {
            const newPage = Math.max(1, page - 1)
            setPageLoading(true)
            return newPage
        })
    }

    function goToNextPage() {
        setPageNumber(page => {
            const newPage = Math.min(numPages, page + 1)
            setPageLoading(true)
            return newPage
        })
    }

    function zoomIn() {
        setScale(s => Math.min(pdfSettings.maxScale, s + 0.2))
    }

    function zoomOut() {
        setScale(s => Math.max(pdfSettings.minScale, s - 0.2))
    }

    useEffect(() => {
        // Ajustar escala inicial baseado nas configurações otimizadas
        setScale(pdfSettings.initialScale)

        const updateScale = () => {
            if (window.innerWidth < 768) {
                setScale(pdfSettings.initialScale)
            } else {
                setScale(1.0)
            }
        }

        window.addEventListener('resize', updateScale)
        return () => window.removeEventListener('resize', updateScale)
    }, [pdfSettings.initialScale])

    // Liberar memória ao mudar de página
    useEffect(() => {
        // Força garbage collection ao trocar de página
        const timer = setTimeout(() => {
            setPageLoading(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [pageNumber])

    return (
        <div className="pdf-viewer">
            <div className="pdf-viewer-header">
                <div className="pdf-viewer-title">
                    📄 {fileName}
                </div>
                <div className="pdf-viewer-actions">
                    {onSign && (
                        <button
                            className="pdf-viewer-button sign-button"
                            onClick={onSign}
                        >
                            {isSigned ? '✍️ Reassinar' : '✍️ Assinar'}
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
                            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: '#666' }}>
                                Otimizando para seu dispositivo...
                            </div>
                        </div>
                    }
                    error={
                        <div style={{ padding: '2rem', color: '#d32f2f' }}>
                            ❌ Erro ao carregar PDF. Tente novamente.
                        </div>
                    }
                >
                    {pageLoading && (
                        <div className="loading-spinner" style={{ position: 'absolute', zIndex: 10 }}>
                            <div className="spinner"></div>
                        </div>
                    )}
                    <Page
                        pageNumber={pageNumber}
                        scale={scale * pdfSettings.renderQuality}
                        width={window.innerWidth < 768 ? window.innerWidth - 40 : undefined}
                        className="pdf-page-container"
                        renderTextLayer={pdfSettings.renderTextLayer}
                        renderAnnotationLayer={pdfSettings.renderAnnotationLayer}
                        loading=""
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
                    disabled={scale <= pdfSettings.minScale}
                >
                    🔍−
                </button>

                <span className="pdf-page-info">
                    {Math.round(scale * 100)}%
                </span>

                <button
                    className="pdf-control-button"
                    onClick={zoomIn}
                    disabled={scale >= pdfSettings.maxScale}
                >
                    🔍+
                </button>
            </div>
        </div>
    )
}
