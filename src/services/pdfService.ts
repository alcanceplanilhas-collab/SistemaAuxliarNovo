import { supabase } from '../supabase'
import type { PDFDocument, PDFMetadata } from '../types/supabase'

/**
 * Serviço para gerenciar operações com PDFs no Supabase
 */

/**
 * Lista todos os PDFs de uma empresa
 */
export async function listPDFs(empresaId: number): Promise<PDFDocument[]> {
    try {
        const { data, error } = await supabase
            .from('tbl_pdf_documents')
            .select('*')
            .eq('empresa_id', empresaId)
            .order('upload_date', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Error listing PDFs:', error)
        throw error
    }
}

/**
 * Faz upload de um PDF para o Storage
 */
export async function uploadPDF(
    file: File,
    empresaId: number,
    userId: number,
    ordemId?: string
): Promise<string> {
    try {
        // Gerar nome único para o arquivo
        const timestamp = Date.now()
        const fileName = `${timestamp}_${file.name}`
        const filePath = ordemId
            ? `${empresaId}/${ordemId}/${fileName}`
            : `${empresaId}/${fileName}`

        // Upload para o Storage
        const { error: uploadError } = await supabase.storage
            .from('pdf-documents')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) throw uploadError

        // Salvar metadata no banco
        const metadata: PDFMetadata = {
            empresa_id: empresaId,
            ordem_id: ordemId,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            uploaded_by: userId
        }

        await savePDFMetadata(metadata)

        return filePath
    } catch (error) {
        console.error('Error uploading PDF:', error)
        throw error
    }
}

/**
 * Download de um PDF do Storage
 */
export async function downloadPDF(path: string): Promise<Blob> {
    try {
        const { data, error } = await supabase.storage
            .from('pdf-documents')
            .download(path)

        if (error) throw error
        if (!data) throw new Error('PDF não encontrado')

        return data
    } catch (error) {
        console.error('Error downloading PDF:', error)
        throw error
    }
}

/**
 * Obtém URL assinada (temporária) de um PDF
 * Para buckets privados, precisamos de signed URL em vez de public URL
 */
export async function getPDFUrl(path: string): Promise<string> {
    try {
        // Cria URL assinada válida por 1 hora
        const { data, error } = await supabase.storage
            .from('pdf-documents')
            .createSignedUrl(path, 3600) // 3600 segundos = 1 hora

        if (error) throw error
        if (!data || !data.signedUrl) throw new Error('Falha ao gerar URL do PDF')

        return data.signedUrl
    } catch (error) {
        console.error('Error getting PDF URL:', error)
        throw error
    }
}

/**
 * Salva metadata de um PDF no banco
 */
export async function savePDFMetadata(metadata: PDFMetadata): Promise<void> {
    try {
        const { error } = await supabase
            .from('tbl_pdf_documents')
            .insert({
                empresa_id: metadata.empresa_id,
                ordem_id: metadata.ordem_id,
                file_name: metadata.file_name,
                file_path: metadata.file_path,
                file_size: metadata.file_size,
                uploaded_by: metadata.uploaded_by,
                signed: false
            })

        if (error) throw error
    } catch (error) {
        console.error('Error saving PDF metadata:', error)
        throw error
    }
}

/**
 * Atualiza status de assinatura de um PDF
 */
export async function updateSignatureStatus(
    filePath: string,
    signatureUrl: string,
    userId: number
): Promise<void> {
    try {
        const { error } = await supabase
            .from('tbl_pdf_documents')
            .update({
                signed: true,
                signature_url: signatureUrl,
                signature_date: new Date().toISOString(),
                signed_by: userId
            })
            .eq('file_path', filePath)

        if (error) throw error
    } catch (error) {
        console.error('Error updating signature status:', error)
        throw error
    }
}

/**
 * Deleta um PDF do Storage e do banco
 */
export async function deletePDF(path: string): Promise<void> {
    try {
        // Deletar do Storage
        const { error: storageError } = await supabase.storage
            .from('pdf-documents')
            .remove([path])

        if (storageError) throw storageError

        // Deletar metadata do banco
        const { error: dbError } = await supabase
            .from('tbl_pdf_documents')
            .delete()
            .eq('file_path', path)

        if (dbError) throw dbError
    } catch (error) {
        console.error('Error deleting PDF:', error)
        throw error
    }
}
