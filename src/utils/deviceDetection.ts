/**
 * Utilitários para detecção de dispositivos e otimizações específicas
 */

/**
 * Detecta se o dispositivo é móvel (smartphone ou tablet)
 */
export function isMobileDevice(): boolean {
    // Verificar user agent
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)

    // Verificar largura da tela
    const isMobileWidth = window.innerWidth < 768

    // Verificar se é touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0

    return isMobileUA || (isMobileWidth && isTouchDevice)
}

/**
 * Detecta se o dispositivo tem memória limitada
 */
export function hasLimitedMemory(): boolean {
    // @ts-ignore - deviceMemory pode não estar disponível em todos os navegadores
    const deviceMemory = navigator.deviceMemory

    // Se deviceMemory não está disponível, assume mobile = memória limitada
    if (deviceMemory === undefined) {
        return isMobileDevice()
    }

    // Considera limitado se tem menos de 4GB RAM
    return deviceMemory < 4
}

/**
 * Retorna configurações otimizadas baseado no dispositivo
 */
export function getOptimizedPDFSettings() {
    const isMobile = isMobileDevice()
    const limitedMemory = hasLimitedMemory()

    return {
        // Desabilitar camadas pesadas em dispositivos móveis ou de memória limitada
        renderTextLayer: !isMobile && !limitedMemory,
        renderAnnotationLayer: !isMobile && !limitedMemory,

        // Escala inicial otimizada
        initialScale: isMobile ? 0.6 : 1.0,

        // Limitar zoom em dispositivos de memória limitada
        maxScale: limitedMemory ? 1.5 : 2.0,
        minScale: isMobile ? 0.4 : 0.5,

        // Cache de páginas
        cachePages: !limitedMemory,
        maxCachedPages: limitedMemory ? 2 : 5,

        // Qualidade de renderização
        renderQuality: limitedMemory ? 1.0 : 1.5
    }
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Valida tamanho máximo de arquivo baseado no dispositivo
 */
export function getMaxFileSize(): number {
    const limitedMemory = hasLimitedMemory()

    // Dispositivos de memória limitada: máximo 10MB
    // Dispositivos normais: máximo 50MB
    return limitedMemory ? 10 * 1024 * 1024 : 50 * 1024 * 1024
}

/**
 * Valida se arquivo pode ser processado no dispositivo atual
 */
export function validateFileSize(fileSize: number): { valid: boolean; message?: string } {
    const maxSize = getMaxFileSize()

    if (fileSize > maxSize) {
        return {
            valid: false,
            message: `Arquivo muito grande para este dispositivo. Tamanho máximo: ${formatFileSize(maxSize)}`
        }
    }

    return { valid: true }
}
