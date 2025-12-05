import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'
import { PDFList } from './PDFList'
import { PDFViewer } from './PDFViewer'
import { SignatureCapture } from './SignatureCapture'
import { PDFUpload } from './PDFUpload'
import {
    listPDFs,
    uploadPDF,
    downloadPDF,
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
            console.log('🔵 Iniciando processo de assinatura...', {
                pdfId: selectedPDF.id,
                fileName: selectedPDF.file_name,
                filePath: selectedPDF.file_path
            })

            // Mostrar que está processando
            alert('⏳ Processando assinatura e incorporando no PDF...')

            // 1. Baixar o PDF original
            console.log('🔵 Baixando PDF original...')
            const originalPdfBlob = await downloadPDF(selectedPDF.file_path)
            console.log('✅ PDF baixado:', originalPdfBlob.size, 'bytes')

            // 2. Criar PDF com assinatura incorporada
            console.log('🔵 Incorporando assinatura no PDF...')
            const { createSignedPDF } = await import('../../services/signatureService')
            const signedPdfBlob = await createSignedPDF(originalPdfBlob, signatureBlob)
            console.log('✅ PDF assinado criado:', signedPdfBlob.size, 'bytes')

            // 3. Upload da imagem de assinatura (para referência)
            console.log('🔵 Fazendo upload da imagem de assinatura...')
            const signaturePath = await uploadSignature(
                signatureBlob,
                company.id,
                selectedPDF.id
            )
            console.log('✅ Assinatura salva em:', signaturePath)

            // 4. Fazer upload do PDF assinado, substituindo o original
            console.log('🔵 Substituindo PDF no Storage...')
            const { error: uploadError } = await supabase.storage
                .from('pdf-documents')
                .update(selectedPDF.file_path, signedPdfBlob, {
                    cacheControl: '3600',
                    upsert: true
                })

            if (uploadError) {
                console.error('❌ Erro no upload:', uploadError)
                throw uploadError
            }
            console.log('✅ PDF substituído no Storage')

            // 5. Atualizar status no banco
            console.log('🔵 Atualizando status no banco...')
            await updateSignatureStatus(
                selectedPDF.file_path,
                signaturePath,
                user.id
            )
            console.log('✅ Status atualizado')

            alert('✅ Documento assinado com sucesso! A assinatura foi incorporada no PDF.')

            // Recarregar lista de PDFs
            await loadPDFs()

            // Voltar para a lista
            setView('list')
            setSelectedPDF(null)
            setPdfUrl('')
        } catch (error) {
            console.error('❌ ERRO ao assinar documento:', error)
            alert('Erro ao assinar documento: ' + (error as Error).message)
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
                    onSign={handleStartSigning} // Permitir assinar/reassinar sempre
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
