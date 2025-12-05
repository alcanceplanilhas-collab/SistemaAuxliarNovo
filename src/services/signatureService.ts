import { supabase } from '../supabase'

/**
 * Serviço para captura e manipulação de assinaturas
 */

/**
 * Captura assinatura do canvas como Blob
 */
export async function captureSignature(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob)
            } else {
                reject(new Error('Falha ao capturar assinatura'))
            }
        }, 'image/png')
    })
}

/**
 * Faz upload da imagem de assinatura para o Storage
 */
export async function uploadSignature(
    signature: Blob,
    empresaId: number,
    documentId: string
): Promise<string> {
    try {
        const timestamp = Date.now()
        const fileName = `signature_${timestamp}.png`
        const filePath = `${empresaId}/signatures/${documentId}_${fileName}`

        const { error } = await supabase.storage
            .from('pdf-documents')
            .upload(filePath, signature, {
                contentType: 'image/png',
                cacheControl: '3600',
                upsert: false
            })

        if (error) throw error

        return filePath
    } catch (error) {
        console.error('Error uploading signature:', error)
        throw error
    }
}

/**
 * Obtém URL da assinatura
 */
export async function getSignatureUrl(path: string): Promise<string> {
    try {
        const { data } = supabase.storage
            .from('pdf-documents')
            .getPublicUrl(path)

        return data.publicUrl
    } catch (error) {
        console.error('Error getting signature URL:', error)
        throw error
    }
}

/**
 * Valida se a assinatura não está vazia
 */
export function validateSignature(canvas: HTMLCanvasElement): boolean {
    const context = canvas.getContext('2d')
    if (!context) return false

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imageData.data

    // Verifica se há algum pixel não-branco
    for (let i = 0; i < pixels.length; i += 4) {
        const alpha = pixels[i + 3]
        if (alpha > 0) {
            return true // Encontrou pixel desenhado
        }
    }

    return false // Canvas está vazio
}

/**
 * Cria um novo PDF com a assinatura incorporada
 * Nota: Esta é uma implementação simplificada
 * Para produção, considere usar bibliotecas como pdf-lib
 */
export async function createSignedPDF(
    originalPdfBlob: Blob,
    signatureBlob: Blob
): Promise<Blob> {
    // Por enquanto, vamos apenas retornar o PDF original
    // Em uma implementação completa, você adicionaria a assinatura ao PDF
    // usando bibliotecas como pdf-lib ou PDFKit

    // TODO: Implementar merge real do PDF com assinatura
    console.log('Creating signed PDF...', { originalPdfBlob, signatureBlob })

    return originalPdfBlob
}
