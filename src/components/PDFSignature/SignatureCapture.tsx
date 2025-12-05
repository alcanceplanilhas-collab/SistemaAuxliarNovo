import { useRef, useEffect, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { captureSignature, validateSignature } from '../../services/signatureService'
import './PDFSignature.css'

interface SignatureCaptureProps {
    onConfirm: (signatureBlob: Blob) => void
    onCancel: () => void
}

export function SignatureCapture({ onConfirm, onCancel }: SignatureCaptureProps) {
    const signatureRef = useRef<SignatureCanvas>(null)
    const [isEmpty, setIsEmpty] = useState(true)

    useEffect(() => {
        // Configurar canvas para mobile
        const canvas = signatureRef.current?.getCanvas()
        if (canvas) {
            canvas.style.touchAction = 'none'
        }
    }, [])

    const handleClear = () => {
        signatureRef.current?.clear()
        setIsEmpty(true)
    }

    const handleEnd = () => {
        const canvas = signatureRef.current?.getCanvas()
        if (canvas) {
            const isValid = validateSignature(canvas)
            setIsEmpty(!isValid)
        }
    }

    const handleConfirm = async () => {
        const canvas = signatureRef.current?.getCanvas()
        if (!canvas) return

        const isValid = validateSignature(canvas)
        if (!isValid) {
            alert('Por favor, desenhe sua assinatura antes de confirmar.')
            return
        }

        try {
            const signatureBlob = await captureSignature(canvas)
            onConfirm(signatureBlob)
        } catch (error) {
            console.error('Error capturing signature:', error)
            alert('Erro ao capturar assinatura. Tente novamente.')
        }
    }

    return (
        <div className="signature-capture">
            <div className="signature-header">
                Assine Aqui
            </div>

            <div className="signature-canvas-container">
                {isEmpty && (
                    <div className="signature-hint">
                        ✍️ Desenhe sua assinatura aqui
                    </div>
                )}
                <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{
                        className: 'signature-canvas',
                        width: 600,
                        height: 300
                    }}
                    onEnd={handleEnd}
                    backgroundColor="white"
                />
            </div>

            <div className="signature-actions">
                <button
                    className="signature-button clear"
                    onClick={handleClear}
                >
                    🗑️ Limpar
                </button>
                <button
                    className="signature-button cancel"
                    onClick={onCancel}
                >
                    ✖️ Cancelar
                </button>
                <button
                    className="signature-button confirm"
                    onClick={handleConfirm}
                    disabled={isEmpty}
                >
                    ✔️ Confirmar
                </button>
            </div>
        </div>
    )
}
