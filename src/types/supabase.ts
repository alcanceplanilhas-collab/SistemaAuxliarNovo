export interface TblAlmox {
    id: number
    notafiscal: string
    lote: string | null
    descricao: string | null
    idstatus_operacional: number
    idinstancia: number
    created_at?: string
}

export interface TblDevice {
    id: number
    serial: string | null
    lacre: string | null
    iddevice: number // Foreign Key to tbl_almox.id
    idinstancia: number
    last_update: string | null // UUID of user who last updated
    created_at?: string
}

export interface TblUsuario {
    id: number
    email: string
    nome: string
    uuid: string
    status_operacional: number
    otp: string | null
    created_at?: string
}

export interface TblParametro {
    id: number
    empresa: string
    pathlogo: string
    created_at?: string
}

export interface PDFDocument {
    id: string
    empresa_id: number
    ordem_id?: string
    file_name: string
    file_path: string
    file_size: number
    upload_date: string
    uploaded_by: number
    uploaded_by_name?: string
    signed: boolean
    signature_url?: string
    signature_date?: string
    signed_by?: number
    signed_by_name?: string
    created_at: string
    updated_at: string
}

export interface PDFMetadata {
    empresa_id: number
    ordem_id?: string
    file_name: string
    file_path: string
    file_size: number
    uploaded_by: number
}
