import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { PDFList } from './PDFList'
import { PDFViewer } from './PDFViewer'
import { SignatureCapture } from './SignatureCapture'
import { PDFUpload } from './PDFUpload'
import {
    listPDFs,
    uploadPDF,
    getPDFUrl,
    updateSignatureStatus
} from '../../services/pdfService'
import { uploadSignature } from '../../services/signatureService'
import type { PDFDocument } from '../../types/supabase'
import './PDFSignature.css'

type ViewMode = 'list' | 'viewer' | 'signing'

export function PDFSignature() {
    const { user, company } = useAuth()
    const [view, setView] = useState<ViewMode>('list')
    const [pdfs, setPdfs] = useState<PDFDocument[]>([])
    const [selectedPDF, setSelectedPDF] = useState<PDFDocument | null>(null)
    const [pdfUrl, setPdfUrl] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [showUpload, setShowUpload] = useState(false)

    useEffect(() => {
        if (company) {
            loadPDFs()
        }
    }, [company])

    const loadPDFs = async () => {
        if (!company) return

        try {
            setLoading(true)
            const documents = await listPDFs(company.id)
            setPdfs(documents)
        } catch (error) {
            console.error('Error loading PDFs:', error)
            alert('Erro ao carregar documentos. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectPDF = async (pdf: PDFDocument) => {
        setSelectedPDF(pdf)
        try {
            const url = await getPDFUrl(pdf.file_path)
            setPdfUrl(url)
            setView('viewer')
        } catch (error) {
            console.error('Error loading PDF:', error)
            alert('Erro ao carregar PDF. Tente novamente.')
        }
    }

    const handleClosePDF = () => {
        setView('list')
        setSelectedPDF(null)
        setPdfUrl('')
    }

    const handleStartSigning = () => {
        setView('signing')
    }

    const handleCancelSigning = () => {
        setView('viewer')
    }

    const handleConfirmSignature = async (signatureBlob: Blob) => {
        if (!selectedPDF || !user || !company) return

        try {
            // Upload da imagem de assinatura
            const signaturePath = await uploadSignature(
                signatureBlob,
                company.id,
                selectedPDF.id
            )

            // Atualizar status no banco
            await updateSignatureStatus(
                selectedPDF.file_path,
                signaturePath,
                user.id
            )

            alert('✅ Documento assinado com sucesso!')

            // Recarregar lista de PDFs
            await loadPDFs()

            // Voltar para a lista
            setView('list')
            setSelectedPDF(null)
            setPdfUrl('')
        } catch (error) {
            console.error('Error signing PDF:', error)
            alert('Erro ao assinar documento. Tente novamente.')
        }
    }

    const handleUpload = async (file: File) => {
        if (!company || !user) return

        try {
            await uploadPDF(file, company.id, user.id)
            alert('✅ PDF enviado com sucesso!')
            await loadPDFs()
        } catch (error) {
            console.error('Error uploading PDF:', error)
            throw error
        }
    }

    if (!company || !user) {
        return (
            <div className="pdf-signature-container">
                <div className="empty-state">
                    <div className="empty-state-icon">⚠️</div>
                    <div>Selecione uma empresa para visualizar documentos.</div>
                </div>
            </div>
        )
    }

    return (
        <div className="pdf-signature-container">
            {view === 'list' && (
                <PDFList
                    pdfs={pdfs}
                    loading={loading}
                    onSelectPDF={handleSelectPDF}
                    onUploadClick={() => setShowUpload(true)}
                />
            )}

            {view === 'viewer' && selectedPDF && (
                <PDFViewer
                    pdfUrl={pdfUrl}
                    fileName={selectedPDF.file_name}
                    onClose={handleClosePDF}
                    onSign={selectedPDF.signed ? undefined : handleStartSigning}
                    isSigned={selectedPDF.signed}
                />
            )}

            {view === 'signing' && (
                <SignatureCapture
                    onConfirm={handleConfirmSignature}
                    onCancel={handleCancelSigning}
                />
            )}

            {showUpload && (
                <PDFUpload
                    onUpload={handleUpload}
                    onClose={() => setShowUpload(false)}
                />
            )}
        </div>
    )
}
