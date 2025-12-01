import React, { useEffect, useRef } from 'react';

interface ScannerProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onScanError?: (error: any) => void;
  onClose?: () => void;
}

export const Scanner: React.FC<ScannerProps> = ({ onScanSuccess, onClose }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // O código HTML EXATO que você validou, encapsulado para rodar isolado
  // Adicionamos apenas estilos para ficar bonito dentro do card
  const scannerHtml = `
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        background: transparent;
        color: #fff;
        font-family: system-ui, -apple-system, sans-serif;
        text-align: center;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 300px;
      }
      #reader {
        width: 100%;
        max-width: 350px;
        border-radius: 16px;
        overflow: hidden;
        margin: 0 auto;
        background: #000;
      }
      /* Esconde elementos extras da lib */
      #reader__dashboard_section_csr span { display: none !important; }
      
      button {
        margin-top: 20px;
        padding: 14px 28px;
        font-size: 16px;
        font-weight: bold;
        background: #10b981; /* Emerald 500 */
        color: white;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: transform 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      button:active { transform: scale(0.95); }
      button svg { width: 20px; height: 20px; }

      .hidden { display: none !important; }
      
      .status {
        margin-top: 10px;
        font-size: 14px;
        color: #fbbf24; /* Amber 400 */
      }
      
      .close-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.5);
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 0;
        min-width: unset;
      }
    </style>
    <script src="https://unpkg.com/html5-qrcode" type="text/javascript"></script>
    </head>
    <body>

    <div id="reader"></div>
    
    <div id="controls">
      <button onclick="iniciar()">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>
        ABRIR CÂMERA
      </button>
    </div>

    <div id="status" class="status"></div>

    <script>
    let html5QrCode;

    async function iniciar() {
      try {
        document.getElementById("controls").classList.add("hidden");
        document.getElementById("status").innerText = "Solicitando permissão da câmera...";

        html5QrCode = new Html5Qrcode("reader");

        const config = { fps: 10, qrbox: 250 };
        
        // Tenta câmera traseira
        const videoConfig = { facingMode: "environment" };

        await html5QrCode.start(
          videoConfig,
          config,
          (decodedText, decodedResult) => {
            // SUCESSO
            // Envia para o React parente
            window.parent.postMessage(
              { type: "SCAN_SUCCESS", text: decodedText, result: decodedResult },
              "*"
            );
            
            // Para e limpa
            html5QrCode.stop().then(() => {
               html5QrCode.clear();
               document.getElementById("status").innerText = "Código lido!";
            }).catch(() => {});
          },
          (error) => {
            // Erros de frame ignorados
          }
        );
        
        // Salva que a permissão foi concedida
        localStorage.setItem("cameraPermissionGranted", "true");
        
        document.getElementById("status").innerText = "Aponte para o código";

      } catch (e) {
        console.error(e);
        document.getElementById("status").innerText = "Erro: " + e;
        document.getElementById("controls").classList.remove("hidden");
        // Remove a permissão salva em caso de erro
        localStorage.removeItem("cameraPermissionGranted");
      }
    }
    
    // Auto-start se a permissão já foi concedida anteriormente
    window.addEventListener("load", () => {
      const permissionGranted = localStorage.getItem("cameraPermissionGranted");
      if (permissionGranted === "true") {
        iniciar();
      }
    });
    </script>
    </body>
    </html>
  `;

  useEffect(() => {
    // Ouvinte de mensagens vindas do Iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SCAN_SUCCESS') {
        onScanSuccess(event.data.text, event.data.result);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onScanSuccess]);

  return (
    <div className="w-full flex justify-center relative">
      <iframe
        ref={iframeRef}
        srcDoc={scannerHtml}
        title="Scanner Frame"
        style={{
          width: '100%',
          height: '400px',
          border: 'none',
          overflow: 'hidden',
          borderRadius: '8px'
        }}
        // Permissões críticas para funcionar
        allow="camera *; microphone *"
      />
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}
        >
          X
        </button>
      )}
    </div>
  );
};
