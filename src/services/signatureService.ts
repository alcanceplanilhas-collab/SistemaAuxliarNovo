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
 * Obtém URL assinada da assinatura
 */
export async function getSignatureUrl(path: string): Promise<string> {
    try {
        const { data, error } = await supabase.storage
            .from('pdf-documents')
            .createSignedUrl(path, 3600) // 1 hora

        if (error) throw error
        if (!data || !data.signedUrl) throw new Error('Falha ao gerar URL da assinatura')

        return data.signedUrl
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
 * Usa pdf-lib para adicionar a assinatura visualmente no PDF
 */
export async function createSignedPDF(
    originalPdfBlob: Blob,
    signatureBlob: Blob
): Promise<Blob> {
    try {
        // Importar pdf-lib dinamicamente
        const { PDFDocument } = await import('pdf-lib')

        // Carregar o PDF original
        const pdfBytes = await originalPdfBlob.arrayBuffer()
        const pdfDoc = await PDFDocument.load(pdfBytes)

        // Carregar a imagem da assinatura
        const signatureBytes = await signatureBlob.arrayBuffer()
        const signatureImage = await pdfDoc.embedPng(signatureBytes)

        // Obter a última página
        const pages = pdfDoc.getPages()
        const lastPage = pages[pages.length - 1]
        const { width } = lastPage.getSize()

        // Dimensões da assinatura (scaled down)
        const signatureWidth = 150
        const signatureHeight = (signatureImage.height / signatureImage.width) * signatureWidth

        // Posição: canto inferior direito com margem
        const x = width - signatureWidth - 50
        const y = 50

        // Adicionar a assinatura na última página
        lastPage.drawImage(signatureImage, {
            x,
            y,
            width: signatureWidth,
            height: signatureHeight,
        })

        // Adicionar texto "Assinado digitalmente em [data]"
        const now = new Date()
        const dateStr = now.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })

        lastPage.drawText(`Assinado digitalmente em ${dateStr}`, {
            x: x,
            y: y - 15,
            size: 8,
            opacity: 0.7
        })

        // Gerar o PDF modificado
        const modifiedPdfBytes = await pdfDoc.save()

        // Converter para Blob (fix para TypeScript)
        return new Blob([modifiedPdfBytes.buffer], { type: 'application/pdf' })
    } catch (error) {
        console.error('Error creating signed PDF:', error)
        throw new Error('Falha ao incorporar assinatura no PDF: ' + error)
    }
}

