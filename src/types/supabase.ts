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
    created_at?: string
}

export interface TblParametro {
    id: number
    empresa: string
    pathlogo: string
    created_at?: string
}
